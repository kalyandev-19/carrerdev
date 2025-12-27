
import React, { useState } from 'react';
import { databaseService } from '../services/databaseService.ts';
import { User } from '../types.ts';
import Button from './common/Button.tsx';
import Input from './common/Input.tsx';
import Icon from './common/Icon.tsx';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await databaseService.findUserByEmail(email);
        
        if (!user) {
          setError('Invalid email or password');
        } else if (user.password !== password) {
          setError('Invalid email or password');
        } else {
          const authUser = { id: user.id, email: user.email, fullName: user.fullName };
          await databaseService.setSession(authUser);
          onLogin(authUser);
        }
      } else {
        if (!email || !password || !fullName) {
          setError('Please fill in all fields');
        } else if (await databaseService.findUserByEmail(email)) {
          setError('Email already in use');
        } else if (password.length < 6) {
          setError('Password must be at least 6 characters');
        } else {
          const newUser = await databaseService.createUser(email, password, fullName);
          await databaseService.setSession(newUser);
          onLogin(newUser);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    if (loading) return;
    setLoading(true);
    const guestUser: User = {
      id: 'guest_' + Math.random().toString(36).substr(2, 5),
      email: 'guest@careerdev.com',
      fullName: 'Guest User'
    };
    await databaseService.setSession(guestUser);
    onLogin(guestUser);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-md">
            <Icon name="logo" className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
          {isLogin ? 'Sign in to your professional dashboard' : 'Start your journey with CareerDev today'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          )}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full py-3 font-semibold shadow-md" isLoading={loading}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => {
              if (loading) return;
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={loading}
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <div className="w-full flex items-center gap-3 py-2">
            <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800"></div>
          </div>

          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            Continue as Guest
            <Icon name="send" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
