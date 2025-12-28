
import * as React from "react"
import { cn } from "../../lib/utils.ts"

interface BackgroundPathsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const BackgroundPaths: React.FC<BackgroundPathsProps> = ({ className, ...props }) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 z-0 pointer-events-none overflow-hidden select-none", 
        className
      )} 
      {...props}
    >
      <svg
        className="absolute w-full h-full opacity-20 dark:opacity-30"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="animate-pulse-slow">
          <path
            d="M-10 20 Q 25 10 50 20 T 110 20"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.2"
            className="path-animate-1"
          />
          <path
            d="M-10 40 Q 25 30 50 40 T 110 40"
            fill="none"
            stroke="url(#grad2)"
            strokeWidth="0.15"
            className="path-animate-2"
          />
          <path
            d="M-10 60 Q 25 50 50 60 T 110 60"
            fill="none"
            stroke="url(#grad3)"
            strokeWidth="0.2"
            className="path-animate-3"
          />
          <path
            d="M-10 80 Q 25 70 50 80 T 110 80"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.1"
            className="path-animate-1"
          />
        </g>
        
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pathMove {
          0% { transform: translateX(-10%); }
          100% { transform: translateX(10%); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .path-animate-1 {
          animation: pathMove 20s ease-in-out infinite alternate;
        }
        .path-animate-2 {
          animation: pathMove 25s ease-in-out infinite alternate-reverse;
        }
        .path-animate-3 {
          animation: pathMove 30s ease-in-out infinite alternate;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}
