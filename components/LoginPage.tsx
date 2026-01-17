
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './common/Icon.tsx';
import Input from './common/Input.tsx';
import Button from './common/Button.tsx';
import { Vortex } from './ui/vortex.tsx';
import { User } from '../types.ts';
import { databaseService } from '../services/databaseService.ts';

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

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please enter your email and password.');
      }

      if (view === 'signup' && !formData.fullName) {
        throw new Error('Full name is required to create an account.');
      }

      const safeEmail = formData.email.toLowerCase().trim();
      // Simple unique ID generation for the session
      const userId = btoa(encodeURIComponent(safeEmail)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
      
      const userPayload: User = {
        id: userId,
        email: safeEmail,
        fullName: formData.fullName || 'User'
      };

      // Sync user profile with Supabase
      const syncedUser = await databaseService.syncUserProfile(userPayload);
      onLogin(syncedUser);
      
    } catch (err: any) {
      console.error("Authentication Error:", err);
      setError(err.message || "Failed to sign in. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Vortex
          backgroundColor="transparent"
          particleCount={100}
          baseSpeed={0.1}
          className="w-full h-full opacity-30"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-12 rounded-[40px] shadow-3d border border-white/5 space-y-8 bg-slate-900/40 backdrop-blur-xl">
          <div className="text-center space-y-4">
            <div className="inline-block bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/20 mb-2">
              <Icon name="logo" className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">CareerDev AI</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              {view === 'signin' ? 'Sign In to Account' : 'Register New Account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {view === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input 
                    label="Full Name" 
                    placeholder="Enter your name" 
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@example.com" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 bg-indigo-600" 
              isLoading={isLoading}
            >
              {view === 'signin' ? 'Log In' : 'Create Account'}
            </Button>
          </form>

          <div className="pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
              className="text-[10px] font-black text-slate-400 hover:text-indigo-400 uppercase tracking-widest transition-colors"
            >
              {view === 'signin' ? "Need an account? Register" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
