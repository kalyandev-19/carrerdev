
import React, { useState } from 'react';
import { databaseService } from '../services/databaseService.ts';
import { User } from '../types.ts';
import Button from './common/Button.tsx';
import Input from './common/Input.tsx';
import Icon from './common/Icon.tsx';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

enum AuthStep {
  LOGIN,
  SIGNUP,
  VERIFY
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>(AuthStep.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await databaseService.createUser(email, password, fullName);
      setStep(AuthStep.VERIFY);
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const user = await databaseService.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !otp) return;
    setError('');
    setLoading(true);
    try {
      const user = await databaseService.verifyEmailOtp(email, otp);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div 
        className="w-full max-w-lg glass-panel p-10 md:p-14 rounded-[40px] shadow-3d border-white/50 border-t-2 border-l-2 tilt-card overflow-hidden relative"
        style={{ transform: 'rotateX(2deg) rotateY(-2deg)' }}
      >
        <div className="absolute -top-24 -right-24 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-10">
            <div className="bg-indigo-600 p-5 rounded-3xl shadow-2xl shadow-indigo-600/30 ring-4 ring-indigo-500/10">
              <Icon name="logo" className="h-10 w-10 text-white" />
            </div>
          </div>
          
          {step === AuthStep.VERIFY ? (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Verify Account</h2>
              <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-sm font-medium">Please enter the code sent to your email</p>
              <form onSubmit={handleVerify} className="space-y-8">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-6 py-6 text-center text-4xl font-black tracking-[0.6em] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white shadow-inner-soft"
                  autoFocus
                />
                {error && <p className="text-rose-500 text-xs text-center font-bold uppercase">{error}</p>}
                <Button type="submit" className="w-full py-5 btn-3d bg-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em]" isLoading={loading}>Verify & Continue</Button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                {step === AuthStep.LOGIN ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-sm font-medium">
                {step === AuthStep.LOGIN ? 'Sign in to access your dashboard' : 'Join thousands of students building their future'}
              </p>

              <form onSubmit={step === AuthStep.LOGIN ? handleLogin : handleSignup} className="space-y-5">
                {step === AuthStep.SIGNUP && (
                  <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className="!rounded-2xl !py-4 shadow-inner-soft" />
                )}
                <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="!rounded-2xl !py-4 shadow-inner-soft" />
                <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="!rounded-2xl !py-4 shadow-inner-soft" />
                
                {error && <p className="text-rose-500 text-xs text-center font-bold uppercase">{error}</p>}

                <Button type="submit" className="w-full py-5 btn-3d bg-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em]" isLoading={loading}>
                  {step === AuthStep.LOGIN ? 'Sign In' : 'Create My Account'}
                </Button>
              </form>

              <div className="mt-10 flex flex-col items-center gap-4">
                <button
                  onClick={() => setStep(step === AuthStep.LOGIN ? AuthStep.SIGNUP : AuthStep.LOGIN)}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {step === AuthStep.LOGIN ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
