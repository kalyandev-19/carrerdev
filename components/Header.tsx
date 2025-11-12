
import React from 'react';
import Icon from './common/Icon';
import { Page } from '../types';

interface HeaderProps {
  currentPage: Page;
  navigateTo: (page: Page) => void;
}

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  navigateTo: (page: Page) => void;
  children: React.ReactNode;
}> = ({ page, currentPage, navigateTo, children }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => navigateTo(page)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-slate-700 text-sky-400'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-700">
          <div className="flex items-center cursor-pointer" onClick={() => navigateTo(Page.Home)}>
            <Icon name="logo" className="h-8 w-8 text-sky-500" />
            <span className="ml-3 text-xl font-bold text-white">Career Launchpad</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink page={Page.IndustryQA} currentPage={currentPage} navigateTo={navigateTo}>Industry Q&A</NavLink>
              <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo}>Resume Builder</NavLink>
              <NavLink page={Page.ResumeAnalyzer} currentPage={currentPage} navigateTo={navigateTo}>Resume Analyzer</NavLink>
              <NavLink page={Page.JobFinder} currentPage={currentPage} navigateTo={navigateTo}>Job Finder</NavLink>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
