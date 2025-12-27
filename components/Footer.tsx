
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
               <span className="text-indigo-600 font-bold text-sm tracking-tight">CareerDev</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">Professional Career Intelligence</span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} CareerDev Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
