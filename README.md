# JARVIS Web (Hosted)

This repository includes a web-based JARVIS UI (`index.html`) and a serverless API endpoint (`/api/generate`) that proxies Gemini requests without exposing your API key.

## Deploy on Vercel (public link)

1. Create a new Vercel project and import this repository.
2. Add an environment variable:
   - `GEMINI_API_KEY` = your Google Gemini API key
3. Deploy the project.

After deploy, Vercel will provide a public HTTPS URL. Use that URL to access JARVIS from anywhere.

## Notes

- Voice input/output requires HTTPS, which Vercel provides.
- The API endpoint is `/api/generate` and includes CORS headers for safety if you host the UI elsewhere.
