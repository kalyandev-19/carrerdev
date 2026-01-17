
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';
import Icon from './common/Icon.tsx';
import { askIndustryExpertStream } from '../services/geminiService.ts';
import { GroundingSource } from '../types.ts';

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
        const currentQuestion = question;
        setQuestion('');

        try {
            const stream = askIndustryExpertStream(field, currentQuestion);
            let fullText = "";
            let finalSources: GroundingSource[] = [];

            const modelMessage: Message = { 
                role: 'model', 
                text: "", 
                isStreaming: true 
            };
            setConversation(prev => [...prev, modelMessage]);

            for await (const chunk of stream) {
                if (!chunk) continue;
                fullText += (chunk.text || "");
                
                const metadata = chunk.candidates?.[0]?.groundingMetadata;
                if (metadata?.groundingChunks) {
                    finalSources = metadata.groundingChunks
                        .map((c: any) => ({ 
                            title: c.web?.title || 'Reference Link', 
                            uri: c.web?.uri || '' 
                        }))
                        .filter((s: any) => s.uri);
                }

                setConversation(prev => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0) {
                        next[lastIdx] = { ...next[lastIdx], text: fullText, sources: finalSources };
                    }
                    return next;
                });
            }

            setConversation(prev => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (lastIdx >= 0) {
                    next[lastIdx] = { ...next[lastIdx], isStreaming: false };
                }
                return next;
            });
        } catch (error: any) {
            console.error(error);
            const errorMsg = error?.message || "Something went wrong. Please try again.";
            setConversation(prev => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (lastIdx >= 0 && next[lastIdx].role === 'model') {
                    next[lastIdx] = { ...next[lastIdx], text: errorMsg, isStreaming: false, isError: true };
                } else {
                    next.push({ role: 'model', text: errorMsg, isError: true });
                }
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    }, [field, question, isLoading]);

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-2 md:px-4">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 md:mb-8"
            >
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 px-2">Industry Expert Advice</h2>
                <div className="flex flex-wrap gap-2 px-2">
                    {industryFields.map((f, i) => (
                        <motion.button
                            key={f}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setField(f)}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                                field === f 
                                ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            {f}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel min-h-[500px] md:h-[600px] rounded-[30px] md:rounded-[40px] flex flex-col shadow-3d overflow-hidden border border-white/5"
            >
                <div className="flex-grow p-4 md:p-8 overflow-y-auto space-y-5 md:space-y-6 custom-scrollbar">
                    {conversation.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-20">
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Icon name="qa" className="h-12 w-12 md:h-16 md:w-16 mb-4 text-slate-400" />
                            </motion.div>
                            <p className="font-bold uppercase tracking-widest text-[10px] md:text-sm">Ask your first question about {field}</p>
                        </div>
                    )}
                    <AnimatePresence>
                      {conversation.map((msg, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                              <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-3d transition-all duration-300 ${
                                  msg.role === 'user' 
                                  ? 'bg-indigo-600 text-white rounded-br-none' 
                                  : msg.isError 
                                      ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800'
                                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-white/10'
                              }`}>
                                  <div className="prose prose-xs md:prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                                      <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                                      {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse rounded-full" />}
                                  </div>
                                  
                                  {msg.sources && msg.sources.length > 0 && (
                                      <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700"
                                      >
                                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Sources:</p>
                                          <div className="flex flex-wrap gap-1.5">
                                              {msg.sources.map((s, i) => (
                                                  <motion.a 
                                                    key={i} 
                                                    whileHover={{ scale: 1.05 }}
                                                    href={s.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-[9px] bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-full text-indigo-500 hover:text-indigo-600 font-bold transition-colors border border-indigo-100 dark:border-indigo-900/30 truncate max-w-[150px]"
                                                  >
                                                      {s.title}
                                                  </motion.a>
                                              ))}
                                          </div>
                                      </motion.div>
                                  )}
                              </div>
                          </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={conversationEndRef} />
                </div>

                <div className="p-4 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={`Type your question about ${field}...`}
                            className="flex-grow bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold shadow-inner-soft focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !question.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 shrink-0"
                        >
                            {isLoading ? <Spinner /> : <Icon name="send" className="h-5 w-5 md:h-6 md:w-6" />}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default IndustryQA;
