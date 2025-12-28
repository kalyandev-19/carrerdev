
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
        try {
            await databaseService.saveResume(resume);
            setSaveStatus('saved');
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('dirty');
        }
    };

    const handleDownload = () => {
        handleSave();
        window.print();
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
            prompt = `Write a professional summary for a student's resume. Name: ${resume.fullName}. Key skills: ${resume.skills}. Seek internship. Focus on value proposition.`;
            setLoadingSection('summary');
        } else if (section === 'responsibilities' && typeof index === 'number') {
            const exp = resume.experience[index];
            prompt = `Write 3 impactful resume bullets for ${exp.role} at ${exp.company}. Use STAR method and metrics.`;
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
        <div id="resume-printable-area" className="bg-white text-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] mx-auto flex flex-col transition-all duration-500 origin-top resume-paper border border-slate-100"
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
                <p className="text-[14px] leading-relaxed text-slate-700 text-justify font-medium whitespace-pre-wrap">{resume.summary || 'Describe your journey...'}</p>
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
                              <li key={i}>{line.replace(/^[•\-\*]\s*/, '').trim()}</li>
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
        </div>
    );

    return (
        <div className="py-8">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; }
                    #resume-printable-area, #resume-printable-area * { visibility: visible; }
                    #resume-printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 40px !important;
                        transform: scale(1) !important;
                        box-shadow: none !important;
                    }
                    @page { size: A4; margin: 0; }
                }
            `}} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div className="animate-in slide-in-from-left-4 duration-500">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Resume Editor</h2>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">3D Spatial Workspace</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto animate-in slide-in-from-right-4 duration-500">
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl lg:hidden flex-grow md:flex-grow-0">
                        <button onClick={() => setActiveTab('edit')} className={`flex-1 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-3d' : 'text-slate-500'}`}>Edit</button>
                        <button onClick={() => setActiveTab('preview')} className={`flex-1 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-3d' : 'text-slate-500'}`}>Preview</button>
                    </div>
                    <Button onClick={handleDownload} className="h-12 px-8 btn-3d bg-indigo-600 hover:bg-indigo-500 rounded-2xl flex items-center gap-3 active:scale-95">
                        <Icon name="logo" className="h-5 w-5" />
                        Download
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className={`space-y-8 h-fit ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    {/* Contact Info */}
                    <section className="tilt-card glass-panel p-8 rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/40 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="bg-indigo-600/10 p-3 rounded-2xl">
                                <Icon name="logo" className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Personal Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="FULL NAME" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} className="!rounded-2xl !py-4 shadow-inner-soft" />
                            <Input label="EMAIL ADDRESS" type="email" value={resume.email} onChange={e => handleChange('email', e.target.value)} className="!rounded-2xl !py-4 shadow-inner-soft" />
                            <Input label="PHONE NUMBER" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} className="!rounded-2xl !py-4 shadow-inner-soft" />
                            <Input label="LINKEDIN PROFILE" value={resume.linkedin} onChange={e => handleChange('linkedin', e.target.value)} className="!rounded-2xl !py-4 shadow-inner-soft" />
                            <Input label="GITHUB REPO" value={resume.github} onChange={e => handleChange('github', e.target.value)} className="!rounded-2xl !py-4 shadow-inner-soft" />
                            <Input label="TECHNICAL SKILLS" value={resume.skills} onChange={e => handleChange('skills', e.target.value)} placeholder="REACT, PYTHON..." className="!rounded-2xl !py-4 shadow-inner-soft" />
                        </div>
                    </section>

                    {/* Summary */}
                    <section className="tilt-card glass-panel p-8 rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-sky-600/10 p-3 rounded-2xl">
                                    <Icon name="analyzer" className="h-6 w-6 text-sky-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Professional Bio</h3>
                            </div>
                            <Button onClick={() => handleGenerateAI('summary')} isLoading={loadingSection === 'summary'} className="bg-white dark:bg-slate-700 !text-indigo-600 dark:!text-indigo-400 h-10 px-6 rounded-xl font-black text-[10px] tracking-widest border border-slate-200 dark:border-slate-600 shadow-sm">AI ASSIST</Button>
                        </div>
                        <Textarea rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} className="!rounded-2xl !py-4 shadow-inner-soft" />
                    </section>

                    {/* Experience Section */}
                    <section className="tilt-card glass-panel p-8 rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-600/10 p-3 rounded-2xl">
                                    <Icon name="roadmap" className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Experience</h3>
                            </div>
                            <button onClick={() => addEntry('experience')} className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700">+ New Job</button>
                        </div>
                        <div className="space-y-8">
                            {resume.experience.map((exp, idx) => (
                                <div key={exp.id} className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 relative shadow-inner-soft animate-in zoom-in-95 duration-300">
                                    <button onClick={() => removeEntry('experience', idx)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"><Icon name="sun" className="h-5 w-5 rotate-45" /></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <Input label="COMPANY" value={exp.company} onChange={e => handleNestedChange('experience', idx, 'company', e.target.value)} className="!rounded-xl" />
                                        <Input label="ROLE" value={exp.role} onChange={e => handleNestedChange('experience', idx, 'role', e.target.value)} className="!rounded-xl" />
                                        <Input label="START" value={exp.startDate} onChange={e => handleNestedChange('experience', idx, 'startDate', e.target.value)} className="!rounded-xl" />
                                        <Input label="END" value={exp.endDate} onChange={e => handleNestedChange('experience', idx, 'endDate', e.target.value)} className="!rounded-xl" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Key Accomplishments</label>
                                            <Button onClick={() => handleGenerateAI('responsibilities', '', idx)} isLoading={loadingSection === `responsibilities-${idx}`} className="h-8 text-[9px] px-4 bg-indigo-50 text-indigo-600 border-none">Optimize with AI</Button>
                                        </div>
                                        <Textarea rows={3} value={exp.responsibilities} onChange={e => handleNestedChange('experience', idx, 'responsibilities', e.target.value)} className="!rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div ref={previewContainerRef} className={`sticky top-24 ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
                    <div className="glass-panel p-8 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/40 overflow-hidden flex flex-col items-center">
                        <div className="w-full h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar flex flex-col items-center pt-8 pb-32">
                            <ResumePreviewContent />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
