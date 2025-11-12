
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
      className="bg-slate-800 rounded-lg p-6 flex flex-col items-start cursor-pointer transition-all duration-300 hover:bg-slate-700 hover:shadow-2xl hover:shadow-indigo-500/20 transform hover:-translate-y-1"
    >
      <div className="bg-slate-700 p-3 rounded-lg text-sky-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-base">{description}</p>
    </div>
  );
};

export default Card;
