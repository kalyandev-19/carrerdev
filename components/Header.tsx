import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './common/Icon.tsx';
import { Page, User } from '../types.ts';

interface HeaderProps {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  user?: User;
  onLogout: () => void;
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
              <span className="text-[7px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">AI Assistant</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1 md:space-x-2">
            <NavLink page={Page.Home} currentPage={currentPage} navigateTo={navigateTo}>Home</NavLink>
            <NavLink page={Page.ResumeBuilder} currentPage={currentPage} navigateTo={navigateTo}>Resume Builder</NavLink>
            <NavLink page={Page.Chat} currentPage={currentPage} navigateTo={navigateTo}>AI Agent</NavLink>
            <NavLink page={Page.IndustryQA} currentPage={currentPage} navigateTo={navigateTo}>Market Insights</NavLink>
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="h-6 md:h-8 w-px bg-slate-800 mx-1 hidden sm:block"></div>

            <div 
              className="flex items-center gap-2 md:gap-4 cursor-pointer"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] md:text-xs font-black text-white leading-tight truncate max-w-[100px] md:max-w-[120px] uppercase tracking-tighter">
                  {user?.fullName || 'Guest User'}
                </span>
                <span className="text-[7px] md:text-[9px] text-emerald-400 font-black uppercase tracking-widest">
                  Account Sync Active
                </span>
              </div>
              
              <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center text-white font-black text-xs md:text-sm uppercase shadow-lg shadow-indigo-600/20">
                {user?.fullName?.charAt(0) || 'U'}
              </div>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-56 glass-panel rounded-2xl p-2 shadow-3d border border-white/10 z-50"
                  >
                    <div className="p-3 border-b border-white/5 mb-2">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">User Profile</p>
                      <p className="text-xs font-bold text-white truncate">{user?.email}</p>
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;