
import React, { useState, useCallback } from 'react';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { analyzeResumeStream } from '../services/geminiService';

const ResumeAnalyzer: React.FC = () => {
    const [resumeText, setResumeText] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError('');
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const base64Data = result.split(',')[1];
                setSelectedFile({
                    data: base64Data,
                    mimeType: file.type || 'application/octet-stream',
                    name: file.name
                });
                setResumeText('');
            };
            reader.onerror = () => setError('Failed to read file.');
            reader.readAsDataURL(file);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError('');
    };

    const handleAnalyze = useCallback(async () => {
        if (!resumeText.trim() && !selectedFile) {
            setError('Please paste your resume or upload a file first.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAnalysis('');

        try {
            const content = selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : resumeText;
            const stream = analyzeResumeStream(content);
            let fullText = "";
            for await (const chunk of stream) {
                fullText += chunk;
                setAnalysis(fullText);
            }
        } catch (error) {
            console.error(error);
            setError('Failed to analyze. Try a smaller file or plain text.');
        } finally {
            setIsLoading(false);
        }
    }, [resumeText, selectedFile]);

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-12 animate-in fade-in duration-700">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Resume Feedback</h2>
                <p className="mt-3 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">AI-Powered Diagnostic Scanner</p>
            </div>
            
            <div className="tilt-card glass-panel p-10 md:p-14 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/40 relative overflow-hidden">
                {/* 3D Animated Background Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />
                
                {!selectedFile ? (
                    <div className="space-y-10">
                        <div className="group relative">
                           <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 ml-2">Manual Terminal Entry</label>
                           <Textarea
                                rows={6}
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="PASTE RESUME CONTENT FOR DEEP ANALYSIS..."
                                className="!rounded-3xl !py-6 !px-8 shadow-inner-soft border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 transition-all text-sm font-semibold"
                            />
                        </div>
                        
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-slate-100 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-6 bg-white dark:bg-slate-900 text-slate-400 font-black uppercase tracking-[0.5em] text-[10px]">Or</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Hardware Upload</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-slate-100 dark:border-slate-800 border-dashed rounded-[40px] cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 transition-all group shadow-inner-soft">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="bg-indigo-600/10 p-5 rounded-3xl group-hover:scale-110 transition-transform mb-4 shadow-lg">
                                            <Icon name="resume" className="w-10 h-10 text-indigo-600" />
                                        </div>
                                        <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Insert Document</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">PDF • DOCX • JPG • PNG</p>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" />
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-indigo-600/5 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[40px] p-10 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500 shadow-inner-soft">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-3d scale-110">
                            <Icon name="resume" className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-xl text-slate-900 dark:text-white truncate max-w-sm tracking-tight">{selectedFile.name}</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em]">Ready for Injection</span>
                            </div>
                        </div>
                        <button 
                            onClick={clearFile}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2 mt-4 px-6 py-3 border border-rose-100 dark:border-rose-900/30 rounded-xl"
                        >
                            <Icon name="sun" className="h-3 w-3 rotate-45" /> Eject File
                        </button>
                    </div>
                )}

                <div className="mt-12 flex justify-center relative">
                    {isLoading && (
                        <div className="absolute -top-32 left-0 w-full h-64 pointer-events-none overflow-hidden rounded-[40px]">
                            <div className="w-full h-1 bg-indigo-500 shadow-[0_0_20px_2px_rgba(99,102,241,0.8)] absolute animate-[scan_2s_infinite]" />
                        </div>
                    )}
                    <Button 
                        onClick={handleAnalyze} 
                        isLoading={isLoading} 
                        disabled={!resumeText.trim() && !selectedFile} 
                        className="w-full md:w-auto px-16 py-5 text-sm font-black uppercase tracking-[0.3em] shadow-2xl rounded-2xl bg-indigo-600 ring-4 ring-indigo-500/10 active:scale-95"
                    >
                        Initiate FeedBack
                    </Button>
                </div>
                {error && <p className="text-rose-500 text-[10px] text-center font-black uppercase tracking-widest mt-6">{error}</p>}
            </div>

            {(isLoading || analysis) && (
                <div className="mt-16 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="tilt-card glass-panel p-10 md:p-14 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/40">
                        <div className="flex items-center gap-5 mb-10 border-b border-slate-100 dark:border-slate-800 pb-8">
                            <div className="h-14 w-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl tilt-card">
                                <Icon name="analyzer" className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Audit Report</h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Intelligence Stream</span>
                            </div>
                        </div>
                        
                        {isLoading && !analysis ? (
                            <div className="flex items-center justify-center py-20 flex-col gap-8">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full border-4 border-indigo-600/10 border-t-indigo-600 animate-spin"></div>
                                    <Icon name="analyzer" className="absolute inset-0 m-auto h-10 w-10 text-indigo-600 animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-slate-900 dark:text-white font-black uppercase tracking-[0.3em] text-xs">Processing Document Layers</p>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Running Structural Linguistics & STAR Check</p>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <div className="text-slate-700 dark:text-slate-200 leading-loose space-y-6 font-semibold text-base">
                                    <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                                    {isLoading && <span className="inline-block w-3 h-6 ml-3 bg-indigo-500 animate-pulse align-middle rounded-sm shadow-lg shadow-indigo-500/50" />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(240px); opacity: 0; }
                }
            `}} />
        </div>
    );
};

export default ResumeAnalyzer;
