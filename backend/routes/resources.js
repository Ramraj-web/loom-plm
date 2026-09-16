import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RESOURCE_SEEDS } from "../data/seed.js";
import { getResourceCollection } from "../db/mongodb.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "resources.json");
const router = Router();

export async function seedResources(collection) {
  for (const [resource, records] of Object.entries(RESOURCE_SEEDS)) {
    const count = await collection.countDocuments({ resource });
    if (count === 0 && records.length) await collection.insertMany(records.map(record => ({ resource, ...record })));
  }
}

function getStoragePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join("/tmp", "resources.json");
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(DATA_FILE)) {
          fs.writeFileSync(tmpPath, fs.readFileSync(DATA_FILE, "utf8"));
        } else {
          fs.writeFileSync(tmpPath, JSON.stringify(RESOURCE_SEEDS, null, 2));
        }
      } catch {
        // Continue to fallback
      }
    }
    return tmpPath;
  }
  return DATA_FILE;
}

let inMemoryDB = null;

function readDB() {
  if (inMemoryDB && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    return inMemoryDB;
  }
  const filePath = getStoragePath();
  let db;
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(RESOURCE_SEEDS, null, 2));
    }
    db = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    db = inMemoryDB || { ...RESOURCE_SEEDS };
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
    } catch {
      // Ignore if read-only disk
    }
  }
  inMemoryDB = db;
  return db;
}

function writeDB(db) {
  inMemoryDB = db;
  const filePath = getStoragePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.warn("Storage write fallback to memory:", err.message);
  }
}

