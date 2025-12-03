
import { GoogleGenAI, Type } from "@google/genai";
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
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_ID,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Analyze this video. Provide a main prompt and break it down into key visual segments with specific prompts for each.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: "The master prompt for the entire video.",
            },
            details: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                action: { type: Type.STRING },
                camera: { type: Type.STRING },
                lighting: { type: Type.STRING },
                style: { type: Type.STRING },
              },
              required: ["subject", "action", "camera", "lighting", "style"],
            },
            segments: {
              type: Type.ARRAY,
              description: "Key visual moments in the video.",
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "Time format MM:SS" },
                  timestampSeconds: { type: Type.NUMBER, description: "Time in seconds (e.g., 2.5)" },
                  description: { type: Type.STRING, description: "Brief visual description of this specific frame" },
                  prompt: { type: Type.STRING, description: "Specific generation prompt for this exact moment/shot" },
                },
                required: ["timestamp", "timestampSeconds", "description", "prompt"],
              }
            }
          },
          required: ["prompt", "details", "segments"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const adaptPromptToProduct = async (originalPrompt: string, imageBase64: string, imageMimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_ID,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64,
            },
          },
          {
            text: `ORIGINAL PROMPT: "${originalPrompt}"
            
            TASK: Rewrite the ORIGINAL PROMPT to feature the specific product shown in the attached image. 
            1. Keep the original camera angles, lighting, style, and action exactly the same.
            2. Replace the original subject's clothing or the main object with a detailed description of the product in the image.
            3. Ensure the description includes the color, texture, logo, and fit of the product in the image.
            
            Return ONLY the modified prompt text.`
          },
        ],
      },
      config: {
        responseMimeType: "text/plain",
      }
    });

    return response.text || "Failed to generate modified prompt.";
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: any[] = [];

  // If a reference image is provided, include it to ground the generation (logos, specific details)
  if (referenceImageBase64 && referenceImageMimeType) {
    parts.push({
      inlineData: {
        mimeType: referenceImageMimeType,
        data: referenceImageBase64,
      },
    });
    // Add strong instruction to use the reference image
    parts.push({ 
      text: `Generate a high-quality, photorealistic image of the following scene: "${prompt}". 
      
      IMPORTANT: The product shown in the attached image MUST be used in the generated image. 
      Maintain the exact visual identity, logos, text, and design details from the reference image. 
      Do not modify the logo or brand name.` 
    });
  } else {
    parts.push({ text: prompt });
  }

  try {
    // Using gemini-2.5-flash-image for generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, 
        }
      }
    });

    // Iterate through parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated in the response.");
  } catch (error) {
    console.error("Gemini Image Generation Failed:", error);
    throw error;
  }
};
