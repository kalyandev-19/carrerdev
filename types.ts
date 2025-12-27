
export enum Page {
  Home = 'home',
  IndustryQA = 'qa',
  ResumeBuilder = 'builder',
  ResumeAnalyzer = 'analyzer',
  Chat = 'chat',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export interface ResumeData {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  education: Education[];
  experience: Experience[];
  skills: string;
}

export interface IndustryResponse {
  text: string;
  sources: GroundingSource[];
}

// Added JobListing and RecentSearch interfaces
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  sourcePlatform: string;
  requirements: string[];
  matchScore?: number;
}

export interface RecentSearch {
  id: string;
  role: string;
  location: string;
  timestamp: string;
}
