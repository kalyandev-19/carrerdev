
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { askIndustryExpert } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    text: string;
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
    }, [conversation]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: question };
        setConversation(prev => [...prev, userMessage]);
        setIsLoading(true);
        setQuestion('');

        const responseText = await askIndustryExpert(field, question);
        const modelMessage: Message = { role: 'model', text: responseText };

        setConversation(prev => [...prev, modelMessage]);
        setIsLoading(false);
    }, [question, isLoading, field]);

    return (
        <div className="max-w-4xl mx-auto py-8 flex flex-col h-[calc(100vh-8rem)]">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white">Industry Q&A</h2>
                <p className="mt-2 text-slate-400">Select an industry and ask your career questions.</p>
            </div>
            
            <div className="mb-4 flex justify-center">
                <select 
                    value={field} 
                    onChange={(e) => setField(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {industryFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            <div className="flex-grow bg-slate-800 rounded-lg p-4 overflow-y-auto mb-4 border border-slate-700">
                {conversation.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <p>Ask a question to start the conversation.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <div className="prose prose-invert prose-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg px-4 py-3 rounded-lg bg-slate-700 text-slate-200 flex items-center">
                                <Spinner />
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={conversationEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., How do I prepare for technical interviews?"
                    className="flex-grow bg-slate-700 border border-slate-600 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                />
                <Button type="submit" isLoading={isLoading} disabled={!question.trim()}>
                    <Icon name="send" className="h-5 w-5"/>
                </Button>
            </form>
        </div>
    );
};

export default IndustryQA;
