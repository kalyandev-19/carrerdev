
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
        title: 'Professional Resume',
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
            // 1. Save workspace state first
            await handleManualSave();

            // 2. Capture a printable version for Cloud Archiving
            if (user.id && user.id !== 'guest-user') {
                const header = `RESUME: ${resume.fullName}\nTitle: ${resume.title}\nEmail: ${resume.email}\nPhone: ${resume.phone}\n\nSUMMARY:\n${resume.summary}\n\nSKILLS:\n${resume.skills}\n\n`;
                const experience = resume.experience.map(e => `[${e.company}] ${e.role} (${e.startDate}-${e.endDate})\n${e.responsibilities}`).join('\n\n');
                const fullText = header + "EXPERIENCE:\n" + experience;
                
                const blob = new Blob([fullText], { type: 'text/plain' });
                const file = new File([blob], `${resume.fullName.replace(/\s+/g, '_')}_Export.txt`, { type: 'text/plain' });
                
                // Upload to Supabase and record in History table
                await databaseService.uploadAndRecordPDF(file, user.id);
            }

            // 3. Trigger Print (which the browser can save as PDF)
            const originalTitle = document.title;
            document.title = `${resume.fullName.replace(/\s+/g, '_')}_CareerDev_Resume`;
            
            // Give the browser a moment to ensure classes like .no-print are applied correctly
            window.setTimeout(() => {
                window.print();
                document.title = originalTitle;
            }, 300);
            
        } catch (e) {
            console.error("Export sequence failure:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAI = useCallback(async (section: 'summary' | 'responsibilities', index?: number) => {
        let prompt = section === 'summary' 
            ? `Write a professional resume summary for ${resume.fullName}. Skills: ${resume.skills}. Focus on career achievements.`
            : `Write impact-driven bullet points for a ${resume.experience[index!]?.role} at ${resume.experience[index!]?.company}. Use action verbs.`;
        
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
        <div id={printMode ? "resume-export-area" : undefined} className="bg-white text-slate-900 p-12 shadow-2xl h-full border border-slate-100">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{resume.fullName || 'RESUME NAME'}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {resume.email} {resume.phone && `• ${resume.phone}`} {resume.linkedin && `• ${resume.linkedin}`}
                </p>
            </header>
            
            {resume.summary && (
              <section className="mb-10">
                  <h2 className="text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3 tracking-widest">Professional Profile</h2>
                  <p className="text-sm font-medium leading-relaxed">{resume.summary}</p>
              </section>
            )}

            <section className="mb-10">
                <h2 className="text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-4 tracking-widest">Core Experience</h2>
                {resume.experience.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Add your professional journey below...</p>
                ) : (
                  resume.experience.map(exp => (
                      <div key={exp.id} className="mb-6">
                          <div className="flex justify-between items-end mb-1">
                              <span className="font-black text-sm uppercase tracking-tight">{exp.role}</span>
                              <span className="text-[10px] font-bold text-slate-500">{exp.startDate} — {exp.endDate}</span>
                          </div>
                          <p className="text-xs font-bold text-indigo-600 mb-2 uppercase">{exp.company}</p>
                          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.responsibilities}</p>
                      </div>
                  ))
                )}
            </section>

            {resume.skills && (
              <section>
                  <h2 className="text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3 tracking-widest">Technical Competencies</h2>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{resume.skills}</p>
              </section>
            )}
        </div>
    );

    return (
        <div className="py-8">
            <div className="print-only"><ResumeContent printMode={true} /></div>
            
            <div className="flex justify-between items-center mb-10 no-print">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Resume Studio</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Last Saved: {lastSaved || 'Not saved yet'}
                  </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleManualSave} disabled={isSaving} className="btn-3d px-6 py-3 bg-slate-800 rounded-xl text-[10px] font-black uppercase">Save Work</button>
                    <Button onClick={handleExport} isLoading={isSaving} className="px-8 py-3 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-500/20">Print & Archive</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 no-print">
                <div className="space-y-6">
                    <div className="glass-panel p-10 rounded-[40px] space-y-8 border-t-2 border-white/10">
                        <Input label="FULL NAME" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="EMAIL" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                          <Input label="PHONE" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} />
                        </div>
                        
                        <div className="relative">
                           <Textarea label="PROFESSIONAL SUMMARY" rows={5} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} />
                           <button 
                             onClick={() => handleGenerateAI('summary')} 
                             className="absolute top-8 right-2 p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                             title="Optimize with AI"
                           >
                             <Icon name="sparkles" className="h-4 w-4" />
                           </button>
                        </div>

                        <Textarea label="KEY SKILLS" rows={3} value={resume.skills} onChange={e => handleChange('skills', e.target.value)} />
                        
                        <div className="pt-4">
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Experience Roles</h3>
                           <button 
                             onClick={() => handleChange('experience', [...resume.experience, { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', responsibilities: '' }])}
                             className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all"
                           >
                             + Add Experience Module
                           </button>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block h-[800px] overflow-y-auto glass-panel p-8 rounded-[40px] sticky top-24 border border-white/5 custom-scrollbar">
                   <div className="scale-95 origin-top">
                     <ResumeContent />
                   </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
