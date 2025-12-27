export enum Page {
  Home = 'home',
  IndustryQA = 'qa',
  ResumeBuilder = 'builder',
  ResumeAnalyzer = 'analyzer',
  JobFinder = 'jobs',
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

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  sourcePlatform?: string;
  url?: string;
}

export interface RecentSearch {
  role: string;
  location: string;
}

export interface IndustryResponse {
  text: string;
  sources: GroundingSource[];
}

export interface JobSearchResponse {
  listings: JobListing[];
  sources: GroundingSource[];
}