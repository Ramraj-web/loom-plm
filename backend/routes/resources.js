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

function readDB() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(RESOURCE_SEEDS, null, 2));
  }
  let db;
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    db = { ...RESOURCE_SEEDS };
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }
  let updated = false;
  for (const [key, seedList] of Object.entries(RESOURCE_SEEDS)) {
    if (!Array.isArray(db[key])) {
      db[key] = [...seedList];
      updated = true;
    }
  }
  if (updated) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }
  return db;
}

function writeDB(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function validResource(name) { return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name); }
function makeId(resource, record) { return record.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

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
  "debitNotes",
  "capas",
];

router.get("/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    const isSoftDelete = SOFT_DELETE_RESOURCES.includes(resource);
    const filter = isSoftDelete
      ? { resource, isDeleted: req.query.trash === "true" ? true : { $ne: true } }
      : { resource };
    if (collection) return res.json(await collection.find(filter).project({ _id: 0 }).toArray());
    const db = readDB();
    res.json((db[resource] || []).filter(record => !isSoftDelete || (req.query.trash === "true" ? record.isDeleted === true : record.isDeleted !== true)));
  } catch (error) { next(error); }
});

router.get("/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    const record = collection ? await collection.findOne({ resource, id }, { projection: { _id: 0 } }) : readDB()[resource]?.find(item => String(item.id) === id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { next(error); }
});

router.post("/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  const record = { ...req.body, id: makeId(resource, req.body), ...(SOFT_DELETE_RESOURCES.includes(resource) ? { isDeleted: false } : {}) };
  try {
    const collection = getResourceCollection();
    if (collection) await collection.insertOne({ resource, ...record });
    else { const db = readDB(); db[resource] = [...(db[resource] || []), record]; writeDB(db); }
    res.status(201).json(record);
  } catch (error) { next(error); }
});

router.put("/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    if (collection) {
      const existing = await collection.findOne({ resource, id });
      if (!existing) return res.status(404).json({ error: "Record not found" });
      const record = { ...existing, ...req.body, id, resource };
      delete record._id;
      const result = await collection.replaceOne({ resource, id }, { resource, ...record });
      if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
      return res.json(record);
    } else {
      const db = readDB();
      const index = (db[resource] || []).findIndex(item => String(item.id) === id);
      if (index < 0) return res.status(404).json({ error: "Record not found" });
      const record = { ...db[resource][index], ...req.body, id };
      db[resource][index] = record;
      writeDB(db);
      return res.json(record);
    }
  } catch (error) { next(error); }
});

router.patch("/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    if (collection) {
      const existing = await collection.findOne({ resource, id });
      if (!existing) return res.status(404).json({ error: "Record not found" });
      const record = { ...existing, ...req.body, id, resource };
      delete record._id;
      await collection.replaceOne({ resource, id }, { resource, ...record });
      return res.json(record);
    } else {
      const db = readDB();
      const index = (db[resource] || []).findIndex(item => String(item.id) === id);
      if (index < 0) return res.status(404).json({ error: "Record not found" });
      const record = { ...db[resource][index], ...req.body, id };
      db[resource][index] = record;
      writeDB(db);
      return res.json(record);
    }
  } catch (error) { next(error); }
});

router.delete("/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    if (SOFT_DELETE_RESOURCES.includes(resource)) {
      const update = { $set: { isDeleted: true, deletedAt: new Date().toISOString() } };
      if (collection) {
        const result = await collection.updateOne({ resource, id }, update);
        if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
      } else {
        const db = readDB(); const record = db[resource]?.find(item => String(item.id) === id);
        if (!record) return res.status(404).json({ error: "Record not found" });
        Object.assign(record, update.$set); writeDB(db);
      }
      return res.json({ id, deleted: true, isDeleted: true });
    }
    if (collection) {
      const result = await collection.deleteOne({ resource, id });
      if (!result.deletedCount) return res.status(404).json({ error: "Record not found" });
    } else {
      const db = readDB(); const before = db[resource]?.length || 0;
      db[resource] = (db[resource] || []).filter(item => String(item.id) !== id);
      if (db[resource].length === before) return res.status(404).json({ error: "Record not found" });
      writeDB(db);
    }
    res.json({ id, deleted: true });
  } catch (error) { next(error); }
});

export default router;