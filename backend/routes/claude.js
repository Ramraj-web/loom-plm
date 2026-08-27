import { Router } from "express";

const router = Router();

// POST /api/claude/extract-highlights
// Frontend sends { techPackNotes, deptOptions }. This route calls the real
// Anthropic API using the key stored in .env (NEVER exposed to the browser)
// and returns a clean parsed JSON array back to the frontend.
router.post("/extract-highlights", async (req, res) => {
  const { techPackNotes, deptOptions } = req.body;

  if (!techPackNotes || !techPackNotes.trim()) {
    return res.status(400).json({ error: "techPackNotes is required" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server (.env)" });
  }

  const deptList = Array.isArray(deptOptions) && deptOptions.length ? deptOptions : ["All"];

  const prompt = `You are reviewing a garment tech pack's comments / notes section for a production team. Pull out only the distinct, important buyer instructions that a team could miss and cause rework — things like materials, trims, colors, construction details, measurements, approvals, or packing requirements. Ignore generic boilerplate.

Return ONLY a JSON array, no markdown fences, no explanation. Each item: {"text": "<concise instruction, under 20 words>", "dept": "<one of: ${deptList.join(", ")}, or All if it applies broadly>"}. If nothing relevant, return [].

Tech pack notes:
"""
${techPackNotes}
"""`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Anthropic API error", details: errText });
    }

    const data = await response.json();
    const raw = (data.content || []).map(b => b.text || "").join("").trim();
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let items;
    try {
      items = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: "Could not parse model output", raw });
    }

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
