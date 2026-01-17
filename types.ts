
export enum Page {
  Home = 'home',
  IndustryQA = 'qa',
  ResumeBuilder = 'builder',
  ResumeAnalyzer = 'analyzer',
  Chat = 'chat',
  Opportunities = 'opportunities'
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
  id?: string;
  userId: string;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  education: Education[];
  experience: Experience[];
  skills: string;
  updatedAt?: string;
}

export interface IndustryResponse {
  text: string;
  sources: GroundingSource[];
}

export interface JobOpportunity {
  id: string;
  role: string;
  company: string;
  location: string;
  description: string;
  url: string;
  type: string;
}
