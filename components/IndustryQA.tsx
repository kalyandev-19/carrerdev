
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { askIndustryExpertStream } from '../services/geminiService';
import { GroundingSource } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
    sources?: GroundingSource[];
    isStreaming?: boolean;
    isError?: boolean;
}

const IndustryQA: React.FC = () => {
    const [field, setField] = useState<string>('Software Engineering');
    const [question, setQuestion] = useState<string>('');
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const conversationEndRef = useRef<HTMLDivElement | null>(null);

    const industryFields = [
        'Internships & Jobs', 
        'Software Engineering', 
        'Data Science', 
        'Product Management', 
        'UX/UI Design', 
        'Marketing', 
        'Finance'
    ];

    const scrollToBottom = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [conversation, isLoading]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: question };
        setConversation(prev => [...prev, userMessage]);
        setIsLoading(true);
        setQuestion('');

        try {
            const stream = askIndustryExpertStream(field, userMessage.text);
            let fullText = "";
            let finalSources: GroundingSource[] = [];

            const modelMessage: Message = { 
                role: 'model', 
                text: "", 
                isStreaming: true 
            };
            setConversation(prev => [...prev, modelMessage]);

            for await (const chunk of stream) {
                fullText += (chunk.text || "");
                const metadata = chunk.candidates?.[0]?.groundingMetadata;
                if (metadata?.groundingChunks) {
                    finalSources = metadata.groundingChunks
                        .map((c: any) => ({ title: c.web?.title || 'External Intel', uri: c.web?.uri || '' }))
                        .filter((s: any) => s.uri);
                }

                setConversation(prev => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    next[lastIdx] = { ...next[lastIdx], text: fullText, sources: finalSources };
                    return next;
                });
            }

            setConversation(prev => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                next[lastIdx] = { ...next[lastIdx], isStreaming: false };
                return next;
            });
        } catch (error: any) {
            console.error(error);
            const errorMsg = error?.message || "Connection interrupted. Terminal retry advised.";
            setConversation(prev => {
                const next = [...prev];
                if (next[next.length - 1]?.role === 'model') {
                    next[next.length - 1] = { role: 'model', text: errorMsg, isError: true };
                    return next;
                }
                return [...prev, { role: 'model', text: errorMsg, isError: true }];
            });
        } finally {
            setIsLoading(false);
        }
    }, [question, isLoading, field]);

    return (
        <div className="max-w-5xl mx-auto py-6 md:py-10 flex flex-col h-[calc(100vh-10rem)] mb-8">
            <div className="text-center mb-8 px-4 flex-shrink-0">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Expert Insights</h2>
                <p className="mt-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">Google Search Grounded Intelligence</p>
            </div>
            
            <div className="mb-8 flex justify-center px-4 flex-shrink-0">
                <div className="relative w-full max-w-sm tilt-card">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Icon name="search" className="h-4 w-4 text-indigo-500" />
                    </div>
                    <select 
                        value={field} 
                        onChange={(e) => setField(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer shadow-3d"
                    >
                        {industryFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <div className="flex-grow glass-panel rounded-[40px] p-6 md:p-10 overflow-y-auto mb-6 border-t-2 border-l-2 border-white/40 shadow-3d custom-scrollbar relative mx-4">
                {conversation.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-6">
                        <div className="p-8 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-[40px] shadow-inner-soft tilt-card">
                            <Icon name="qa" className="h-16 w-16 text-indigo-600 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Channel Open</p>
                            <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">Query the industry mainframe about <span className="text-indigo-600 dark:text-indigo-400">{field}</span>.</p>
                        </div>
                    </div>
                )}
                <div className="space-y-8">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            <div className={`max-w-[85%] px-8 py-5 rounded-[30px] shadow-3d ${
                                msg.isError 
                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200' 
                                : msg.role === 'user' 
                                  ? 'bg-indigo-600 text-white rounded-tr-none border-white/20' 
                                  : 'glass-panel text-slate-900 dark:text-white rounded-tl-none border-white/40'
                            }`}>
                                <div className="prose prose-sm max-w-none break-words font-semibold leading-relaxed" style={{whiteSpace: 'pre-wrap'}}>
                                    {msg.text}
                                    {msg.isStreaming && <span className="inline-block w-2 h-5 ml-2 bg-indigo-400 animate-pulse align-middle rounded-sm" />}
                                </div>
                                {msg.sources && msg.sources.length > 0 && (
                                  <div className={`mt-6 pt-5 border-t ${msg.role === 'user' ? 'border-white/20' : 'border-slate-100 dark:border-slate-800'}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${msg.role === 'user' ? 'text-white/60' : 'text-indigo-600 dark:text-indigo-400'}`}>Verified Intel Sources:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.sources.map((source, sIdx) => (
                                        <a 
                                          key={sIdx} 
                                          href={source.uri} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all inline-flex items-center gap-2 max-w-[180px] truncate ${
                                            msg.role === 'user'
                                            ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:shadow-lg'
                                          }`}
                                        >
                                          <Icon name="search" className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">{source.title}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={conversationEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="relative flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-[35px] shadow-3d border-2 border-slate-100 dark:border-slate-800 focus-within:border-indigo-500 transition-all mx-4 flex-shrink-0">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={`Query Terminal: ${field}...`}
                    className="flex-grow bg-transparent border-none rounded-2xl px-6 py-4 text-base font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!question.trim() || isLoading} 
                    className="bg-indigo-600 hover:bg-indigo-500 p-5 rounded-[25px] btn-3d shadow-xl transition-all disabled:opacity-50"
                >
                    <Icon name="send" className="h-6 w-6 text-white"/>
                </button>
            </form>
        </div>
    );
};

export default IndustryQA;
