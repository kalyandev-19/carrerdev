import { User, ResumeData, JobListing, RecentSearch } from '../types';

const DB_KEYS = {
  USERS: 'career_launchpad_users',
  RESUMES: 'career_launchpad_resumes',
  SAVED_JOBS: 'career_launchpad_saved_jobs',
  RECENT_SEARCHES: 'career_launchpad_recent_searches',
  SESSION: 'career_launchpad_current_user'
};

// Generic helper to get data from local storage
const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic helper to save data to local storage
const saveCollection = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const databaseService = {
  // --- User Methods ---
  getUsers: () => getCollection<{id: string; email: string; password: string; fullName: string}>(DB_KEYS.USERS),
  
  createUser: (email: string, password: string, fullName: string): User => {
    const users = databaseService.getUsers();
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, password, fullName };
    saveCollection(DB_KEYS.USERS, [...users, newUser]);
    return { id: newUser.id, email: newUser.email, fullName: newUser.fullName };
  },

  findUserByEmail: (email: string) => {
    return databaseService.getUsers().find(u => u.email === email);
  },

  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.SESSION);
    }
  },

  getSession: (): User | null => {
    const data = localStorage.getItem(DB_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  // --- Resume Methods ---
  getResume: (userId: string): ResumeData | null => {
    const resumes = getCollection<ResumeData>(DB_KEYS.RESUMES);
    return resumes.find(r => r.userId === userId) || null;
  },

  saveResume: (resume: ResumeData) => {
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
  getSavedJobs: (userId: string): JobListing[] => {
    const allSaved = getCollection<{userId: string; job: JobListing}>(DB_KEYS.SAVED_JOBS);
    return allSaved.filter(item => item.userId === userId).map(item => item.job);
  },

  toggleJobSave: (userId: string, job: JobListing) => {
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
  getRecentSearches: (userId: string): RecentSearch[] => {
    const allSearches = getCollection<{userId: string; searches: RecentSearch[]}>(DB_KEYS.RECENT_SEARCHES);
    const userSearches = allSearches.find(item => item.userId === userId);
    return userSearches ? userSearches.searches : [];
  },

  addRecentSearch: (userId: string, role: string, location: string) => {
    const allSearches = getCollection<{userId: string; searches: RecentSearch[]}>(DB_KEYS.RECENT_SEARCHES);
    const index = allSearches.findIndex(item => item.userId === userId);
    
    let userSearches = index > -1 ? allSearches[index].searches : [];
    
    // Remove if already exists to move to top
    userSearches = userSearches.filter(s => !(s.role.toLowerCase() === role.toLowerCase() && s.location.toLowerCase() === location.toLowerCase()));
    
    // Prepend new search
    userSearches.unshift({ role, location });
    
    // Limit to 5
    userSearches = userSearches.slice(0, 5);
    
    if (index > -1) {
      allSearches[index].searches = userSearches;
    } else {
      allSearches.push({ userId, searches: userSearches });
    }
    
    saveCollection(DB_KEYS.RECENT_SEARCHES, allSearches);
    return userSearches;
  },

  clearRecentSearches: (userId: string) => {
    const allSearches = getCollection<{userId: string; searches: RecentSearch[]}>(DB_KEYS.RECENT_SEARCHES);
    const updated = allSearches.filter(item => item.userId !== userId);
    saveCollection(DB_KEYS.RECENT_SEARCHES, updated);
  }
};