function validResource(name) { return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name); }
function makeId(resource, record) { return record.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function uniqueById(records) {
  const seen = new Set();
  return records.filter(record => {
    if (!record.id || seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

const SOFT_DELETE_RESOURCES = [
  "orders",
  "tasks",
  "approvals",
  "departments",
  "production",
  "staff",
  "leaveRequests",
  "financials",
  "certifications",
  "compliances",
  "debitNotes",
  "capas",
  "notifications",
  "suppliers",
  "supplierWork",
];

router.get("/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    const isSoftDelete = SOFT_DELETE_RESOURCES.includes(resource);
    const showAll = req.query.all === "true";
    const isTrash = req.query.trash === "true";
    const filter = isSoftDelete && !showAll
      ? { resource, isDeleted: isTrash ? true : { $ne: true } }
      : { resource };
    if (collection) {
      const records = await collection.find(filter).project({ _id: 0 }).toArray();
      return res.json(resource === "users" ? uniqueById(records) : records);
    }
    const db = readDB();
    const records = (db[resource] || []).filter(record => !isSoftDelete || showAll || (isTrash ? record.isDeleted === true : record.isDeleted !== true));
    res.json(resource === "users" ? uniqueById(records) : records);
  } catch (error) { next(error); }
});

// Helper to decode parameter keys safely
function extractId(raw) {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

router.get("/:resource/:id(*)", async (req, res, next) => {
  const { resource } = req.params;
  const id = extractId(req.params.id);
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    const record = collection
      ? await collection.findOne({ resource, $or: [{ primaryId: id }, { id }] }, { projection: { _id: 0 } })
      : readDB()[resource]?.find(item => String(item.primaryId) === id || String(item.id) === id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    if (SOFT_DELETE_RESOURCES.includes(resource) && req.query.all !== "true" && req.query.trash !== "true" && record.isDeleted === true) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(record);
  } catch (error) { next(error); }
});

router.post("/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  const recordId = makeId(resource, req.body);
  const primaryId = req.body.primaryId || `pri_${resource}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record = { ...req.body, primaryId, id: recordId, ...(SOFT_DELETE_RESOURCES.includes(resource) ? { isDeleted: false } : {}) };
  try {
    const collection = getResourceCollection();
    if (collection) {
      delete record._id;
      await collection.insertOne({ resource, ...record });
    } else {
      const db = readDB();
      if (!db[resource]) db[resource] = [];
      db[resource] = [record, ...(db[resource] || [])];
      writeDB(db);
    }
    res.status(201).json(record);
  } catch (error) { next(error); }
});

router.put("/:resource/:id(*)", async (req, res, next) => {
  const { resource } = req.params;
  const id = extractId(req.params.id);
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    if (collection) {
      const existing = await collection.findOne({ resource, $or: [{ primaryId: id }, { _id: id }, { id }] });
      const record = {
        ...(existing || {}),
        ...req.body,
        id: existing?.id || req.body.id || id,
        primaryId: existing?.primaryId || req.body.primaryId || id,
        resource
      };
      delete record._id;
      if (existing?._id) {
        await collection.replaceOne({ resource, _id: existing._id }, { resource, ...record });
      } else {
        await collection.insertOne({ resource, ...record });
      }
      return res.json(record);
    } else {
      const db = readDB();
      if (!db[resource]) db[resource] = [];
      const index = db[resource].findIndex(item => (id && String(item.primaryId) === id) || (id && String(item._id) === id) || String(item.id) === id);
      if (index < 0) {
        const record = { ...req.body, id, primaryId: req.body.primaryId || id, resource };
        db[resource].push(record);
        writeDB(db);
        return res.json(record);
      }
      const record = { ...db[resource][index], ...req.body, id: db[resource][index].id || id, primaryId: db[resource][index].primaryId || id };
      db[resource][index] = record;
      writeDB(db);
      return res.json(record);
    }
  } catch (error) { next(error); }
});

router.patch("/:resource/:id(*)", async (req, res, next) => {
  const { resource } = req.params;
  const id = extractId(req.params.id);
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    if (collection) {
      const existing = await collection.findOne({ resource, $or: [{ primaryId: id }, { _id: id }, { id }] });
      if (!existing) return res.status(404).json({ error: "Record not found" });
      const record = {
        ...existing,
        ...req.body,
        id: existing.id || id,
        primaryId: existing.primaryId || req.body.primaryId || id,
        resource
      };
      delete record._id;
      // Strictly update by unique MongoDB _id so other orders sharing the same id (e.g. PO-123) are never overwritten!
      await collection.replaceOne({ resource, _id: existing._id }, { resource, ...record }, { upsert: false });
      return res.json(record);
    } else {
      const db = readDB();
      if (!db[resource]) db[resource] = [];
      const index = db[resource].findIndex(item => (id && String(item.primaryId) === id) || (id && String(item._id) === id) || String(item.id) === id);
      if (index < 0) return res.status(404).json({ error: "Record not found" });
      const record = { ...db[resource][index], ...req.body, id: db[resource][index].id || id, primaryId: db[resource][index].primaryId || id };
      db[resource][index] = record;
      writeDB(db);
      return res.json(record);
    }
  } catch (error) { next(error); }
});

router.delete("/:resource/:id(*)", async (req, res, next) => {
  const { resource } = req.params;
  const id = extractId(req.params.id);
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  const isPermanent = req.query.permanent === "true" || req.query.force === "true";

  try {
    const collection = getResourceCollection();
    const queryFilter = { resource, $or: [{ primaryId: id }, { id }, { name: id }] };
    if (SOFT_DELETE_RESOURCES.includes(resource) && !isPermanent) {
      const update = { $set: { isDeleted: true, deletedAt: new Date().toISOString() } };
      if (collection) {
        const result = await collection.updateOne(queryFilter, update);
        if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
      } else {
        const db = readDB();
        const record = db[resource]?.find(item => String(item.primaryId) === id || String(item.id) === id);
        if (!record) return res.status(404).json({ error: "Record not found" });
        Object.assign(record, update.$set); writeDB(db);
      }
      return res.json({ id, deleted: true, isDeleted: true });
    }

    if (collection) {
      const result = await collection.deleteOne(queryFilter);
      
      // Cascade delete order-associated records from MongoDB
      if (resource === "orders") {
        try {
          await collection.deleteMany({
            resource: "tasks",
            $or: [{ orderId: id }, { order: id }, { relatedOrderId: id }]
          });
          await collection.deleteMany({
            resource: "notifications",
            $or: [{ relatedId: id }, { orderId: id }, { eventKey: { $regex: id } }]
          });
          await collection.deleteMany({
            resource: "supplierWork",
            $or: [{ orderId: id }, { order: id }]
          });
          await collection.deleteMany({
            resource: "certifications",
            orderId: id
          });
          await collection.deleteMany({
            resource: "compliances",
            orderId: id
          });
          await collection.deleteMany({
            resource: "debitNotes",
            $or: [{ po: id }, { orderId: id }]
          });
          await collection.deleteMany({
            resource: "capas",
            $or: [{ po: id }, { orderId: id }]
          });
          const { getStorageCollection } = await import("../db/mongodb.js").catch(() => ({}));
          const storageCol = getStorageCollection ? getStorageCollection() : null;
          if (storageCol) {
            await storageCol.deleteMany({
              key: { $in: [`docs:${id}`, `highlights:${id}`, `chat:${id}`, `customTypes:${id}`] }
            });
          }
        } catch (cascadeErr) {
          console.warn("Cascade delete error in resources route:", cascadeErr.message);
        }
      }

      return res.json({ id, deleted: result.deletedCount > 0, permanent: true });
    } else {
      const db = readDB();
      const before = db[resource]?.length || 0;
      db[resource] = (db[resource] || []).filter(item => String(item.id) !== id && String(item.name) !== id);
      
      // Cascade delete from local DB
      if (resource === "orders") {
        ["tasks", "notifications", "supplierWork", "certifications", "compliances", "debitNotes", "capas"].forEach(relRes => {
          if (Array.isArray(db[relRes])) {
            db[relRes] = db[relRes].filter(r =>
              r.orderId !== id && r.order !== id && r.po !== id && r.relatedId !== id
            );
          }
        });
      }

      writeDB(db);
      return res.json({ id, deleted: db[resource].length < before, permanent: true });
    }
  } catch (error) { next(error); }
});

export default router;