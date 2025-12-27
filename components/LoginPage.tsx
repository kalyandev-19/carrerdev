import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';
import { User } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Icon from './common/Icon';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fix: Handled async database calls by making the handler async and awaiting Promise results.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Artificial delay for a more "real" authentication feel
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (isLogin) {
        const user = await databaseService.findUserByEmail(email);
        
        if (!user) {
          setError('No account found with this email address.');
        } else if (user.password !== password) {
          setError('Incorrect password. Please try again.');
        } else {
          const authUser = { id: user.id, email: user.email, fullName: user.fullName };
          await databaseService.setSession(authUser);
          onLogin(authUser);
        }
      } else {
        if (!email || !password || !fullName) {
          setError('Please fill in all fields to create your account.');
        } else if (await databaseService.findUserByEmail(email)) {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
        } else {
          const newUser = await databaseService.createUser(email, password, fullName);
          await databaseService.setSession(newUser);
          onLogin(newUser);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Fix: Updated to async to properly await session persistence before navigating.
  const handleGuestAccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const guestUser: User = {
      id: 'guest_' + Math.random().toString(36).substr(2, 5),
      email: 'guest@careerdev.ai',
      fullName: 'Guest Professional'
    };
    await databaseService.setSession(guestUser);
    onLogin(guestUser);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-sky-500/10 p-4 rounded-full">
              <Icon name="logo" className="h-10 w-10 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join CareerDev'}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm px-4">
            {isLogin ? 'Enter your details to access your career dashboard' : 'Create an account to start your professional journey'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            )}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs text-center font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-indigo-500/20" isLoading={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors font-semibold"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>

            <div className="w-full flex items-center gap-3 py-2">
              <div className="h-px flex-grow bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">or</span>
              <div className="h-px flex-grow bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
              onClick={handleGuestAccess}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-sm font-bold flex items-center justify-center gap-2 group"
            >
              <span>Browse as Guest</span>
              <Icon name="send" className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;