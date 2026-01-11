
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      {label && <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">{label}</label>}
      <textarea
        id={id}
        className={`w-full px-6 py-4 bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner-soft placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 dark:text-white font-semibold transition-all custom-scrollbar ${className}`}
        {...props}
      />
    </div>
  );
};

export default Textarea;
