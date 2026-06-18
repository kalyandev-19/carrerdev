import { ResumeData, User } from '../types.ts';

const API_URL = (import.meta as any).env.VITE_API_URL || 
  (window.location.origin.includes('localhost') ? 'http://localhost:5001/api' : '/api');



export const databaseService = {
  syncUserProfile: async (user: User): Promise<User> => {
    const response = await fetch(`${API_URL}/profiles/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Database connection failed: ${response.statusText}`);
    }

    return await response.json();
  },

  getResumes: async (userId: string): Promise<ResumeData[]> => {
    if (!userId) return [];

    try {
      const response = await fetch(`${API_URL}/resumes?userId=${userId}`);
      if (!response.ok) {
        console.error("Database fetch error:", response.statusText);
        return [];
      }
      return await response.json();
    } catch (e) {
      console.error("Database fetch connection failure:", e);
      return [];
    }
  },

  getResume: async (resumeId: string): Promise<ResumeData | null> => {
    if (!resumeId) return null;
    
    try {
      const response = await fetch(`${API_URL}/resumes/${resumeId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error("Database fetch connection failure:", e);
      return null;
    }
  },

  saveResume: async (resume: ResumeData): Promise<ResumeData> => {
    if (!resume.userId) throw new Error("Missing user identification. Please log in again.");

    const response = await fetch(`${API_URL}/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: resume.id,
        userId: resume.userId,
        title: resume.title,
        fullName: resume.fullName,
        email: resume.email,
        phone: resume.phone,
        linkedin: resume.linkedin,
        github: resume.github,
        summary: resume.summary,
        education: resume.education,
        experience: resume.experience,
        skills: resume.skills
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Save failed: ${response.statusText}`);
    }

    return await response.json();
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    if (!resumeId) return;
    try {
      await fetch(`${API_URL}/resumes/${resumeId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error("Delete resume failure:", e);
    }
  },


};
