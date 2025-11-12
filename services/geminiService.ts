import { GoogleGenAI, Type } from "@google/genai";
import { JobListing } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const askIndustryExpert = async (field: string, question: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Question: "${question}"`,
      config: {
        systemInstruction: `You are a helpful and experienced professional in the ${field} industry. Provide clear, concise, and actionable advice for a student or recent graduate. Format your response using markdown.`,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error asking industry expert:", error);
    return "Sorry, I encountered an error while trying to answer your question. Please try again.";
  }
};

export const generateResumeSection = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a professional resume writer. Generate a concise and impactful response based on the user's request. Focus on action verbs and quantifiable achievements."
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating resume section:", error);
        return "Error generating content. Please try again.";
    }
};


export const analyzeResume = async (resumeText: string): Promise<string> => {
  const prompt = `
    Analyze the following resume and provide feedback. Structure your feedback into the following sections:
    1.  **Overall Impression:** A brief summary of the resume's strengths and weaknesses.
    2.  **Formatting and Readability:** Comments on layout, font, and clarity.
    3.  **Summary/Objective Section:** Suggestions for improvement.
    4.  **Experience Section:** Feedback on the description of roles and responsibilities. Suggest using the STAR (Situation, Task, Action, Result) method and incorporating more action verbs and metrics.
    5.  **Skills Section:** Comments on the relevance and presentation of skills.
    6.  **Actionable Recommendations:** A bulleted list of the top 3-5 most important things to improve.

    Format the entire output using markdown.

    --- RESUME TEXT ---
    ${resumeText}
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return "Sorry, I was unable to analyze the resume. Please check the content and try again.";
  }
};

export const findJobs = async (role: string, location: string): Promise<JobListing[]> => {
  const prompt = `Generate a list of 4 realistic but fictional job or internship listings for a "${role}" in "${location}".`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              type: { type: Type.STRING, description: "e.g., 'Full-time', 'Internship', 'Contract'" },
              description: { type: Type.STRING },
              requirements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["title", "company", "location", "type", "description", "requirements"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const listings = JSON.parse(jsonText) as Omit<JobListing, 'id'>[];

    // Add a unique ID to each listing
    return listings.map(listing => ({
      ...listing,
      id: `${listing.title}-${listing.company}-${listing.location}`.replace(/\s+/g, '-').toLowerCase(),
    }));
    
  } catch (error) {
    console.error("Error finding jobs:", error);
    // Fallback or error handling
    return [];
  }
};