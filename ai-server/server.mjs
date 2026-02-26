import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
console.log("OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);


const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/ai-explain", async (req, res) => {
  try {
    const {
      tightPct,
      okPct,
      loosePct,
      fitScore,
      recommendation
    } = req.body || {};

    if (
      typeof tightPct !== "number" ||
      typeof okPct !== "number" ||
      typeof loosePct !== "number" ||
      typeof fitScore !== "number" ||
      typeof recommendation !== "string"
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const prompt = `
You are a medical 3D printing advisor.

Fit Metrics:
- Tight: ${tightPct}%
- OK: ${okPct}%
- Loose: ${loosePct}%
- Fit Score: ${fitScore}/100
- Recommendation: ${recommendation}

Write:
• 1 sentence overall verdict
• 2 bullets explaining the issue
• 2 bullets with next actions

Keep it executive-friendly and concise.
`;

    const response = await client.responses.create({
      model: "gpt-5",
      input: prompt
    });

    const text =
      response.output_text ||
      "AI explanation unavailable.";

    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI server error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ AI server running at http://localhost:${PORT}`);
});
