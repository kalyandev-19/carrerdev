
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
import { Page, User } from './types.ts';
import { databaseService, supabase } from './services/databaseService.ts';

const ApiKeyGate = ({ onAuthorized }: { onAuthorized: () => void }) => {
  const handleConnect = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    onAuthorized();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-500/20">
            <Icon name="logo" className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Connection Required
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Please establish a secure connection with the Gemini AI service to access the platform features.
          </p>
        </div>

        <button
          onClick={handleConnect}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
        >
          <Icon name="network" className="h-5 w-5" />
          Connect Gemini API
        </button>
        
        <div className="pt-4">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4"
          >
            Review API billing documentation
          </a>
        </div>
      </div>
    </div>
  );
};

const Home = ({ navigateTo, user }: { navigateTo: (page: Page) => void; user: User }) => {
  const [stats, setStats] = useState({ resumeComplete: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const resume = await databaseService.getResume(user.id);
      let completion = 0;
      if (resume) {
        if (resume.summary) completion += 20;
        if (resume.experience.length > 0) completion += 40;
        if (resume.education.length > 0) completion += 30;
        if (resume.skills) completion += 10;
      }
      setStats({ resumeComplete: completion });
    };
    loadStats();
  }, [user.id]);

  return (
    <div className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Career Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
              Welcome back, {user.fullName.split(' ')[0]}. Manage your professional documents and get AI-driven career advice.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl shadow-sm">
               <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Profile Strength</span>
               <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resumeComplete}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Professional Development</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              title="AI Career Advisor"
              description="Consult with our specialized AI for interview prep and career strategy."
              icon={<Icon name="chat" />}
              onClick={() => navigateTo(Page.Chat)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
            <Card
              title="Industry Analysis"
              description="Access real-time market data and emerging skill requirements in your field."
              icon={<Icon name="qa" />}
              onClick={() => navigateTo(Page.IndustryQA)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Resume & Portfolio</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              title="Resume Builder"
              description="Create your professional resume using industry-standard templates."
              icon={<Icon name="resume" />}
              onClick={() => navigateTo(Page.ResumeBuilder)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
            <Card
              title="Resume Scanner"
              description="Get instant AI feedback on your resume's impact and keywords."
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
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
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
        } else {
          setCurrentUser(null);
          setAuthView(AuthView.Login);
        }
      });

      const savedTheme = localStorage.getItem('careerdev_theme');
      setIsDark(savedTheme === 'dark');
      setInitialized(true);

      return () => subscription.unsubscribe();
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

  if (!initialized || isKeySelected === null) return null;

  if (!isKeySelected) {
    return <ApiKeyGate onAuthorized={() => setIsKeySelected(true)} />;
  }

  if (!currentUser || authView === AuthView.Login) {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
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
