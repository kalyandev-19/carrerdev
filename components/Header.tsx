import React from 'react';
import Icon from './common/Icon';
import { Page, User } from '../types';

interface HeaderProps {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  user: User;
  onLogout: () => void;
  onShowLogin: () => void;
  isDark: boolean;
  toggleTheme: () => void;
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
      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-indigo-600/10 dark:bg-slate-700 text-indigo-600 dark:text-sky-400'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo, user, onLogout, onShowLogin, isDark, toggleTheme }) => {
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  const isGuest = user.id.startsWith('guest_');

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigateTo(Page.Home)}>
            <div className="bg-sky-500/10 p-2 rounded-lg">
              <Icon name="logo" className="h-6 w-6 text-sky-500" />
            </div>
            <span className="ml-3 text-xl font-bold text-slate-900 dark:text-white hidden sm:block">CareerDev</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavLink page={Page.Chat} currentPage={currentPage} navigateTo={navigateTo}>Assistant</NavLink>
            <NavLink page={Page.IndustryQA} currentPage={currentPage} navigateTo={navigateTo}>Q&A</NavLink>
            <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo}>Builder</NavLink>
            <NavLink page={Page.ResumeAnalyzer} currentPage={currentPage} navigateTo={navigateTo}>Analyzer</NavLink>
            <NavLink page={Page.JobFinder} currentPage={currentPage} navigateTo={navigateTo}>Jobs</NavLink>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Icon name="sun" className="h-5 w-5" /> : <Icon name="moon" className="h-5 w-5" />}
            </button>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                {isGuest ? 'Guest Access' : user.fullName}
              </span>
              <div className="flex gap-2 mt-1">
                {isGuest ? (
                  <button 
                    onClick={onShowLogin}
                    className="text-[10px] text-indigo-600 dark:text-sky-400 hover:underline uppercase font-black tracking-widest"
                  >
                    Sign In
                  </button>
                ) : (
                  <button 
                    onClick={onLogout}
                    className="text-[10px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase font-black tracking-widest"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
            
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
              isGuest 
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 shadow-none' 
              : 'bg-gradient-to-br from-sky-400 to-indigo-600 shadow-sky-500/20'
            }`}>
              {isGuest ? <Icon name="network" className="h-5 w-5" /> : initials}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;