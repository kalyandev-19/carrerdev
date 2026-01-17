
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './common/Button.tsx';
import Textarea from './common/Textarea.tsx';
import Icon from './common/Icon.tsx';
import { analyzeResumeStream } from '../services/geminiService.ts';
import { databaseService } from '../services/databaseService.ts';

const ResumeAnalyzer: React.FC<{ userId?: string }> = ({ userId }) => {
    const [resumeText, setResumeText] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<{ raw: File, data: string, mimeType: string, name: string } | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeepAudit, setIsDeepAudit] = useState<boolean>(true);
    const [saveToCloud, setSaveToCloud] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const res = e.target?.result as string;
                if (res && res.includes(',')) {
                  setSelectedFile({ 
                      raw: file,
                      data: res.split(',')[1], 
                      mimeType: file.type || 'application/octet-stream', 
                      name: file.name 
                  });
                  setResumeText('');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!resumeText.trim() && !selectedFile) { setError('Please provide a resume to analyze.'); return; }
        setIsLoading(true);
        setAnalysis('');
        setError('');
        
        try {
            if (selectedFile && userId && saveToCloud) {
                try {
                    await databaseService.uploadAndRecordPDF(selectedFile.raw, userId);
                } catch (err) {
                    console.warn("Cloud backup failed, continuing with analysis:", err);
                }
            }

            const content = selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : resumeText;
            const stream = analyzeResumeStream(content, isDeepAudit);
            let full = "";
            for await (const chunk of stream) {
                full += chunk;
                setAnalysis(full);
            }
        } catch (e) { 
            setError('Failed to analyze resume. Please try again.'); 
        } finally { 
            setIsLoading(false); 
        }
    }, [resumeText, selectedFile, userId, saveToCloud, isDeepAudit]);

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Strategic Audit</h2>
                <p className="mt-2 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Neural-Net powered performance scoring</p>
            </div>
            
            <div className="glass-panel p-10 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/10 relative overflow-hidden">
                <AnimatePresence>
                    {isLoading && (
                        <motion.div 
                            initial={{ top: "0%" }}
                            animate={{ top: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className={`absolute left-0 w-full h-1 shadow-[0_0_30px_5px_rgba(99,102,241,0.8)] z-20 pointer-events-none ${isDeepAudit ? 'bg-purple-500' : 'bg-indigo-500'}`}
                        />
                    )}
                </AnimatePresence>

                <div className="space-y-8">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDeepAudit ? 'bg-purple-600/20 text-purple-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                                <Icon name={isDeepAudit ? "network" : "bolt"} className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Analysis Engine</h4>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">{isDeepAudit ? 'Gemini 3 Pro + Thinking' : 'Gemini 3 Flash'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsDeepAudit(!isDeepAudit)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDeepAudit ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                            {isDeepAudit ? 'Deep Audit Enabled' : 'Switch to Deep Audit'}
                        </button>
                    </div>

                    {!selectedFile ? (
                        <>
                            <Textarea rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume text here for instant scoring..." />
                            <div className="relative py-4 text-center">
                                <span className="px-6 bg-slate-950 text-slate-400 font-black uppercase tracking-[0.5em] text-[10px]">OR UPLOAD A FILE</span>
                                <div className="absolute inset-0 flex items-center -z-10"><div className="w-full border-t-2 border-slate-800"></div></div>
                            </div>
                            <label className="flex flex-col items-center justify-center w-full h-40 border-4 border-slate-800 border-dashed rounded-[40px] cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all shadow-inner-soft group">
                                <Icon name="resume" className="w-10 h-10 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload Resume (PDF/Docx)</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.doc" />
                            </label>
                        </>
                    ) : (
                        <div className="bg-indigo-600/5 border-2 border-indigo-900/30 rounded-[40px] p-10 flex flex-col items-center gap-4">
                            <Icon name="resume" className="h-12 w-12 text-indigo-600" />
                            <p className="font-black text-white uppercase tracking-tight">{selectedFile.name}</p>
                            
                            {userId && (
                                <div className="flex items-center gap-3 mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="saveCloud" 
                                        checked={saveToCloud} 
                                        onChange={(e) => setSaveToCloud(e.target.checked)}
                                        className="h-4 w-4 accent-indigo-600"
                                    />
                                    <label htmlFor="saveCloud" className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">Save to my documents</label>
                                </div>
                            )}

                            <button onClick={() => setSelectedFile(null)} className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-2">Remove File</button>
                        </div>
                    )}
                    
                    {error && <p className="text-center text-[10px] font-black uppercase text-rose-500">{error}</p>}
                    <Button onClick={handleAnalyze} isLoading={isLoading} className={`w-full py-5 rounded-2xl ${isDeepAudit ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600'}`}>
                        {isDeepAudit ? 'Perform Strategic Audit' : 'Analyze Resume'}
                    </Button>
                </div>
            </div>

            {(isLoading || analysis) && (
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="mt-16 glass-panel p-12 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white ${isDeepAudit ? 'bg-purple-600 shadow-purple-500/20 shadow-lg' : 'bg-indigo-600'}`}>
                                <Icon name={isDeepAudit ? "network" : "analyzer"} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Audit Insights</h3>
                                <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">{isDeepAudit ? 'Deep Reasoning Active' : 'Standard Scan'}</p>
                            </div>
                        </div>
                        {isDeepAudit && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600/10 rounded-xl border border-purple-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                                <span className="text-[8px] font-black uppercase text-purple-400 tracking-widest">Neural Sync</span>
                            </div>
                        )}
                    </div>
                    <div className="prose prose-invert max-w-none font-bold text-slate-200 leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                        {isLoading && <span className={`inline-block w-2 h-5 ml-2 animate-pulse rounded-full ${isDeepAudit ? 'bg-purple-500' : 'bg-indigo-500'}`} />}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ResumeAnalyzer;
