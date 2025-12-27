
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ResumeData, Experience, Education, User } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import { generateResumeSectionStream } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import Icon from './common/Icon';

interface ResumeBuilderProps {
  user: User;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ user }) => {
    const [resume, setResume] = useState<ResumeData>({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: '',
        linkedin: '',
        github: '',
        summary: '',
        education: [],
        experience: [],
        skills: ''
    });
    const [loadingSection, setLoadingSection] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewScale, setPreviewScale] = useState(1);

    useEffect(() => {
        const loadResume = async () => {
          const savedResume = await databaseService.getResume(user.id);
          if (savedResume) {
              setResume(savedResume);
          }
        };
        loadResume();
    }, [user.id]);

    useEffect(() => {
        const handleResize = () => {
            if (previewContainerRef.current) {
                const containerWidth = previewContainerRef.current.offsetWidth;
                const a4Width = 794;
                const padding = 32;
                const newScale = (containerWidth - padding) / a4Width;
                setPreviewScale(Math.min(newScale, 1.2));
            }
        };

        window.addEventListener('resize', handleResize);
        const timer = setTimeout(handleResize, 100);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [activeTab]);

    const handleSave = async () => {
        setSaveStatus('saving');
        await databaseService.saveResume(resume);
        setSaveStatus('saved');
    };

    const handleChange = <T extends keyof ResumeData,>(field: T, value: ResumeData[T]) => {
        setResume(prev => ({ ...prev, [field]: value }));
        setSaveStatus('dirty');
    };

    const handleNestedChange = <T extends 'education' | 'experience',>(section: T, index: number, field: string, value: string) => {
        const sectionCopy = [...resume[section]] as any[];
        sectionCopy[index][field] = value;
        handleChange(section, sectionCopy as any);
    };

    const addEntry = (section: 'education' | 'experience') => {
        const newEntry = section === 'education'
            ? { id: `edu${Date.now()}`, school: '', degree: '', startDate: '', endDate: '', gpa: '' }
            : { id: `exp${Date.now()}`, company: '', role: '', startDate: '', endDate: '', responsibilities: '' };
        handleChange(section, [...resume[section], newEntry] as any);
    };

    const removeEntry = (section: 'education' | 'experience', index: number) => {
        const sectionCopy = [...resume[section]];
        sectionCopy.splice(index, 1);
        handleChange(section, sectionCopy as any);
    };

    const handleGenerateAI = useCallback(async (section: 'summary' | 'responsibilities', context?: string, index?: number) => {
        let prompt = '';
        if (section === 'summary') {
            prompt = `Write a professional summary for a student's resume. Name: ${resume.fullName}. Key skills: ${resume.skills}. The student is seeking an internship. Focus on value proposition.`;
            setLoadingSection('summary');
        } else if (section === 'responsibilities' && typeof index === 'number') {
            const exp = resume.experience[index];
            prompt = `Write 3 concise, high-impact resume bullet points for the role of ${exp.role} at ${exp.company}. Use the STAR method (Situation, Task, Action, Result). Focus on outcomes and quantifiable metrics.`;
            setLoadingSection(`responsibilities-${index}`);
        }

        if (!prompt) return;

        try {
            const stream = generateResumeSectionStream(prompt);
            let fullText = "";
            for await (const chunk of stream) {
                fullText += chunk;
                if (section === 'summary') {
                    setResume(prev => ({ ...prev, summary: fullText }));
                } else if (section === 'responsibilities' && typeof index === 'number') {
                    setResume(prev => {
                        const nextExp = [...prev.experience];
                        nextExp[index] = { ...nextExp[index], responsibilities: fullText };
                        return { ...prev, experience: nextExp };
                    });
                }
                setSaveStatus('dirty');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSection(null);
        }
    }, [resume]);

    const ResumePreviewContent = () => (
        <div className="bg-white text-slate-900 shadow-2xl mx-auto flex flex-col transition-all duration-500 origin-top"
            style={{ width: '794px', minHeight: '1123px', padding: '64px', transform: `scale(${previewScale})`, marginBottom: `calc((1123px * ${previewScale}) - 1123px)` }}>
            <header className="text-center mb-10">
                <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none mb-4">{resume.fullName || 'YOUR NAME'}</h1>
                <div className="flex flex-wrap justify-center items-center gap-x-4 text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>{resume.email}</span>
                    {resume.phone && <><span className="text-indigo-400">•</span><span>{resume.phone}</span></>}
                    {resume.linkedin && <><span className="text-indigo-400">•</span><span>{resume.linkedin}</span></>}
                    {resume.github && <><span className="text-indigo-400">•</span><span>{resume.github}</span></>}
                </div>
            </header>
            <section className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-[14px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">Professional Profile</h2>
                    <div className="h-[2px] bg-slate-100 flex-grow"></div>
                </div>
                <p className="text-[14px] leading-relaxed text-slate-700 text-justify font-medium">{resume.summary || 'Describe your journey...'}</p>
            </section>
            <section className="mb-10">
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-[14px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">Experience</h2>
                    <div className="h-[2px] bg-slate-100 flex-grow"></div>
                </div>
                {resume.experience.map(exp => (
                    <div key={exp.id} className="relative mb-6">
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="text-[16px] font-bold text-slate-900">{exp.role || 'Job Title'}</h4>
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">{exp.startDate} – {exp.endDate}</span>
                        </div>
                        <div className="text-[13px] font-bold text-indigo-600 mb-3 italic">{exp.company || 'Organization Name'}</div>
                        <ul className="list-disc ml-5 text-[13px] text-slate-700 space-y-2 leading-relaxed">
                            {exp.responsibilities.split('\n').filter(l => l.trim()).map((line, i) => (
                              <li key={i} className="pl-1">{line.replace(/^[•\-\*]\s*/, '').trim()}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
            <section className="mb-10">
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-[14px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">Education</h2>
                    <div className="h-[2px] bg-slate-100 flex-grow"></div>
                </div>
                {resume.education.map(edu => (
                    <div key={edu.id} className="mb-4">
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="text-[15px] font-bold text-slate-900">{edu.school || 'University Name'}</h4>
                            <span className="text-[12px] font-bold text-slate-500">{edu.startDate} – {edu.endDate}</span>
                        </div>
                        <div className="flex justify-between text-[13px] text-slate-600 italic">
                            <span>{edu.degree || 'Field of Study'}</span>
                            {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                    </div>
                ))}
            </section>
            <section className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-[14px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">Expertise</h2>
                    <div className="h-[2px] bg-slate-100 flex-grow"></div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {resume.skills.split(',').filter(s => s.trim()).map((skill, i) => (
                      <span key={i} className="text-[11px] border border-slate-200 px-4 py-1.5 rounded-lg font-bold bg-slate-50 text-slate-700 uppercase tracking-tighter">{skill.trim()}</span>
                    ))}
                </div>
            </section>
        </div>
    );

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Resume Workspace</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time professional document generator</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl lg:hidden flex-grow md:flex-grow-0">
                        <button onClick={() => setActiveTab('edit')} className={`flex-1 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Edit</button>
                        <button onClick={() => setActiveTab('preview')} className={`flex-1 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Preview</button>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 ${saveStatus === 'saved' ? 'text-green-500' : saveStatus === 'saving' ? 'text-sky-400 animate-pulse' : 'text-orange-400'}`}>
                        {saveStatus === 'saved' ? 'Synced' : saveStatus === 'saving' ? 'Saving...' : 'Draft'}
                      </span>
                      <Button onClick={handleSave} disabled={saveStatus === 'saved'} className="h-9">Save</Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className={`space-y-8 h-fit ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <Icon name="logo" className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Info</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Full Name" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                            <Input label="Email" type="email" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                            <Input label="Phone" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} />
                            <Input label="LinkedIn" value={resume.linkedin} onChange={e => handleChange('linkedin', e.target.value)} />
                            <Input label="GitHub" value={resume.github} onChange={e => handleChange('github', e.target.value)} />
                        </div>
                    </section>
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div className="flex items-center gap-3">
                                <Icon name="analyzer" className="h-5 w-5 text-sky-600" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Summary</h3>
                            </div>
                            <Button onClick={() => handleGenerateAI('summary')} isLoading={loadingSection === 'summary'} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 h-8 text-xs font-bold">AI Write</Button>
                        </div>
                        <Textarea rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} placeholder="Goals..." />
                    </section>
                </div>
                <div ref={previewContainerRef} className={`sticky top-24 ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
                    <div className="bg-slate-100 dark:bg-slate-950 p-2 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden flex flex-col items-center">
                        <div className="w-full h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar flex flex-col items-center pt-4 pb-20">
                            <ResumePreviewContent />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
