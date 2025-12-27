
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-white font-black text-xs uppercase tracking-widest">CareerDev</span>
            <span className="text-indigo-500 font-bold text-[10px] uppercase">AI Kernel v2.0</span>
          </div>
          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} CareerDev AI // Scientific Career Intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
