
import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';
import { User } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Icon from './common/Icon';
import Spinner from './common/Spinner';

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

    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      if (isLogin) {
        const user = await databaseService.findUserByEmail(email);
        
        if (!user) {
          setError('IDENT_NOT_FOUND: ACCOUNT_NULL');
        } else if (user.password !== password) {
          setError('AUTH_FAILED: PASS_INVALID');
        } else {
          const authUser = { id: user.id, email: user.email, fullName: user.fullName };
          await databaseService.setSession(authUser);
          onLogin(authUser);
        }
      } else {
        if (!email || !password || !fullName) {
          setError('VALIDATION_ERROR: NULL_FIELDS');
        } else if (await databaseService.findUserByEmail(email)) {
          setError('DUPLICATE_ENTRY: ACCOUNT_EXISTS');
        } else if (password.length < 6) {
          setError('SECURITY_WARN: PASS_TOO_SHORT');
        } else {
          const newUser = await databaseService.createUser(email, password, fullName);
          await databaseService.setSession(newUser);
          onLogin(newUser);
        }
      }
    } catch (err) {
      console.error(err);
      setError('CRITICAL_SYSTEM_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    if (loading) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const guestUser: User = {
      id: 'dev_' + Math.random().toString(36).substr(2, 5),
      email: 'guest@careerdev.ai',
      fullName: 'Guest Developer'
    };
    await databaseService.setSession(guestUser);
    onLogin(guestUser);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300">
              <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-indigo-600 dark:text-sky-400 animate-pulse">
              SYNCING_AUTH_KERNEL...
            </p>
          </div>
        )}

        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl"></div>

        <div className={`relative z-10 transition-all duration-300 ${loading ? 'blur-[2px] opacity-50' : ''}`}>
          <div className="flex justify-center mb-6">
            <div className="bg-slate-900 dark:bg-slate-100 p-4 rounded-xl">
              <Icon name="logo" className="h-10 w-10 text-white dark:text-slate-900" />
            </div>
          </div>
          
          <h2 className="text-3xl font-mono font-bold text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
            {isLogin ? 'Access_Kernel' : 'Create_Identity'}
          </h2>
          <p className="text-center font-mono text-slate-500 dark:text-slate-400 mb-8 text-[11px] uppercase tracking-widest px-4">
            {isLogin ? 'Enter professional credentials' : 'Deploy new profile to career cloud'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Identity_Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="PRO_USER_01"
                required
                className="font-mono text-xs"
                disabled={loading}
              />
            )}
            <Input
              label="Auth_Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@careerdev.ai"
              required
              className="font-mono text-xs"
              disabled={loading}
            />
            <Input
              label="Secure_Token"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="font-mono text-xs"
              disabled={loading}
            />
            
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 p-3 rounded-xl text-[10px] font-mono font-bold text-center animate-in fade-in slide-in-from-top-2 duration-300">
                ERR: {error}
              </div>
            )}

            <Button type="submit" className="w-full py-4 text-xs font-mono font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20" isLoading={loading}>
              {isLogin ? 'INITIATE_SESSION' : 'DEPLOY_ACCOUNT'}
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
              className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              {isLogin ? "// SWITCH_TO_REGISTRATION" : "// SWITCH_TO_LOGIN"}
            </button>

            <div className="w-full flex items-center gap-3 py-2">
              <div className="h-px flex-grow bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">or</span>
              <div className="h-px flex-grow bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
              onClick={handleGuestAccess}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-[11px] font-mono font-bold flex items-center justify-center gap-2 group disabled:opacity-50 uppercase tracking-widest"
            >
              <span>EPHEMERAL_ACCESS</span>
              <Icon name="send" className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
