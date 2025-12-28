
import React, { useState, useCallback, useEffect } from 'react';
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
import { Page, User } from './types.ts';
import { databaseService, supabase } from './services/databaseService.ts';

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
    <div className="space-y-6 flex flex-col items-center">
      <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20 animate-bounce">
        <Icon name="logo" className="h-12 w-12 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Loading Your Career Dashboard</h2>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
          <Spinner /> 
          <span>Connecting to secure services...</span>
        </div>
      </div>
    </div>
  </div>
);

const ApiKeyGate = ({ onAuthorized }: { onAuthorized: () => void }) => {
  const handleConnect = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    } catch (e) {
      console.warn("External key selection tool unavailable.");
    }
    onAuthorized();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-5 rounded-2xl shadow-xl shadow-indigo-500/20">
            <Icon name="logo" className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Setup AI Features
          </h1>
          <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              To use our career AI tools, please ensure your <code className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono text-xs">API_KEY</code> is active.
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requirements:</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>Google Gemini API Key</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>Paid Google Cloud project recommended</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleConnect}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <Icon name="network" className="h-5 w-5" />
          Open Platform
        </button>
      </div>
    </div>
  );
};

const Home = ({ navigateTo, user }: { navigateTo: (page: Page) => void; user: User }) => {
  const [stats, setStats] = useState({ resumeComplete: 0 });

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
    <div className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Your Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
              Hello, {user.fullName.split(' ')[0]}. Ready to build your professional future?
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl shadow-sm">
               <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Resume Strength</span>
               <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resumeComplete}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">AI Career Tools</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              title="Career AI"
              description="Chat about career strategy, interview prep, and your path to success."
              icon={<Icon name="chat" />}
              onClick={() => navigateTo(Page.Chat)}
              className="bg-white dark:bg-slate-900"
            />
            <Card
              title="Expert Insights"
              description="Get real-time answers about job markets, salaries, and required skills."
              icon={<Icon name="qa" />}
              onClick={() => navigateTo(Page.IndustryQA)}
              className="bg-white dark:bg-slate-900"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Your Documents</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              title="Resume Editor"
              description="Create and refine a professional resume with AI assistance."
              icon={<Icon name="resume" />}
              onClick={() => navigateTo(Page.ResumeBuilder)}
              className="bg-white dark:bg-slate-900"
            />
            <Card
              title="Resume Feedback"
              description="Upload your resume to get an instant AI score and improvement tips."
              icon={<Icon name="analyzer" />}
              onClick={() => navigateTo(Page.ResumeAnalyzer)}
              className="bg-indigo-600 text-white border-transparent"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

enum AuthView {
  App = 'app',
  Login = 'login'
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [authView, setAuthView] = useState<AuthView>(AuthView.Login);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [initialized, setInitialized] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

        const savedTheme = localStorage.getItem('careerdev_theme');
        setIsDark(savedTheme === 'dark');
      } catch (err) {
        console.error("App initialization error:", err);
        setIsKeySelected(true);
      } finally {
        setTimeout(() => setInitialized(true), 800);
      }
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
    return <ApiKeyGate onAuthorized={() => setIsKeySelected(true)} />;
  }

  if (!currentUser || authView === AuthView.Login) {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-900`}>
        <LoginPage onLogin={(user) => {
           setCurrentUser(user);
           setAuthView(AuthView.App);
           setCurrentPage(Page.Home);
        }} />
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
      case Page.Home:
      default:
        return <Home navigateTo={navigateTo} user={currentUser} />;
    }
  };

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
      <div className="flex flex-col min-h-screen">
        <Header 
          currentPage={currentPage} 
          navigateTo={navigateTo} 
          user={currentUser} 
          onLogout={handleLogout}
          onShowLogin={() => setAuthView(AuthView.Login)}
          isDark={isDark}
          toggleTheme={() => setIsDark(!isDark)}
        />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
