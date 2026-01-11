
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchOpportunities } from '../services/geminiService.ts';
import Icon from './common/Icon.tsx';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';
import { GroundingSource } from '../types.ts';

const Opportunities: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Remote');
  const [type, setType] = useState('Internship');
  const [results, setResults] = useState<{ text: string, sources: GroundingSource[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);

    try {
      const response = await searchOpportunities(query, location, type);
      if (response) {
        const text = response.text || "No detailed results found.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((chunk: any) => ({
            title: chunk.web?.title || 'Job Listing',
            uri: chunk.web?.uri || ''
          }))
          .filter((s: any) => s.uri) || [];
        
        setResults({ text, sources });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Neural Opportunity Finder</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Real-time Job & Internship Intelligence</p>
      </motion.div>

      <div className="glass-panel p-8 rounded-[40px] border border-white/10 shadow-3d mb-12">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Role / Skills</label>
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Frontend Engineer, Product Design" 
              className="w-full px-6 py-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Location</label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, Remote" 
              className="w-full px-6 py-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <Button isLoading={isLoading} className="h-[60px] rounded-2xl">
            Execute Search
          </Button>
        </form>

        <div className="flex gap-4 mt-8 justify-center">
          {['Internship', 'Entry Level', 'Full-time'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                type === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
              <div className="bg-indigo-600 p-6 rounded-3xl relative z-10 shadow-3d">
                <Spinner />
              </div>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Syncing with Global Job Networks...</p>
          </motion.div>
        ) : results ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 glass-panel p-8 md:p-12 rounded-[40px] border border-white/5 shadow-3d h-fit">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                  <Icon name="logo" className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Listing Analysis</h3>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 font-medium leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: results.text.replace(/\n/g, '<br />') }} />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-4">Direct Portals Found</h4>
              {results.sources.map((source, i) => (
                <motion.a
                  key={i}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="block glass-panel p-6 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h5 className="text-sm font-black text-white uppercase truncate group-hover:text-indigo-400 transition-colors">{source.title}</h5>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">{new URL(source.uri).hostname}</p>
                    </div>
                    <div className="shrink-0 p-2 bg-slate-800 rounded-xl text-slate-400 group-hover:text-white transition-colors">
                      <Icon name="send" className="h-4 w-4" />
                    </div>
                  </div>
                </motion.a>
              ))}
              {results.sources.length === 0 && (
                <div className="text-center py-10 opacity-50 italic text-slate-500">
                  No verified direct links found for this specific search.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 opacity-30">
            <Icon name="roadmap" className="h-20 w-20 mx-auto text-slate-600 mb-6" />
            <p className="font-black uppercase tracking-[0.5em] text-slate-600">Enter a query to begin scanning</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Opportunities;
