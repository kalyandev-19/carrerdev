
import { User, ResumeData, JobListing, RecentSearch } from '../types';

const DB_KEYS = {
  USERS: 'career_launchpad_users',
  RESUMES: 'career_launchpad_resumes',
  SAVED_JOBS: 'career_launchpad_saved_jobs',
  RECENT_SEARCHES: 'career_launchpad_recent_searches',
  SESSION: 'career_launchpad_current_user'
};

// Helper to simulate network latency
const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const databaseService = {
  // --- User Methods ---
  getUsers: async () => {
    await delay();
    return getCollection<{id: string; email: string; password: string; fullName: string}>(DB_KEYS.USERS);
  },
  
  createUser: async (email: string, password: string, fullName: string): Promise<User> => {
    await delay(500);
    const users = getCollection<{id: string; email: string; password: string; fullName: string}>(DB_KEYS.USERS);
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, password, fullName };
    saveCollection(DB_KEYS.USERS, [...users, newUser]);
    return { id: newUser.id, email: newUser.email, fullName: newUser.fullName };
  },

  findUserByEmail: async (email: string) => {
    await delay();
    const users = getCollection<{id: string; email: string; password: string; fullName: string}>(DB_KEYS.USERS);
    return users.find(u => u.email === email);
  },

  setSession: async (user: User | null) => {
    await delay();
    if (user) {
      localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.SESSION);
    }
  },

  getSession: async (): Promise<User | null> => {
    await delay();
    const data = localStorage.getItem(DB_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  // --- Resume Methods ---
  getResume: async (userId: string): Promise<ResumeData | null> => {
    await delay();
    const resumes = getCollection<ResumeData>(DB_KEYS.RESUMES);
    return resumes.find(r => r.userId === userId) || null;
  },

  saveResume: async (resume: ResumeData) => {
    await delay(300);
    const resumes = getCollection<ResumeData>(DB_KEYS.RESUMES);
    const index = resumes.findIndex(r => r.userId === resume.userId);
    if (index > -1) {
      resumes[index] = resume;
      saveCollection(DB_KEYS.RESUMES, resumes);
    } else {
      saveCollection(DB_KEYS.RESUMES, [...resumes, resume]);
    }
  },

  // --- Saved Jobs Methods ---
  getSavedJobs: async (userId: string): Promise<JobListing[]> => {
    await delay();
    const allSaved = getCollection<{userId: string; job: JobListing}>(DB_KEYS.SAVED_JOBS);
    return allSaved.filter(item => item.userId === userId).map(item => item.job);
  },

  toggleJobSave: async (userId: string, job: JobListing) => {
    await delay();
    const allSaved = getCollection<{userId: string; job: JobListing}>(DB_KEYS.SAVED_JOBS);
    const exists = allSaved.find(item => item.userId === userId && item.job.id === job.id);
    
    let updated;
    if (exists) {
      updated = allSaved.filter(item => !(item.userId === userId && item.job.id === job.id));
    } else {
      updated = [...allSaved, { userId, job }];
    }
    saveCollection(DB_KEYS.SAVED_JOBS, updated);
    return !exists;
  },

  // --- Recent Searches Methods ---
  getRecentSearches: async (userId: string): Promise<RecentSearch[]> => {
    await delay();
    const allSearches = getCollection<{userId: string; searches: RecentSearch[]}>(DB_KEYS.RECENT_SEARCHES);
    const userSearches = allSearches.find(item => item.userId === userId);
    return userSearches ? userSearches.searches : [];
  },

  addRecentSearch: async (userId: string, role: string, location: string) => {
    await delay();
    const allSearches = getCollection<{userId: string; searches: RecentSearch[]}>(DB_KEYS.RECENT_SEARCHES);
    const index = allSearches.findIndex(item => item.userId === userId);
    
    let userSearches = index > -1 ? allSearches[index].searches : [];
    userSearches = userSearches.filter(s => !(s.role.toLowerCase() === role.toLowerCase() && s.location.toLowerCase() === location.toLowerCase()));
    userSearches.unshift({ role, location });
    userSearches = userSearches.slice(0, 5);
    
    if (index > -1) {
      allSearches[index].searches = userSearches;
    } else {
      allSearches.push({ userId, searches: userSearches });
    }
    
    saveCollection(DB_KEYS.RECENT_SEARCHES, allSearches);
    return userSearches;
  },

  clearRecentSearches: async (userId: string) => {
    await delay();
    const allSearches = getCollection<{userId: string; searches: RecentSearch[]}>(DB_KEYS.RECENT_SEARCHES);
    const updated = allSearches.filter(item => item.userId !== userId);
    saveCollection(DB_KEYS.RECENT_SEARCHES, updated);
  }
};
