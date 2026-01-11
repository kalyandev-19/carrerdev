
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './common/Icon.tsx';
import Input from './common/Input.tsx';
import Button from './common/Button.tsx';
import { Vortex } from './ui/vortex.tsx';
import { User } from '../types.ts';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate Network Latency for "Neural Authorization"
    await new Promise(resolve => setTimeout(resolve, 800));

    if (view === 'signin') {
      if (formData.email && formData.password) {
        onLogin({
          id: btoa(formData.email).slice(0, 10),
          email: formData.email,
          fullName: formData.fullName || 'Authorized Professional'
        });
      } else {
        setError('Authorization credentials required.');
      }
    } else {
      if (formData.email && formData.password && formData.fullName) {
        onLogin({
          id: `user_${Date.now()}`,
          email: formData.email,
          fullName: formData.fullName
        });
      } else {
        setError('Complete profile metadata required.');
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 md:p-6 overflow-y-auto relative">
      <div className="fixed inset-0 z-0">
        <Vortex
          backgroundColor="transparent"
          rangeY={800}
          particleCount={150}
          baseHue={230}
          baseSpeed={0.05}
          rangeSpeed={0.3}
          className="w-full h-full opacity-20"
          containerClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-pink-500/10 pointer-events-none" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className='relative z-10 glass-panel w-full max-w-[1000px] flex flex-col md:flex-row min-h-[550px] md:h-[650px] rounded-[30px] md:rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/5 overflow-hidden'
      >
        <div className='w-full md:w-1/2 px-6 lg:px-12 py-10 md:py-12 flex flex-col justify-center relative z-10'>
          <div className="mb-6 md:mb-8 text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg mb-3">
                <Icon name="logo" className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tighter uppercase">Career Dev AI</span>
            </div>
            <h1 className='text-2xl font-black text-white uppercase tracking-tighter mb-2'>
              {view === 'signin' ? 'Neural Authorization' : 'New Profile Protocol'}
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
              {view === 'signin' ? 'Access your professional terminal' : 'Initialize your career trajectory'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto">
            <AnimatePresence mode="wait">
              {view === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input 
                    label="Full Name" 
                    placeholder="ENTER FULL IDENTITY" 
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="NETWORK_ID@CAREER.AI" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            
            <Input 
              label="Secret Protocol" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-[10px] font-black uppercase text-rose-500 text-center"
              >
                {error}
              </motion.p>
            )}

            <Button 
              type="submit" 
              isLoading={isLoading} 
              className="w-full py-4 mt-2"
            >
              {view === 'signin' ? 'Execute Login' : 'Register Profile'}
            </Button>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {view === 'signin' ? "Need a neural node?" : "Already initialized?"}
                <button 
                  type="button"
                  onClick={() => setView(view === 'signin' ? 'signup' : 'signin')} 
                  className="ml-2 text-indigo-400 hover:text-white transition-colors underline underline-offset-4"
                >
                  {view === 'signin' ? 'Register Protocol' : 'Access Terminal'}
                </button>
              </p>
            </div>
          </form>
        </div>

        <div className='hidden md:block md:w-1/2 h-full relative overflow-hidden bg-slate-900'>
          <motion.img
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.4 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src='https://images.pexels.com/photos/7102037/pexels-photo-7102037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
            alt="Career Dev Visual"
            className="w-full h-full object-cover grayscale transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-12 flex flex-col justify-end">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Neural Workspace</h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-xs">
              Securely unlock the next level of your professional trajectory. Built for the modern career ecosystem.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
