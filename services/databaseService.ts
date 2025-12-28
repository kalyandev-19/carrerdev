
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

  verifyEmailOtp: async (email: string, token: string): Promise<User> => {
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
      email: data.user.email!,
      fullName: profile?.full_name || data.user.email!.split('@')[0],
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
      email: authData.user.email!,
      fullName: profile?.full_name || authData.user.email!.split('@')[0],
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
      email: session.user.email!,
      fullName: profile?.full_name || session.user.email!.split('@')[0],
    };
  },

  // --- Resume Methods ---
  getResume: async (userId: string): Promise<ResumeData | null> => {
    if (!isValidId(userId)) return null;

    if (userId === 'guest-user') {
      const localData = localStorage.getItem('careerdev_guest_resume');
      return localData ? JSON.parse(localData) : null;
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching resume:', error.message);
      return null;
    }
    
    return data ? {
        userId: data.user_id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        linkedin: data.linkedin,
        github: data.github,
        summary: data.summary,
        education: data.education || [],
        experience: data.experience || [],
        skills: data.skills
    } : null;
  },

  saveResume: async (resume: ResumeData) => {
    if (!isValidId(resume.userId)) return;

    if (resume.userId === 'guest-user') {
      localStorage.setItem('careerdev_guest_resume', JSON.stringify(resume));
      return;
    }

    // Ensure education and experience are correctly serialized for JSONB
    const payload = {
      user_id: resume.userId,
      full_name: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      summary: resume.summary,
      education: JSON.parse(JSON.stringify(resume.education)),
      experience: JSON.parse(JSON.stringify(resume.experience)),
      skills: resume.skills
    };

    const { error } = await supabase
      .from('resumes')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);
  },
};
