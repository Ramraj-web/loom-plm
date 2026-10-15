import { broadcast } from "../wsHandler.js";
import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "storage.json");

let storageCollection = null;

export function setStorageCollection(collection) {
  storageCollection = collection;
}

// Simple JSON-file "database" for prototyping. Andha munnaadi Claude Artifact
// environment la irundha window.storage API-a ithu recreate pannudhu.
// Production ku pogum bothu, ithuku pathila real DB (Postgres / MongoDB) vachukalam —
// but ippo start panna idhu podhum.

function getStoragePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join("/tmp", "storage.json");
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(DATA_FILE)) {
          fs.writeFileSync(tmpPath, fs.readFileSync(DATA_FILE, "utf8"));
        } else {
          fs.writeFileSync(tmpPath, JSON.stringify({ personal: {}, shared: {} }, null, 2));
        }
      } catch {}
    }
    return tmpPath;
  }
  return DATA_FILE;
}

let inMemoryStorage = null;

function readDB() {
  if (inMemoryStorage && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    return inMemoryStorage;
  }
  const filePath = getStoragePath();
  let db;
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ personal: {}, shared: {} }, null, 2));
    }
    db = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    db = inMemoryStorage || { personal: {}, shared: {} };
  }
  inMemoryStorage = db;
  return db;
}

function writeDB(db) {
  inMemoryStorage = db;
  const filePath = getStoragePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.warn("Storage write fallback to memory:", err.message);
  }
}

const router = Router();

// GET /api/storage?prefix=xxx&shared=true|false
router.get("/", async (req, res, next) => {
  const shared = req.query.shared === "true";
  const prefix = req.query.prefix || "";
  if (storageCollection) {
    try {
      const records = await storageCollection.find({ shared, key: { $regex: `^${escapeRegExp(prefix)}` } }, { projection: { _id: 0, key: 1 } }).toArray();
      return res.json({ keys: records.map(record => record.key), prefix, shared });
    } catch (error) {
      return next(error);
    }
  }
  const db = readDB();
  const bucket = shared ? "shared" : "personal";
  const keys = Object.keys(db[bucket] || {}).filter(k => k.startsWith(prefix));
  return res.json({ keys, prefix, shared: bucket === "shared" });
});

