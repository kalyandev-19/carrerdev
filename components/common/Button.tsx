
import React from 'react';
import Spinner from './Spinner.tsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, isLoading = false, className = '', ...props }) => {
  return (
    <button
      className={`btn-3d inline-flex items-center justify-center gap-3 px-8 py-3 border-none text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner />
          <span className="animate-pulse">PROCESSING</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
