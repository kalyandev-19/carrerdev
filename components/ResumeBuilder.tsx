
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ResumeData, User } from '../types';
import Button from './common/Button.tsx';
import Input from './common/Input.tsx';
import Textarea from './common/Textarea.tsx';
import { generateResumeSectionStream } from '../services/geminiService.ts';
import { databaseService } from '../services/databaseService.ts';
import Icon from './common/Icon.tsx';

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

    // 3D Tilt Values
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleExport = () => {
        // Change title temporarily so the PDF file has a professional name
        const originalTitle = document.title;
        const fileName = `${resume.fullName.replace(/\s+/g, '_')}_Resume`;
        document.title = fileName;
        
        window.print();
        
        // Restore original title after print dialog closes
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    useEffect(() => {
        const loadResume = async () => {
          const savedResume = await databaseService.getResume(user.id);
          if (savedResume) setResume(savedResume);
        };
        loadResume();
    }, [user.id]);

    useEffect(() => {
        const handleResize = () => {
            if (previewContainerRef.current) {
                const containerWidth = previewContainerRef.current.offsetWidth;
                const a4Width = 794;
                const padding = 64;
                const newScale = (containerWidth - padding) / a4Width;
                setPreviewScale(Math.min(newScale, 1.0));
            }
        };
        window.addEventListener('resize', handleResize);
        const timer = setTimeout(handleResize, 100);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [activeTab]);

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
            prompt = `Write a professional summary for a student's resume. Name: ${resume.fullName}. Key skills: ${resume.skills}. Focus on industry value.`;
            setLoadingSection('summary');
        } else if (section === 'responsibilities' && typeof index === 'number') {
            const exp = resume.experience[index];
            prompt = `Write 3 STAR method bullet points for ${exp.role} at ${exp.company}. High impact.`;
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
        } catch (error) { console.error(error); } finally { setLoadingSection(null); }
    }, [resume]);

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Resume Studio</h2>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">3D Precision Workspace</p>
                </motion.div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleExport} className="h-12 px-8 btn-3d bg-indigo-600 rounded-2xl flex items-center gap-3 active:scale-95">
                        <Icon name="resume" className="h-5 w-5" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    {/* Contact Info */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="tilt-card glass-panel p-8 rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/40 space-y-6"
                    >
                        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="bg-indigo-600/10 p-3 rounded-2xl">
                                <Icon name="logo" className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Identity Profile</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="FULL NAME" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                            <Input label="EMAIL" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                            <Input label="PHONE" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} />
                            <Input label="LINKEDIN" value={resume.linkedin} onChange={e => handleChange('linkedin', e.target.value)} />
                            <Input label="SKILLS" value={resume.skills} onChange={e => handleChange('skills', e.target.value)} placeholder="E.G. REACT, TYPESCRIPT" />
                        </div>
                    </motion.section>

                    {/* Summary */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="tilt-card glass-panel p-8 rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/40 space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Professional Bio</h3>
                            <Button onClick={() => handleGenerateAI('summary')} isLoading={loadingSection === 'summary'} className="h-8 px-4 text-[9px] bg-slate-100 dark:bg-slate-700 !text-indigo-600">AI Optimize</Button>
                        </div>
                        <Textarea rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} />
                    </motion.section>

                    {/* Experience */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="tilt-card glass-panel p-8 rounded-[40px] shadow-3d border-t-2 border-l-2 border-white/40 space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Experience Blocks</h3>
                            <button onClick={() => addEntry('experience')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">+ Add Block</button>
                        </div>
                        <div className="space-y-6">
                            {resume.experience.map((exp, idx) => (
                                <div key={exp.id} className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 relative shadow-inner-soft">
                                    <button onClick={() => removeEntry('experience', idx)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500"><Icon name="sun" className="h-4 w-4 rotate-45" /></button>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <Input label="COMPANY" value={exp.company} onChange={e => handleNestedChange('experience', idx, 'company', e.target.value)} />
                                        <Input label="ROLE" value={exp.role} onChange={e => handleNestedChange('experience', idx, 'role', e.target.value)} />
                                    </div>
                                    <Textarea rows={3} label="RESPONSIBILITIES" value={exp.responsibilities} onChange={e => handleNestedChange('experience', idx, 'responsibilities', e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </motion.section>
                </div>

                <div className="sticky top-24 hidden lg:block">
                    <motion.div 
                        ref={previewContainerRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                        className="glass-panel p-8 rounded-[50px] shadow-3d border-t-2 border-l-2 border-white/40 overflow-hidden flex flex-col items-center cursor-default h-[calc(100vh-14rem)]"
                    >
                        <div className="w-full overflow-y-auto custom-scrollbar flex justify-center py-8">
                            <motion.div 
                                id="resume-export-area"
                                style={{ 
                                    width: '794px', 
                                    minHeight: '1123px', 
                                    padding: '64px', 
                                    scale: previewScale,
                                    transformOrigin: 'top center',
                                    translateZ: "50px"
                                }}
                                className="bg-white text-slate-900 shadow-2xl shadow-black/20"
                            >
                                <header className="text-center mb-10">
                                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase mb-4">{resume.fullName || 'YOUR IDENTITY'}</h1>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">{resume.email} {resume.phone ? `| ${resume.phone}` : ''}</p>
                                    {resume.linkedin && <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-2">{resume.linkedin}</p>}
                                </header>
                                <div className="space-y-8">
                                    {resume.summary && (
                                        <section>
                                            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Summary</h2>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{resume.summary}</p>
                                        </section>
                                    )}
                                    {resume.experience.length > 0 && (
                                        <section>
                                            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Experience</h2>
                                            {resume.experience.map(exp => (
                                                <div key={exp.id} className="mb-6">
                                                    <div className="flex justify-between items-baseline">
                                                        <h4 className="font-bold text-slate-900">{exp.role}</h4>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exp.startDate} - {exp.endDate || 'Present'}</span>
                                                    </div>
                                                    <p className="text-[12px] font-black text-indigo-600 uppercase tracking-tighter mb-2">{exp.company}</p>
                                                    <p className="text-[13px] text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{exp.responsibilities}</p>
                                                </div>
                                            ))}
                                        </section>
                                    )}
                                    {resume.skills && (
                                        <section>
                                            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Skills & Tech</h2>
                                            <p className="text-[13px] font-medium text-slate-700">{resume.skills}</p>
                                        </section>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
