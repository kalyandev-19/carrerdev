
import { createClient } from '@supabase/supabase-js';
import { ResumeData, User } from '../types.ts';

const SUPABASE_URL = 'https://beerzpfihrilduvhkqdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZXJ6cGZpaHJpbGR1dmhrcWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDYwMTcsImV4cCI6MjA4MjQyMjAxN30.V7QxMmYesJJZdwjIKcZL5LEGtKib6yCVMy9ngj5q97o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const databaseService = {
  syncUserProfile: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.warn("Profile sync error:", error.message);
      return user;
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name
    };
  },

  getResumes: async (userId: string): Promise<ResumeData[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Database fetch error:", error);
      return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title || 'Untitled Resume',
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
    
    if (error || !data) return null;
    
    return {
        id: data.id,
        userId: data.user_id,
        title: data.title || 'Untitled Resume',
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

    if (resume.id) {
      payload.id = resume.id;
    }

    const { data, error } = await supabase
      .from('resumes')
      .upsert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
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
    await supabase.from('resumes').delete().eq('id', resumeId);
  },

  uploadAndRecordPDF: async (file: File | Blob, userId: string): Promise<string> => {
    const name = (file as File).name || 'resume.pdf';
    const fileName = `${Date.now()}_${name.replace(/\s+/g, '_')}`;

    const { error: storageError } = await supabase
      .storage
      .from('downloads')
      .upload(`pdfs/${fileName}`, file);

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase
      .storage
      .from('downloads')
      .getPublicUrl(`pdfs/${fileName}`);

    await supabase
      .from('user_downloads')
      .insert([{ user_id: userId, file_name: name, file_url: publicUrl }]);

    return publicUrl;
  }
};
