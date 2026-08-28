import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// POST /api/gemini/extract-highlights or /api/claude/extract-highlights
// Extracts actionable highlights from garment tech pack notes using Google Gemini API.
router.post("/extract-highlights", async (req, res) => {
  const { techPackNotes, deptOptions } = req.body;

  if (!techPackNotes || !techPackNotes.trim()) {
    return res.status(400).json({ error: "techPackNotes is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY;
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
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
