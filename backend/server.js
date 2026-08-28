import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import storageRoutes from "./routes/storage.js";
import { connectMongo } from "./db/mongodb.js";
import { setStorageCollection } from "./routes/storage.js";
import geminiRoutes from "./routes/gemini.js";
import claudeRoutes from "./routes/claude.js";
import resourceRoutes from "./routes/resources.js";
import { seedResources } from "./routes/resources.js";

dotenv.config();
console.log("Gemini API key loaded:", !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY));

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api/storage", storageRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/claude", claudeRoutes);
app.use("/api/resources", resourceRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("API Server Error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  const collection = await connectMongo();
  if (collection) {
    setStorageCollection(collection);
    const resourceCollection = (await import("./db/mongodb.js")).getResourceCollection();
    await seedResources(resourceCollection);
    console.log("MongoDB storage connected");
  } else {
    console.log("MONGODB_URI not set; using local JSON storage");
  }
  app.listen(PORT, () => {
    console.log(`Loom PLM backend listening on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
