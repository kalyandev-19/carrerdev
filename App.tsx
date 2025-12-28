
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
        <h2 className="text-xl font-black text-white tracking-tight uppercase">CareerDev Sync</h2>
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <Spinner /> 
          <span>Initializing Workspace...</span>
        </div>
      </div>
    </motion.div>
  </div>
);

const Home = ({ navigateTo, user, onEditResume }: { navigateTo: (page: Page) => void; user: User; onEditResume: (resumeId: string) => void }) => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [stats, setStats] = useState({ resumeComplete: 0 });
  const containerRef = useRef(null);
  
  const roadmapData = [
    { id: "1", title: "Core Resume", description: "Build your high-impact professional identity.", icon: <Icon name="resume" className="h-5 w-5" /> },
    { id: "2", title: "AI Audit", description: "Perform deep analysis on your documents.", icon: <Icon name="analyzer" className="h-5 w-5" /> },
    { id: "3", title: "Industry QA", description: "Get real-time insights from global experts.", icon: <Icon name="qa" className="h-5 w-5" /> },
    { id: "4", title: "Career Agent", description: "Finalize your strategy with voice-enabled AI.", icon: <Icon name="logo" className="h-5 w-5" /> },
  ];

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.8]);

  const loadData = async () => {
    try {
      const [userResumes, userDownloads] = await Promise.all([
        databaseService.getResumes(user.id),
        databaseService.getUserDownloads(user.id)
      ]);
      setResumes(userResumes || []);
      setDownloads(userDownloads || []);

      if (userResumes && userResumes.length > 0) {
        const resume = userResumes[0];
        let completion = 0;
        if (resume.summary) completion += 20;
        if (resume.experience?.length) completion += 40;
        if (resume.education?.length) completion += 30;
        if (resume.skills) completion += 10;
        setStats({ resumeComplete: completion });
      }
    } catch (e) {
      console.error("Dashboard sync error:", e);
    }
  };

  useEffect(() => { loadData(); }, [user.id]);

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
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="w-full mx-auto rounded-[50px] h-[40rem] overflow-hidden relative mb-16 shadow-3d bg-slate-950"
        >
          <Vortex backgroundColor="transparent" particleCount={300} className="flex items-center flex-col justify-center w-full h-full relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center space-y-8 glass-panel !bg-black/20 p-12 rounded-[60px] border-white/10">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600/20 rounded-full border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                 Career Intelligence v3.0
              </div>
              <h2 className="text-white text-4xl md:text-7xl font-black tracking-tighter leading-none">
                AI Powered Career <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Dashboard.</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-8">
                <div className="text-left space-y-6">
                  <p className="text-white/70 text-lg font-medium">Elevate your professional trajectory with expert tools and neural guidance.</p>
                  <button onClick={() => navigateTo(Page.ResumeBuilder)} className="btn-3d px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs">Get Started</button>
                </div>
                <MorphingCardStack cards={roadmapData} className="relative z-10" />
              </div>
            </motion.div>
          </Vortex>
        </motion.div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-4 mb-24 relative z-10">
          {/* AI STRATEGY HUB */}
          <div className="glass-panel rounded-[50px] p-8 border border-indigo-500/20 shadow-3d relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30"><Icon name="chat" className="h-6 w-6 text-indigo-400" /></div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">AI Career Strategy</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Insights & Consulting</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <Card title="AI Career Chat" description="Consult with your personal career assistant." icon={<Icon name="chat" />} onClick={() => navigateTo(Page.Chat)} glowColor="blue" />
              <Card title="Industry Insights" description="Live job trends and salary benchmarks." icon={<Icon name="qa" />} onClick={() => navigateTo(Page.IndustryQA)} glowColor="orange" />
            </div>
          </div>

          {/* PROFESSIONAL WORKSPACE */}
          <div className="glass-panel rounded-[50px] p-8 border border-emerald-500/10 shadow-3d relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-600/20 rounded-2xl border border-emerald-500/30"><Icon name="resume" className="h-6 w-6 text-emerald-400" /></div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Professional Workspace</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Document Management</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <Card title="Resume Builder" description="Engineer high-impact documents." icon={<Icon name="resume" />} onClick={() => navigateTo(Page.ResumeBuilder)} glowColor="purple" />
              <Card title="AI Analysis" description="Diagnostic audit of your professional files." icon={<Icon name="analyzer" />} onClick={() => navigateTo(Page.ResumeAnalyzer)} glowColor="green" />
            </div>

            {/* My Saved Resumes */}
            <div className="mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-6">My Saved Resumes</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                {resumes.map((res) => (
                  <div key={res.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Icon name="resume" className="h-5 w-5 text-indigo-400" />
                      <div>
                        <h5 className="text-sm font-bold text-white uppercase truncate max-w-[150px]">{res.title}</h5>
                        <p className="text-[8px] font-black text-slate-500 uppercase">{new Date(res.updatedAt || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onEditResume(res.id!)} className="p-2 hover:bg-indigo-600 rounded-lg"><Icon name="edit" className="h-3.5 w-3.5" /></button>
                      <button onClick={(e) => handleDeleteResume(res.id!, e)} className="p-2 hover:bg-rose-600 rounded-lg"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cloud Archives */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Recent Cloud History</h3>
              <div className="space-y-3">
                {downloads.slice(0, 3).map((dl) => (
                  <div key={dl.id} className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon name="save" className="h-4 w-4 text-emerald-400" />
                      <h5 className="text-[11px] font-bold text-slate-200 uppercase truncate max-w-[140px]">{dl.file_name}</h5>
                    </div>
                    <a href={dl.file_url} target="_blank" rel="noreferrer" className="px-4 py-1.5 bg-slate-800 hover:bg-indigo-700 rounded-lg text-[8px] font-black uppercase">View</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [editingResumeId, setEditingResumeId] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { const timer = setTimeout(() => setIsReady(true), 1200); return () => clearTimeout(timer); }, []);
  const handleLogin = (u: User) => { setUser(u); setAuthView(AuthView.App); };
  const handleLogout = async () => { await databaseService.logout(); setUser(null); setAuthView(AuthView.Login); setCurrentPage(Page.Home); };
  const navigateTo = (page: Page) => { setEditingResumeId(undefined); setCurrentPage(page); };
  const onEditResume = (id: string) => { setEditingResumeId(id); setCurrentPage(Page.ResumeBuilder); };

  if (!isReady) return <LoadingScreen />;
  if (authView === AuthView.Login || !user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      <Header currentPage={currentPage} navigateTo={navigateTo} user={user} onLogout={handleLogout} onShowLogin={() => setAuthView(AuthView.Login)} />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {currentPage === Page.Home && <Home navigateTo={navigateTo} user={user} onEditResume={onEditResume} />}
              {currentPage === Page.IndustryQA && <IndustryQA />}
              {currentPage === Page.ResumeBuilder && <ResumeBuilder user={user} resumeId={editingResumeId} />}
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
