
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './common/Icon.tsx';
import Button from './common/Button.tsx';
import { searchOpportunities } from '../services/geminiService.ts';
import { GroundingSource } from '../types.ts';

interface JobCard {
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
}

const Opportunities: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'Internship' | 'Job'>('Internship');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<JobCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await searchOpportunities(query, location || 'Remote', type);
      const text = response.text || "";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Job Listing',
          uri: chunk.web?.uri || ''
        }))
        .filter((s: GroundingSource) => s.uri);

      const jobResults: JobCard[] = sources.map((source) => ({
        title: source.title,
        company: "Industry Partner",
        location: location || "Global/Remote",
        link: source.uri,
        description: "Apply directly through the verified partner portal."
      }));

      if (jobResults.length === 0 && text) {
        setResults([{
          title: "Market Insight",
          company: "AI Intelligence",
          location: location || "Global",
          link: "#",
          description: text.slice(0, 300) + "..."
        }]);
      } else {
        setResults(jobResults);
      }
    } catch (err: any) {
      setError(err.message || "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-12 space-y-4">
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
          Opportunity <span className="text-indigo-500">Node</span>
        </h2>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-slate-500 max-w-2xl">
          Real-time discovery grounded in Google Search.
        </p>
      </div>

      <div className="glass-panel p-6 md:p-10 rounded-[40px] border border-white/5 mb-12 shadow-3d">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4 space-y-3">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. UX Designer"
              className="w-full px-6 py-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-indigo-500 outline-none text-white font-bold"
            />
          </div>
          <div className="md:col-span-3">
             <input 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full px-6 py-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-indigo-500 outline-none text-white font-bold"
            />
          </div>
          <div className="md:col-span-3 flex bg-slate-900/50 p-1.5 rounded-2xl border-2 border-slate-800">
            <button type="button" onClick={() => setType('Internship')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${type === 'Internship' ? 'bg-indigo-600' : 'text-slate-500'}`}>Internship</button>
            <button type="button" onClick={() => setType('Job')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${type === 'Job' ? 'bg-indigo-600' : 'text-slate-500'}`}>Job</button>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" isLoading={isLoading} className="w-full py-4.5">Find</Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {results.map((job, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-[40px] border border-white/5 flex flex-col justify-between shadow-3d">
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{job.title}</h3>
                <p className="text-xs text-indigo-400 font-bold uppercase">{job.company} • {job.location}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{job.description}</p>
              </div>
              <a href={job.link} target="_blank" rel="noopener noreferrer" className="mt-8 py-4 bg-slate-800 hover:bg-indigo-600 text-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Apply Now</a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Opportunities;