// Helper to decode parameter keys safely
function extractKey(raw) {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

// GET /api/storage/:key?shared=true|false
router.get("/:key(*)", async (req, res, next) => {
  const shared = req.query.shared === "true";
  const key = extractKey(req.params.key);
  const rawKey = req.params.key;

  if (storageCollection) {
    try {
      let record = await storageCollection.findOne({ key, shared });
      if (!record && rawKey !== key) {
        record = await storageCollection.findOne({ key: rawKey, shared });
      }
      if (!record) {
        return res.status(200).json({ key, value: null, shared });
      }
      return res.status(200).json({ key: record.key, value: record.value, shared });
    } catch (error) {
      return next(error);
    }
  }

  const db = readDB();
  const bucket = shared ? "shared" : "personal";
  const store = db[bucket] || {};
  let value = store[key];
  if (value === undefined && rawKey !== key) {
    value = store[rawKey];
  }
  if (value === undefined) {
    return res.status(200).json({ key, value: null, shared: bucket === "shared" });
  }
  return res.status(200).json({ key, value, shared: bucket === "shared" });
});

// POST /api/storage/:key   body: { value, shared }
router.post("/:key(*)", async (req, res, next) => {
  const shared = !!req.body.shared;
  const key = extractKey(req.params.key);
  let value = req.body.value;

  // Intelligently merge user_sessions and audit_logs so concurrent tabs (e.g. incognito vs normal)
  // never wipe out other active users or history
  if (key === "user_sessions") {
    try {
      const incoming = typeof value === "string" ? JSON.parse(value) : value;
      if (Array.isArray(incoming)) {
        let existing = [];
        if (storageCollection) {
          const rec = await storageCollection.findOne({ key, shared });
          if (rec && rec.value) {
            try { existing = typeof rec.value === "string" ? JSON.parse(rec.value) : rec.value; } catch (e) {}
          }
        } else {
          const db = readDB();
          const bucket = shared ? "shared" : "personal";
          if (db[bucket] && db[bucket][key]) {
            try { existing = typeof db[bucket][key] === "string" ? JSON.parse(db[bucket][key]) : db[bucket][key]; } catch (e) {}
          }
        }

        if (Array.isArray(existing) && existing.length > 0) {
          const sessionMap = new Map();
          existing.forEach(s => { if (s && s.id) sessionMap.set(s.id, s); });
          incoming.forEach(s => {
            if (s && s.id) {
              const prev = sessionMap.get(s.id) || {};
              sessionMap.set(s.id, { ...prev, ...s });
            }
          });
          const merged = Array.from(sessionMap.values()).sort((a, b) => new Date(b.loginTime || 0) - new Date(a.loginTime || 0));
          value = JSON.stringify(merged.slice(0, 500));
        }
      }
    } catch (e) {
      console.warn("Error merging user_sessions on backend:", e.message);
    }
  } else if (key === "audit_logs") {
    try {
      const incoming = typeof value === "string" ? JSON.parse(value) : value;
      if (Array.isArray(incoming)) {
        let existing = [];
        if (storageCollection) {
          const rec = await storageCollection.findOne({ key, shared });
          if (rec && rec.value) {
            try { existing = typeof rec.value === "string" ? JSON.parse(rec.value) : rec.value; } catch (e) {}
          }
        } else {
          const db = readDB();
          const bucket = shared ? "shared" : "personal";
          if (db[bucket] && db[bucket][key]) {
            try { existing = typeof db[bucket][key] === "string" ? JSON.parse(db[bucket][key]) : db[bucket][key]; } catch (e) {}
          }
        }

        if (Array.isArray(existing) && existing.length > 0) {
          const logMap = new Map();
          incoming.forEach(l => { if (l && l.id) logMap.set(l.id, l); });
          existing.forEach(l => { if (l && l.id && !logMap.has(l.id)) logMap.set(l.id, l); });
          const merged = Array.from(logMap.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          value = JSON.stringify(merged.slice(0, 500));
        }
      }
    } catch (e) {
      console.warn("Error merging audit_logs on backend:", e.message);
    }
  }

  if (storageCollection) {
    try {
      await storageCollection.updateOne(
        { key, shared },
        { $set: { key, value, shared } },
        { upsert: true }
      );
      try {
        broadcast({ type: "STORAGE_CHANGE", key, value, shared, timestamp: new Date().toISOString() });
      } catch (err) {}
      return res.status(200).json({ key, value, shared });
    } catch (error) {
      return next(error);
    }
  }

  const db = readDB();
  const bucket = shared ? "shared" : "personal";
  if (!db[bucket]) db[bucket] = {};
  db[bucket][key] = value;
  writeDB(db);
  try {
    broadcast({ type: "STORAGE_CHANGE", key, value, shared: !!shared, timestamp: new Date().toISOString() });
  } catch (err) {}
  return res.status(200).json({ key, value, shared: !!shared });
});

// DELETE /api/storage/:key?shared=true|false
router.delete("/:key(*)", async (req, res, next) => {
  const shared = req.query.shared === "true";
  const key = extractKey(req.params.key);
  const rawKey = req.params.key;

  if (storageCollection) {
    try {
      const result = await storageCollection.deleteMany({
        $or: [{ key, shared }, { key: rawKey, shared }]
      });
      return res.status(200).json({ key, deleted: result.deletedCount > 0, shared });
    } catch (error) {
      return next(error);
    }
  }

  const db = readDB();
  const bucket = shared ? "shared" : "personal";
  const store = db[bucket] || {};
  const deleted = (key in store) || (rawKey in store);
  delete store[key];
  delete store[rawKey];
  writeDB(db);
  return res.status(200).json({ key, deleted, shared: bucket === "shared" });
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;
