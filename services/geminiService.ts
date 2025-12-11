import { GoogleGenAI, Type } from "@google/genai";
import { Visitor, RecognitionResult } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const compressImage = async (base64Str: string, maxWidth = 640): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = maxWidth / img.width;
      const finalScale = scale < 1 ? scale : 1; 
      canvas.width = img.width * finalScale;
      canvas.height = img.height * finalScale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str.split(',')[1] || base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.8);
      resolve(compressed.split(',')[1]);
    };
  });
};

export const validateReferencePhoto = async (photoBase64: string): Promise<boolean> => {
  const cleanFrame = await compressImage(photoBase64);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: "Does this image contain a clear, visible human face suitable for recognition? Return JSON." },
            { inlineData: { mimeType: "image/jpeg", data: cleanFrame } }
          ] 
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { hasFace: { type: Type.BOOLEAN } },
          required: ["hasFace"]
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return result.hasFace === true;
  } catch (error: any) {
    // Check for rate limits
    if (error.toString().includes('429') || error.message?.includes('quota') || error.status === 'RESOURCE_EXHAUSTED') {
      throw new Error("QUOTA_EXCEEDED");
    }
    console.error("Face validation error:", error);
    return false;
  }
};

export const identifyVisitor = async (
  currentFrameBase64: string,
  knownVisitors: Visitor[]
): Promise<RecognitionResult> => {
  
  const cleanFrame = await compressImage(currentFrameBase64);
  const inputs: any[] = [];
  
  inputs.push({ text: "Current View Image (Analyze this for people):" });
  inputs.push({ inlineData: { mimeType: "image/jpeg", data: cleanFrame } });

  if (knownVisitors.length > 0) {
    inputs.push({ text: "Reference Database:" });
    knownVisitors.forEach(visitor => {
      const cleanRef = visitor.photoBase64.split(',')[1] || visitor.photoBase64;
      // We pass the type (trusted/blocked) so the model knows context
      inputs.push({ text: `ID: ${visitor.id} | Name: ${visitor.name} | Status: ${visitor.type}` });
      inputs.push({ inlineData: { mimeType: "image/jpeg", data: cleanRef } });
    });
  }

  // UPDATED PROMPT: Ethical guidelines and robust matching
  const prompt = `
    You are ReMembr, an empathetic vision assistant for memory care.
    Analyze the "Current View Image".
    
    GUIDELINES:
    1. **Strict Identification**: Only match a person if the face matches the Reference Database with HIGH confidence.
    2. **Avoid Assumptions**: For unknown people, DO NOT guess their name, race, or gender. Label them simply as "Unknown Person".
    3. **Lighting Check**: If the face is too dark, blurry, or back-lit to be sure, set 'confidenceIsLow' to true.
    4. **Output Format**: Return a JSON object with a "people" array.

    For each detected person:
    - box_2d: [ymin, xmin, ymax, xmax] (0-1000)
    - matchFound: boolean
    - name: The name from DB or "Unknown Person"
    - type: 'trusted' or 'blocked' (from DB) or undefined if unknown
    - relationship: from DB or null
    - lastInteraction: from DB or null
    - notes: from DB or null
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: prompt }, ...inputs.slice(1)] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            people: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  matchFound: { type: Type.BOOLEAN },
                  visitorId: { type: Type.STRING, nullable: true },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["trusted", "blocked"], nullable: true },
                  relationship: { type: Type.STRING, nullable: true },
                  lastInteraction: { type: Type.STRING, nullable: true },
                  notes: { type: Type.STRING, nullable: true },
                  confidenceIsLow: { type: Type.BOOLEAN, nullable: true }
                },
                required: ["box_2d", "matchFound", "name"]
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    return JSON.parse(resultText) as RecognitionResult;

  } catch (error: any) {
    if (error.toString().includes('429') || error.message?.includes('quota') || error.status === 'RESOURCE_EXHAUSTED') {
       throw new Error("QUOTA_EXCEEDED");
    }
    console.error("Gemini Recognition Error:", error);
    return { people: [] };
  }
};