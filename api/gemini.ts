import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverless proxy to Google Gemini. Expects the client to POST the same
// body shape that would be sent to the Gemini `generateContent` endpoint.
// This keeps the `GEMINI_API_KEY` out of the browser.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    return;
  }

  try {
    const body = req.body;
    // Determine model (allow client to specify or default)
    const model = body?.model || 'gemini-2.5-flash';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err: any) {
    console.error('Proxy to Gemini failed:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
