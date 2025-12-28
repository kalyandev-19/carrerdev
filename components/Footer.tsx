
import React from 'react';
import Icon from './common/Icon.tsx';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 py-20 px-4 no-print">
      <div className="container mx-auto max-w-7xl">
        <div className="glass-panel p-12 md:p-16 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/5 relative overflow-hidden">
          {/* Spatial Decor */}
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-600/20">
                  <Icon name="logo" className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl font-black text-white tracking-tighter">CareerDev</span>
              </div>
              <p className="text-base text-slate-400 max-w-sm font-semibold leading-relaxed">
                Empowering the next generation of professionals with AI-driven career intelligence and modern portfolio tools. Built for the spatial web.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Navigation</h4>
              <ul className="space-y-4 text-sm font-black uppercase tracking-widest text-slate-300">
                <li><button className="hover:text-indigo-400 transition-colors">Resources</button></li>
                <li><button className="hover:text-indigo-400 transition-colors">Marketplace</button></li>
                <li><button className="hover:text-indigo-400 transition-colors">AI Status</button></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Core Network</h4>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Node v3.0 Online</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Quantum Ready</span>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
              &copy; {new Date().getFullYear()} CareerDev Neural Net.
            </p>
            <div className="flex gap-10">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-indigo-400 transition-colors">Security Protocol</span>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-indigo-400 transition-colors">API Ethics</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
