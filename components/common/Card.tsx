
import React from 'react';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, description, icon, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`group p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:-translate-y-1 ${className}`}
    >
      <div className="inline-flex bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{description}</p>
    </div>
  );
};

export default Card;
