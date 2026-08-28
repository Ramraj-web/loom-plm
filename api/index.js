import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { RESOURCE_SEEDS } from "../backend/data/seed.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json({ limit: "10mb" }));

// MongoDB connection cache for serverless lifecycle
let client = null;
let storageCollection = null;
let resourceCollection = null;
let isMongoConnecting = false;

async function getMongoDb() {
  if (!process.env.MONGODB_URI) return null;
  if (resourceCollection) return { storageCollection, resourceCollection };
  if (isMongoConnecting) return null;

  try {
    isMongoConnecting = true;
    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
    }
    const database = client.db(process.env.MONGODB_DB_NAME || "loom_plm");
    storageCollection = database.collection("storage");
    resourceCollection = database.collection("resources");

    // Seed resources if empty
    for (const [resource, records] of Object.entries(RESOURCE_SEEDS)) {
      const count = await resourceCollection.countDocuments({ resource });
      if (count === 0 && records.length) {
        await resourceCollection.insertMany(records.map(record => ({ resource, ...record })));
      }
    }
    return { storageCollection, resourceCollection };
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return null;
  } finally {
    isMongoConnecting = false;
  }
}

// In-memory / serverless storage fallback
let memoryDB = JSON.parse(JSON.stringify(RESOURCE_SEEDS));
let memoryStorage = { personal: {}, shared: {} };

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

function validResource(name) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name);
}

function makeId(resource, record) {
  return record.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Health route
app.get("/api/health", (req, res) => {
  res.json({ ok: true, environment: "vercel-serverless", timestamp: new Date().toISOString() });
});

// Resource CRUD Routes
app.get("/api/resources/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });

  try {
    const mongo = await getMongoDb();
    const isSoftDelete = SOFT_DELETE_RESOURCES.includes(resource);
    if (mongo) {
      const filter = isSoftDelete
        ? { resource, isDeleted: req.query.trash === "true" ? true : { $ne: true } }
        : { resource };
      const items = await mongo.resourceCollection.find(filter).project({ _id: 0 }).toArray();
      return res.json(items);
    }

    if (!Array.isArray(memoryDB[resource])) {
      memoryDB[resource] = JSON.parse(JSON.stringify(RESOURCE_SEEDS[resource] || []));
    }
    const items = memoryDB[resource].filter(record => {
      if (!isSoftDelete) return true;
      return req.query.trash === "true" ? record.isDeleted === true : record.isDeleted !== true;
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.get("/api/resources/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      const record = await mongo.resourceCollection.findOne({ resource, id }, { projection: { _id: 0 } });
      if (!record) return res.status(404).json({ error: "Record not found" });
      return res.json(record);
    }

    const record = (memoryDB[resource] || []).find(item => String(item.id) === id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

app.post("/api/resources/:resource", async (req, res, next) => {
  const { resource } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });

  const record = {
    ...req.body,
    id: makeId(resource, req.body),
    ...(SOFT_DELETE_RESOURCES.includes(resource) ? { isDeleted: false } : {}),
  };

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.resourceCollection.insertOne({ resource, ...record });
    } else {
      if (!Array.isArray(memoryDB[resource])) memoryDB[resource] = [];
      memoryDB[resource] = [record, ...memoryDB[resource]];
    }
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

app.put("/api/resources/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      const existing = await mongo.resourceCollection.findOne({ resource, id });
      if (!existing) return res.status(404).json({ error: "Record not found" });
      const record = { ...existing, ...req.body, id, resource };
      delete record._id;
      await mongo.resourceCollection.replaceOne({ resource, id }, { resource, ...record });
      return res.json(record);
    } else {
      if (!Array.isArray(memoryDB[resource])) memoryDB[resource] = [];
      const index = memoryDB[resource].findIndex(item => String(item.id) === id);
      if (index < 0) return res.status(404).json({ error: "Record not found" });
      const record = { ...memoryDB[resource][index], ...req.body, id };
      memoryDB[resource][index] = record;
      return res.json(record);
    }
  } catch (error) {
    next(error);
  }
});

app.patch("/api/resources/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      const existing = await mongo.resourceCollection.findOne({ resource, id });
      if (!existing) return res.status(404).json({ error: "Record not found" });
      const record = { ...existing, ...req.body, id, resource };
      delete record._id;
      await mongo.resourceCollection.replaceOne({ resource, id }, { resource, ...record });
      return res.json(record);
    } else {
      if (!Array.isArray(memoryDB[resource])) memoryDB[resource] = [];
      const index = memoryDB[resource].findIndex(item => String(item.id) === id);
      if (index < 0) return res.status(404).json({ error: "Record not found" });
      const record = { ...memoryDB[resource][index], ...req.body, id };
      memoryDB[resource][index] = record;
      return res.json(record);
    }
  } catch (error) {
    next(error);
  }
});

app.delete("/api/resources/:resource/:id", async (req, res, next) => {
  const { resource, id } = req.params;
  if (!validResource(resource)) return res.status(404).json({ error: "Unknown resource" });

  try {
    const mongo = await getMongoDb();
    if (SOFT_DELETE_RESOURCES.includes(resource)) {
      const update = { $set: { isDeleted: true, deletedAt: new Date().toISOString() } };
      if (mongo) {
        const result = await mongo.resourceCollection.updateOne({ resource, id }, update);
        if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
      } else {
        const record = (memoryDB[resource] || []).find(item => String(item.id) === id);
        if (!record) return res.status(404).json({ error: "Record not found" });
        Object.assign(record, update.$set);
      }
      return res.json({ id, deleted: true, isDeleted: true });
    }

    if (mongo) {
      const result = await mongo.resourceCollection.deleteOne({ resource, id });
      if (!result.deletedCount) return res.status(404).json({ error: "Record not found" });
    } else {
      const before = memoryDB[resource]?.length || 0;
      memoryDB[resource] = (memoryDB[resource] || []).filter(item => String(item.id) !== id);
      if (memoryDB[resource].length === before) return res.status(404).json({ error: "Record not found" });
    }
    res.json({ id, deleted: true });
  } catch (error) {
    next(error);
  }
});

// Storage API Routes
app.get("/api/storage/:key", async (req, res, next) => {
  try {
    const shared = req.query.shared === "true";
    const mongo = await getMongoDb();
    if (mongo) {
      const record = await mongo.storageCollection.findOne({ key: req.params.key, shared });
      if (!record) return res.status(404).json({ error: "Key not found" });
      return res.json({ key: record.key, value: record.value, shared });
    }
    const bucket = shared ? "shared" : "personal";
    const value = memoryStorage[bucket][req.params.key];
    if (value === undefined) return res.status(404).json({ error: "Key not found" });
    res.json({ key: req.params.key, value, shared });
  } catch (error) {
    next(error);
  }
});

app.post("/api/storage/:key", async (req, res, next) => {
  try {
    const shared = !!req.body.shared;
    const value = req.body.value;
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.storageCollection.updateOne(
        { key: req.params.key, shared },
        { $set: { key: req.params.key, value, shared } },
        { upsert: true }
      );
      return res.json({ key: req.params.key, value, shared });
    }
    const bucket = shared ? "shared" : "personal";
    memoryStorage[bucket][req.params.key] = value;
    res.json({ key: req.params.key, value, shared });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Vercel Serverless API Error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

export default app;
