
import { createClient } from '@supabase/supabase-js';
import { ResumeData } from '../types.ts';

const SUPABASE_URL = 'https://beerzpfihrilduvhkqdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZXJ6cGZpaHJpbGR1dmhrcWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDYwMTcsImV4cCI6MjA4MjQyMjAxN30.V7QxMmYesJJZdwjIKcZL5LEGtKib6yCVMy9ngj5q97o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const databaseService = {
  // --- Resume Methods ---
  getResumes: async (userId: string): Promise<ResumeData[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Supabase Fetch Resumes Error:", error);
      return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        fullName: item.full_name,
        email: item.email,
        phone: item.phone,
        linkedin: item.linkedin,
        github: item.github,
        summary: item.summary,
        education: item.education || [],
        experience: item.experience || [],
        skills: item.skills,
        updatedAt: item.updated_at
    }));
  },

  getResume: async (resumeId: string): Promise<ResumeData | null> => {
    if (!resumeId) return null;
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle();
    
    if (error) {
      console.error("Supabase Fetch Single Resume Error:", error);
      return null;
    }
    
    if (!data) return null;
    
    return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        linkedin: data.linkedin,
        github: data.github,
        summary: data.summary,
        education: data.education || [],
        experience: data.experience || [],
        skills: data.skills,
        updatedAt: data.updated_at
    };
  },

  saveResume: async (resume: ResumeData): Promise<ResumeData> => {
    const payload: any = {
      user_id: resume.userId,
      title: resume.title || 'Untitled Resume',
      full_name: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      summary: resume.summary,
      education: resume.education,
      experience: resume.experience,
      skills: resume.skills,
    };

    // Only include ID for updates if it's a valid persistent ID (not a temporary one)
    if (resume.id && resume.id.length > 20) {
      payload.id = resume.id;
    }

    console.debug("Attempting Supabase Upsert with payload:", payload);

    const { data, error } = await supabase
      .from('resumes')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Supabase Save Error:", error);
      throw new Error(`Database Error: ${error.message} (Code: ${error.code})`);
    }
    
    return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        linkedin: data.linkedin,
        github: data.github,
        summary: data.summary,
        education: data.education,
        experience: data.experience,
        skills: data.skills,
        updatedAt: data.updated_at
    };
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    if (!resumeId) return;
    const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
    if (error) {
      console.error("Supabase Delete Error:", error);
      throw error;
    }
  },

  uploadAndRecordPDF: async (file: File | Blob, userId: string): Promise<string> => {
    if (!userId) {
        throw new Error("Authentication required to save files to cloud.");
    }

    const fileName = `${Date.now()}_${(file as File).name || 'resume.pdf'}`;

    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('downloads')
      .upload(`pdfs/${fileName}`, file);

    if (storageError) {
      console.error("Supabase Storage Error:", storageError);
      throw storageError;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('downloads')
      .getPublicUrl(`pdfs/${fileName}`);

    const { error: dbError } = await supabase
      .from('user_downloads')
      .insert([
        { 
          user_id: userId, 
          file_name: (file as File).name || 'resume.pdf', 
          file_url: publicUrl 
        }
      ]);

    if (dbError) {
      console.error("Supabase Insert Download Error:", dbError);
      throw dbError;
    }
    
    return publicUrl;
  },

  getUserDownloads: async (userId: string) => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_downloads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching downloads:", error);
      return [];
    }
    return data || [];
  }
};
