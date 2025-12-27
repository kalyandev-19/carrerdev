
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
  activeColor?: string;
}> = ({ page, currentPage, navigateTo, children, activeColor = 'indigo' }) => {
  const isActive = currentPage === page;
  
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 shadow-indigo-500/10',
    sky: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 shadow-sky-500/10',
    fuchsia: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 shadow-fuchsia-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shadow-emerald-500/10',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 shadow-amber-500/10',
  };

  return (
    <button
      onClick={() => navigateTo(page)}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
        isActive
          ? `${colorMap[activeColor]} shadow-lg scale-105 border border-white/10`
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
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
    <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => navigateTo(Page.Home)}>
            <div className="bg-gradient-to-tr from-fuchsia-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Icon name="logo" className="h-6 w-6 text-white" />
            </div>
            <span className="ml-4 text-2xl font-black text-slate-900 dark:text-white hidden sm:block uppercase tracking-tighter">CareerDev</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <NavLink page={Page.Chat} currentPage={currentPage} navigateTo={navigateTo} activeColor="fuchsia">Assistant</NavLink>
            <NavLink page={Page.IndustryQA} currentPage={currentPage} navigateTo={navigateTo} activeColor="amber">Expert Q&A</NavLink>
            <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo} activeColor="indigo">Builder</NavLink>
            <NavLink page={Page.ResumeAnalyzer} currentPage={currentPage} navigateTo={navigateTo} activeColor="sky">Analyzer</NavLink>
            <NavLink page={Page.JobFinder} currentPage={currentPage} navigateTo={navigateTo} activeColor="emerald">Opportunities</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:scale-110 active:rotate-12"
              aria-label="Toggle Theme"
            >
              {isDark ? <Icon name="sun" className="h-5 w-5" /> : <Icon name="moon" className="h-5 w-5" />}
            </button>

            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-widest">
                {isGuest ? 'GUEST' : user.fullName.toUpperCase()}
              </span>
              <div className="flex gap-2 mt-1">
                {isGuest ? (
                  <button 
                    onClick={onShowLogin}
                    className="text-[9px] text-fuchsia-600 dark:text-fuchsia-400 hover:underline uppercase font-black tracking-widest"
                  >
                    Authenticate
                  </button>
                ) : (
                  <button 
                    onClick={onLogout}
                    className="text-[9px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors uppercase font-black tracking-widest"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
            
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl transition-all hover:scale-105 ${
              isGuest 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none' 
              : 'bg-gradient-to-br from-fuchsia-500 to-indigo-600 shadow-indigo-500/30'
            }`}>
              {isGuest ? <Icon name="network" className="h-6 w-6" /> : initials}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
