
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 1. Client-Side Caching Utility ---
interface CacheEntry {
  data: any;
  timestamp: number;
}

const getCachedData = (key: string, ttlMs: number = 3600000): any | null => {
  const cached = localStorage.getItem(`gemini_cache_${key}`);
  if (cached) {
    try {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < ttlMs) {
        return entry.data;
      }
    } catch {
      // ignore
    }
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(`gemini_cache_${key}`, JSON.stringify(entry));
  } catch {
    // ignore
  }
};

// --- 2. Request Spacing Rate-Limiting ---
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 2000; // 2 seconds minimum between outbound calls

const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
    await delay(waitTime);
  }
  lastRequestTime = Date.now();
};

// --- 3. Dynamic Model Fallback Control ---
let currentModel = 'gemini-flash-latest';

const getActiveModel = () => currentModel;

const demoteModel = () => {
  if (currentModel === 'gemini-flash-latest') {
    console.warn("Primary model experiencing high demand. Demoting to gemini-flash-lite-latest.");
    currentModel = 'gemini-flash-lite-latest';
  }
};

// --- 4. Exponential Backoff & Fallback Retry Wrapper ---
const callWithRetryAndFallback = async <T>(
  fn: (model: string) => Promise<T>,
  maxRetries: number = 5
): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    const model = getActiveModel();
    try {
      await enforceRateLimit();
      return await fn(model);
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        // If primary model failed persistently, try one instant fallback attempt
        if (model === 'gemini-flash-latest') {
          demoteModel();
          try {
            console.warn("Attempting immediate fallback to gemini-flash-lite-latest...");
            return await fn('gemini-flash-lite-latest');
          } catch (fallbackError) {
            throw fallbackError;
          }
        }
        throw error;
      }
      
      const status = error?.status || error?.code || 0;
      const message = error?.message || "";
      const is429 = status === 429 || message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
      const is503 = status === 503 || message.includes("503") || message.includes("UNAVAILABLE") || message.includes("high demand") || message.includes("temporary");
      
      if (is429 || is503) {
        if (is503 && model === 'gemini-flash-latest') {
          demoteModel(); // Switch active model for the next attempt
          console.warn("Primary model overloaded (503). Retrying instantly with gemini-flash-lite-latest...");
          continue; // Retry immediately without delay
        }
        
        let waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, 16s...
        
        // Parse retry recommendations
        const retryMatch = message.match(/retry in ([\d\.]+)s/);
        if (retryMatch) {
          const seconds = parseFloat(retryMatch[1]);
          waitMs = Math.ceil(seconds * 1000) + 500;
        }
        
        console.warn(`${is429 ? '429 Rate Limited' : '503 High Demand'}. Retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})...`);
        await delay(waitMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
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

// --- 5. Pre-Written High-Quality Career Tips ---
const CAREER_TIPS = [
  "Focus on building a portfolio, not just a resume.",
  "Your network is your net worth; start connecting today.",
  "Learn to sell your skills, not just list them.",
  "The best way to predict the future is to create it.",
  "Skills get you the interview; soft skills get you the job.",
  "Master one core stack before spreading too thin.",
  "Build public projects; let recruiters find your work.",
  "A clean GitHub tells a better story than a GPA.",
  "Internships are about learning what you don't want to do.",
  "Consistency beats intensity in learning to code.",
  "Read documentation; it's the ultimate cheat code.",
  "Don't just code; learn how the business makes money.",
  "Ask smart questions; it shows you care about the answer.",
  "Contribute to open source; it's real-world teamwork.",
  "Perfect is the enemy of shipped. Deploy your projects.",
  "Your first job won't be your last; focus on growth.",
  "Learn Git early; it will save you hours of panic.",
  "Explain complex topics simply; it proves you understand them.",
  "Be teachable. Nobody expects a junior to know everything.",
  "Solve your own problems first, then ask for help.",
  "Design for the user, not just for the compiler.",
  "Understand SQL; databases are the heart of every app.",
  "A good developer is a great Google searcher.",
  "Write clean comments; your future self will thank you.",
  "Quality of code is better than quantity of features.",
  "Build a personal website; it is your digital front door.",
  "Understand the 'why' behind the code, not just the 'how'.",
  "Tailor your resume for the role you actually want.",
  "Tech stacks change; problem-solving skills are permanent.",
  "Automate repetitive tasks; it's the developer way.",
  "Take breaks; the best solutions often come offline.",
  "Learn to read other people's code without judging.",
  "Mock interviews are the best way to conquer anxiety.",
  "Start before you feel ready; confidence follows action.",
  "Embrace debugging; it's where the real learning happens.",
  "Learn how to use developer tools in the browser.",
  "Keep your LinkedIn profile clean, updated, and active.",
  "A problem well-stated is a problem half-solved.",
  "Great products are built by teams, not individuals.",
  "Document your learning journey in public blogs.",
  "Learn the basics of cloud deployment early on.",
  "Focus on writing readable code over clever hacks.",
  "Test your edge cases; users definitely will.",
  "Stay curious; technology evolves weekly.",
  "Learn how to write clear, professional emails.",
  "Master the command line; it boosts your speed.",
  "Build things that solve your own daily annoyances.",
  "Under-promise and over-deliver on your deadlines.",
  "Learn to accept constructive feedback on code reviews.",
  "Your curiosity is your greatest career asset."
];

let lastTipIndex = -1;

const getRandomCareerTip = (): string => {
  let index = Math.floor(Math.random() * CAREER_TIPS.length);
  if (CAREER_TIPS.length > 1) {
    while (index === lastTipIndex) {
      index = Math.floor(Math.random() * CAREER_TIPS.length);
    }
  }
  lastTipIndex = index;
  return CAREER_TIPS[index];
};

/**
 * Hyper-Velocity Responses for near-instant career insights
 * Streams pre-written career quotes to prevent API limits and guarantee responsiveness
 */
export const getFastCareerTipStream = async function* (bypassCache: boolean = false) {
  const cacheKey = "fast_career_tip";
  let tipText = "";
  
  if (!bypassCache) {
    const cached = getCachedData(cacheKey, 1800000); // 30 minutes cache
    if (cached) {
      tipText = cached;
    }
  }
  
  if (!tipText) {
    tipText = getRandomCareerTip();
    setCachedData(cacheKey, tipText);
  }
  
  // Yield words with a slight delay to simulate a real neural stream
  const words = tipText.split(" ");
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i === words.length - 1 ? "" : " ");
    await delay(40); // 40ms stream simulation
  }
};

