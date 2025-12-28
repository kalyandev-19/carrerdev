
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import IndustryQA from './components/IndustryQA.tsx';
import ResumeBuilder from './components/ResumeBuilder.tsx';
import ResumeAnalyzer from './components/ResumeAnalyzer.tsx';
import LoginPage from './components/LoginPage.tsx';
import ChatBot from './components/ChatBot.tsx';
import Card from './components/common/Card.tsx';
import Icon from './components/common/Icon.tsx';
import Spinner from './components/common/Spinner.tsx';
import { Vortex } from './components/ui/vortex.tsx';
import { BackgroundPaths } from './components/ui/background-paths.tsx';
import { Page, User, AuthView } from './types.ts';
import { databaseService, supabase } from './services/databaseService.ts';

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6 flex flex-col items-center"
    >
      <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20 animate-pulse">
        <Icon name="logo" className="h-12 w-12 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-white tracking-tight uppercase">Neural OS Sync</h2>
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <Spinner /> 
          <span>Linking Data Streams...</span>
        </div>
      </div>
    </motion.div>
  </div>
);

const Home = ({ navigateTo, user }: { navigateTo: (page: Page) => void; user: User }) => {
  const [stats, setStats] = useState({ resumeComplete: 0 });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.8]);
  const heroRotateX = useTransform(scrollYProgress, [0, 0.4], [0, 10]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const resume = await databaseService.getResume(user.id);
        let completion = 0;
        if (resume) {
          if (resume.summary) completion += 20;
          if (resume.experience.length > 0) completion += 40;
          if (resume.education.length > 0) completion += 30;
          if (resume.skills) completion += 10;
        }
        setStats({ resumeComplete: completion });
      } catch (e) {
        console.error("Stats fetch error:", e);
      }
    };
    loadStats();
  }, [user.id]);

  return (
    <div className="relative" ref={containerRef}>
      <BackgroundPaths className="opacity-20 fixed inset-0 z-0" />
      
      <div className="relative z-10 py-4">
        {/* Hero Section */}
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, rotateX: heroRotateX }}
          className="w-full mx-auto rounded-[50px] h-[45rem] overflow-hidden relative mb-16 shadow-3d group perspective-[1500px]"
        >
          <Vortex
            backgroundColor="transparent"
            rangeY={400}
            particleCount={400}
            baseHue={220}
            className="flex items-center flex-col justify-center px-4 md:px-10 py-4 w-full h-full relative z-10"
            containerClassName="bg-slate-950"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, z: -100 }}
              animate={{ scale: 1, opacity: 1, z: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto text-center space-y-8 glass-panel !bg-black/20 p-12 md:p-16 rounded-[60px] border-white/10 backdrop-blur-md"
            >
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600/20 rounded-full border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                 Career Assistant v3.0
              </div>
              
              <h2 className="text-white text-4xl md:text-7xl font-black text-center tracking-tighter leading-none">
                AI Powered Career <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Dashboard.
                </span>
              </h2>
              
              <p className="text-white/70 text-sm md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Unlock your potential with expert industry insights and professional tools designed for success.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-8">
                <motion.button 
                  onClick={() => navigateTo(Page.ResumeBuilder)}
                  whileHover={{ scale: 1.05, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-3d px-12 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-sm shadow-2xl relative overflow-hidden flex items-center gap-3 group"
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                    className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0 pointer-events-none"
                  />
                  
                  <span className="relative z-10">Get Started</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="relative z-10"
                  >
                    <Icon name="resume" className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </motion.div>

                  {/* Radial Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>

                <button 
                  onClick={() => navigateTo(Page.Chat)}
                  className="px-10 py-4 text-white/80 hover:text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-105 flex items-center gap-3 group"
                >
                  AI Assistant 
                  <Icon name="search" className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          </Vortex>
        </motion.div>

        {/* Dashboard Content */}
        <div className="relative px-4">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
          >
            <div className="relative">
              <div className="absolute -left-10 top-0 h-full w-1 bg-indigo-600/50 rounded-full blur-sm" />
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-3 uppercase flex items-center gap-4">
                Dashboard
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <p className="text-slate-400 max-w-2xl text-lg font-bold uppercase tracking-widest">
                Status: <span className="text-indigo-400">Active</span> • Profile: <span className="text-white">{user.fullName}</span>
              </p>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.05, rotateY: -10, translateZ: 50 }}
              className="glass-panel px-10 py-6 rounded-[35px] shadow-3d border border-white/10 cursor-pointer group"
            >
               <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 group-hover:text-indigo-400 transition-colors">Resume Strength</span>
               <div className="flex items-end gap-3">
                 <span className="text-4xl font-black text-emerald-400">{stats.resumeComplete}%</span>
                 <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${stats.resumeComplete}%` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full bg-emerald-500"
                   />
                 </div>
               </div>
            </motion.div>
          </motion.div>

          {/* Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24 relative">
            {/* Tools Grid */}
            <motion.section
              initial={{ opacity: 0, y: 50, rotateX: 5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-indigo-600/10 rounded-lg">
                  <Icon name="chat" className="h-4 w-4 text-indigo-400" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">Career Intelligence</h2>
                <div className="h-[1px] bg-gradient-to-r from-slate-800 to-transparent flex-grow"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Card
                  title="AI Career Chat"
                  description="Consult with your personal AI assistant for career advice and interview prep."
                  icon={<Icon name="chat" />}
                  onClick={() => navigateTo(Page.Chat)}
                  className="bg-slate-900/40 border border-white/5"
                />
                <Card
                  title="Industry Insights"
                  description="Get up-to-date data on job trends, salaries, and required industry skills."
                  icon={<Icon name="qa" />}
                  onClick={() => navigateTo(Page.IndustryQA)}
                  className="bg-slate-900/40 border border-white/5"
                />
              </div>
            </motion.section>

            {/* Resume Builder Grid */}
            <motion.section
              initial={{ opacity: 0, y: 50, rotateX: 5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-purple-600/10 rounded-lg">
                  <Icon name="resume" className="h-4 w-4 text-purple-400" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">Document Builder</h2>
                <div className="h-[1px] bg-gradient-to-r from-slate-800 to-transparent flex-grow"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Card
                  title="Resume Editor"
                  description="Build a high-impact professional resume using our interactive studio."
                  icon={<Icon name="resume" />}
                  onClick={() => navigateTo(Page.ResumeBuilder)}
                  className="bg-slate-900/40 border border-white/5"
                />
                <Card
                  title="AI Resume Review"
                  description="Upload your resume for deep AI analysis and actionable feedback."
                  icon={<Icon name="analyzer" />}
                  onClick={() => navigateTo(Page.ResumeAnalyzer)}
                  className="bg-indigo-600/90 text-white border-transparent shadow-indigo-600/20"
                />
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const initApp = async () => {
      try {
        const apiKey = process.env.API_KEY;
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey || !!apiKey);
        } else {
          setIsKeySelected(true);
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .maybeSingle();
                
              setCurrentUser({
                id: session.user.id,
                email: session.user.email!,
                fullName: profile?.full_name || session.user.email!.split('@')[0],
              });
              setAuthView(AuthView.App);
            } catch (err) {
              console.error("Profile fetch error:", err);
            }
          } else {
            setCurrentUser(null);
            setAuthView(AuthView.Login);
          }
        });

      } catch (err) {
        console.error("App initialization error:", err);
        setIsKeySelected(true);
      } finally {
        setTimeout(() => setInitialized(true), 800);
      }
    };
    initApp();
  }, []);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    setAuthView(AuthView.App);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogout = async () => {
    await databaseService.logout();
    setCurrentUser(null);
    setAuthView(AuthView.Login);
    navigateTo(Page.Home);
  };

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (isKeySelected === false) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={async () => {
                    // @ts-ignore
                    await window.aistudio.openSelectKey();
                    setIsKeySelected(true);
                }}
                className="btn-3d px-10 py-5 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
            >
                Authorize API Access
            </motion.button>
        </div>
    );
  }

  if (!currentUser || authView === AuthView.Login) {
    return (
      <div className="dark min-h-screen bg-slate-950">
        <LoginPage onLogin={(user) => {
           setCurrentUser(user);
           setAuthView(AuthView.App);
           setCurrentPage(Page.Home);
        }} />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case Page.Chat: return <ChatBot user={currentUser} />;
      case Page.IndustryQA: return <IndustryQA />;
      case Page.ResumeBuilder: return <ResumeBuilder user={currentUser} />;
      case Page.ResumeAnalyzer: return <ResumeAnalyzer />;
      case Page.Home:
      default: return <Home navigateTo={navigateTo} user={currentUser} />;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, rotateY: 10, translateZ: -100 },
    animate: { opacity: 1, scale: 1, rotateY: 0, translateZ: 0 },
    exit: { opacity: 0, scale: 1.02, rotateY: -10, translateZ: 100 }
  };

  return (
    <div className="dark min-h-screen bg-slate-950 transition-colors duration-300">
      <div className="flex flex-col min-h-screen">
        <Header 
          currentPage={currentPage} 
          navigateTo={navigateTo} 
          user={currentUser} 
          onLogout={handleLogout}
          onShowLogin={() => setAuthView(AuthView.Login)}
        />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 perspective-[2000px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ 
                duration: 0.7, 
                ease: [0.16, 1, 0.3, 1],
                opacity: { duration: 0.4 }
              }}
              className="w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
