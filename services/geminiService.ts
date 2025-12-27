
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { JobListing, GroundingSource, JobSearchResponse } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const askIndustryExpertStream = async function* (field: string, question: string) {
  const ai = getAI();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `Question about the ${field} industry: "${question}"`,
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
    console.error("Error asking industry expert:", error);
    throw error;
  }
};

export const generateResumeSectionStream = async function* (prompt: string) {
    const ai = getAI();
    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are a professional resume writer. Generate a concise and impactful response. Focus on action verbs and achievements."
            }
        });
        for await (const chunk of responseStream) {
            yield chunk.text || "";
        }
    } catch (error) {
        console.error("Error generating resume section:", error);
        throw error;
    }
};

export const analyzeResumeStream = async function* (content: string | { data: string, mimeType: string }) {
  const ai = getAI();
  
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
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt
      }
    });
    for await (const chunk of responseStream) {
        yield chunk.text || "";
    }
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
};

export const findJobs = async (role: string, location: string): Promise<JobSearchResponse> => {
  const ai = getAI();
  const prompt = `Search for 5 real, active job or internship opportunities for "${role}" in "${location}". 
  Crucially, prioritize results from major job platforms including LinkedIn, Indeed, Glassdoor, and Wellfound (AngelList).
  
  For each job, provide the output in valid JSON format as defined in the response schema.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              requirements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sourcePlatform: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ["title", "company", "location", "type", "description", "requirements", "sourcePlatform", "url"],
          },
        },
      },
    });

    const jsonText = response.text?.trim() || "[]";
    const listingsRaw = JSON.parse(jsonText) as Omit<JobListing, 'id'>[];

    const listings = listingsRaw.map(listing => ({
      ...listing,
      id: `${listing.title}-${listing.company}-${listing.location}`.replace(/\s+/g, '-').toLowerCase() + '-' + Math.random().toString(36).substr(2, 9),
    }));

    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || '',
      })).filter((s: GroundingSource) => s.uri) || [];
    
    return { listings, sources };
    
  } catch (error) {
    console.error("Error finding jobs:", error);
    return { listings: [], sources: [] };
  }
};