/**
 * Deep Reasoning Chat with History
 * Model: gemini-flash-latest
 */
export const deepChatStream = async function* (
  message: string,
  history: { role: 'user' | 'model', text: string }[],
  useThinking: boolean = true
) {
  try {
    const ai = getAI();

    const responseStream = await callWithRetryAndFallback(async (model) => {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: "You are the CareerDev Senior Strategist. For complex student career queries, leverage your deep reasoning capabilities. Always maintain context from the conversation history."
        },
      });

      const fullPrompt = history.length > 0
        ? `Conversation history:\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}\n\nUser: ${message}`
        : message;

      return await chat.sendMessageStream({
        message: fullPrompt
      });
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
 * Model: gemini-flash-latest
 */
export const askIndustryExpertStream = async function* (field: string, question: string) {
  const cacheKey = `expert_${field}_${question}`.replace(/\s+/g, '_');
  const cached = getCachedData(cacheKey);
  if (cached) {
    yield {
      text: cached.text,
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: cached.sources.map((s: any) => ({
              web: { title: s.title, uri: s.uri }
            }))
          }
        }
      ]
    };
    return;
  }

  try {
    const ai = getAI();
    const responseStream = await callWithRetryAndFallback((model) => ai.models.generateContentStream({
      model,
      contents: [{
        parts: [{ text: `I am a student interested in the ${field} industry. Question: "${question}"` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a professional career counselor specializing in the ${field} industry. Provide actionable, data-driven advice. Always reference current trends.`,
      }
    }));

    let fullText = "";
    let finalSources: any[] = [];

    for await (const chunk of responseStream) {
      fullText += chunk.text || "";
      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        finalSources = metadata.groundingChunks;
      }
      yield chunk;
    }

    if (fullText) {
      setCachedData(cacheKey, {
        text: fullText,
        sources: finalSources.map((c: any) => ({
          title: c.web?.title || 'Reference Link',
          uri: c.web?.uri || ''
        })).filter((s: any) => s.uri)
      });
    }
  } catch (error) {
    handleAIError(error);
  }
};

/**
 * Fast Resume Generation
 * Model: gemini-flash-latest
 */
export const generateResumeSectionStream = async function* (prompt: string) {
  const cacheKey = `resume_${prompt}`.replace(/\s+/g, '_');
  const cached = getCachedData(cacheKey);
  if (cached) {
    yield cached;
    return;
  }

  try {
    const ai = getAI();
    const responseStream = await callWithRetryAndFallback((model) => ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a professional resume strategist. Generate high-impact, action-oriented text. Be fast and concise."
      }
    }));
    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      yield chunkText;
    }
    if (fullText) {
      setCachedData(cacheKey, fullText);
    }
  } catch (error) {
    handleAIError(error);
  }
};

/**
 * Deep Resume Analysis with Thinking
 * Model: gemini-flash-latest
 */
export const analyzeResumeStream = async function* (
  content: string | { data: string, mimeType: string },
  isDeep: boolean = false
) {
  const contentSig = typeof content === 'string' 
    ? content.substring(0, 1000) 
    : content.data.substring(0, 1000);
  const cacheKey = `audit_${isDeep}_${contentSig}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200);
  const cached = getCachedData(cacheKey);
  if (cached) {
    yield cached;
    return;
  }

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
    const responseStream = await callWithRetryAndFallback((model) => ai.models.generateContentStream({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: isDeep
          ? "Perform a 'Strategic Audit' of this resume. Analyze keyword density for modern recruiters, score the resume from 0-100%, and provide a roadmap for high-tier industry placement."
          : "Provide quick, constructive feedback on this resume. Identify clear areas for improvement."
      }
    }));
    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      yield chunkText;
    }
    if (fullText) {
      setCachedData(cacheKey, fullText);
    }
  } catch (error) {
    handleAIError(error);
  }
};

/**
 * Search for opportunities using Google Search Grounding
 * Model: gemini-flash-latest
 */
export const searchOpportunities = async (query: string, location: string, type: 'Internship' | 'Job') => {
  const cacheKey = `opps_${query}_${location}_${type}`.replace(/\s+/g, '_');
  const cached = getCachedData(cacheKey, 14400000); // 4 hours cache for opportunities
  if (cached) {
    return cached;
  }

  try {
    const ai = getAI();
    const response = await callWithRetryAndFallback((model) => ai.models.generateContent({
      model,
      contents: [{
        parts: [{ text: `Search for currently active ${type} listings for "${query}" in ${location}. Return a list of specific roles and companies if possible, grounded in search results.` }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
      }
    }));

    if (response) {
      setCachedData(cacheKey, response);
    }
    return response;
  } catch (error) {
    handleAIError(error);
  }
};
