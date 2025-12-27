
import { createClient } from '@supabase/supabase-js';
import { User, ResumeData, JobListing, RecentSearch } from '../types';

const SUPABASE_URL = 'https://beerzpfihrilduvhkqdo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZXJ6cGZpaHJpbGR1dmhrcWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDYwMTcsImV4cCI6MjA4MjQyMjAxN30.V7QxMmYesJJZdwjIKcZL5LEGtKib6yCVMy9ngj5q97o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if a string is a valid UUID before querying Supabase
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export const databaseService = {
  // --- User & Auth Methods ---
  createUser: async (email: string, password: string, fullName: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: email,
      full_name: fullName,
    });

    if (profileError) console.error('Profile creation error:', profileError.message);

    return {
      id: authData.user.id,
      email: authData.user.email!,
      fullName: fullName,
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

  logout: async () => {
    await supabase.auth.signOut();
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
    if (!isUuid(userId)) return null;

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
    if (!isUuid(resume.userId)) return;

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

  // --- Added Job & Search Methods ---
  getSavedJobs: async (userId: string): Promise<JobListing[]> => {
    if (!isUuid(userId)) return [];
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('job_data')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching saved jobs:', error.message);
      return [];
    }
    return data?.map(item => item.job_data) || [];
  },

  toggleJobSave: async (userId: string, job: JobListing) => {
    if (!isUuid(userId)) return;
    
    const { data: existing } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', job.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', job.id);
    } else {
      await supabase
        .from('saved_jobs')
        .insert({
          user_id: userId,
          job_id: job.id,
          job_data: job
        });
    }
  },

  getRecentSearches: async (userId: string): Promise<RecentSearch[]> => {
    if (!isUuid(userId)) return [];
    const { data, error } = await supabase
      .from('recent_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching searches:', error.message);
      return [];
    }
    return data?.map(d => ({
      id: d.id,
      role: d.role,
      location: d.location,
      timestamp: d.created_at
    })) || [];
  },

  addRecentSearch: async (userId: string, role: string, location: string): Promise<RecentSearch[]> => {
    if (!isUuid(userId)) return [];
    
    const { error } = await supabase.from('recent_searches').insert({
      user_id: userId,
      role,
      location
    });

    if (error) console.error('Error adding search:', error.message);

    return databaseService.getRecentSearches(userId);
  },
};
