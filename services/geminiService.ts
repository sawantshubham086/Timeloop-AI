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

export const analyzeVideoContent = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Gemini API Key not configured");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: SYSTEM_INSTRUCTION }
          },
          contents: {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              {
                text: "Analyze this video. Provide a main prompt and break it down into key visual segments with specific prompts for each. Return ONLY valid JSON.",
              },
            ],
          },
          generation_config: {
            response_mime_type: "application/json",
            response_schema: {
              type: "OBJECT",
              properties: {
                masterPrompt: {
                  type: "STRING",
                  description: "The master prompt for the entire video.",
                },
                details: {
                  type: "OBJECT",
                  properties: {
                    subject: { type: "STRING" },
                    camera: { type: "STRING" },
                    lighting: { type: "STRING" },
                    aesthetics: { type: "STRING" },
                  },
                  required: ["subject", "camera", "lighting", "aesthetics"],
                },
                segments: {
                  type: "ARRAY",
                  description: "Key visual moments in the video.",
                  items: {
                    type: "OBJECT",
                    properties: {
                      timestamp: { type: "STRING", description: "Time format MM:SS" },
                      timestampSeconds: { type: "NUMBER", description: "Time in seconds" },
                      description: { type: "STRING" },
                      prompt: { type: "STRING" },
                    },
                    required: ["timestamp", "timestampSeconds", "description", "prompt"],
                  }
                }
              },
              required: ["masterPrompt", "details", "segments"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Gemini API error");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const adaptPromptToProduct = async (originalPrompt: string, imageBase64: string, imageMimeType: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API Key not configured");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: {
            parts: [
              {
                inline_data: {
                  mime_type: imageMimeType,
                  data: imageBase64,
                },
              },
              {
                text: `ORIGINAL PROMPT: "${originalPrompt}"
                
TASK: Rewrite the ORIGINAL PROMPT to feature the specific product shown in the attached image. 
1. Keep the original camera angles, lighting, style, and action exactly the same.
2. Replace the original subject's clothing or the main object with a detailed description of the product in the image.
3. Ensure the description includes the color, texture, logo, and fit of the product in the image.

Return ONLY the modified prompt text, nothing else.`
              },
            ],
          },
          generation_config: {
            response_mime_type: "text/plain",
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Gemini API error");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate modified prompt.";
  } catch (error) {
    console.error("Gemini Product Adaptation Failed:", error);
    throw error;
  }
};

export const generateBrandImage = async (
  prompt: string, 
  referenceImageBase64?: string, 
  referenceImageMimeType?: string, 
  aspectRatio: string = "9:16"
): Promise<string> => {
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API Key not configured");
  }

  const parts: any[] = [];

  if (referenceImageBase64 && referenceImageMimeType) {
    parts.push({
      inline_data: {
        mime_type: referenceImageMimeType,
        data: referenceImageBase64,
      },
    });
    parts.push({ 
      text: `Generate a high-quality, photorealistic image of the following scene: "${prompt}". 
      
IMPORTANT: The product shown in the attached image MUST be used in the generated image. 
Maintain the exact visual identity, logos, text, and design details from the reference image.` 
    });
  } else {
    parts.push({ text: prompt });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: {
            parts: parts,
          },
          generation_config: {
            response_mime_type: "image/png",
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Image generation failed");
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data);
    
    if (imagePart?.inline_data) {
      return `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`;
    }
    
    throw new Error("No image generated in the response.");
  } catch (error) {
    console.error("Gemini Image Generation Failed:", error);
    throw error;
  }
};
