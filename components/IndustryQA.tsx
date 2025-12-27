
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
}

const IndustryQA: React.FC = () => {
    const [field, setField] = useState<string>('Software Engineering');
    const [question, setQuestion] = useState<string>('');
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const conversationEndRef = useRef<HTMLDivElement | null>(null);

    const industryFields = ['Software Engineering', 'Data Science', 'Product Management', 'UX/UI Design', 'Marketing', 'Finance'];

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
                        .map((c: any) => ({ title: c.web?.title || 'Source', uri: c.web?.uri || '' }))
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
        } catch (error) {
            console.error(error);
            setConversation(prev => [...prev, { role: 'model', text: "Sorry, I hit a snag while looking that up. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }, [question, isLoading, field]);

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 flex flex-col min-h-[500px] h-[calc(100vh-10rem)] mb-8">
            <div className="text-center mb-4 md:mb-6 px-2 flex-shrink-0">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Industry Q&A</h2>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">Live insights grounded by Google Search.</p>
            </div>
            
            <div className="mb-4 flex justify-center px-2 flex-shrink-0">
                <div className="relative w-full max-w-xs">
                    <select 
                        value={field} 
                        onChange={(e) => setField(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm dark:shadow-lg"
                    >
                        {industryFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <div className="flex-grow bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-3 md:p-6 overflow-y-auto mb-4 border border-slate-200 dark:border-slate-700/50 shadow-inner custom-scrollbar transition-colors">
                {conversation.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400 dark:text-slate-500 space-y-4 px-6 text-center">
                        <div className="p-4 bg-white dark:bg-slate-700/30 rounded-full shadow-sm">
                            <Icon name="qa" className="h-10 w-10 md:h-12 md:w-12 opacity-30 text-indigo-400" />
                        </div>
                        <p className="text-sm md:text-base max-w-xs">Start a conversation with an expert in <span className="text-indigo-600 dark:text-indigo-400 font-bold">{field}</span>.</p>
                    </div>
                )}
                <div className="space-y-4 md:space-y-6">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[92%] md:max-w-[85%] px-4 py-3 rounded-2xl shadow-md ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600/50'
                            }`}>
                                <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert text-slate-800 dark:text-slate-100'}`} style={{whiteSpace: 'pre-wrap'}}>
                                    {msg.text}
                                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-sky-500 animate-pulse align-middle" />}
                                </div>
                                {msg.sources && msg.sources.length > 0 && (
                                  <div className={`mt-3 pt-3 border-t ${msg.role === 'user' ? 'border-white/20' : 'border-slate-200 dark:border-slate-600/50'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${msg.role === 'user' ? 'text-white/70' : 'text-sky-600 dark:text-sky-400'}`}>Verified Sources:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {msg.sources.map((source, sIdx) => (
                                        <a 
                                          key={sIdx} 
                                          href={source.uri} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all inline-flex items-center gap-1 max-w-[140px] truncate ${
                                            msg.role === 'user'
                                            ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-sky-600 dark:text-sky-300 border-sky-100 dark:border-sky-900/50 hover:bg-slate-100 dark:hover:bg-slate-900'
                                          }`}
                                          title={source.title}
                                        >
                                          <Icon name="search" className="h-2.5 w-2.5 flex-shrink-0" />
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

            <form onSubmit={handleSubmit} className="relative flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 md:p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-lg mx-2 md:mx-0 flex-shrink-0">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={`Ask about ${field}...`}
                    className="flex-grow bg-transparent border-none rounded-xl px-4 py-2.5 text-sm md:text-base text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    disabled={isLoading}
                />
                <Button 
                    type="submit" 
                    isLoading={isLoading} 
                    disabled={!question.trim()} 
                    className="rounded-xl px-4 md:px-6 h-10 md:h-11 flex-shrink-0"
                >
                    <Icon name="send" className="h-5 w-5"/>
                </Button>
            </form>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.2);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(71, 85, 105, 0.5);
                }
            `}} />
        </div>
    );
};

export default IndustryQA;
