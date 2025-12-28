
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../services/databaseService.ts';
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import { Vortex } from './ui/vortex.tsx';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

enum AuthStep {
  LOGIN,
  SIGNUP,
  VERIFY
}

const AppInput = ({ label, placeholder, icon, type = "text", value, onChange, ...rest }: any) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative"
    >
      {label && <label className='block mb-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-300 md:text-slate-400 ml-1'>{label}</label>}
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="peer relative z-10 border-2 border-[var(--color-border)] h-12 md:h-14 w-full rounded-2xl bg-slate-900/80 md:bg-[var(--color-surface)] px-5 md:px-6 font-medium text-white outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:border-indigo-500 focus:bg-slate-900/100 placeholder:text-slate-500 text-sm"
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-bg-2) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-slate-500">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>(AuthStep.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      if (!email) throw new Error('Email required');
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
      if (!email) throw new Error('Email required');
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
      const user = await databaseService.verifyOtp(email, otp);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guest = databaseService.loginAsGuest();
    onLogin(guest);
  };

  const socialIcons = [
    { icon: <Icon name="logo" className="h-5 w-5" />, href: '#' },
    { icon: <Icon name="chat" className="h-5 w-5" />, href: '#' },
    { icon: <Icon name="network" className="h-5 w-5" />, href: '#' }
  ];

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 md:p-6 overflow-y-auto relative">
      {/* Background Spatial Effect */}
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
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Hover Glow Effect */}
        <div
          className={`absolute pointer-events-none w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[100px] transition-opacity duration-500 hidden md:block ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `translate(${mousePosition.x - 300}px, ${mousePosition.y - 300}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />

        {/* Left Section: Form */}
        <div className='w-full md:w-1/2 px-6 lg:px-16 py-10 md:py-12 flex flex-col justify-center relative z-10'>
          <AnimatePresence mode="wait">
            {step === AuthStep.VERIFY ? (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <h1 className='text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-tighter'>Verify Account</h1>
                <p className='text-slate-400 text-sm mb-8 font-medium'>Security code dispatched to your terminal</p>
                <form onSubmit={handleVerify} className="space-y-6">
                  <motion.input
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900/70 border-2 border-slate-800 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 text-center text-3xl md:text-4xl font-black tracking-[0.4em] md:tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white"
                    autoFocus
                  />
                  {error && <p className="text-rose-500 text-[10px] font-black uppercase">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full py-4 md:py-5 btn-3d bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm text-white">
                    {loading ? 'Processing...' : 'Verify Protocol'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="mb-6 md:mb-8">
                  {/* Branding for Mobile View */}
                  <div className="md:hidden flex flex-col items-center mb-6">
                    <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg mb-3">
                      <Icon name="logo" className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter uppercase">Career Dev</span>
                    <div className="h-px w-8 bg-indigo-500/30 mt-2" />
                  </div>

                  <h1 className='text-3xl md:text-4xl font-black text-white uppercase tracking-tighter'>
                    {step === AuthStep.LOGIN ? 'Sign In' : 'Sign Up'}
                  </h1>

                  <div className="flex gap-3 justify-center mt-6 md:mt-8">
                    {socialIcons.map((social, index) => (
                      <motion.button 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="w-10 h-10 md:w-12 md:h-12 glass-panel rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-slate-400 border border-white/5"
                      >
                        {social.icon}
                      </motion.button>
                    ))}
                  </div>
                  <span className='text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-500 mt-6 block'>or use digital profile</span>
                </div>

                <form onSubmit={step === AuthStep.LOGIN ? handleLogin : handleSignup} className='space-y-4 text-left'>
                  <AnimatePresence mode="popLayout">
                    {step === AuthStep.SIGNUP && (
                      <AppInput 
                        key="signup-name"
                        placeholder="IDENTIFIER / FULL NAME" 
                        value={fullName} 
                        onChange={(e: any) => setFullName(e.target.value)} 
                      />
                    )}
                  </AnimatePresence>
                  
                  <AppInput 
                    placeholder="TERMINAL EMAIL ADDRESS" 
                    type="email" 
                    value={email} 
                    onChange={(e: any) => setEmail(e.target.value)} 
                  />

                  <AppInput 
                    placeholder="SECURITY ACCESS KEY" 
                    type="password" 
                    value={password} 
                    onChange={(e: any) => setPassword(e.target.value)} 
                  />
                  
                  {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}

                  <div className="flex flex-col gap-4 mt-8">
                    <button type="submit" disabled={loading} className="w-full py-4 md:py-5 btn-3d bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm text-white active:scale-95 transition-all shadow-xl">
                      {loading ? 'Neural Syncing...' : step === AuthStep.LOGIN ? 'Initialize Login' : 'Register Profile'}
                    </button>
                    <div className="flex flex-col items-center gap-3">
                      <button 
                        type="button"
                        onClick={handleGuestLogin}
                        className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        Continue as Ghost User
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setError('');
                          setStep(step === AuthStep.LOGIN ? AuthStep.SIGNUP : AuthStep.LOGIN);
                        }}
                        className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white border-b border-transparent hover:border-white transition-all"
                      >
                        {step === AuthStep.LOGIN ? "Create New Profile" : "Access Existing Login"}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section: Visual */}
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
              Unlock the next level of your professional trajectory. Powered by Gemini.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
