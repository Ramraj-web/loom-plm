import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "storage.json");

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
router.get("/:key", (req, res) => {
  const db = readDB();
  const bucket = req.query.shared === "true" ? "shared" : "personal";
  const value = db[bucket][req.params.key];
  if (value === undefined) return res.status(404).json({ error: "Key not found" });
  res.json({ key: req.params.key, value, shared: bucket === "shared" });
});

// POST /api/storage/:key   body: { value, shared }
router.post("/:key", (req, res) => {
  const db = readDB();
  const { value, shared } = req.body;
  const bucket = shared ? "shared" : "personal";
  db[bucket][req.params.key] = value;
  writeDB(db);
  res.json({ key: req.params.key, value, shared: !!shared });
});

// DELETE /api/storage/:key?shared=true|false
router.delete("/:key", (req, res) => {
  const db = readDB();
  const bucket = req.query.shared === "true" ? "shared" : "personal";
  const deleted = req.params.key in db[bucket];
  delete db[bucket][req.params.key];
  writeDB(db);
  res.json({ key: req.params.key, deleted, shared: bucket === "shared" });
});

// GET /api/storage?prefix=xxx&shared=true|false
router.get("/", (req, res) => {
  const db = readDB();
  const bucket = req.query.shared === "true" ? "shared" : "personal";
  const prefix = req.query.prefix || "";
  const keys = Object.keys(db[bucket]).filter(k => k.startsWith(prefix));
  res.json({ keys, prefix, shared: bucket === "shared" });
});

export default router;
