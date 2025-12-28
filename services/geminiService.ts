
import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types.ts";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.startsWith('sk-or-')) {
    throw new Error("Invalid or missing API Key. Please ensure you are using a Google Gemini API Key (starting with AIza) configured in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const handleAIError = (error: any) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || "";
  
  if (message.includes("Requested entity was not found")) {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      window.aistudio.openSelectKey();
    }
    throw new Error("The API key provided is not authorized or the project is missing. Please select a valid key from a paid Google Cloud project.");
  }

  throw error;
};

export const askIndustryExpertStream = async function* (field: string, question: string) {
  try {
    const ai = getAIClient();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `Question about the ${field} industry: "${question}"` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a helpful and experienced professional in the ${field} industry. 
        Provide clear, concise, and actionable advice for a student or recent graduate. 
        Use your search tool to provide the most up-to-date information regarding industry trends, 
        salary data, or required skills. Format your response using markdown.`,
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
        const ai = getAIClient();
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: [{
                parts: [{ text: prompt }]
            }],
            config: {
                systemInstruction: "You are a professional resume writer. Generate a concise and impactful response. Focus on action verbs and achievements."
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
    Analyze the following resume and provide feedback. Structure your feedback into the following sections:
    1.  **Overall Impression**
    2.  **Formatting and Readability**
    3.  **Summary/Objective Section**
    4.  **Experience Section** (Use STAR method suggestions)
    5.  **Skills Section**
    6.  **Actionable Recommendations** (Top 3-5 bullets)

    Format using markdown. If a file is provided, also comment on the visual layout and design.
  `;

  const parts: any[] = [];
  if (typeof content === 'string') {
    parts.push({ text: `Analyze this resume text:\n\n${content}` });
  } else {
    parts.push({
      inlineData: {
        data: content.data,
        mimeType: content.mimeType
      }
    });
    parts.push({ text: "Analyze the attached resume file." });
  }

  try {
    const ai = getAIClient();
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
