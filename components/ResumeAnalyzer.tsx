
import React, { useState, useCallback } from 'react';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import { analyzeResume } from '../services/geminiService';

const ResumeAnalyzer: React.FC = () => {
    const [resumeText, setResumeText] = useState<string>('');
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setResumeText(text);
            };
            reader.readAsText(file);
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!resumeText.trim()) {
            setError('Please paste or upload your resume text first.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAnalysis('');

        const result = await analyzeResume(resumeText);
        setAnalysis(result);
        setIsLoading(false);
    }, [resumeText]);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white">Resume Analyzer</h2>
                <p className="mt-2 text-slate-400">Get instant, AI-powered feedback on your resume.</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <Textarea
                    label="Paste your resume text here"
                    rows={15}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste the full text of your resume here for analysis..."
                />
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <label className="text-sm text-slate-400">
                        Or upload a .txt file:
                        <input type="file" accept=".txt" onChange={handleFileChange} className="ml-2 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </label>
                    <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!resumeText.trim()}>
                        Analyze Resume
                    </Button>
                </div>
                {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            </div>

            {(isLoading || analysis) && (
                <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-2xl font-bold text-sky-400 mb-4">Analysis Results</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Spinner />
                            <span className="ml-2">Analyzing your resume...</span>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-sky-400" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default ResumeAnalyzer;
