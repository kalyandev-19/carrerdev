import React, { useState, useCallback, useEffect } from 'react';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { JobListing } from '../types';
import { findJobs } from '../services/geminiService';

const JobCard: React.FC<{ 
    job: JobListing;
    isSaved: boolean;
    onSaveToggle: (job: JobListing) => void;
}> = ({ job, isSaved, onSaveToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-sky-500 transition-colors duration-300 relative">
            <button 
                onClick={() => onSaveToggle(job)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors z-10"
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
                <Icon name="bookmark" className={`h-5 w-5 transition-colors ${isSaved ? 'text-sky-400 fill-sky-400' : 'text-slate-400 hover:text-white'}`} />
            </button>
            <div className="flex justify-between items-start">
                <div className="pr-10">
                    <h3 className="text-xl font-bold text-sky-400">{job.title}</h3>
                    <p className="text-slate-300 font-medium">{job.company}</p>
                    <p className="text-sm text-slate-400">{job.location}</p>
                </div>
                <span className="bg-slate-700 text-sky-400 text-xs font-semibold px-2.5 py-0.5 rounded-full ml-4 flex-shrink-0">{job.type}</span>
            </div>
            <p className={`mt-4 text-sm text-slate-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
                {job.description}
            </p>
            <div className="mt-4">
                <h4 className="font-semibold text-slate-200">Requirements:</h4>
                <ul className="list-disc list-inside mt-1 text-sm text-slate-400 space-y-1">
                    {(isExpanded ? job.requirements : job.requirements.slice(0, 3)).map((req, index) => (
                        <li key={index}>{req}</li>
                    ))}
                    {!isExpanded && job.requirements.length > 3 && (
                        <li className="text-slate-500 italic">...and {job.requirements.length - 3} more</li>
                    )}
                </ul>
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 text-sm font-semibold rounded-md text-sky-400 bg-slate-700/50 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-colors"
                    aria-expanded={isExpanded}
                >
                    {isExpanded ? 'Show Less' : 'View Details'}
                </button>
            </div>
        </div>
    );
};


const JobFinder: React.FC = () => {
    const [role, setRole] = useState<string>('Software Engineer Intern');
    const [location, setLocation] = useState<string>('San Francisco, CA');
    const [jobListings, setJobListings] = useState<JobListing[]>([]);
    const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    
    const SAVED_JOBS_KEY = 'career_launchpad_saved_jobs';

    useEffect(() => {
        try {
            const saved = localStorage.getItem(SAVED_JOBS_KEY);
            if (saved) {
                setSavedJobs(JSON.parse(saved));
            }
        } catch (error) {
            console.error("Failed to parse saved jobs from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs));
        } catch (error) {
            console.error("Failed to save jobs to localStorage", error);
        }
    }, [savedJobs]);

    const handleSaveToggle = useCallback((jobToToggle: JobListing) => {
        setSavedJobs(prevSavedJobs => {
            const isAlreadySaved = prevSavedJobs.some(job => job.id === jobToToggle.id);
            if (isAlreadySaved) {
                return prevSavedJobs.filter(job => job.id !== jobToToggle.id);
            } else {
                return [...prevSavedJobs, jobToToggle];
            }
        });
    }, []);

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role.trim() || !location.trim()) {
            setError('Please enter both a role and a location.');
            return;
        }
        setError('');
        setIsLoading(true);
        setHasSearched(true);
        setJobListings([]);

        const results = await findJobs(role, location);
        if (results.length === 0) {
            setError('Could not find any opportunities. Try a different search.');
        }
        setJobListings(results);
        setIsLoading(false);
    }, [role, location]);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Opportunity Finder</h2>
                <p className="mt-2 text-slate-400">Discover simulated job and internship opportunities.</p>
            </div>

            <form onSubmit={handleSearch} className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col md:flex-row items-end gap-4">
                <Input
                    label="Job Role / Title"
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., Data Analyst"
                    className="w-full"
                />
                <Input
                    label="Location"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., New York, NY"
                    className="w-full"
                />
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    Search
                </Button>
            </form>
            {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
            
            {savedJobs.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Saved Opportunities</h3>
                    <div className="space-y-6">
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

            <div className="mt-8">
                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Spinner />
                        <span className="ml-2">Searching for opportunities...</span>
                    </div>
                )}
                
                {!isLoading && hasSearched && jobListings.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">
                           {savedJobs.length > 0 ? "Search Results" : "Opportunities"}
                        </h3>
                        <div className="space-y-6">
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

                {!isLoading && hasSearched && jobListings.length === 0 && !error && (
                    <div className="text-center py-10 text-slate-500">
                        <p>No results found. Please try a different search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobFinder;