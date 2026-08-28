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
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeDB(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function validResource(name) { return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name); }
function makeId(resource, record) { return record.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

router.get("/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
    if (collection) return res.json(await collection.find({ resource }).project({ _id: 0 }).toArray());
    const db = readDB();
    res.json(db[resource] || []);
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
  const record = { ...req.body, id: makeId(resource, req.body) };
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
  const record = { ...req.body, id };
  try {
    const collection = getResourceCollection();
    if (collection) {
      const result = await collection.replaceOne({ resource, id }, { resource, ...record });
      if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
    } else {
      const db = readDB(); const index = (db[resource] || []).findIndex(item => String(item.id) === id);
      if (index < 0) return res.status(404).json({ error: "Record not found" });
      db[resource][index] = record; writeDB(db);
    }
    res.json(record);
  } catch (error) { next(error); }
});

router.delete("/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });
  try {
    const collection = getResourceCollection();
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