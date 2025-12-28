
import { createClient } from '@supabase/supabase-js';
import { User, ResumeData } from '../types';

const SUPABASE_URL = 'https://beerzpfihrilduvhkqdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZXJ6cGZpaHJpbGR1dmhrcWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDYwMTcsImV4cCI6MjA4MjQyMjAxN30.V7QxMmYesJJZdwjIKcZL5LEGtKib6yCVMy9ngj5q97o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if a string is a valid UUID or our guest identifier
const isValidId = (id: string) => id === 'guest-user' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export const databaseService = {
  // --- User & Auth Methods ---
  createUser: async (email: string, password: string, fullName: string): Promise<{ userId: string }> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Pre-create profile (will be linked once verified)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: email,
      full_name: fullName,
    });

    if (profileError) console.error('Profile creation error:', profileError.message);

    return { userId: authData.user.id };
  },

  verifyOtp: async (email: string, token: string): Promise<User> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
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
      fullName: profile?.full_name || data.user.email?.split('@')[0] || 'User',
    };
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
      fullName: profile?.full_name || authData.user.email?.split('@')[0] || 'User',
    };
  },

  loginAsGuest: (): User => {
    return {
      id: 'guest-user',
      email: 'guest@careerdev.ai',
      fullName: 'Guest explorer'
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('careerdev_guest_resume');
    localStorage.removeItem('careerdev_guest_resumes_collection');
  },

  setSession: async (user: User | null) => {
    if (!user) await supabase.auth.signOut();
  },

  getSession: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      id: session.user.id,
      email: session.user.email || 'no-email',
      fullName: profile?.full_name || session.user.email?.split('@')[0] || 'User',
    };
  },

  // --- Resume Methods ---
  getResumes: async (userId: string): Promise<ResumeData[]> => {
    if (!isValidId(userId)) return [];

    if (userId === 'guest-user') {
      const localData = localStorage.getItem('careerdev_guest_resumes_collection');
      return localData ? JSON.parse(localData) : [];
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching resumes:', error.message);
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
    if (resumeId.startsWith('guest-')) {
        const localData = localStorage.getItem('careerdev_guest_resumes_collection');
        if (!localData) return null;
        const collection: ResumeData[] = JSON.parse(localData);
        return collection.find(r => r.id === resumeId) || null;
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle();
    
    if (error) return null;
    
    return data ? {
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
    } : null;
  },

  saveResume: async (resume: ResumeData): Promise<ResumeData> => {
    const isGuest = resume.userId === 'guest-user';
    const now = new Date().toISOString();

    if (isGuest) {
      const localData = localStorage.getItem('careerdev_guest_resumes_collection');
      let collection: ResumeData[] = localData ? JSON.parse(localData) : [];
      
      const toSave = { ...resume, id: resume.id || `guest-${Date.now()}`, updatedAt: now };
      
      const existingIdx = collection.findIndex(r => r.id === toSave.id);
      if (existingIdx >= 0) {
        collection[existingIdx] = toSave;
      } else {
        collection.unshift(toSave);
      }
      
      localStorage.setItem('careerdev_guest_resumes_collection', JSON.stringify(collection));
      return toSave;
    }

    const payload = {
      id: resume.id, // Supabase will generate if undefined
      user_id: resume.userId,
      title: resume.title,
      full_name: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      summary: resume.summary,
      education: JSON.parse(JSON.stringify(resume.education)),
      experience: JSON.parse(JSON.stringify(resume.experience)),
      skills: resume.skills,
      updated_at: now
    };

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
    if (resumeId.startsWith('guest-')) {
        const localData = localStorage.getItem('careerdev_guest_resumes_collection');
        if (!localData) return;
        const collection: ResumeData[] = JSON.parse(localData);
        const filtered = collection.filter(r => r.id !== resumeId);
        localStorage.setItem('careerdev_guest_resumes_collection', JSON.stringify(filtered));
        return;
    }

    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
    
    if (error) throw error;
  }
};
