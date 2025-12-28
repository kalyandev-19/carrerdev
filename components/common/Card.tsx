
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, description, icon, onClick, className = '' }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ 
        scale: 1.02, 
        rotateY: 5, 
        rotateX: -5,
        translateZ: 20
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative group p-10 glass-panel rounded-[40px] cursor-pointer shadow-3d hover:shadow-3d-hover transition-all duration-500 perspective-[1000px] overflow-hidden ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Dynamic Glow Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Icon with 3D Pop */}
      <motion.div 
        style={{ transformStyle: "preserve-3d", translateZ: "40px" }}
        className="inline-flex bg-slate-900/80 p-5 rounded-2xl text-indigo-400 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner-soft group-hover:shadow-indigo-500/20"
      >
        {icon}
      </motion.div>

      {/* Text with Layered Depth */}
      <div style={{ transformStyle: "preserve-3d" }}>
        <motion.h3 
          style={{ translateZ: "30px" }}
          className="text-2xl font-black text-white mb-4 tracking-tighter uppercase"
        >
          {title}
        </motion.h3>
        <motion.p 
          style={{ translateZ: "20px" }}
          className="text-slate-400 text-sm leading-relaxed font-bold uppercase tracking-wider"
        >
          {description}
        </motion.p>
      </div>

      {/* Technical Corner Accent */}
      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-30 transition-opacity">
        <div className="w-4 h-4 border-t-2 border-r-2 border-indigo-400 rounded-tr-md" />
      </div>
      
      <div className="absolute bottom-0 left-0 p-6 opacity-0 group-hover:opacity-30 transition-opacity">
        <div className="w-4 h-4 border-b-2 border-l-2 border-indigo-400 rounded-bl-md" />
      </div>
    </motion.div>
  );
};

export default Card;
