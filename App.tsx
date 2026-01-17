
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import IndustryQA from './components/IndustryQA.tsx';
import ResumeBuilder from './components/ResumeBuilder.tsx';
import ResumeAnalyzer from './components/ResumeAnalyzer.tsx';
import ChatBot from './components/ChatBot.tsx';
import Opportunities from './components/Opportunities.tsx';
import LoginPage from './components/LoginPage.tsx';
import Card from './components/common/Card.tsx';
import Icon from './components/common/Icon.tsx';
import Spinner from './components/common/Spinner.tsx';
import { Vortex } from './components/ui/vortex.tsx';
import { BackgroundPaths } from './components/ui/background-paths.tsx';
import { MorphingCardStack } from './components/ui/morphing-card-stack.tsx';
import { Page, ResumeData, User } from './types.ts';
import { databaseService } from './services/databaseService.ts';
import { getFastCareerTipStream } from './services/geminiService.ts';

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
        <h2 className="text-xl font-black text-white tracking-tight uppercase">CareerDev AI</h2>
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <Spinner /> 
          <span>Syncing your workspace...</span>
        </div>
      </div>
    </motion.div>
  </div>
);

const Home = ({ navigateTo, userId, onEditResume }: { navigateTo: (page: Page) => void; userId: string; onEditResume: (resumeId: string) => void }) => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [fastTip, setFastTip] = useState<string>("Initializing intelligence...");
  const [isTipLoading, setIsTipLoading] = useState(false);
  const containerRef = useRef(null);
  
  const roadmapData = [
    { id: "1", title: "Build Resume", description: "Create a professional, high-impact resume.", icon: <Icon name="resume" className="h-5 w-5" /> },
    { id: "2", title: "Review Resume", description: "Get instant AI feedback on your documents.", icon: <Icon name="analyzer" className="h-5 w-5" /> },
    { id: "3", title: "Market Insights", description: "Get real-time trends for your industry.", icon: <Icon name="qa" className="h-5 w-5" /> },
    { id: "4", title: "Interview Prep", description: "Practice with our voice-enabled AI bot.", icon: <Icon name="logo" className="h-5 w-5" /> },
  ];

  const fetchFastTip = async () => {
    setIsTipLoading(true);
    setFastTip("");
    try {
      const stream = getFastCareerTipStream();
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setFastTip(fullText);
      }
    } catch (e) {
      setFastTip("Focus on your unique strengths.");
    } finally {
      setIsTipLoading(false);
    }
  };

  useEffect(() => {
    fetchFastTip();
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.8]);

  const loadData = async () => {
    try {
      const userResumes = await databaseService.getResumes(userId);
      setResumes(userResumes || []);
    } catch (e) {
      console.error("Dashboard sync error:", e);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  return (
    <div className="relative" ref={containerRef}>
      <BackgroundPaths className="opacity-10 fixed inset-0 z-0" />
      <div className="relative z-10 py-4 px-2 sm:px-4">
        
        {/* Fast AI Neural Pulse Bar */}
        <div className="max-w-7xl mx-auto mb-8 relative">
           <div className="glass-panel py-4 px-8 rounded-2xl border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400">
                  <Icon name="bolt" className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Neural Pulse:</span>
                <span className="text-xs font-bold text-white italic">"{fastTip}"</span>
              </div>
              <button 
                onClick={fetchFastTip} 
                disabled={isTipLoading}
                className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
              >
                {isTipLoading ? "Syncing..." : "[ REFRESH INSIGHT ]"}
              </button>
           </div>
        </div>

        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="w-full mx-auto rounded-[30px] md:rounded-[50px] min-h-[35rem] md:h-[40rem] overflow-hidden relative mb-12 md:mb-16 shadow-3d bg-slate-950"
        >
          <Vortex backgroundColor="transparent" particleCount={200} className="flex items-center flex-col justify-center w-full h-full relative z-10 px-4 md:px-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8 glass-panel !bg-black/40 p-6 md:p-12 rounded-[40px] md:rounded-[60px] border-white/10"
            >
              <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-indigo-600/30 rounded-full border border-indigo-500/30 text-indigo-300 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
                 Spatial Intelligence v4.0
              </div>
              <h2 className="text-white text-3xl md:text-7xl font-black tracking-tighter leading-tight md:leading-none">
                AI Driven Career <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Ecosystem.</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mt-6 md:mt-8">
                <div className="text-center md:text-left space-y-4 md:space-y-6">
                  <p className="text-white/80 text-sm md:text-lg font-medium leading-relaxed">
                    Forge your future with senior-tier AI reasoning and real-time industry intelligence.
                  </p>
                  <button onClick={() => navigateTo(Page.ResumeBuilder)} className="btn-3d w-full md:w-auto px-8 py-3.5 md:px-10 md:py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] md:text-xs">
                    Start Building
                  </button>
                </div>
                <div className="hidden md:block relative z-10">
                  <MorphingCardStack cards={roadmapData} className="relative" />
                </div>
              </div>
            </motion.div>
          </Vortex>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-24 relative z-10">
          <div className="glass-panel rounded-[30px] md:rounded-[50px] p-6 md:p-8 border border-indigo-500/20 shadow-3d relative overflow-hidden group">
            <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-10">
              <div className="p-2.5 md:p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                <Icon name="chat" className="h-5 w-5 md:h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">AI Workspace</h2>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-500">Pro reasoning & Native Audio</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <Card title="Career Agent" description="Deep strategy chat with Gemini 3 Pro." icon={<Icon name="chat" />} onClick={() => navigateTo(Page.Chat)} glowColor="purple" />
              <Card title="Industry Q&A" description="Search-grounded live market data." icon={<Icon name="qa" />} onClick={() => navigateTo(Page.IndustryQA)} glowColor="orange" />
              <div className="sm:col-span-2">
                <Card title="Opportunity Node" description="Live jobs & internships via Search Grounding." icon={<Icon name="send" />} onClick={() => navigateTo(Page.Opportunities)} glowColor="green" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[30px] md:rounded-[50px] p-6 md:p-8 border border-emerald-500/10 shadow-3d relative overflow-hidden">
            <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-10">
              <div className="p-2.5 md:p-3 bg-emerald-600/20 rounded-2xl border border-emerald-500/30">
                <Icon name="resume" className="h-5 w-5 md:h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Portfolio Engine</h2>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-500">Fast drafting & Strategic audits</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
              <Card title="Resume Studio" description="Draft high-velocity resumes with AI." icon={<Icon name="resume" />} onClick={() => navigateTo(Page.ResumeBuilder)} glowColor="blue" />
              <Card title="Strategic Audit" description="Performance scoring with Deep Reasoning." icon={<Icon name="analyzer" />} onClick={() => navigateTo(Page.ResumeAnalyzer)} glowColor="green" />
            </div>

            <div className="mb-8 md:mb-10">
              <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-400 mb-4 md:mb-6 px-2">Saved Resumes</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar px-2">
                {resumes.length === 0 ? (
                  <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest italic py-4">No resumes archived.</p>
                ) : (
                  resumes.map((res) => (
                    <div key={res.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <Icon name="resume" className="h-4 w-4 md:h-5 md:w-5 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <h5 className="text-xs md:text-sm font-bold text-white uppercase truncate">{res.title}</h5>
                        </div>
                      </div>
                      <button onClick={() => onEditResume(res.id!)} className="p-1.5 md:p-2 hover:bg-indigo-600 rounded-lg transition-colors"><Icon name="edit" className="h-3 w-3" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Workspace: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [editingResumeId, setEditingResumeId] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (page: Page) => { setEditingResumeId(undefined); setCurrentPage(page); };
  const onEditResume = (id: string) => { setEditingResumeId(id); setCurrentPage(Page.ResumeBuilder); };

  if (!isLoaded) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      <Header currentPage={currentPage} navigateTo={navigateTo} user={user} onLogout={onLogout} />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {currentPage === Page.Home && <Home navigateTo={navigateTo} userId={user.id} onEditResume={onEditResume} />}
              {currentPage === Page.IndustryQA && <IndustryQA />}
              {currentPage === Page.ResumeBuilder && <ResumeBuilder user={user} resumeId={editingResumeId} />}
              {currentPage === Page.ResumeAnalyzer && <ResumeAnalyzer userId={user.id} />}
              {currentPage === Page.Chat && <ChatBot user={user} />}
              {currentPage === Page.Opportunities && <Opportunities />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAndSync = async () => {
      const storedUser = localStorage.getItem('careerdev_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const synced = await databaseService.syncUserProfile(parsed);
          setUser(synced);
        } catch (e) {
          localStorage.removeItem('careerdev_user');
          setUser(null);
        }
      }
      setIsAuthChecking(false);
    };
    checkAndSync();
  }, []);

  const handleLogin = (userData: User) => {
    localStorage.setItem('careerdev_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('careerdev_user');
    setUser(null);
  };

  if (isAuthChecking) return <LoadingScreen />;

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Workspace user={user} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginPage onLogin={handleLogin} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
