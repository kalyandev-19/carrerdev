
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

/**
 * Hyper-Velocity Responses for near-instant career insights
 * Model: gemini-2.5-flash-lite-latest
 */
export const getFastCareerTipStream = async function* () {
    try {
        const ai = getAI();
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-lite-latest',
            contents: [{ parts: [{ text: "Generate one unique, ultra-concise career tip for a student (max 15 words)." }] }],
            config: {
                systemInstruction: "You are the CareerDev Fast-Response Engine. Provide high-velocity, impactful student career advice."
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
 * Deep Reasoning Chat with History
 * Model: gemini-3-pro-preview with max thinkingBudget
 */
export const deepChatStream = async function* (
  message: string, 
  history: {role: 'user' | 'model', text: string}[],
  useThinking: boolean = true
) {
  try {
    const ai = getAI();
    
    // Map history to the required format for sendMessage
    // sendMessage handles the state, but we can pass the initial history to the chat creation
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are the CareerDev Senior Strategist. For complex student career queries, leverage your deep reasoning capabilities. Always maintain context from the conversation history.",
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {})
      },
      // Note: In some versions of the SDK, history is passed here
      // But we will use the stateful sendMessage approach
    });

    // If we have history, we might need to "replay" it if the chat is fresh
    // For simplicity and adherence to the prompt, we'll send the latest message 
    // but include history in the prompt part if the native history isn't stateful across calls
    const fullPrompt = history.length > 0 
      ? `Conversation history:\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}\n\nUser: ${message}`
      : message;

    const responseStream = await chat.sendMessageStream({
      message: fullPrompt
    });

    for await (const chunk of responseStream) {
      yield chunk.text || "";
    }
  } catch (error) {
    handleAIError(error);
  }
}

/**
 * Standard Industry Q&A with Search Grounding
 * Model: gemini-3-flash-preview
 */
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
        systemInstruction: `You are a professional career counselor specializing in the ${field} industry. Provide actionable, data-driven advice. Always reference current trends.`,
      }
    });

    for await (const chunk of responseStream) {
      yield chunk;
    }
  } catch (error) {
    handleAIError(error);
  }
};

/**
 * Fast Resume Generation
 * Model: gemini-2.5-flash-lite-latest
 */
export const generateResumeSectionStream = async function* (prompt: string) {
    try {
        const ai = getAI();
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-lite-latest',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a professional resume strategist. Generate high-impact, action-oriented text. Be fast and concise."
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
 * Deep Resume Analysis with Thinking
 * Model: gemini-3-pro-preview
 */
export const analyzeResumeStream = async function* (
  content: string | { data: string, mimeType: string },
  isDeep: boolean = false
) {
  const parts: any[] = [];
  if (typeof content === 'string') {
    parts.push({ text: `Resume Content for Analysis:\n\n${content}` });
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
      model: isDeep ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction: isDeep 
          ? "Perform a 'Strategic Audit' of this resume. Analyze keyword density for modern recruiters, score the resume from 0-100%, and provide a roadmap for high-tier industry placement."
          : "Provide quick, constructive feedback on this resume. Identify clear areas for improvement.",
        ...(isDeep ? { thinkingConfig: { thinkingBudget: 32768 } } : {})
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
 * Real-time Opportunity Discovery with Search Grounding
 */
export const searchOpportunities = async (query: string, location: string, type: 'Internship' | 'Job') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `Search for the latest ${type} openings for "${query}" in "${location}". Focus on verified job boards and official company career pages. Provide direct application links.` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are CareerDev AI's real-time Opportunity Node. Your mission is to discover and present active career opportunities by grounding your response in Google Search.",
      }
    });
    return response;
  } catch (error) {
    handleAIError(error);
  }
};
