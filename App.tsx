
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
import { MorphingCardStack } from './components/ui/morphing-card-stack.tsx';
import { Page, User, AuthView, ResumeData } from './types.ts';
import { databaseService } from './services/databaseService.ts';

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
  const [downloads, setDownloads] = useState<any[]>([]);
  const [stats, setStats] = useState({ resumeComplete: 0 });
  const containerRef = useRef(null);
  
  const roadmapData = [
    {
      id: "1",
      title: "Core Resume",
      description: "Build your high-impact professional identity.",
      icon: <Icon name="resume" className="h-5 w-5" />,
    },
    {
      id: "2",
      title: "AI Audit",
      description: "Perform deep neural analysis on your documents.",
      icon: <Icon name="analyzer" className="h-5 w-5" />,
    },
    {
      id: "3",
      title: "Industry QA",
      description: "Get real-time insights from global experts.",
      icon: <Icon name="qa" className="h-5 w-5" />,
    },
    {
      id: "4",
      title: "Career Agent",
      description: "Finalize your strategy with voice-enabled AI.",
      icon: <Icon name="logo" className="h-5 w-5" />,
    },
  ];

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
      setResumes(userResumes || []);
      
      const userDownloads = await databaseService.getUserDownloads(user.id);
      setDownloads(userDownloads || []);

      if (userResumes && userResumes.length > 0) {
        const resume = userResumes[0];
        if (resume) {
          let completion = 0;
          if (resume.summary) completion += 20;
          if (resume.experience && resume.experience.length > 0) completion += 40;
          if (resume.education && resume.education.length > 0) completion += 30;
          if (resume.skills) completion += 10;
          setStats({ resumeComplete: completion });
        }
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-12">
                <div className="text-left space-y-6">
                  <p className="text-white/70 text-sm md:text-xl font-medium leading-relaxed">
                    Unlock your potential with expert industry insights and professional tools designed for success.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <motion.button 
                      onClick={() => navigateTo(Page.ResumeBuilder)}
                      whileHover={{ scale: 1.05, translateY: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-3d px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-2xl relative overflow-hidden flex items-center gap-3 group"
                    >
                      <span>Get Started</span>
                      <Icon name="resume" className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-3xl" />
                  <MorphingCardStack 
                    cards={roadmapData} 
                    className="relative z-10"
                  />
                </div>
              </div>
            </motion.div>
          </Vortex>
        </motion.div>

        {/* Global Dashboard Header */}
        <div className="relative px-4 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
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
        </div>

        {/* Dashboard Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-4 mb-24 relative z-10">
          
          {/* SECTION 1: AI STRATEGY HUB */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-8"
          >
            <div className="glass-panel rounded-[50px] p-8 border border-indigo-500/20 shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)] relative overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-500" />
              
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                  <Icon name="chat" className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">AI Career Strategy</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">AI Chat & Industry Trends</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                <Card
                  title="AI Career Chat"
                  description="Consult with your personal AI assistant for high-level career advice."
                  icon={<Icon name="chat" />}
                  onClick={() => navigateTo(Page.Chat)}
                  glowColor="blue"
                  className="!min-h-[260px]"
                />
                <Card
                  title="Industry Insights"
                  description="Access live data on current job trends and global salary benchmarks."
                  icon={<Icon name="qa" />}
                  onClick={() => navigateTo(Page.IndustryQA)}
                  glowColor="orange"
                  className="!min-h-[260px]"
                />
              </div>

              <div className="mt-8 p-6 bg-slate-900/40 rounded-[30px] border border-white/5 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="roadmap" className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Roadmap Progress</h4>
                </div>
                <div className="flex items-center gap-2">
                   {[1,2,3,4].map((step) => (
                     <div key={step} className={`h-1.5 flex-grow rounded-full ${step <= (stats.resumeComplete / 25) + 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                   ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECTION 2: PROFESSIONAL WORKSPACE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-8"
          >
            <div className="glass-panel rounded-[50px] p-8 border border-emerald-500/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.05)] relative overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl group-hover:bg-emerald-600/10 transition-all duration-500" />

              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="p-3 bg-emerald-600/20 rounded-2xl border border-emerald-500/30">
                  <Icon name="resume" className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Professional Workspace</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Create, analyze, and manage your documents</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 mb-10">
                <Card
                  title="Resume Builder"
                  description="Engineer a fresh, action-oriented document with AI assistance."
                  icon={<Icon name="resume" />}
                  onClick={() => navigateTo(Page.ResumeBuilder)}
                  glowColor="purple"
                  className="!min-h-[220px]"
                />
                <Card
                  title="AI Resume Analysis"
                  description="Run high-fidelity diagnostics on your existing professional files."
                  icon={<Icon name="analyzer" />}
                  onClick={() => navigateTo(Page.ResumeAnalyzer)}
                  glowColor="green"
                  className="!min-h-[220px]"
                />
              </div>

              {/* Saved Resumes Section */}
              <div className="relative z-10 mb-10">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Saved Resumes</h3>
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">
                      {resumes.length} Module{resumes.length !== 1 ? 's' : ''}
                   </span>
                </div>

                <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  {resumes.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-slate-800 rounded-[35px] text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No documents saved yet.</p>
                    </div>
                  ) : (
                    resumes.map((res) => (
                      <motion.div 
                        key={res.id}
                        whileHover={{ x: 5 }}
                        className="bg-slate-900/50 p-5 rounded-[25px] border border-white/5 flex items-center justify-between group/item"
                      >
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
                              <Icon name="resume" className="h-5 w-5" />
                           </div>
                           <div>
                              <h5 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[150px]">{res.title}</h5>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Updated: {res.updatedAt ? new Date(res.updatedAt).toLocaleDateString() : 'N/A'}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => onEditResume(res.id!)} className="p-2 hover:bg-indigo-600 rounded-lg transition-all"><Icon name="edit" className="h-3.5 w-3.5" /></button>
                           <button onClick={(e) => handleDeleteResume(res.id!, e)} className="p-2 hover:bg-rose-600 rounded-lg transition-all"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                           <button onClick={() => onDownloadResume(res.id!)} className="px-4 py-2 bg-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95">Open</button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* NEW: Recent History Section */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Recent History</h3>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg">
                      Cloud Archives
                   </span>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {downloads.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-800 rounded-[35px] text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No cloud files archived.</p>
                    </div>
                  ) : (
                    downloads.map((dl) => (
                      <div 
                        key={dl.id}
                        className="bg-slate-900/30 p-4 rounded-[20px] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-300">
                              <Icon name="save" className="h-4 w-4" />
                           </div>
                           <div className="min-w-0">
                              <h5 className="text-[11px] font-bold text-slate-200 uppercase truncate max-w-[140px]">{dl.file_name}</h5>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.1em]">{new Date(dl.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <a 
                          href={dl.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-1.5 bg-slate-800 hover:bg-indigo-700 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
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
              {currentPage === Page.ResumeAnalyzer && <ResumeAnalyzer userId={user.id} />}
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
