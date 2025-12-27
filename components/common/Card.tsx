import React from 'react';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ title, description, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 flex flex-col items-start cursor-pointer transition-all duration-300 border border-slate-100 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl dark:hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transform hover:-translate-y-1"
    >
      <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-indigo-600 dark:text-sky-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Card;