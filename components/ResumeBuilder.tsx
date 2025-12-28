
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ResumeData, User } from '../types.ts';
import Button from './common/Button.tsx';
import Input from './common/Input.tsx';
import Textarea from './common/Textarea.tsx';
import { generateResumeSectionStream } from '../services/geminiService.ts';
import { databaseService } from '../services/databaseService.ts';
import Icon from './common/Icon.tsx';

interface ResumeBuilderProps {
  user: User;
  resumeId?: string;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ user, resumeId }) => {
    const [resume, setResume] = useState<ResumeData>({
        userId: user.id,
        title: 'New Resume Module',
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
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewScale, setPreviewScale] = useState(1);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(useSpring(y), [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(useSpring(x), [-0.5, 0.5], ["-5deg", "5deg"]);

    useEffect(() => {
        const loadResume = async () => {
          if (resumeId) {
            const savedResume = await databaseService.getResume(resumeId);
            if (savedResume) {
                setResume(savedResume);
                if (savedResume.updatedAt) setLastSaved(new Date(savedResume.updatedAt).toLocaleTimeString());
            }
          }
        };
        loadResume();
    }, [resumeId]);

    const handleChange = <T extends keyof ResumeData,>(field: T, value: ResumeData[T]) => {
        setResume(prev => ({ ...prev, [field]: value }));
        setSaveStatus('dirty');
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        setSaveStatus('saving');
        try {
            const saved = await databaseService.saveResume(resume);
            setResume(prev => ({ ...prev, id: saved.id, updatedAt: saved.updatedAt }));
            setSaveStatus('saved');
            setLastSaved(new Date().toLocaleTimeString());
            return saved;
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        setIsSaving(true);
        try {
            // 1. Save state
            await handleManualSave();

            // 2. Upload to Cloud History (Logic integration)
            if (user.id !== 'guest-user') {
                const printContent = document.getElementById('resume-export-area')?.innerText || "";
                const blob = new Blob([printContent], { type: 'text/plain' });
                const file = new File([blob], `${resume.title.replace(/\s+/g, '_')}.txt`, { type: 'text/plain' });
                await databaseService.uploadAndRecordPDF(file, user.id);
            }

            // 3. Trigger Print
            const originalTitle = document.title;
            document.title = `${resume.fullName.replace(/\s+/g, '_')}_Resume`;
            setTimeout(() => {
                window.print();
                document.title = originalTitle;
            }, 500);
        } catch (e) {
            console.error("Export/Archive failed:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAI = useCallback(async (section: 'summary' | 'responsibilities', index?: number) => {
        let prompt = section === 'summary' 
            ? `Write a professional resume summary for ${resume.fullName}. Skills: ${resume.skills}.`
            : `Write impact bullets for role ${(resume.experience[index!]?.role)} at ${(resume.experience[index!]?.company)}.`;
        
        setLoadingSection(section === 'summary' ? 'summary' : `exp-${index}`);
        try {
            const stream = generateResumeSectionStream(prompt);
            let fullText = "";
            for await (const chunk of stream) {
                fullText += chunk;
                if (section === 'summary') handleChange('summary', fullText);
                else {
                    const nextExp = [...resume.experience];
                    nextExp[index!] = { ...nextExp[index!], responsibilities: fullText };
                    handleChange('experience', nextExp);
                }
            }
        } finally { setLoadingSection(null); }
    }, [resume]);

    const ResumeContent = ({ printMode = false }: { printMode?: boolean }) => (
        <div id={printMode ? "resume-export-area" : undefined} className={`bg-white text-slate-900 p-12 shadow-2xl h-full`}>
            <header className="text-center mb-10">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{resume.fullName || 'YOUR NAME'}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{resume.email} • {resume.phone} • {resume.linkedin}</p>
            </header>
            <section className="mb-8">
                <h2 className="text-xs font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3">Professional Summary</h2>
                <p className="text-sm font-medium leading-relaxed">{resume.summary}</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xs font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3">Experience</h2>
                {resume.experience.map(exp => (
                    <div key={exp.id} className="mb-4">
                        <div className="flex justify-between font-black text-sm"><span>{exp.role}</span><span>{exp.startDate} - {exp.endDate}</span></div>
                        <p className="text-xs font-bold text-indigo-600 mb-1">{exp.company}</p>
                        <p className="text-xs text-slate-600 italic whitespace-pre-wrap">{exp.responsibilities}</p>
                    </div>
                ))}
            </section>
            <section>
                <h2 className="text-xs font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3">Technical Skills</h2>
                <p className="text-xs font-bold text-slate-700">{resume.skills}</p>
            </section>
        </div>
    );

    return (
        <div className="py-8">
            <div className="print-only"><ResumeContent printMode={true} /></div>
            <div className="flex justify-between items-center mb-10 no-print">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Resume Studio</h2>
                <div className="flex gap-4">
                    <button onClick={handleManualSave} disabled={isSaving} className="btn-3d px-6 py-3 bg-slate-800 rounded-xl text-[10px] font-black uppercase">Save Workspace</button>
                    <Button onClick={handleExport} isLoading={isSaving} className="px-8 py-3 bg-indigo-600 rounded-xl">Download & Archive</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 no-print">
                <div className="space-y-6">
                    <div className="glass-panel p-8 rounded-[40px] space-y-4">
                        <Input label="FULL NAME" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                        <Input label="EMAIL" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                        <Input label="SKILLS" value={resume.skills} onChange={e => handleChange('skills', e.target.value)} />
                        <div className="flex justify-between items-end gap-4">
                           <Textarea label="SUMMARY" rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} />
                           <button onClick={() => handleGenerateAI('summary')} className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 mb-2"><Icon name="sparkles" className="h-5 w-5" /></button>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block h-[600px] overflow-y-auto glass-panel p-6 rounded-[40px] sticky top-24">
                   <ResumeContent />
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
