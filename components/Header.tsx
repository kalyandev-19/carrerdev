
import React from 'react';
import Icon from './common/Icon.tsx';
import { Page, User } from '../types.ts';

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
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo, user, onLogout, isDark, toggleTheme }) => {
  const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  return (
    <header className="bg-white dark:bg-slate-900 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer group shrink-0" onClick={() => navigateTo(Page.Home)}>
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Icon name="logo" className="h-5 w-5 text-white" />
            </div>
            <div className="ml-2.5 flex flex-col justify-center">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">CareerDev</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1">
            <NavLink page={Page.Home} currentPage={currentPage} navigateTo={navigateTo}>Dashboard</NavLink>
            <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo}>Resume Builder</NavLink>
            <NavLink page={Page.JobFinder} currentPage={currentPage} navigateTo={navigateTo}>Job Search</NavLink>
            <NavLink page={Page.Chat} currentPage={currentPage} navigateTo={navigateTo}>Advisor</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Icon name="sun" className="h-5 w-5" /> : <Icon name="moon" className="h-5 w-5" />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {user.fullName}
                </span>
                <button 
                  onClick={onLogout}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors font-semibold"
                >
                  Logout
                </button>
              </div>
              
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm bg-indigo-600">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
