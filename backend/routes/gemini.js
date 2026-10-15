import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, orders = [] } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI chat is not configured" });

  const prompt = `You are the project assistant for a garment production PLM. Answer the user's question clearly and briefly using only the project data below. If an order number is relevant, include its exact ID in your answer so the app can make it clickable. Explain order process questions using practical steps such as confirmation, booking, costing, approvals, production, quality, and shipment. Do not invent data.

Project orders:
${JSON.stringify(orders)}

User question:
${String(message).trim()}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let result;
    try {
      result = await genAI.getGenerativeModel({ model: "gemini-3.6-flash" }).generateContent(prompt);
    } catch (error) {
      result = await genAI.getGenerativeModel({ model: "gemini-flash-latest" }).generateContent(prompt);
    }
    return res.json({ reply: result.response.text().trim() });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return res.status(500).json({ error: error.message || "Failed to answer chat message" });
  }
});

// POST /api/gemini/extract-highlights or /api/claude/extract-highlights
// Extracts actionable highlights from garment tech pack notes using Google Gemini API.
router.post("/extract-highlights", async (req, res) => {
  const { techPackNotes, deptOptions } = req.body;

  if (!techPackNotes || !techPackNotes.trim()) {
    return res.status(400).json({ error: "techPackNotes is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server (.env)" });
  }

  const deptList = Array.isArray(deptOptions) && deptOptions.length ? deptOptions : ["All"];

  const prompt = `You are reviewing a garment tech pack's comments / notes section for a production team. Pull out only the distinct, important buyer instructions that a team could miss and cause rework — things like materials, trims, colors, construction details, measurements, approvals, or packing requirements. Ignore generic boilerplate.

Return ONLY a JSON array, no markdown fences, no explanation. Each item must follow this format:
{"text": "<concise instruction, under 20 words>", "dept": "<one of: ${deptList.join(", ")}, or All if it applies broadly>"}

If nothing relevant is found, return [].

Tech pack notes:
"""
${techPackNotes}
"""`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let result;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
      result = await model.generateContent(prompt);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await fallbackModel.generateContent(prompt);
    }

    const responseText = result.response.text();

    const raw = responseText ? responseText.trim() : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let items;
    try {
      items = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: "Could not parse model output", raw });
    }

    res.json({ items });
  } catch (e) {
    console.error("Gemini API Error:", e);
    res.status(500).json({ error: e.message || "Failed to process Gemini request" });
  }
});

export default router;
