import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import storageRoutes from "../backend/routes/storage.js";
import claudeRoutes from "../backend/routes/claude.js";
import resourceRoutes, { seedResources } from "../backend/routes/resources.js";
import { connectMongo, getResourceCollection } from "../backend/db/mongodb.js";
import { setStorageCollection } from "../backend/routes/storage.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json({ limit: "10mb" }));

let mongoInitialized = false;
async function ensureDb() {
  if (mongoInitialized) return;
  try {
    const collection = await connectMongo();
    if (collection) {
      setStorageCollection(collection);
      const resourceCollection = getResourceCollection();
      await seedResources(resourceCollection);
    }
    mongoInitialized = true;
  } catch (err) {
    console.error("MongoDB init error in serverless environment:", err);
  }
}

app.use(async (req, res, next) => {
  await ensureDb();
  next();
});

app.use("/api/storage", storageRoutes);
app.use("/api/claude", claudeRoutes);
app.use("/api/resources", resourceRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, environment: "vercel-serverless" }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Vercel Serverless API Error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

export default app;
