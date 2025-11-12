
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import IndustryQA from './components/IndustryQA';
import ResumeBuilder from './components/ResumeBuilder';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import JobFinder from './components/JobFinder';
import Card from './components/common/Card';
import Icon from './components/common/Icon';
import { Page } from './types';

const Home = ({ navigateTo }: { navigateTo: (page: Page) => void }) => (
  <div className="py-12">
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
        Career Launchpad AI
      </h1>
      <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
        Your AI-powered co-pilot for navigating the path from classroom to career. Get instant advice, build the perfect resume, and discover your next opportunity.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <Card
        title="Industry Q&A"
        description="Ask questions and get insights from an AI expert simulating years of industry experience."
        icon={<Icon name="qa" />}
        onClick={() => navigateTo(Page.IndustryQA)}
      />
      <Card
        title="AI Resume Builder"
        description="Craft a professional resume from scratch with AI-powered suggestions and formatting."
        icon={<Icon name="resume" />}
        onClick={() => navigateTo(Page.ResumeBuilder)}
      />
      <Card
        title="Resume Analyzer"
        description="Upload your existing resume and get detailed feedback and suggestions for improvement."
        icon={<Icon name="analyzer" />}
        onClick={() => navigateTo(Page.ResumeAnalyzer)}
      />
      <Card
        title="Opportunity Finder"
        description="Search for simulated internship and job postings tailored to your interests."
        icon={<Icon name="search" />}
        onClick={() => navigateTo(Page.JobFinder)}
      />
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case Page.IndustryQA:
        return <IndustryQA />;
      case Page.ResumeBuilder:
        return <ResumeBuilder />;
      case Page.ResumeAnalyzer:
        return <ResumeAnalyzer />;
      case Page.JobFinder:
        return <JobFinder />;
      case Page.Home:
      default:
        return <Home navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
      <Header currentPage={currentPage} navigateTo={navigateTo} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
