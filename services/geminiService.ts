
import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types.ts";

const handleAIError = (error: any) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || "";
  
  // Specific check for missing key in browser or invalid key errors
  const isAuthError = 
    message.includes("An API Key must be set") || 
    message.includes("Requested entity was not found") || 
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID");

  if (isAuthError) {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      window.aistudio.openSelectKey();
    }
    throw new Error("API Authentication failed. Please select a valid API key from a paid Google Cloud project to continue.");
  }

  throw error;
};

/**
 * Helper to ensure we always have a fresh instance with the latest injected API key
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Force open the key selector if we reach this state without a key
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      window.aistudio.openSelectKey();
    }
    throw new Error("API Key is missing. Please select a key in the authorization dialog.");
  }
  return new GoogleGenAI({ apiKey });
};

export const askIndustryExpertStream = async function* (field: string, question: string) {
  try {
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `I am a student interested in the ${field} industry. Question: "${question}"` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are an expert career counselor specializing in the ${field} industry. 
        Your goal is to provide specific, actionable advice. 
        Use the Google Search tool to find current trends, salary benchmarks, or active internship/job platforms.
        Always maintain a professional, encouraging tone. Format your response with clear Markdown headers and bullet points.`,
      }
    });

    for await (const chunk of responseStream) {
      yield chunk;
    }
  } catch (error) {
    handleAIError(error);
  }
};

export const generateResumeSectionStream = async function* (prompt: string) {
    try {
        const ai = getAI();
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: [{
                parts: [{ text: prompt }]
            }],
            config: {
                systemInstruction: "You are a professional resume strategist. Generate text that is high-impact, uses action-oriented language, and quantifies achievements where possible. Be concise."
            }
        });
        for await (const chunk of responseStream) {
            yield chunk.text || "";
        }
    } catch (error) {
        handleAIError(error);
    }
};

export const analyzeResumeStream = async function* (content: string | { data: string, mimeType: string }) {
  const systemPrompt = `
    Analyze the provided resume and deliver a high-level strategic audit. Structure your feedback into:
    1. **Visual & Structural Logic**: Brief comment on layout.
    2. **Content Impact**: How well achievements are communicated.
    3. **Keyword Optimization**: Suggestions for industry-standard terms.
    4. **Action Items**: 3 concrete steps for improvement.

    Be critical but constructive. Use professional formatting.
  `;

  const parts: any[] = [];
  if (typeof content === 'string') {
    parts.push({ text: `Resume Content:\n\n${content}` });
  } else {
    parts.push({
      inlineData: {
        data: content.data,
        mimeType: content.mimeType
      }
    });
  }

  try {
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction: systemPrompt
      }
    });
    for await (const chunk of responseStream) {
        yield chunk.text || "";
    }
  } catch (error) {
    handleAIError(error);
  }
};
