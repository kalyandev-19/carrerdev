
import { GoogleGenAI, Type } from "@google/genai";
import { GroundingSource } from "../types.ts";

/**
 * Custom error handler for Gemini API calls.
 * Triggers the key selection dialog if an authentication error occurs in the sandbox,
 * or logs a clear message for local development.
 */
const handleAIError = (error: any) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || "";
  
  const isAuthError = 
    message.includes("An API Key must be set") || 
    message.includes("Requested entity was not found") || 
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID") ||
    message.includes("invalid character");

  if (isAuthError) {
    // Check if we are in the AI Studio sandbox environment
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      window.aistudio.openSelectKey();
    } else {
      console.warn("Authentication failed. Ensure VITE_API_KEY is set in your local .env file.");
    }
    throw new Error("Authentication failure. Please ensure your API key is valid and configured.");
  }

  throw error;
};

/**
 * Helper to ensure we always have a fresh instance with the latest injected API key.
 * Checks both process.env (sandbox) and import.meta.env (Vite/Local).
 */
export const getAI = () => {
  // Try platform-injected key first, then local Vite key
  // @ts-ignore
  const apiKey = process.env.API_KEY || (import.meta.env && import.meta.env.VITE_API_KEY);
  
  if (!apiKey) {
    // If in sandbox, open the key selector
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      window.aistudio.openSelectKey();
      throw new Error("API Key is missing. Please select a key in the authorization dialog.");
    }
    
    throw new Error("API Key is missing. Local users: add VITE_API_KEY=your_key to a .env file.");
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

/**
 * Searches for active job or internship opportunities using Google Search grounding.
 */
export const searchOpportunities = async (query: string, location: string, type: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `Find ${type} opportunities for "${query}" in "${location}". Provide a brief overview of the current landscape and key companies hiring.` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a real-time job market analyst. 
        Your task is to identify active job or internship opportunities based on user queries.
        Provide a concise summary of the market status and highlight significant listings or platforms.
        Use Google Search to ensure the data is current.`,
      }
    });
    return response;
  } catch (error) {
    handleAIError(error);
    throw error;
  }
};
