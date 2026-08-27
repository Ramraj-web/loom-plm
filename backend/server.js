import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import storageRoutes from "./routes/storage.js";
import claudeRoutes from "./routes/claude.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/storage", storageRoutes);
app.use("/api/claude", claudeRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Loom PLM backend running on http://localhost:${PORT}`);
});
