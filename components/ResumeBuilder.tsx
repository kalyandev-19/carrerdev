
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
        // Ensure data is saved before download
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
        <div id="resume-printable-area" className="bg-white text-slate-900 shadow-2xl mx-auto flex flex-col transition-all duration-500 origin-top resume-paper"
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
                {resume.experience.length === 0 && <p className="text-slate-400 text-sm italic">No experience added yet...</p>}
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
                {resume.education.length === 0 && <p className="text-slate-400 text-sm italic">No education added yet...</p>}
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
                    {resume.skills ? resume.skills.split(',').filter(s => s.trim()).map((skill, i) => (
                      <span key={i} className="text-[11px] border border-slate-200 px-4 py-1.5 rounded-lg font-bold bg-slate-50 text-slate-700 uppercase tracking-tighter">{skill.trim()}</span>
                    )) : <p className="text-slate-400 text-sm italic">No skills added...</p>}
                </div>
            </section>
        </div>
    );

    return (
        <div className="py-8">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #resume-printable-area, #resume-printable-area * {
                        visibility: visible;
                    }
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
                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
            `}} />
            
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
                    
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="hidden sm:flex items-center px-2 mr-2 border-r border-slate-200 dark:border-slate-700">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${saveStatus === 'saved' ? 'text-green-500' : saveStatus === 'saving' ? 'text-sky-400 animate-pulse' : 'text-orange-400'}`}>
                            {saveStatus === 'saved' ? 'Synced' : saveStatus === 'saving' ? 'Saving...' : 'Draft'}
                          </span>
                        </div>
                        <Button onClick={handleSave} disabled={saveStatus === 'saved'} className="h-9 bg-slate-100 !text-slate-700 hover:bg-slate-200 border-none shadow-none">
                            Save
                        </Button>
                        <Button onClick={handleDownload} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                            <Icon name="logo" className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className={`space-y-8 h-fit ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    {/* Contact Info */}
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <Icon name="logo" className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Info</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Full Name" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                            <Input label="Email" type="email" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                            <Input label="Phone" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} />
                            <Input label="LinkedIn URL" value={resume.linkedin} onChange={e => handleChange('linkedin', e.target.value)} />
                            <Input label="GitHub URL" value={resume.github} onChange={e => handleChange('github', e.target.value)} />
                            <Input label="Skills (comma separated)" value={resume.skills} onChange={e => handleChange('skills', e.target.value)} placeholder="React, TypeScript, Figma..." />
                        </div>
                    </section>

                    {/* Summary */}
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div className="flex items-center gap-3">
                                <Icon name="analyzer" className="h-5 w-5 text-sky-600" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Summary</h3>
                            </div>
                            <Button onClick={() => handleGenerateAI('summary')} isLoading={loadingSection === 'summary'} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 h-8 text-xs font-bold">AI Write</Button>
                        </div>
                        <Textarea rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} placeholder="Goals and high-level summary..." />
                    </section>

                    {/* Experience Section */}
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div className="flex items-center gap-3">
                                <Icon name="roadmap" className="h-5 w-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Work Experience</h3>
                            </div>
                            <button onClick={() => addEntry('experience')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">+ Add Job</button>
                        </div>
                        <div className="space-y-6">
                            {resume.experience.map((exp, idx) => (
                                <div key={exp.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 relative">
                                    <button onClick={() => removeEntry('experience', idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Icon name="sun" className="h-4 w-4 rotate-45" /></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Input label="Company" value={exp.company} onChange={e => handleNestedChange('experience', idx, 'company', e.target.value)} />
                                        <Input label="Role" value={exp.role} onChange={e => handleNestedChange('experience', idx, 'role', e.target.value)} />
                                        <Input label="Start Date" value={exp.startDate} onChange={e => handleNestedChange('experience', idx, 'startDate', e.target.value)} placeholder="Month Year" />
                                        <Input label="End Date" value={exp.endDate} onChange={e => handleNestedChange('experience', idx, 'endDate', e.target.value)} placeholder="Present / Month Year" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Responsibilities (STAR Method)</label>
                                            <Button onClick={() => handleGenerateAI('responsibilities', '', idx)} isLoading={loadingSection === `responsibilities-${idx}`} className="h-7 text-[10px] px-2 bg-indigo-50 text-indigo-600">AI Optimize</Button>
                                        </div>
                                        <Textarea rows={3} value={exp.responsibilities} onChange={e => handleNestedChange('experience', idx, 'responsibilities', e.target.value)} placeholder="Describe what you did..." />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Education Section */}
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div className="flex items-center gap-3">
                                <Icon name="education" className="h-5 w-5 text-amber-600" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Education</h3>
                            </div>
                            <button onClick={() => addEntry('education')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">+ Add School</button>
                        </div>
                        <div className="space-y-6">
                            {resume.education.map((edu, idx) => (
                                <div key={edu.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 relative">
                                    <button onClick={() => removeEntry('education', idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Icon name="sun" className="h-4 w-4 rotate-45" /></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="School / University" value={edu.school} onChange={e => handleNestedChange('education', idx, 'school', e.target.value)} />
                                        <Input label="Degree / Certificate" value={edu.degree} onChange={e => handleNestedChange('education', idx, 'degree', e.target.value)} />
                                        <Input label="Start Date" value={edu.startDate} onChange={e => handleNestedChange('education', idx, 'startDate', e.target.value)} />
                                        <Input label="End Date" value={edu.endDate} onChange={e => handleNestedChange('education', idx, 'endDate', e.target.value)} />
                                        <Input label="GPA (Optional)" value={edu.gpa} onChange={e => handleNestedChange('education', idx, 'gpa', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div ref={previewContainerRef} className={`sticky top-24 ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
                    <div className="bg-slate-100 dark:bg-slate-950 p-2 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden flex flex-col items-center">
                        <div className="w-full h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar flex flex-col items-center pt-4 pb-20">
                            <ResumePreviewContent />
                        </div>
                    </div>
                    {/* Mobile Only Save Floating Button */}
                    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] flex gap-2">
                        <Button onClick={handleSave} disabled={saveStatus === 'saved'} className="flex-grow shadow-2xl h-12 rounded-2xl">
                          {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
