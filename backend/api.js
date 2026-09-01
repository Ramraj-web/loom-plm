import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ===== MIDDLEWARE =====
app.set("etag", false);
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));

// ===== STORAGE ROUTES =====
const STORAGE_FILE = path.join(__dirname, "data", "storage.json");
let inMemoryStorage = null;

function getStoragePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = "/tmp/storage.json";
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(STORAGE_FILE)) {
          fs.writeFileSync(tmpPath, fs.readFileSync(STORAGE_FILE, "utf8"));
        } else {
          fs.writeFileSync(tmpPath, JSON.stringify({ personal: {}, shared: {} }, null, 2));
        }
      } catch {}
    }
    return tmpPath;
  }
  return STORAGE_FILE;
}

function readStorageDB() {
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

function writeStorageDB(db) {
  inMemoryStorage = db;
  const filePath = getStoragePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.warn("Storage write fallback to memory:", err.message);
  }
}

app.get("/api/storage", (req, res) => {
  const shared = req.query.shared === "true";
  const prefix = req.query.prefix || "";
  const db = readStorageDB();
  const bucket = shared ? "shared" : "personal";
  const keys = Object.keys(db[bucket] || {}).filter(k => k.startsWith(prefix));
  res.json({ keys, prefix, shared: bucket === "shared" });
});

app.get("/api/storage/:key(*)", (req, res) => {
  const shared = req.query.shared === "true";
  const key = decodeURIComponent(req.params.key || "");
  const db = readStorageDB();
  const bucket = shared ? "shared" : "personal";
  const value = (db[bucket] || {})[key];
  res.status(200).json({ key, value: value !== undefined ? value : null, shared: bucket === "shared" });
});

app.post("/api/storage/:key(*)", (req, res) => {
  const shared = !!req.body.shared;
  const key = decodeURIComponent(req.params.key || "");
  const value = req.body.value;
  const db = readStorageDB();
  const bucket = shared ? "shared" : "personal";
  if (!db[bucket]) db[bucket] = {};
  db[bucket][key] = value;
  writeStorageDB(db);
  res.status(200).json({ key, value, shared });
});

app.delete("/api/storage/:key(*)", (req, res) => {
  const shared = req.query.shared === "true";
  const key = decodeURIComponent(req.params.key || "");
  const db = readStorageDB();
  const bucket = shared ? "shared" : "personal";
  const store = db[bucket] || {};
  const deleted = key in store;
  delete store[key];
  writeStorageDB(db);
  res.status(200).json({ key, deleted, shared });
});

// ===== RESOURCES ROUTES =====
import { RESOURCE_SEEDS } from "./data/seed.js";

const RESOURCES_FILE = path.join(__dirname, "data", "resources.json");
let inMemoryResources = null;

function getResourcesPath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = "/tmp/resources.json";
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(RESOURCES_FILE)) {
          fs.writeFileSync(tmpPath, fs.readFileSync(RESOURCES_FILE, "utf8"));
        } else {
          fs.writeFileSync(tmpPath, JSON.stringify(RESOURCE_SEEDS, null, 2));
        }
      } catch {}
    }
    return tmpPath;
  }
  return RESOURCES_FILE;
}

function readResourcesDB() {
  if (inMemoryResources && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    return inMemoryResources;
  }
  const filePath = getResourcesPath();
  let db;
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(RESOURCE_SEEDS, null, 2));
    }
    db = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    db = inMemoryResources || { ...RESOURCE_SEEDS };
  }
  let updated = false;
  for (const [key, seedList] of Object.entries(RESOURCE_SEEDS)) {
    if (!Array.isArray(db[key])) {
      db[key] = [...seedList];
      updated = true;
    }
  }
  if (updated) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
    } catch {}
  }
  inMemoryResources = db;
  return db;
}

function writeResourcesDB(db) {
  inMemoryResources = db;
  const filePath = getResourcesPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.warn("Resources write fallback to memory:", err.message);
  }
}

function validResource(name) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name);
}

function makeId(resource, record) {
  return record.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SOFT_DELETE_RESOURCES = [
  "orders", "tasks", "approvals", "departments", "production", "staff",
  "leaveRequests", "financials", "certifications", "compliances", "debitNotes",
  "capas", "notifications",
];

app.get("/api/resources/:resource", (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const db = readResourcesDB();
    const isSoftDelete = SOFT_DELETE_RESOURCES.includes(resource);
    const showAll = req.query.all === "true";
    const isTrash = req.query.trash === "true";
    const records = (db[resource] || []).filter(
      record => !isSoftDelete || showAll || (isTrash ? record.isDeleted === true : record.isDeleted !== true)
    );
    res.json(records);
  } catch (error) {
    next(error);
  }
});

app.get("/api/resources/:resource/:id", (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const db = readResourcesDB();
    const record = (db[resource] || []).find(item => String(item.id) === id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

app.post("/api/resources/:resource", (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  const recordId = makeId(resource, req.body);
  const record = {
    ...req.body,
    id: recordId,
    ...(SOFT_DELETE_RESOURCES.includes(resource) ? { isDeleted: false } : {}),
  };
  try {
    const db = readResourcesDB();
    if (!db[resource]) db[resource] = [];
    const existingIdx = db[resource].findIndex(item => String(item.id) === String(recordId));
    if (existingIdx >= 0) {
      db[resource][existingIdx] = record;
    } else {
      db[resource] = [record, ...db[resource]];
    }
    writeResourcesDB(db);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

app.put("/api/resources/:resource/:id", (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const db = readResourcesDB();
    if (!db[resource]) db[resource] = [];
    const index = db[resource].findIndex(item => String(item.id) === id);
    if (index < 0) {
      const record = { ...req.body, id, resource };
      db[resource].push(record);
      writeResourcesDB(db);
      return res.json(record);
    }
    const record = { ...db[resource][index], ...req.body, id };
    db[resource][index] = record;
    writeResourcesDB(db);
    res.json(record);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/resources/:resource/:id", (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const db = readResourcesDB();
    if (!db[resource]) db[resource] = [];
    const index = db[resource].findIndex(item => String(item.id) === id);
    if (index < 0) {
      const record = { ...req.body, id, resource };
      db[resource].push(record);
      writeResourcesDB(db);
      return res.json(record);
    }
    const record = { ...db[resource][index], ...req.body, id };
    db[resource][index] = record;
    writeResourcesDB(db);
    res.json(record);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/resources/:resource/:id", (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const db = readResourcesDB();
    if (SOFT_DELETE_RESOURCES.includes(resource)) {
      const record = db[resource]?.find(item => String(item.id) === id);
      if (!record) return res.status(404).json({ error: "Record not found" });
      record.isDeleted = true;
      record.deletedAt = new Date().toISOString();
      writeResourcesDB(db);
      return res.json({ id, deleted: true, isDeleted: true });
    }
    const before = db[resource]?.length || 0;
    db[resource] = (db[resource] || []).filter(item => String(item.id) !== id);
    writeResourcesDB(db);
    res.json({ id, deleted: db[resource].length < before });
  } catch (error) {
    next(error);
  }
});

// ===== HEALTH & ERROR =====
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("API Error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

export default app;