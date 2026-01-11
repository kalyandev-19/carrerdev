
import React, { useState, useCallback, useEffect } from 'react';
import { ResumeData, User, Experience, Education } from '../types.ts';
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
        fullName: user.fullName || '',
        email: user.email || '',
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
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const loadResume = async () => {
          try {
            if (resumeId) {
              const savedResume = await databaseService.getResume(resumeId);
              if (savedResume) {
                  setResume(savedResume);
                  if (savedResume.updatedAt) setLastSaved(new Date(savedResume.updatedAt).toLocaleTimeString());
              }
            }
          } catch (e) {
            console.error("Critical Resume Load Failure:", e);
          }
        };
        loadResume();
    }, [resumeId]);

    const handleChange = <T extends keyof ResumeData,>(field: T, value: ResumeData[T]) => {
        setResume(prev => ({ ...prev, [field]: value }));
        if (saveError) setSaveError(null);
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const saved = await databaseService.saveResume(resume);
            if (saved && saved.id) {
              setResume(prev => ({ ...prev, id: saved.id, updatedAt: saved.updatedAt }));
              setLastSaved(new Date().toLocaleTimeString());
            }
            return saved;
        } catch (e: any) {
            console.error("Cloud Sync Blocked:", e);
            setSaveError(e.message || "Failed to sync with cloud. Check internet and permissions.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        setIsSaving(true);
        try {
            // 1. Ensure latest state is saved to Cloud
            await handleManualSave();

            // 2. Cloud Archive for History (Text Version)
            if (user.id) {
                const headerText = `RESUME: ${resume.fullName || 'User'}\nCONTACT: ${resume.email} | ${resume.phone}\n\n`;
                const summaryText = `SUMMARY:\n${resume.summary}\n\n`;
                const expText = `EXPERIENCE:\n` + resume.experience.map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate})\n${e.responsibilities}`).join('\n\n') + `\n\n`;
                const eduText = `EDUCATION:\n` + resume.education.map(e => `${e.degree} at ${e.school} (${e.startDate} - ${e.endDate})`).join('\n\n') + `\n\n`;
                const skillsText = `SKILLS: ${resume.skills}`;
                
                const blob = new Blob([headerText + summaryText + expText + eduText + skillsText], { type: 'text/plain' });
                const file = new File([blob], `${(resume.fullName || 'Resume').replace(/\s+/g, '_')}_Archive.txt`, { type: 'text/plain' });
                await databaseService.uploadAndRecordPDF(file, user.id);
            }

            // 3. Trigger Native Print Dialog
            setTimeout(() => {
                const originalTitle = document.title;
                document.title = `${(resume.fullName || 'Resume').replace(/\s+/g, '_')}_Resume`;
                window.print();
                document.title = originalTitle;
            }, 100);
            
        } catch (e) {
            console.error("Export sequence failure:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAI = useCallback(async (section: 'summary' | 'experience', index?: number) => {
        let prompt = "";
        if (section === 'summary') {
          prompt = `Write a polished, professional resume summary for ${resume.fullName}. Skills: ${resume.skills}. Keep it to 3 impactful sentences.`;
        } else if (section === 'experience' && index !== undefined) {
          const exp = resume.experience[index];
          prompt = `Write 4 strong, action-oriented bullet points for a ${exp.role} role at ${exp.company}. Quantify accomplishments.`;
        }

        setLoadingSection(section === 'summary' ? 'summary' : `exp-${index}`);
        try {
            const stream = generateResumeSectionStream(prompt);
            let fullText = "";
            for await (const chunk of stream) {
                fullText += chunk;
                if (section === 'summary') handleChange('summary', fullText);
                else if (section === 'experience' && index !== undefined) {
                    const newExp = [...resume.experience];
                    newExp[index] = { ...newExp[index], responsibilities: fullText };
                    handleChange('experience', newExp);
                }
            }
        } catch (e) {
            console.error("AI Generation Terminated:", e);
        } finally { setLoadingSection(null); }
    }, [resume]);

    const ResumeContent = ({ isPrint = false }: { isPrint?: boolean }) => (
        <div id={isPrint ? "resume-export-area" : undefined} className={`bg-white text-slate-900 ${isPrint ? '' : 'p-6 md:p-12 shadow-2xl h-full border border-slate-100'}`}>
            <header className="text-center mb-8">
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-2 break-words">{resume.fullName || 'USER NAME'}</h1>
                <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest space-y-1 md:space-y-0 md:space-x-2 flex flex-col md:flex-row justify-center items-center">
                  <span className="truncate max-w-full">{resume.email}</span>
                  {resume.phone && <span className="hidden md:inline">•</span>}
                  {resume.phone && <span>{resume.phone}</span>}
                </div>
                <div className="text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 space-y-1 md:space-y-0 md:space-x-2 flex flex-col md:flex-row justify-center items-center">
                  {resume.linkedin && <span className="truncate max-w-full">LinkedIn: {resume.linkedin}</span>}
                  {resume.github && <span className="hidden md:inline">•</span>}
                  {resume.github && <span className="truncate max-w-full">GitHub: {resume.github}</span>}
                </div>
            </header>
            
            <section className="mb-6 md:mb-8">
                <h2 className="text-[10px] md:text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-2 tracking-widest">Professional Summary</h2>
                <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{resume.summary}</p>
            </section>

            <section className="mb-6 md:mb-8">
                <h2 className="text-[10px] md:text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3 md:mb-4 tracking-widest">Work Experience</h2>
                {resume.experience.length === 0 ? (
                    <p className="text-[10px] md:text-xs italic text-slate-400">Add your experience using the editor modules.</p>
                ) : (
                    resume.experience.map(exp => (
                        <div key={exp.id} className="mb-5 md:mb-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-1">
                                <span className="font-black text-xs md:text-sm uppercase tracking-tight">{exp.role}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <p className="text-[10px] md:text-xs font-bold text-indigo-600 mb-2 uppercase">{exp.company}</p>
                            <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.responsibilities}</p>
                        </div>
                    ))
                )}
            </section>

            <section className="mb-6 md:mb-8">
                <h2 className="text-[10px] md:text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-3 md:mb-4 tracking-widest">Education</h2>
                {resume.education.length === 0 ? (
                    <p className="text-[10px] md:text-xs italic text-slate-400">Add your education modules.</p>
                ) : (
                    resume.education.map(edu => (
                        <div key={edu.id} className="mb-3">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-end">
                                <span className="font-black text-xs md:text-sm uppercase tracking-tight">{edu.degree}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500">{edu.startDate} - {edu.endDate}</span>
                            </div>
                            <p className="text-[10px] md:text-xs font-bold text-indigo-600 uppercase">{edu.school}</p>
                            {edu.gpa && <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">GPA: {edu.gpa}</p>}
                        </div>
                    ))
                )}
            </section>

            <section>
                <h2 className="text-[10px] md:text-[11px] font-black text-indigo-700 uppercase border-b-2 border-slate-100 mb-2 tracking-widest">Skills & Expertise</h2>
                <p className="text-[10px] md:text-xs font-bold text-slate-700 leading-relaxed">{resume.skills}</p>
            </section>
        </div>
    );

    return (
        <div className="py-4 md:py-8">
            <div className="print-only">
                <ResumeContent isPrint={true} />
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8 md:mb-10 no-print">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Resume Studio</h2>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-500">
                    Cloud Sync: {lastSaved || 'Offline'}
                  </p>
                  {saveError && (
                    <p className="text-[8px] font-black uppercase text-rose-500 mt-1 tracking-widest">Error: {saveError}</p>
                  )}
                </div>
                <div className="flex gap-3 md:gap-4">
                    <button onClick={handleManualSave} disabled={isSaving} className="btn-3d flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-slate-800 rounded-xl text-[9px] md:text-[10px] font-black uppercase whitespace-nowrap shadow-xl">
                        Save Work
                    </button>
                    <Button onClick={handleExport} isLoading={isSaving} className="flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 bg-indigo-600 rounded-xl shadow-xl">
                        <div className="flex items-center justify-center gap-2">
                            <Icon name="download" className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="text-[10px] md:text-xs">Export PDF</span>
                        </div>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 no-print">
                <div className="space-y-6 md:space-y-8 md:h-[calc(100vh-16rem)] md:overflow-y-auto md:pr-4 custom-scrollbar">
                    {/* Basic Info Module */}
                    <div className="glass-panel p-6 md:p-8 rounded-[30px] md:rounded-[40px] space-y-5 md:space-y-6 border border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-indigo-400">Core Identity</h3>
                        <Input label="FULL NAME" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="EMAIL" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                          <Input label="PHONE" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="LINKEDIN" placeholder="linkedin.com/in/username" value={resume.linkedin} onChange={e => handleChange('linkedin', e.target.value)} />
                          <Input label="GITHUB" placeholder="github.com/username" value={resume.github} onChange={e => handleChange('github', e.target.value)} />
                        </div>
                        <div className="relative">
                          <Textarea label="SUMMARY" rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} />
                          <button onClick={() => handleGenerateAI('summary')} disabled={loadingSection === 'summary'} className="absolute top-9 right-3 p-1.5 md:p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-lg backdrop-blur-sm">
                            {loadingSection === 'summary' ? <Icon name="logo" className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" /> : <Icon name="sparkles" className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                          </button>
                        </div>
                        <Textarea label="EXPERTISE & SKILLS" rows={2} placeholder="e.g. React, Python, Data Analysis..." value={resume.skills} onChange={e => handleChange('skills', e.target.value)} />
                    </div>

                    {/* Experience Modules */}
                    <div className="glass-panel p-6 md:p-8 rounded-[30px] md:rounded-[40px] space-y-5 md:space-y-6 border border-white/5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-indigo-400">Professional Journey</h3>
                          <button 
                            onClick={() => handleChange('experience', [...resume.experience, { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', responsibilities: '' }])}
                            className="p-1.5 md:p-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 md:gap-2 shadow-inner-soft"
                          >
                            <Icon name="plus" className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase">Add Role</span>
                          </button>
                        </div>
                        {resume.experience.map((exp, idx) => (
                          <div key={exp.id} className="p-5 md:p-6 bg-slate-900/50 rounded-2xl md:rounded-3xl border border-white/5 space-y-4 shadow-3d relative group">
                            <Input placeholder="Company Name" value={exp.company} onChange={e => {
                                const next = [...resume.experience];
                                next[idx].company = e.target.value;
                                handleChange('experience', next);
                            }} />
                            <Input placeholder="Job Title" value={exp.role} onChange={e => {
                                const next = [...resume.experience];
                                next[idx].role = e.target.value;
                                handleChange('experience', next);
                            }} />
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                              <Input placeholder="Start Date" value={exp.startDate} onChange={e => {
                                  const next = [...resume.experience];
                                  next[idx].startDate = e.target.value;
                                  handleChange('experience', next);
                              }} />
                              <Input placeholder="End Date" value={exp.endDate} onChange={e => {
                                  const next = [...resume.experience];
                                  next[idx].endDate = e.target.value;
                                  handleChange('experience', next);
                              }} />
                            </div>
                            <div className="relative">
                              <Textarea placeholder="Key Responsibilities & Achievements..." rows={4} value={exp.responsibilities} onChange={e => {
                                  const next = [...resume.experience];
                                  next[idx].responsibilities = e.target.value;
                                  handleChange('experience', next);
                              }} />
                              <button onClick={() => handleGenerateAI('experience', idx)} disabled={loadingSection === `exp-${idx}`} className="absolute top-3 right-3 p-1.5 md:p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-lg backdrop-blur-sm">
                                {loadingSection === `exp-${idx}` ? <Icon name="logo" className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" /> : <Icon name="sparkles" className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                              </button>
                            </div>
                            <button onClick={() => handleChange('experience', resume.experience.filter(e => e.id !== exp.id))} className="text-[8px] md:text-[9px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors">Remove Entry</button>
                          </div>
                        ))}
                    </div>

                    {/* Education Modules */}
                    <div className="glass-panel p-6 md:p-8 rounded-[30px] md:rounded-[40px] space-y-5 md:space-y-6 border border-white/5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-indigo-400">Academic Background</h3>
                          <button 
                            onClick={() => handleChange('education', [...resume.education, { id: Date.now().toString(), school: '', degree: '', startDate: '', endDate: '', gpa: '' }])}
                            className="p-1.5 md:p-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 md:gap-2 shadow-inner-soft"
                          >
                            <Icon name="plus" className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase">Add Degree</span>
                          </button>
                        </div>
                        {resume.education.map((edu, idx) => (
                          <div key={edu.id} className="p-5 md:p-6 bg-slate-900/50 rounded-2xl md:rounded-3xl border border-white/5 space-y-4 shadow-3d">
                            <Input placeholder="University Name" value={edu.school} onChange={e => {
                                const next = [...resume.education];
                                next[idx].school = e.target.value;
                                handleChange('education', next);
                            }} />
                            <Input placeholder="Degree Type (e.g. B.S. Computer Science)" value={edu.degree} onChange={e => {
                                const next = [...resume.education];
                                next[idx].degree = e.target.value;
                                handleChange('education', next);
                            }} />
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                              <Input placeholder="Start" value={edu.startDate} onChange={e => {
                                  const next = [...resume.education];
                                  next[idx].startDate = e.target.value;
                                  handleChange('education', next);
                              }} />
                              <Input placeholder="End" value={edu.endDate} onChange={e => {
                                  const next = [...resume.education];
                                  next[idx].endDate = e.target.value;
                                  handleChange('education', next);
                              }} />
                              <Input placeholder="GPA" value={edu.gpa} onChange={e => {
                                  const next = [...resume.education];
                                  next[idx].gpa = e.target.value;
                                  handleChange('education', next);
                              }} />
                            </div>
                            <button onClick={() => handleChange('education', resume.education.filter(e => e.id !== edu.id))} className="text-[8px] md:text-[9px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors">Remove Entry</button>
                          </div>
                        ))}
                    </div>
                </div>

                {/* Editor Live Preview */}
                <div className="hidden lg:block h-[calc(100vh-16rem)] overflow-y-auto glass-panel p-8 rounded-[40px] sticky top-24 border border-white/5 custom-scrollbar shadow-inner-soft">
                   <div className="scale-95 origin-top shadow-3d-hover">
                     <ResumeContent />
                   </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
