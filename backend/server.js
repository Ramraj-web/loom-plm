import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import storageRoutes from "./routes/storage.js";
import { connectMongo } from "./db/mongodb.js";
import { setStorageCollection } from "./routes/storage.js";
import claudeRoutes from "./routes/claude.js";
import resourceRoutes from "./routes/resources.js";
import { seedResources } from "./routes/resources.js";

dotenv.config();
console.log("Anthropic API key loaded:", !!process.env.ANTHROPIC_API_KEY);

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "5mb" }));

app.use("/api/storage", storageRoutes);
app.use("/api/claude", claudeRoutes);
app.use("/api/resources", resourceRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.message === "Origin is not allowed by CORS" ? 403 : 500;
  res.status(status).json({ error: status === 403 ? "Origin is not allowed by CORS" : "Internal server error" });
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
