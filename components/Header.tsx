
import React from 'react';
import Icon from './common/Icon.tsx';
import { Page, User } from '../types.ts';

interface HeaderProps {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  user: User;
  onLogout: () => void;
  onShowLogin: () => void;
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
      className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 ${
        isActive
          ? 'text-indigo-400 bg-indigo-900/30 shadow-inner-soft'
          : 'text-slate-400 hover:text-indigo-400'
      }`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo, user, onLogout }) => {
  const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-2 md:px-4 py-2 md:py-4 pointer-events-none no-print">
      <nav className="container mx-auto max-w-7xl pointer-events-auto">
        <div className="glass-panel !bg-slate-950/80 backdrop-blur-xl border border-white/5 h-16 md:h-20 rounded-2xl md:rounded-[30px] px-4 md:px-8 flex items-center justify-between shadow-3d">
          <div className="flex items-center cursor-pointer group shrink-0" onClick={() => navigateTo(Page.Home)}>
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg tilt-card">
              <Icon name="logo" className="h-4 w-4 md:h-6 md:w-6 text-white" />
            </div>
            <div className="ml-2 md:ml-3 flex flex-col justify-center">
              <span className="text-sm md:text-xl font-black text-white tracking-tighter leading-none">CareerDev</span>
              <span className="text-[7px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">AI Powered</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1 md:space-x-2">
            <NavLink page={Page.Home} currentPage={currentPage} navigateTo={navigateTo}>Dashboard</NavLink>
            <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo}>Editor</NavLink>
            <NavLink page={Page.Chat} currentPage={currentPage} navigateTo={navigateTo}>AI Agent</NavLink>
            <NavLink page={Page.IndustryQA} currentPage={currentPage} navigateTo={navigateTo}>Insights</NavLink>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="h-6 md:h-8 w-px bg-slate-800 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] md:text-xs font-black text-white leading-tight truncate max-w-[100px] md:max-w-[120px] uppercase tracking-tighter">
                  {user.fullName}
                </span>
                <button 
                  onClick={onLogout}
                  className="text-[7px] md:text-[9px] text-slate-400 hover:text-rose-500 transition-colors font-black uppercase tracking-widest"
                >
                  Terminate
                </button>
              </div>
              
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-2xl flex items-center justify-center text-white font-black text-xs md:text-sm shadow-xl bg-indigo-600 ring-2 md:ring-4 ring-indigo-500/10 tilt-card">
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
