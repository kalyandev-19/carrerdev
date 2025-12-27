
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import IndustryQA from './components/IndustryQA';
import ResumeBuilder from './components/ResumeBuilder';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import JobFinder from './components/JobFinder';
import LoginPage from './components/LoginPage';
import ChatBot from './components/ChatBot';
import Card from './components/common/Card';
import Icon from './components/common/Icon';
import { Page, User } from './types';
import { databaseService } from './services/databaseService';

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
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
          Launch your <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-500 animate-gradient-x">CareerDev</span>
        </h1>
        
        <div className="flex flex-col items-center gap-8">
          <button 
            onClick={() => navigateTo(Page.ResumeBuilder)}
            className="group relative px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center gap-3 group-hover:text-white">
              Get Started
              <Icon name="send" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-sky-200 dark:border-sky-900/50 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black tracking-widest shadow-lg shadow-sky-500/5">
               <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></div>
               <span className="text-slate-500 dark:text-slate-400">SAVED JOBS:</span>
               <span className="text-slate-900 dark:text-white">{stats.jobs}</span>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-emerald-200 dark:border-emerald-900/50 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black tracking-widest shadow-lg shadow-emerald-500/5">
               <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
               <span className="text-slate-500 dark:text-slate-400">COMPLETION:</span>
               <span className="text-slate-900 dark:text-white">{stats.resumeComplete}%</span>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-fuchsia-200 dark:border-fuchsia-900/50 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black tracking-widest shadow-lg shadow-fuchsia-500/5">
               <div className="h-2 w-2 rounded-full bg-fuchsia-500 animate-ping"></div>
               <span className="text-slate-500 dark:text-slate-400">AI ENGINE:</span>
               <span className="text-slate-900 dark:text-white">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-16">
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Core Interaction Tools</h2>
            <div className="h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card
              title="Career Assistant"
              description="Your personal mentor for technical prep and career strategy."
              icon={<Icon name="chat" />}
              onClick={() => navigateTo(Page.Chat)}
              className="bg-gradient-to-br from-rose-500 to-orange-500 text-white"
            />
            <Card
              title="Resume Builder"
              description="Craft professional documents with real-time AI bullet generation."
              icon={<Icon name="resume" />}
              onClick={() => navigateTo(Page.ResumeBuilder)}
              className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white"
            />
            <Card
              title="Job Hunter"
              description="Deep-web search for the latest internships and entry-level roles."
              icon={<Icon name="search" />}
              onClick={() => navigateTo(Page.JobFinder)}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
            />
          </div>
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

  useEffect(() => {
    const initApp = async () => {
      const savedUser = await databaseService.getSession();
      if (savedUser) {
        setCurrentUser(savedUser);
      } else {
        const guestId = localStorage.getItem('career_launchpad_guest_id') || ('guest_' + Math.random().toString(36).substr(2, 5));
        localStorage.setItem('career_launchpad_guest_id', guestId);
        
        const guestUser: User = {
          id: guestId,
          email: 'guest@careerdev.ai',
          fullName: 'Guest Professional'
        };
        setCurrentUser(guestUser);
      }

      const savedTheme = localStorage.getItem('launchpad_theme');
      setIsDark(savedTheme !== 'light');
      setInitialized(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('launchpad_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('launchpad_theme', 'light');
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
    const guestId = localStorage.getItem('career_launchpad_guest_id') || ('guest_' + Math.random().toString(36).substr(2, 5));
    const guestUser: User = {
      id: guestId,
      email: 'guest@careerdev.ai',
      fullName: 'Guest Professional'
    };
    setCurrentUser(guestUser);
    setCurrentPage(Page.Home);
    setAuthView(AuthView.App);
  };

  const showLogin = () => {
    setAuthView(AuthView.Login);
  };

  if (!initialized) return null;

  if (authView === AuthView.Login) {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
        <div className="relative">
          <button 
            onClick={() => setAuthView(AuthView.App)}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm z-50"
          >
            <Icon name="logo" className="h-4 w-4 rotate-180" />
            Back to Dashboard
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
