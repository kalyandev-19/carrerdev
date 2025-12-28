
import { createClient } from '@supabase/supabase-js';
import { User, ResumeData } from '../types.ts';

/**
 * SQL SCHEMA FOR SUPABASE SETUP
 * ----------------------------
 * Run this in your Supabase SQL Editor:
 * 
 * -- 1. Resumes Table
 * CREATE TABLE IF NOT EXISTS public.resumes (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *     title TEXT NOT NULL DEFAULT 'Untitled Resume',
 *     full_name TEXT NOT NULL,
 *     email TEXT,
 *     phone TEXT,
 *     linkedin TEXT,
 *     github TEXT,
 *     summary TEXT,
 *     skills TEXT,
 *     education JSONB DEFAULT '[]'::jsonb,
 *     experience JSONB DEFAULT '[]'::jsonb,
 *     created_at TIMESTAMPTZ DEFAULT now(),
 *     updated_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 2. Downloads/History Table
 * CREATE TABLE IF NOT EXISTS public.user_downloads (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *     file_name TEXT NOT NULL,
 *     file_url TEXT NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 3. Storage Bucket: Ensure a bucket named 'downloads' exists and is set to Public
 * 
 * ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can manage their own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);
 * 
 * ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view their own downloads" ON public.user_downloads FOR ALL USING (auth.uid() = user_id);
 */

const SUPABASE_URL = 'https://beerzpfihrilduvhkqdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZXJ6cGZpaHJpbGR1dmhrcWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDYwMTcsImV4cCI6MjA4MjQyMjAxN30.V7QxMmYesJJZdwjIKcZL5LEGtKib6yCVMy9ngj5q97o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export const databaseService = {
  // --- User & Auth Methods ---
  createUser: async (email: string, password: string, fullName: string): Promise<{ userId: string }> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');
    return { userId: authData.user.id };
  },

  login: async (email: string, password: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authData.user.id)
      .maybeSingle();

    return {
      id: authData.user.id,
      email: authData.user.email || 'no-email',
      fullName: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
    };
  },

  verifyOtp: async (email: string, token: string): Promise<User> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw error;
    if (!data.user) throw new Error('Verification failed');

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email || 'no-email',
      fullName: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
    };
  },

  loginAsGuest: (): User => {
    return {
      id: 'guest-user',
      email: 'guest@careerdev.ai',
      fullName: 'Guest Explorer'
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('careerdev_guest_resumes_collection');
  },

  // --- Resume Methods ---
  getResumes: async (userId: string): Promise<ResumeData[]> => {
    if (userId === 'guest-user') {
      const localData = localStorage.getItem('careerdev_guest_resumes_collection');
      return localData ? JSON.parse(localData) : [];
    }

    if (!isValidUUID(userId)) return [];

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching resumes:", error);
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
    
    if (resumeId.startsWith('guest-')) {
        const localData = localStorage.getItem('careerdev_guest_resumes_collection');
        if (!localData) return null;
        const collection: ResumeData[] = JSON.parse(localData);
        return collection.find(r => r.id === resumeId) || null;
    }

    if (!isValidUUID(resumeId)) return null;

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle();
    
    if (error || !data) return null;
    
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
    const isGuest = resume.userId === 'guest-user';
    const now = new Date().toISOString();

    if (isGuest) {
      const localData = localStorage.getItem('careerdev_guest_resumes_collection');
      let collection: ResumeData[] = localData ? JSON.parse(localData) : [];
      const toSave = { ...resume, id: resume.id || `guest-${Date.now()}`, updatedAt: now };
      const existingIdx = collection.findIndex(r => r.id === toSave.id);
      if (existingIdx >= 0) collection[existingIdx] = toSave;
      else collection.unshift(toSave);
      localStorage.setItem('careerdev_guest_resumes_collection', JSON.stringify(collection));
      return toSave;
    }

    const payload: any = {
      user_id: resume.userId,
      title: resume.title,
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

    if (resume.id && isValidUUID(resume.id)) {
      payload.id = resume.id;
    }

    const { data, error } = await supabase
      .from('resumes')
      .upsert(payload, { onConflict: 'id' })
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
    if (resumeId.startsWith('guest-')) {
        const localData = localStorage.getItem('careerdev_guest_resumes_collection');
        if (!localData) return;
        const collection: ResumeData[] = JSON.parse(localData);
        localStorage.setItem('careerdev_guest_resumes_collection', JSON.stringify(collection.filter(r => r.id !== resumeId)));
        return;
    }
    if (!isValidUUID(resumeId)) return;
    const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
    if (error) throw error;
  },

  // --- NEW: Storage & History Methods ---
  
  uploadAndRecordPDF: async (file: File | Blob, userId: string): Promise<string> => {
    if (!userId || userId === 'guest-user') {
        throw new Error("Authentication required to save files to cloud.");
    }

    const fileName = `${Date.now()}_${(file as File).name || 'resume.pdf'}`;

    // 1. Upload the file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('downloads')
      .upload(`pdfs/${fileName}`, file);

    if (storageError) throw storageError;

    // 2. Get the Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('downloads')
      .getPublicUrl(`pdfs/${fileName}`);

    // 3. Save the reference in Database Table
    const { error: dbError } = await supabase
      .from('user_downloads')
      .insert([
        { 
          user_id: userId, 
          file_name: (file as File).name || 'resume.pdf', 
          file_url: publicUrl 
        }
      ]);

    if (dbError) throw dbError;
    
    return publicUrl;
  },

  getUserDownloads: async (userId: string) => {
    if (!userId || userId === 'guest-user') return [];
    if (!isValidUUID(userId)) return [];

    const { data, error } = await supabase
      .from('user_downloads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }
};
