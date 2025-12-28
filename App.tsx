
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
import { Page, User, AuthView, ResumeData } from './types.ts';
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

const Home = ({ navigateTo, user, onEditResume, onDownloadResume }: { navigateTo: (page: Page) => void; user: User; onEditResume: (resumeId: string) => void; onDownloadResume: (resumeId: string) => void }) => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [stats, setStats] = useState({ resumeComplete: 0 });
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.8]);
  const heroRotateX = useTransform(scrollYProgress, [0, 0.4], [0, 10]);

  const loadData = async () => {
    try {
      const userResumes = await databaseService.getResumes(user.id);
      setResumes(userResumes);
      
      if (userResumes.length > 0) {
        const resume = userResumes[0]; // Latest
        let completion = 0;
        if (resume.summary) completion += 20;
        if (resume.experience.length > 0) completion += 40;
        if (resume.education.length > 0) completion += 30;
        if (resume.skills) completion += 10;
        setStats({ resumeComplete: completion });
      }
    } catch (e) {
      console.error("Data fetch error:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Permanently delete this resume?")) {
        await databaseService.deleteResume(id);
        loadData();
    }
  };

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
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                  description="Consult with your personal AI assistant for career advice."
                  icon={<Icon name="chat" />}
                  onClick={() => navigateTo(Page.Chat)}
                  glowColor="blue"
                />
                <Card
                  title="Industry Insights"
                  description="Get up-to-date data on job trends and salaries."
                  icon={<Icon name="qa" />}
                  onClick={() => navigateTo(Page.IndustryQA)}
                  glowColor="orange"
                />
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-purple-600/10 rounded-lg">
                  <Icon name="resume" className="h-4 w-4 text-purple-400" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">Document Hub</h2>
                <div className="h-[1px] bg-gradient-to-r from-slate-800 to-transparent flex-grow"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Card
                  title="New Resume"
                  description="Start fresh with a professional document module."
                  icon={<Icon name="resume" />}
                  onClick={() => navigateTo(Page.ResumeBuilder)}
                  glowColor="purple"
                />
                <Card
                  title="AI Audit"
                  description="Analyze existing documents for deep neural feedback."
                  icon={<Icon name="analyzer" />}
                  onClick={() => navigateTo(Page.ResumeAnalyzer)}
                  glowColor="green"
                />
              </div>
            </motion.section>
          </div>

          {/* My Resumes Table */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24"
          >
             <div className="flex items-center gap-4 mb-10">
                <div className="p-2 bg-emerald-600/10 rounded-lg">
                  <Icon name="resume" className="h-4 w-4 text-emerald-400" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">My Document Collection</h2>
                <div className="h-[1px] bg-gradient-to-r from-slate-800 to-transparent flex-grow"></div>
              </div>

              {resumes.length === 0 ? (
                <div className="glass-panel p-20 rounded-[40px] border border-dashed border-slate-800 text-center">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No documents synced. Ready for first initialization.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {resumes.map((res) => (
                        <motion.div 
                          key={res.id}
                          whileHover={{ scale: 1.01, translateY: -4 }}
                          className="glass-panel p-8 rounded-[35px] border border-white/10 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 text-indigo-400 shadow-inner-soft">
                                    <Icon name="resume" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{res.title}</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                        Last Updated: {new Date(res.updatedAt!).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => onEditResume(res.id!)}
                                    className="p-3 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-white/5"
                                    title="Edit Module"
                                >
                                    <Icon name="edit" className="h-4 w-4" />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteResume(res.id!, e)}
                                    className="p-3 bg-white/5 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-white/5"
                                    title="Delete Module"
                                >
                                    <Icon name="trash" className="h-4 w-4" />
                                </button>
                                <button 
                                    onClick={() => onDownloadResume(res.id!)}
                                    className="btn-3d px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600"
                                >
                                    Download
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
              )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

// Main App component that handles overall state and navigation
const App: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [editingResumeId, setEditingResumeId] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial system load simulation
    const timer = setTimeout(() => setIsReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setAuthView(AuthView.App);
  };

  const handleLogout = async () => {
    await databaseService.logout();
    setUser(null);
    setAuthView(AuthView.Login);
    setCurrentPage(Page.Home);
  };

  const navigateTo = (page: Page) => {
    setEditingResumeId(undefined);
    setCurrentPage(page);
  };

  const onEditResume = (id: string) => {
    setEditingResumeId(id);
    setCurrentPage(Page.ResumeBuilder);
  };

  const onDownloadResume = (id: string) => {
    setEditingResumeId(id);
    setCurrentPage(Page.ResumeBuilder);
  };

  if (!isReady) return <LoadingScreen />;

  if (authView === AuthView.Login || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 font-sans antialiased">
      <Header 
        currentPage={currentPage} 
        navigateTo={navigateTo} 
        user={user} 
        onLogout={handleLogout}
        onShowLogin={() => setAuthView(AuthView.Login)}
      />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {currentPage === Page.Home && (
                <Home 
                  navigateTo={navigateTo} 
                  user={user} 
                  onEditResume={onEditResume} 
                  onDownloadResume={onDownloadResume} 
                />
              )}
              {currentPage === Page.IndustryQA && <IndustryQA />}
              {currentPage === Page.ResumeBuilder && (
                <ResumeBuilder 
                  user={user} 
                  resumeId={editingResumeId} 
                />
              )}
              {currentPage === Page.ResumeAnalyzer && <ResumeAnalyzer />}
              {currentPage === Page.Chat && <ChatBot user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
