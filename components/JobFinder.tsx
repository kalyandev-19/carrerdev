import React, { useState, useCallback, useEffect } from 'react';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { JobListing, GroundingSource, User, RecentSearch } from '../types';
import { findJobs } from '../services/geminiService';
import { databaseService } from '../services/databaseService';

const JobCard: React.FC<{ 
    job: JobListing;
    isSaved: boolean;
    onSaveToggle: (job: JobListing) => void;
}> = ({ job, isSaved, onSaveToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getPlatformColor = (platform?: string) => {
        const p = platform?.toLowerCase() || '';
        if (p.includes('linkedin')) return 'bg-[#0077b5] text-white';
        if (p.includes('indeed')) return 'bg-[#2164f3] text-white';
        if (p.includes('glassdoor')) return 'bg-[#0caa41] text-white';
        if (p.includes('wellfound') || p.includes('angel')) return 'bg-black text-white';
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all duration-300 relative shadow-md dark:shadow-lg group">
            <button 
                onClick={() => onSaveToggle(job)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
                <Icon name="bookmark" className={`h-5 w-5 transition-colors ${isSaved ? 'text-sky-500 fill-sky-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`} />
            </button>
            <div className="flex justify-between items-start">
                <div className="pr-10">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{job.title}</h3>
                        {job.sourcePlatform && (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${getPlatformColor(job.sourcePlatform)}`}>
                                {job.sourcePlatform}
                            </span>
                        )}
                    </div>
                    <p className="text-indigo-600 dark:text-sky-500 font-semibold mt-1">{job.company}</p>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <Icon name="location" className="h-4 w-4 mr-1" />
                        {job.location}
                    </div>
                </div>
                <span className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold px-3 py-1 rounded-full ml-4 flex-shrink-0 uppercase tracking-tight">{job.type}</span>
            </div>
            <p className={`mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                {job.description}
            </p>
            <div className="mt-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-2">Requirements:</h4>
                <ul className="list-disc list-inside mt-1 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {(isExpanded ? job.requirements : job.requirements.slice(0, 3)).map((req, index) => (
                        <li key={index} className="pl-1">{req}</li>
                    ))}
                    {!isExpanded && job.requirements.length > 3 && (
                        <li className="text-slate-400 italic ml-5">...and {job.requirements.length - 3} more</li>
                    )}
                </ul>
            </div>
            <div className="mt-6 flex justify-end items-center gap-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {isExpanded ? 'Collapse' : 'Expand Details'}
                </button>
                <a 
                  href={job.url || `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' jobs')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Apply on {job.sourcePlatform || 'Platform'}
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

    useEffect(() => {
        setSavedJobs(databaseService.getSavedJobs(user.id));
        setRecentSearches(databaseService.getRecentSearches(user.id));
    }, [user.id]);

    const handleSaveToggle = useCallback((jobToToggle: JobListing) => {
        databaseService.toggleJobSave(user.id, jobToToggle);
        setSavedJobs(databaseService.getSavedJobs(user.id));
    }, [user.id]);

    const triggerSearch = async (targetRole: string, targetLocation: string) => {
        if (!targetRole.trim() || !targetLocation.trim()) {
            setError('Please enter both a role and a location.');
            return;
        }
        setError('');
        setIsLoading(true);
        setHasSearched(true);
        setJobListings([]);
        setSources([]);

        // Save to recent searches
        const updatedRecent = databaseService.addRecentSearch(user.id, targetRole, targetLocation);
        setRecentSearches(updatedRecent);

        const response = await findJobs(targetRole, targetLocation);
        if (response.listings.length === 0) {
            setError('Could not find any live opportunities. Try broadening your search.');
        }
        setJobListings(response.listings);
        setSources(response.sources);
        setIsLoading(false);
    };

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        triggerSearch(role, location);
    }, [role, location, user.id]);

    const handleRecentClick = (search: RecentSearch) => {
        setRole(search.role);
        setLocation(search.location);
        triggerSearch(search.role, search.location);
    };

    const clearHistory = () => {
        databaseService.clearRecentSearches(user.id);
        setRecentSearches([]);
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Opportunity Finder</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400 italic">Aggregating LinkedIn, Indeed, and Glassdoor via live search.</p>
            </div>

            <div className="space-y-4">
                <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row items-end gap-4 transition-colors">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Job Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Data Analyst"
                    />
                    <Input
                        label="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., London or Remote"
                    />
                    </div>
                    <Button type="submit" isLoading={isLoading} className="px-8 h-[42px]">
                        Find Jobs
                    </Button>
                </form>

                {recentSearches.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-1">Recent:</span>
                        {recentSearches.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleRecentClick(s)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
                            >
                                <Icon name="search" className="h-3 w-3 opacity-50" />
                                <span>{s.role} <span className="text-slate-400 dark:text-slate-500 font-normal">in</span> {s.location}</span>
                            </button>
                        ))}
                        <button 
                            onClick={clearHistory}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase ml-auto"
                        >
                            Clear History
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 dark:text-red-400 mt-4 text-center font-medium">{error}</p>}
            
            {savedJobs.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <Icon name="bookmark" className="text-sky-500 h-6 w-6" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Your Saved Opportunities</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
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

            <div className="mt-12">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Spinner />
                        <span className="mt-4 font-medium animate-pulse">Scouring LinkedIn, Indeed, and more...</span>
                    </div>
                )}
                
                {!isLoading && hasSearched && jobListings.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Live Search Results</h3>
                            <span className="text-xs text-slate-500 font-mono">Verified via Platform APIs</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {jobListings.map((job) => {
                                const isSaved = savedJobs.some(savedJob => savedJob.id === job.id);
                                return (
                                    <JobCard 
                                        key={job.id} 
                                        job={job}
                                        isSaved={isSaved}
                                        onSaveToggle={handleSaveToggle}
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