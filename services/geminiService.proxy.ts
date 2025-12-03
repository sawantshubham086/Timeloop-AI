import { AnalysisResult } from "../types";

const GEMINI_MODEL_ID = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
You are an expert AI Video Prompt Engineer and Cinematographer. 
Your task is to analyze a video and reverse-engineer the exact text prompt needed to generate it.

Perform two tasks:
1. GLOBAL ANALYSIS: A comprehensive prompt for the entire video.
2. SCENE BREAKDOWN: Identify 3 to 6 distinct key moments (keyframes) in the video. For each moment, provide the timestamp, a description, and a specific generation prompt for that exact shot.

Focus on:
- Subject extraction
- Camera movement specific to the shot
- Lighting conditions
`;

const proxyToServer = async (body: any) => {
  const r = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Proxy error: ${r.status}`);
  }

  return r.json();
};

export const analyzeVideoContent = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  const body = {
    model: GEMINI_MODEL_ID,
    system_instruction: { parts: { text: SYSTEM_INSTRUCTION } },
    contents: {
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Data } },
        { text: "Analyze this video. Provide a main prompt and break it down into key visual segments with specific prompts for each. Return ONLY valid JSON." }
      ]
    },
    generation_config: {
      response_mime_type: 'application/json'
    }
  };

  const data = await proxyToServer(body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  return JSON.parse(text) as AnalysisResult;
};

export const adaptPromptToProduct = async (originalPrompt: string, imageBase64: string, imageMimeType: string): Promise<string> => {
  const body = {
    model: GEMINI_MODEL_ID,
    contents: {
      parts: [
        { inline_data: { mime_type: imageMimeType, data: imageBase64 } },
        { text: `ORIGINAL PROMPT: "${originalPrompt}"\n\nTASK: Rewrite the ORIGINAL PROMPT to feature the specific product shown in the attached image. Return ONLY the modified prompt text.` }
      ]
    },
    generation_config: { response_mime_type: 'text/plain' }
  };

  const data = await proxyToServer(body);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate modified prompt.';
};

export const generateBrandImage = async (
  prompt: string,
  referenceImageBase64?: string,
  referenceImageMimeType?: string,
  aspectRatio: string = '9:16'
): Promise<string> => {
  const parts: any[] = [];

  if (referenceImageBase64 && referenceImageMimeType) {
    parts.push({ inline_data: { mime_type: referenceImageMimeType, data: referenceImageBase64 } });
    parts.push({ text: `Generate a high-quality, photorealistic image of the following scene: "${prompt}". IMPORTANT: Use the attached reference image for product details.` });
  } else {
    parts.push({ text: prompt });
  }

  const body = {
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    generation_config: { response_mime_type: 'image/png' }
  };

  const data = await proxyToServer(body);
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data);
  if (imagePart?.inline_data) return `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`;
  throw new Error('No image generated in the response.');
};
