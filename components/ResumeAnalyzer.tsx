
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
                // FileReader result for readAsDataURL starts with "data:mime/type;base64,"
                const base64Data = result.split(',')[1];
                setSelectedFile({
                    data: base64Data,
                    mimeType: file.type || 'application/octet-stream',
                    name: file.name
                });
                setResumeText(''); // Clear text when file is selected
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
            setError('Failed to analyze resume. The file might be too large or an unsupported format.');
        } finally {
            setIsLoading(false);
        }
    }, [resumeText, selectedFile]);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Resume Analyzer</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Upload your resume in any format for AI-powered feedback.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl transition-all">
                {!selectedFile ? (
                    <div className="space-y-6">
                        <Textarea
                            label="Option 1: Paste resume text"
                            rows={8}
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your resume content here..."
                            className="text-sm"
                        />
                        
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Or</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Option 2: Upload Document</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Icon name="resume" className="w-8 h-8 mb-3 text-slate-400" />
                                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="font-bold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-400 uppercase font-black tracking-tighter">PDF, Word, Images, or TXT</p>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" />
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg">
                            <Icon name="resume" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black mt-1">Ready for scanning</p>
                        </div>
                        <button 
                            onClick={clearFile}
                            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                            <Icon name="sun" className="h-3 w-3 rotate-45" /> Clear and start over
                        </button>
                    </div>
                )}

                <div className="mt-8 flex justify-center">
                    <Button 
                        onClick={handleAnalyze} 
                        isLoading={isLoading} 
                        disabled={!resumeText.trim() && !selectedFile} 
                        className="w-full md:w-auto px-12 py-3 text-base font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                    >
                        Deep Scan Resume
                    </Button>
                </div>
                {error && <p className="text-red-500 dark:text-red-400 mt-4 text-sm text-center font-bold">{error}</p>}
            </div>

            {(isLoading || analysis) && (
                <div className="mt-12 bg-white dark:bg-slate-800 p-6 md:p-10 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <Icon name="analyzer" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Diagnostic Results</h3>
                    </div>
                    
                    {isLoading && !analysis ? (
                        <div className="flex items-center justify-center py-16 flex-col gap-6">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
                                <Icon name="analyzer" className="absolute inset-0 m-auto h-8 w-8 text-indigo-600 animate-pulse" />
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Running document OCR & structural analysis...</span>
                        </div>
                    ) : (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                             <div 
                                className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
                                dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} 
                             />
                             {isLoading && <span className="inline-block w-2 h-5 ml-2 bg-indigo-500 animate-pulse align-middle" />}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResumeAnalyzer;
