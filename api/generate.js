const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent";

const extractResponseText = (data) =>
  data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const defaultOrigin = host ? `${protocol}://${host}` : null;
  const configuredOrigins = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = configuredOrigins
    ? configuredOrigins
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => {
          try {
            new URL(item);
            return true;
          } catch {
            return false;
          }
        })
    : defaultOrigin
      ? [defaultOrigin]
      : [];

  if (configuredOrigins && allowedOrigins.length === 0) {
    console.error("Invalid ALLOWED_ORIGINS configuration");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

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

    let data;
    try {
      data = await response.json();
    } catch {
      res.status(502).json({ error: "Invalid response from Gemini API" });
      return;
    }

    if (!response.ok) {
      const message = data?.error?.message || "Gemini API error";
      res.status(response.status).json({ error: message });
      return;
    }

    const responseText = extractResponseText(data);
    if (!responseText) {
      res.status(502).json({ error: "No response from model" });
      return;
    }

    res.status(200).json({ text: responseText });
  } catch (error) {
    console.error("Gemini proxy error", error?.message);
    res.status(500).json({ error: "Unexpected server error" });
  }
};
