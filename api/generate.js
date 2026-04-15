const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent";

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const defaultOrigin = host ? `${protocol}://${host}` : null;
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean)
    : defaultOrigin
      ? [defaultOrigin]
      : [];

  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (allowedOrigins.length > 0) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt is required and must be a string" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Service temporarily unavailable" });
    return;
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Respond as JARVIS, the AI assistant: ${prompt}` }],
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error?.message || "Gemini API error";
      res.status(response.status).json({ error: message });
      return;
    }

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      res.status(502).json({ error: "No response from model" });
      return;
    }

    res.status(200).json({ text: responseText });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Unexpected server error" });
  }
};
