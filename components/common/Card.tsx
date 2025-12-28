
import React from 'react';
import { motion } from 'framer-motion';
import { GlowCard } from '../ui/spotlight-card.tsx';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

const Card: React.FC<CardProps> = ({ title, description, icon, onClick, className = '', glowColor = 'blue' }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ 
        scale: 1.02,
        y: -5
      }}
      whileTap={{ scale: 0.98 }}
      className="h-full w-full"
    >
      <GlowCard 
        glowColor={glowColor}
        customSize={true}
        className={`w-full h-full min-h-[220px] ${className}`}
      >
        <div className="p-8 h-full flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="inline-flex bg-slate-900/60 p-4 rounded-2xl text-indigo-400 self-start border border-white/5 shadow-inner-soft">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">
                {title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-wider">
                {description}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 opacity-30 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-[2px] bg-indigo-500 rounded-full" />
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
};

export default Card;
