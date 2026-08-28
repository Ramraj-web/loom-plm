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

function readDB() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ personal: {}, shared: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const router = Router();

// GET /api/storage/:key?shared=true|false
router.get("/:key", async (req, res, next) => {
  if (storageCollection) {
    try {
      const shared = req.query.shared === "true";
      const record = await storageCollection.findOne({ key: req.params.key, shared });
      if (!record) return res.status(404).json({ error: "Key not found" });
      return res.json({ key: record.key, value: record.value, shared });
    } catch (error) {
      return next(error);
    }
  }
  const db = readDB();
  const bucket = req.query.shared === "true" ? "shared" : "personal";
  const value = db[bucket][req.params.key];
  if (value === undefined) return res.status(404).json({ error: "Key not found" });
  res.json({ key: req.params.key, value, shared: bucket === "shared" });
});

// POST /api/storage/:key   body: { value, shared }
router.post("/:key", async (req, res, next) => {
  if (storageCollection) {
    try {
      const shared = !!req.body.shared;
      const value = req.body.value;
      await storageCollection.updateOne(
        { key: req.params.key, shared },
        { $set: { key: req.params.key, value, shared } },
        { upsert: true },
      );
      return res.json({ key: req.params.key, value, shared });
    } catch (error) {
      return next(error);
    }
  }
  const db = readDB();
  const { value, shared } = req.body;
  const bucket = shared ? "shared" : "personal";
  db[bucket][req.params.key] = value;
  writeDB(db);
  res.json({ key: req.params.key, value, shared: !!shared });
});

// DELETE /api/storage/:key?shared=true|false
router.delete("/:key", async (req, res, next) => {
  if (storageCollection) {
    try {
      const shared = req.query.shared === "true";
      const result = await storageCollection.deleteOne({ key: req.params.key, shared });
      return res.json({ key: req.params.key, deleted: result.deletedCount > 0, shared });
    } catch (error) {
      return next(error);
    }
  }
  const db = readDB();
  const bucket = req.query.shared === "true" ? "shared" : "personal";
  const deleted = req.params.key in db[bucket];
  delete db[bucket][req.params.key];
  writeDB(db);
  res.json({ key: req.params.key, deleted, shared: bucket === "shared" });
});

// GET /api/storage?prefix=xxx&shared=true|false
router.get("/", async (req, res, next) => {
  if (storageCollection) {
    try {
      const shared = req.query.shared === "true";
      const prefix = req.query.prefix || "";
      const records = await storageCollection.find({ shared, key: { $regex: `^${escapeRegExp(prefix)}` } }, { projection: { _id: 0, key: 1 } }).toArray();
      return res.json({ keys: records.map(record => record.key), prefix, shared });
    } catch (error) {
      return next(error);
    }
  }
  const db = readDB();
  const bucket = req.query.shared === "true" ? "shared" : "personal";
  const prefix = req.query.prefix || "";
  const keys = Object.keys(db[bucket]).filter(k => k.startsWith(prefix));
  res.json({ keys, prefix, shared: bucket === "shared" });
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;
