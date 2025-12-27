
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
      className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 ${
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
  const isGuest = user.id.startsWith('dev_') || user.id.startsWith('guest_');

  return (
    <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer group shrink-0" onClick={() => navigateTo(Page.Home)}>
            <div className="bg-slate-900 dark:bg-slate-100 p-2 rounded-lg group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-colors">
              <Icon name="logo" className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <div className="ml-3 flex flex-col justify-center font-mono">
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Career</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter leading-none">Dev_</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1">
            <NavLink page={Page.Chat} currentPage={currentPage} navigateTo={navigateTo} activeColor="fuchsia">Assistant</NavLink>
            <NavLink page={Page.IndustryQA} currentPage={currentPage} navigateTo={navigateTo} activeColor="amber">Analyzer</NavLink>
            <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo} activeColor="indigo">Architect</NavLink>
            <NavLink page={Page.ResumeAnalyzer} currentPage={currentPage} navigateTo={navigateTo} activeColor="sky">Scanner</NavLink>
            <NavLink page={Page.JobFinder} currentPage={currentPage} navigateTo={navigateTo} activeColor="emerald">Deployment</NavLink>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:scale-110 active:rotate-12"
              aria-label="Toggle Theme"
            >
              {isDark ? <Icon name="sun" className="h-5 w-5" /> : <Icon name="moon" className="h-5 w-5" />}
            </button>

            <div className="hidden sm:flex flex-col items-end mr-1 font-mono">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-widest truncate max-w-[120px]">
                {isGuest ? 'GUEST_USER' : user.fullName.toUpperCase()}
              </span>
              <div className="flex gap-2">
                {isGuest ? (
                  <button 
                    onClick={onShowLogin}
                    className="text-[9px] text-fuchsia-600 dark:text-fuchsia-400 hover:underline uppercase font-bold tracking-widest"
                  >
                    Authenticate
                  </button>
                ) : (
                  <button 
                    onClick={onLogout}
                    className="text-[9px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors uppercase font-bold tracking-widest"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
            
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-mono font-black text-xs shadow-xl transition-all hover:scale-105 shrink-0 ${
              isGuest 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none border border-slate-200 dark:border-slate-700' 
              : 'bg-indigo-600 shadow-indigo-500/30'
            }`}>
              {isGuest ? 'G' : initials}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
