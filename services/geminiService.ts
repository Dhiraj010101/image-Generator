
import { GoogleGenAI, Type } from "@google/genai";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateImageVariation = async (
  referenceImageBase64: string,
  mimeType: string,
  prompt: string,
  aspectRatio: string = "1:1",
  enhanceQuality: boolean = false,
  maxRetries: number = 3
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let lastError: any = null;

  // Construct optimized prompt based on enhancement setting
  let systemPrompt = `Analyze the attached reference image carefully for style, composition, and key features. 
              
  Task: Generate a high-fidelity, photorealistic new image based on this analysis and the following instruction: "${prompt}".
  
  Requirements:
  - Output Resolution: 8K equivalent detail.
  - Quality: Masterpiece, highly detailed, sharp focus.
  - Aspect Ratio: ${aspectRatio}.
  - Do not simply describe the image; generate the visual result.`;

  if (enhanceQuality) {
    systemPrompt += `
    
    CRITICAL ENHANCEMENT INSTRUCTIONS:
    - MODE: ULTRA-REALISM & TEXTURE UPSCALING.
    - Lighting: Apply volumetric lighting, ray-tracing style shadows, and professional color grading (HDR).
    - Details: Enhance micro-textures (skin pores, fabric threads, material imperfections).
    - Clarity: Eliminate all compression artifacts, blur, or noise. Denoise and sharpen.
    - Aesthetics: Cinematic composition, award-winning photography style.`;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Using gemini-2.5-flash-image (Free tier compatible)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: systemPrompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: referenceImageBase64
              }
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      // If we got a response but no image, throw to trigger retry
      throw new Error("API returned response but no image data found.");

    } catch (error: any) {
      console.warn(`Generation attempt ${attempt}/${maxRetries} failed:`, error.message);
      lastError = error;
      
      // If it's the last attempt, don't wait, just loop to exit
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt - 1);
        await wait(delay);
      }
    }
  }

  console.error("All generation attempts failed.", lastError);
  return null;
};

export const compareImagesQuality = async (
  images: { data: string; mimeType: string }[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.data
    }
  }));

  const prompt = `You are a world-class photography judge and technical image analyst. 
  
  Task: Analyze the provided images. Compare them based on:
  1. Technical Quality: Sharpness, noise levels, exposure balance, dynamic range, and resolution perception.
  2. Aesthetic Quality: Composition, color harmony, lighting, and visual impact.
  
  Output:
  - Assign a score (0-100) to each image.
  - Provide a concise critique for each (max 15 words).
  - Identify the single BEST image index.
  - Provide a reason why it won.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: prompt },
        ...imageParts
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bestImageIndex: { type: Type.INTEGER, description: "Index of the highest quality image (0-based)" },
          winnerReason: { type: Type.STRING, description: "Why this image is the best" },
          analyses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                score: { type: Type.INTEGER, description: "Quality score from 0-100" },
                critique: { type: Type.STRING, description: "Short critique of the image" }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
