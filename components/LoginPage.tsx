
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
        const user = await databaseService.login(email, password);
        onLogin(user);
      } else {
        if (!email || !password || !fullName) {
          setError('Please fill in all fields');
        } else if (password.length < 6) {
          setError('Password must be at least 6 characters');
        } else {
          const newUser = await databaseService.createUser(email, password, fullName);
          onLogin(newUser);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'An unexpected error occurred.';
      if (message.includes('Invalid login credentials')) {
        message = 'Login failed. Check your email/password or create a new account.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
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
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          )}
          <Input
            label="Email Address"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={loading}
          />
          <Input
            label="Password"
            id="password"
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
