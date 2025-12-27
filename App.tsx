
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
    const savedJobs = databaseService.getSavedJobs(user.id).length;
    const resume = databaseService.getResume(user.id);
    let completion = 0;
    if (resume) {
      if (resume.summary) completion += 20;
      if (resume.experience.length > 0) completion += 40;
      if (resume.education.length > 0) completion += 30;
      if (resume.skills) completion += 10;
    }
    setStats({ jobs: savedJobs, resumeComplete: completion });
  }, [user.id]);

  return (
    <div className="py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Accelerate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">CareerDev</span>
        </h1>
        
        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold shadow-sm">
             <div className="h-2 w-2 rounded-full bg-sky-500"></div>
             <span className="text-slate-500 dark:text-slate-400">SAVED JOBS:</span>
             <span className="text-slate-900 dark:text-white">{stats.jobs}</span>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold shadow-sm">
             <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
             <span className="text-slate-500 dark:text-slate-400">RESUME COMPLETION:</span>
             <span className="text-slate-900 dark:text-white">{stats.resumeComplete}%</span>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold shadow-sm">
             <div className="h-2 w-2 rounded-full bg-amber-500"></div>
             <span className="text-slate-500 dark:text-slate-400">AI SESSIONS:</span>
             <span className="text-slate-900 dark:text-white">Active</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 ml-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Primary Toolset</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              title="Career Assistant"
              description="Real-time professional mentoring. Practice interviews or get salary negotiation advice."
              icon={<Icon name="chat" />}
              onClick={() => navigateTo(Page.Chat)}
            />
            <Card
              title="Resume Builder"
              description="Craft a document that beats the ATS. Uses AI to write high-impact bullet points."
              icon={<Icon name="resume" />}
              onClick={() => navigateTo(Page.ResumeBuilder)}
            />
            <Card
              title="Opportunity Finder"
              description="Real-world internships and roles discovered via live web search grounded for today."
              icon={<Icon name="search" />}
              onClick={() => navigateTo(Page.JobFinder)}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 ml-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Career Advancement</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => navigateTo(Page.Chat)}
              className="group bg-gradient-to-br from-rose-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-rose-100 dark:border-slate-700 cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="bg-rose-500/10 p-3 rounded-xl text-rose-600 mb-4 w-fit group-hover:scale-110 transition-transform">
                <Icon name="interview" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Mock Interview</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Run a simulated 15-minute technical or behavioral interview with instant feedback.</p>
            </div>
            
            <div 
              onClick={() => navigateTo(Page.Chat)}
              className="group bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-emerald-100 dark:border-slate-700 cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-600 mb-4 w-fit group-hover:scale-110 transition-transform">
                <Icon name="roadmap" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Skill Roadmap</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Generate a step-by-step learning path to master the tech stack for your target role.</p>
            </div>

            <div 
              onClick={() => navigateTo(Page.Chat)}
              className="group bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-600 mb-4 w-fit group-hover:scale-110 transition-transform">
                <Icon name="network" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Network Strategist</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Get cold-email templates and networking scripts tailored to industry professionals.</p>
            </div>
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
  const [authView, setAuthView] = useState<AuthView>(AuthView.App);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedUser = databaseService.getSession();
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAuthView(AuthView.App);
    setCurrentPage(Page.Home);
  };

  const handleLogout = () => {
    databaseService.setSession(null);
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
    <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
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
