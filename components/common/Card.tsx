
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
      className={`tilt-card group p-8 glass-panel rounded-3xl cursor-pointer shadow-3d hover:shadow-3d-hover ${className}`}
    >
      <div className="inline-flex bg-white dark:bg-slate-800 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner-soft group-hover:shadow-lg translate-z-10">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter translate-z-20">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-semibold translate-z-10">{description}</p>
      
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none rounded-3xl transition-opacity duration-500" />
    </div>
  );
};

export default Card;
