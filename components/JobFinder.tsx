
import React, { useState, useCallback, useEffect } from 'react';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { JobListing, GroundingSource, User, RecentSearch, ResumeData } from '../types';
import { findJobs } from '../services/geminiService';
import { databaseService } from '../services/databaseService';

const JobCard: React.FC<{ 
    job: JobListing & { matchScore?: number; linkedinInsights?: string };
    isSaved: boolean;
    onSaveToggle: (job: JobListing) => void;
    highlightLinkedIn?: boolean;
}> = ({ job, isSaved, onSaveToggle, highlightLinkedIn }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getPlatformColor = (platform?: string) => {
        const p = platform?.toLowerCase() || '';
        if (p.includes('linkedin')) return 'bg-[#0077b5] text-white';
        if (p.includes('indeed')) return 'bg-[#2164f3] text-white';
        if (p.includes('glassdoor')) return 'bg-[#0caa41] text-white';
        if (p.includes('wellfound') || p.includes('angel')) return 'bg-black text-white';
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    };

    const isLinkedIn = job.sourcePlatform?.toLowerCase().includes('linkedin') || job.url?.includes('linkedin.com');

    return (
        <div className={`p-6 rounded-3xl border transition-all duration-300 relative shadow-xl backdrop-blur-sm group bg-white dark:bg-slate-900/50 ${
            highlightLinkedIn && isLinkedIn 
            ? 'border-[#0077b5]/50 ring-2 ring-[#0077b5]/10 shadow-[#0077b5]/5' 
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
        }`}>
            {job.matchScore !== undefined && (
              <div className="absolute -top-3 left-6 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-full shadow-lg border border-white/20 z-20">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">AI MATCH: {job.matchScore}%</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              </div>
            )}

            <button 
                onClick={() => onSaveToggle(job)}
                className="absolute top-6 right-6 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm z-10"
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
                <Icon name="bookmark" className={`h-5 w-5 transition-colors ${isSaved ? 'text-emerald-500 fill-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`} />
            </button>
            
            <div className="flex justify-between items-start pt-2">
                <div className="pr-12">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{job.title}</h3>
                        {job.sourcePlatform && (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm border border-white/10 ${getPlatformColor(job.sourcePlatform)}`}>
                                {job.sourcePlatform}
                            </span>
                        )}
                        {isLinkedIn && <span className="h-2 w-2 rounded-full bg-[#0077b5] animate-pulse" title="Live on LinkedIn"></span>}
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest">{job.company}</p>
                    <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">
                        <Icon name="location" className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {job.location}
                    </div>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 text-[10px] font-black px-3 py-1.5 rounded-xl ml-4 flex-shrink-0 uppercase tracking-widest">{job.type}</span>
            </div>

            {job.linkedinInsights && isLinkedIn && (
              <div className="mt-4 px-4 py-2 bg-[#0077b5]/5 dark:bg-[#0077b5]/10 border border-[#0077b5]/20 rounded-xl flex items-center gap-3">
                <Icon name="network" className="h-4 w-4 text-[#0077b5]" />
                <span className="text-[10px] font-black text-[#0077b5] uppercase tracking-widest">{job.linkedinInsights}</span>
              </div>
            )}

            <p className={`mt-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {job.description}
            </p>

            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-3">Key Requirements</h4>
                <div className="flex flex-wrap gap-2">
                    {(isExpanded ? job.requirements : job.requirements.slice(0, 3)).map((req, index) => (
                        <span key={index} className="text-[10px] font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700">
                            {req}
                        </span>
                    ))}
                    {!isExpanded && job.requirements.length > 3 && (
                        <button onClick={() => setIsExpanded(true)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline ml-2">
                            +{job.requirements.length - 3} More
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center gap-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {isExpanded ? 'Show Less' : 'Full Details'}
                </button>
                <a 
                  href={job.url || `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' jobs')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl text-white transition-all shadow-lg active:scale-95 ${
                    isLinkedIn 
                    ? 'bg-[#0077b5] hover:bg-[#005a8a] shadow-[#0077b5]/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  }`}
                >
                  {isLinkedIn ? 'Apply on LinkedIn' : 'Apply Now'}
                </a>
            </div>
        </div>
    );
};

interface JobFinderProps {
  user: User;
}

const JobFinder: React.FC<JobFinderProps> = ({ user }) => {
    const [role, setRole] = useState<string>('Software Engineer Intern');
    const [location, setLocation] = useState<string>('Remote');
    const [jobListings, setJobListings] = useState<JobListing[]>([]);
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    const [userResume, setUserResume] = useState<ResumeData | null>(null);

    // LinkedIn Specific State
    const [isLinkedInConnected, setIsLinkedInConnected] = useState<boolean>(false);
    const [isLinking, setIsLinking] = useState<boolean>(false);
    const [isLinkedInOnly, setIsLinkedInOnly] = useState<boolean>(false);
    const [isSyncingProfile, setIsSyncingProfile] = useState<boolean>(false);

    const quickSearches = [
        { role: 'Frontend Engineer', loc: 'Remote' },
        { role: 'Data Scientist', loc: 'New York' },
        { role: 'Product Manager', loc: 'San Francisco' },
        { role: 'UX Designer', loc: 'Remote' },
        { role: 'Backend Intern', loc: 'London' }
    ];

    useEffect(() => {
        const loadInitialData = async () => {
          const [saved, recent, resume] = await Promise.all([
            databaseService.getSavedJobs(user.id),
            databaseService.getRecentSearches(user.id),
            databaseService.getResume(user.id)
          ]);
          setSavedJobs(saved);
          setRecentSearches(recent);
          setUserResume(resume);
          
          const connected = localStorage.getItem(`linkedin_connected_${user.id}`) === 'true';
          setIsLinkedInConnected(connected);
        };
        loadInitialData();
    }, [user.id]);

    const handleConnectLinkedIn = () => {
        setIsLinking(true);
        setTimeout(() => {
            setIsLinkedInConnected(true);
            setIsLinking(false);
            localStorage.setItem(`linkedin_connected_${user.id}`, 'true');
        }, 2000);
    };

    const handleSyncProfile = async () => {
      setIsSyncingProfile(true);
      const resume = await databaseService.getResume(user.id);
      if (resume) {
        setUserResume(resume);
        if (resume.experience.length > 0) {
          setRole(resume.experience[0].role);
        }
      }
      setIsSyncingProfile(false);
    };

    const handleSaveToggle = useCallback(async (jobToToggle: JobListing) => {
        await databaseService.toggleJobSave(user.id, jobToToggle);
        const updatedSaved = await databaseService.getSavedJobs(user.id);
        setSavedJobs(updatedSaved);
    }, [user.id]);

    const triggerSearch = async (targetRole: string, targetLocation: string, linkedinFilter: boolean = false) => {
        if (!targetRole.trim() || !targetLocation.trim()) {
            setError('Please enter both a role and a location.');
            return;
        }
        setError('');
        setIsLoading(true);
        setHasSearched(true);
        setJobListings([]);
        setSources([]);

        const updatedRecent = await databaseService.addRecentSearch(user.id, targetRole, targetLocation);
        setRecentSearches(updatedRecent);

        try {
            const response = await findJobs(targetRole, targetLocation, linkedinFilter, userResume);
            if (response.listings.length === 0) {
                setError('Could not find any live opportunities. Try broadening your search.');
            }
            setJobListings(response.listings);
            setSources(response.sources);
        } catch (e) {
            setError('Search failed. Please try a different query.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        triggerSearch(role, location, isLinkedInOnly);
    }, [role, location, isLinkedInOnly, user.id, userResume]);

    const handleQuickClick = (r: string, l: string) => {
        setRole(r);
        setLocation(l);
        triggerSearch(r, l, isLinkedInOnly);
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-700">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Opportunity <span className="text-emerald-500">Hunter</span></h2>
                <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 uppercase font-black tracking-[0.3em] opacity-60">High-Speed Live Indexing of Global Job Boards</p>
            </div>

            <div className="space-y-6">
                {!isLinkedInConnected ? (
                    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-[#0077b5]/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#0077b5] p-3 rounded-2xl text-white shadow-lg shadow-[#0077b5]/20">
                                <Icon name="network" className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">LinkedIn API Bridge</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Authorize access to fetch real-time LinkedIn listings</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleConnectLinkedIn}
                            disabled={isLinking}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                                isLinking ? 'bg-slate-100 text-slate-400' : 'bg-[#0077b5] text-white hover:bg-[#005a8a] shadow-lg shadow-[#0077b5]/20 active:scale-95'
                            }`}
                        >
                            {isLinking ? <Spinner /> : <Icon name="send" className="h-3 w-3" />}
                            {isLinking ? 'Syncing...' : 'Connect LinkedIn'}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#0077b5]/5 dark:bg-[#0077b5]/10 rounded-3xl border border-[#0077b5]/30 animate-in fade-in gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#0077b5] animate-pulse"></div>
                                <span className="text-[10px] font-black text-[#0077b5] uppercase tracking-widest">LinkedIn API Active</span>
                            </div>
                            <button 
                              onClick={handleSyncProfile}
                              disabled={isSyncingProfile}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#0077b5]/30 text-[9px] font-black uppercase tracking-widest transition-all ${
                                userResume ? 'bg-[#0077b5] text-white' : 'bg-white dark:bg-slate-800 text-[#0077b5] hover:bg-[#0077b5]/10'
                              }`}
                            >
                              <Icon name="resume" className="h-3 w-3" />
                              {isSyncingProfile ? 'Syncing...' : userResume ? 'Profile Synced' : 'Sync Profile'}
                            </button>
                        </div>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isLinkedInOnly ? 'text-[#0077b5]' : 'text-slate-400 group-hover:text-slate-600'}`}>LinkedIn Only Mode</span>
                                <div 
                                    onClick={() => setIsLinkedInOnly(!isLinkedInOnly)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isLinkedInOnly ? 'bg-[#0077b5]' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${isLinkedInOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </label>
                            <button 
                                onClick={() => {
                                    setIsLinkedInConnected(false);
                                    localStorage.removeItem(`linkedin_connected_${user.id}`);
                                }}
                                className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row items-end gap-6 transition-all ring-1 ring-slate-900/5">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <Input
                            label="What role are you seeking?"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g., AI Research Intern"
                            className="text-lg font-bold !rounded-2xl !py-4"
                        />
                        <Input
                            label="Where should it be?"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., Austin or Remote"
                            className="text-lg font-bold !rounded-2xl !py-4"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        isLoading={isLoading} 
                        className={`w-full md:w-auto px-10 h-16 !rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all ${
                            isLinkedInOnly 
                            ? 'bg-[#0077b5] hover:bg-[#005a8a] shadow-[#0077b5]/20' 
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                        }`}
                    >
                        {isLinkedInOnly ? 'Fetch LinkedIn Roles' : 'Search Jobs'}
                    </Button>
                </form>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Quick Picks:</span>
                    {quickSearches.map((qs, i) => (
                        <button
                            key={i}
                            disabled={isLoading}
                            onClick={() => handleQuickClick(qs.role, qs.loc)}
                            className="px-4 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {qs.role}
                        </button>
                    ))}
                </div>

                {recentSearches.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-1 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">History:</span>
                        {recentSearches.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickClick(s.role, s.location)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-emerald-500/30 transition-all"
                            >
                                <Icon name="search" className="h-2.5 w-2.5 opacity-50" />
                                <span>{s.role} @ {s.location}</span>
                            </button>
                        ))}
                        <button 
                            onClick={async () => {
                                await databaseService.clearRecentSearches(user.id);
                                setRecentSearches([]);
                            }}
                            className="text-[10px] font-black text-slate-300 hover:text-rose-500 transition-colors uppercase ml-auto"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl mt-8 text-center animate-in slide-in-from-top-2">
                    <p className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest">{error}</p>
                </div>
            )}
            
            {savedJobs.length > 0 && !hasSearched && !isLoading && (
                <div className="mt-16 space-y-8 animate-in fade-in duration-1000">
                    <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Vaulted Opportunities</h3>
                        <div className="h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent flex-grow"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {savedJobs.map((job) => (
                            <JobCard 
                                key={job.id} 
                                job={job}
                                isSaved={true}
                                onSaveToggle={handleSaveToggle}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-16">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-8">
                        <div className="relative">
                            <div className={`h-24 w-24 rounded-full border-4 ${isLinkedInOnly ? 'border-[#0077b5]/10 border-t-[#0077b5]' : 'border-emerald-500/10 border-t-emerald-500'} animate-spin`}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icon name={isLinkedInOnly ? 'network' : 'search'} className={`h-8 w-8 animate-pulse ${isLinkedInOnly ? 'text-[#0077b5]' : 'text-emerald-500'}`} />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <span className="block font-black uppercase tracking-[0.3em] text-xs text-slate-900 dark:text-white">
                                {isLinkedInOnly ? 'Parsing LinkedIn Index' : 'Analyzing Market Data'}
                            </span>
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {isLinkedInOnly ? 'Fetching live LinkedIn job slots' : 'Querying LinkedIn, Indeed & Glassdoor Hubs'}
                            </span>
                        </div>
                    </div>
                )}
                
                {!isLoading && hasSearched && jobListings.length > 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Search Results</h3>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Found {jobListings.length} High-Impact Matches</p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                                <span className={`h-2 w-2 rounded-full animate-pulse ${isLinkedInOnly ? 'bg-[#0077b5]' : 'bg-emerald-500'}`}></span>
                                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Live Feed Verified</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {jobListings.map((job) => {
                                const isSaved = savedJobs.some(savedJob => savedJob.id === job.id);
                                return (
                                    <JobCard 
                                        key={job.id} 
                                        job={job}
                                        isSaved={isSaved}
                                        onSaveToggle={handleSaveToggle}
                                        highlightLinkedIn={isLinkedInOnly}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobFinder;
