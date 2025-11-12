export enum Page {
  Home = 'home',
  IndustryQA = 'qa',
  ResumeBuilder = 'builder',
  ResumeAnalyzer = 'analyzer',
  JobFinder = 'jobs',
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
  type: string; // e.g., 'Full-time', 'Internship'
  description: string;
  requirements: string[];
}