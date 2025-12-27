
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import IndustryQA from './components/IndustryQA.tsx';
import ResumeBuilder from './components/ResumeBuilder.tsx';
import ResumeAnalyzer from './components/ResumeAnalyzer.tsx';
import JobFinder from './components/JobFinder.tsx';
import LoginPage from './components/LoginPage.tsx';
import ChatBot from './components/ChatBot.tsx';
import Card from './components/common/Card.tsx';
import Icon from './components/common/Icon.tsx';
import Spinner from './components/common/Spinner.tsx';
import { Page, User } from './types.ts';
import { databaseService } from './services/databaseService.ts';

const ApiKeyGate = ({ onAuthorized }: { onAuthorized: () => void }) => {
  const handleConnect = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    onAuthorized();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 max-w-lg w-full space-y-12">
        <div className="space-y-4">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.3)]">
              <Icon name="logo" className="h-12 w-12 text-slate-900" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-mono font-black text-white uppercase tracking-tighter">
            Neural_Link<span className="text-indigo-500">_Offline</span>
          </h1>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest leading-relaxed">
            CareerDev AI requires an authorized Gemini API connection to activate intelligence kernels.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-6 backdrop-blur-md">
          <button
            onClick={handleConnect}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            <Icon name="network" className="h-5 w-5" />
            Establish_Neural_Link
          </button>
          
          <div className="space-y-3">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Requirement: Selected API Key must be from a paid project.
            </p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest underline decoration-indigo-500/30 underline-offset-4"
            >
              // View Billing Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = ({ navigateTo, user }: { navigateTo: (page: Page) => void; user: User }) => {
  const [stats, setStats] = useState({ jobs: 0, resumeComplete: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const savedJobs = (await databaseService.getSavedJobs(user.id)).length;
      const resume = await databaseService.getResume(user.id);
      let completion = 0;
      if (resume) {
        if (resume.summary) completion += 20;
        if (resume.experience.length > 0) completion += 40;
        if (resume.education.length > 0) completion += 30;
        if (resume.skills) completion += 10;
      }
      setStats({ jobs: savedJobs, resumeComplete: completion });
    };
    loadStats();
  }, [user.id]);

  return (
    <div className="py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16 relative">
        <h1 className="text-5xl md:text-8xl font-mono font-extrabold text-slate-900 dark:text-white mb-6 tracking-tighter leading-[1.1] uppercase">
          Career<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 animate-gradient-x italic">Dev</span><span className="text-indigo-600 dark:text-indigo-400">_</span>
        </h1>
        
        <div className="flex flex-col items-center gap-8">
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm md:text-base font-medium leading-relaxed font-mono">
            Scientific career intelligence & resume engineering. Automated professional protocols for the next generation of industry leaders.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-sky-200 dark:border-sky-900/50 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest shadow-lg shadow-sky-500/5">
               <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></div>
               <span className="text-slate-500 dark:text-slate-400 uppercase">SAVED_OPPORTUNITIES:</span>
               <span className="text-slate-900 dark:text-white">{stats.jobs}</span>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-emerald-200 dark:border-emerald-900/50 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest shadow-lg shadow-emerald-500/5">
               <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
               <span className="text-slate-500 dark:text-slate-400 uppercase">PROFILE_COMPLETION:</span>
               <span className="text-slate-900 dark:text-white">{stats.resumeComplete}%</span>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-fuchsia-200 dark:border-fuchsia-900/50 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest shadow-lg shadow-fuchsia-500/5">
               <div className="h-2 w-2 rounded-full bg-fuchsia-500 animate-ping"></div>
               <span className="text-slate-500 dark:text-slate-400 uppercase">INTELLIGENCE_STATUS:</span>
               <span className="text-slate-900 dark:text-white">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-20">
        <section>
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-slate-400">Section_01 // Strategic Advisory</h2>
            <div className="h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              title="Career Strategist"
              description="Personalized AI coaching for professional navigation. Optimized for technical preparation and long-term career strategy."
              icon={<Icon name="chat" />}
              onClick={() => navigateTo(Page.Chat)}
              className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white min-h-[200px] border-indigo-500/20"
            />
            <Card
              title="Industry Insights"
              description="Real-time market analysis via neural search. Extract salary parameters, skill trends, and trending industry protocols."
              icon={<Icon name="qa" />}
              onClick={() => navigateTo(Page.IndustryQA)}
              className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white min-h-[200px] border-emerald-500/20"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-slate-400">Section_02 // Portfolio Engineering</h2>
            <div className="h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              title="Resume Architect"
              description="Construct high-impact professional documents. Apply logic-based STAR methods to career data for maximum structural integrity."
              icon={<Icon name="resume" />}
              onClick={() => navigateTo(Page.ResumeBuilder)}
              className="bg-gradient-to-br from-slate-900 to-fuchsia-950 text-white min-h-[200px] border-fuchsia-500/20"
            />
            <Card
              title="Resume Evaluator"
              description="Heuristic scan of your professional documents. Receive readability metrics and structural feedback for resume optimization."
              icon={<Icon name="analyzer" />}
              onClick={() => navigateTo(Page.ResumeAnalyzer)}
              className="bg-gradient-to-br from-slate-900 to-sky-950 text-white min-h-[200px] border-sky-500/20"
            />
          </div>
        </section>

        <section className="pb-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-slate-400">Section_03 // Market Placement</h2>
            <div className="h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent flex-grow"></div>
          </div>
          <Card
            title="Opportunity Search Engine"
            description="Parallel search across global job boards. Automated matching based on your unique career parameters and profile data."
            icon={<Icon name="search" />}
            onClick={() => navigateTo(Page.JobFinder)}
            className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-12 border-slate-700"
          />
        </section>
      </div>
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

enum AuthView {
  App = 'app',
  Login = 'login'
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [authView, setAuthView] = useState<AuthView>(AuthView.App);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [initialized, setInitialized] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // Check for API Key Selection
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);

      const savedUser = await databaseService.getSession();
      if (savedUser) {
        setCurrentUser(savedUser);
      } else {
        const guestId = localStorage.getItem('career_dev_guest_id') || ('dev_' + Math.random().toString(36).substr(2, 5));
        localStorage.setItem('career_dev_guest_id', guestId);
        
        const guestUser: User = {
          id: guestId,
          email: 'guest@careerdev.ai',
          fullName: 'Guest Developer'
        };
        setCurrentUser(guestUser);
      }

      const savedTheme = localStorage.getItem('careerdev_theme');
      setIsDark(savedTheme !== 'light');
      setInitialized(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('careerdev_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('careerdev_theme', 'light');
    }
  }, [isDark]);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    setAuthView(AuthView.App);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setAuthView(AuthView.App);
    setCurrentPage(Page.Home);
    await databaseService.setSession(user);
  };

  const handleLogout = async () => {
    await databaseService.setSession(null);
    const guestId = localStorage.getItem('career_dev_guest_id') || ('dev_' + Math.random().toString(36).substr(2, 5));
    const guestUser: User = {
      id: guestId,
      email: 'guest@careerdev.ai',
      fullName: 'Guest Developer'
    };
    setCurrentUser(guestUser);
    setCurrentPage(Page.Home);
    setAuthView(AuthView.App);
  };

  const showLogin = () => {
    setAuthView(AuthView.Login);
  };

  if (!initialized || isKeySelected === null) return null;

  // Key Selection Gating
  if (!isKeySelected) {
    return <ApiKeyGate onAuthorized={() => setIsKeySelected(true)} />;
  }

  if (authView === AuthView.Login) {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
        <div className="relative">
          <button 
            onClick={() => setAuthView(AuthView.App)}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-mono font-bold text-sm z-50"
          >
            <Icon name="logo" className="h-4 w-4 rotate-180" />
            RETURN TO ROOT
          </button>
          <LoginPage onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (!currentUser) return null;

    switch (currentPage) {
      case Page.Chat:
        return <ChatBot user={currentUser} />;
      case Page.IndustryQA:
        return <IndustryQA />;
      case Page.ResumeBuilder:
        return <ResumeBuilder user={currentUser} />;
      case Page.ResumeAnalyzer:
        return <ResumeAnalyzer />;
      case Page.JobFinder:
        return <JobFinder user={currentUser} />;
      case Page.Home:
      default:
        return <Home navigateTo={navigateTo} user={currentUser} />;
    }
  };

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
      <div className="flex flex-col min-h-screen">
        {currentUser && (
          <Header 
            currentPage={currentPage} 
            navigateTo={navigateTo} 
            user={currentUser} 
            onLogout={handleLogout}
            onShowLogin={showLogin}
            isDark={isDark}
            toggleTheme={() => setIsDark(!isDark)}
          />
        )}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            {renderPage()}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
