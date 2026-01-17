
import { GoogleGenAI } from "@google/genai";

/**
 * Robust error handling for Gemini API calls.
 */
const handleAIError = (error: any) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || "";
  
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
    throw new Error("Authentication failure. Please ensure your API key is valid.");
  }

  throw error;
};

/**
 * Strictly obtains the GoogleGenAI instance using the environment's API_KEY.
 */
export const getAI = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
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
        systemInstruction: `You are a professional career counselor specializing in the ${field} industry. Provide actionable, data-driven advice.`,
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
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a professional resume strategist. Generate high-impact, action-oriented text."
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
        systemInstruction: "Analyze this resume. Provide critical feedback on content, keywords, and action items."
      }
    });
    for await (const chunk of responseStream) {
        yield chunk.text || "";
    }
  } catch (error) {
    handleAIError(error);
  }
};

export const searchOpportunities = async (query: string, location: string, type: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `Find ${type} opportunities for "${query}" in "${location}".` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a job market analyst providing real-time opportunity insights.",
      }
    });
    return response;
  } catch (error) {
    handleAIError(error);
    throw error;
  }
};
