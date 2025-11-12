
import React, { useState, useCallback } from 'react';
import { ResumeData, Experience, Education } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import { generateResumeSection } from '../services/geminiService';

const initialResumeData: ResumeData = {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '123-456-7890',
    linkedin: 'linkedin.com/in/janedoe',
    github: 'github.com/janedoe',
    summary: 'A highly motivated and detail-oriented computer science student seeking an internship position to apply my skills in software development and problem-solving.',
    education: [{ id: 'edu1', school: 'State University', degree: 'B.S. in Computer Science', startDate: '2021', endDate: '2025', gpa: '3.8' }],
    experience: [{ id: 'exp1', company: 'Tech Solutions Inc.', role: 'Software Engineer Intern', startDate: 'May 2023', endDate: 'Aug 2023', responsibilities: '- Developed and maintained features for a web application using React and Node.js.\n- Collaborated with a team of 5 engineers in an agile environment.' }],
    skills: 'JavaScript, React, Node.js, Python, SQL, Git, Docker'
};

const ResumeBuilder: React.FC = () => {
    const [resume, setResume] = useState<ResumeData>(initialResumeData);
    const [loadingSection, setLoadingSection] = useState<string | null>(null);

    const handleChange = <T extends keyof ResumeData,>(field: T, value: ResumeData[T]) => {
        setResume(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = <T extends 'education' | 'experience',>(section: T, index: number, field: keyof T extends 'education' ? keyof Education : keyof Experience, value: string) => {
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
            prompt = `Write a professional summary for a student's resume. Key skills: ${resume.skills}. The student is seeking an internship. The student's experience includes: ${resume.experience.map(e => e.role + ' at ' + e.company).join(', ')}.`;
            setLoadingSection('summary');
        } else if (section === 'responsibilities' && typeof index === 'number') {
            const exp = resume.experience[index];
            prompt = `Write 2-3 concise, action-oriented resume bullet points for the role of ${exp.role} at ${exp.company}. Use the STAR method. Previous responsibilities (if any): ${exp.responsibilities}`;
            setLoadingSection(`responsibilities-${index}`);
        }

        if (!prompt) return;

        const result = await generateResumeSection(prompt);

        if (section === 'summary') {
            handleChange('summary', result);
        } else if (section === 'responsibilities' && typeof index === 'number') {
            handleNestedChange('experience', index, 'responsibilities', result);
        }

        setLoadingSection(null);
    }, [resume]);


    return (
        <div className="py-8">
            <h2 className="text-3xl font-bold text-center text-white mb-6">AI Resume Builder</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
                    <h3 className="text-xl font-bold text-sky-400 border-b border-slate-600 pb-2">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" value={resume.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                        <Input label="Email" type="email" value={resume.email} onChange={e => handleChange('email', e.target.value)} />
                        <Input label="Phone" value={resume.phone} onChange={e => handleChange('phone', e.target.value)} />
                        <Input label="LinkedIn Profile" value={resume.linkedin} onChange={e => handleChange('linkedin', e.target.value)} />
                        <Input label="GitHub Profile" value={resume.github} onChange={e => handleChange('github', e.target.value)} />
                    </div>

                    <h3 className="text-xl font-bold text-sky-400 border-b border-slate-600 pb-2 pt-4">Professional Summary</h3>
                    <Textarea label="Summary" rows={4} value={resume.summary} onChange={e => handleChange('summary', e.target.value)} />
                    <Button onClick={() => handleGenerateAI('summary')} isLoading={loadingSection === 'summary'}>Generate with AI</Button>

                    <h3 className="text-xl font-bold text-sky-400 border-b border-slate-600 pb-2 pt-4">Experience</h3>
                    {resume.experience.map((exp, index) => (
                        <div key={exp.id} className="p-4 bg-slate-700/50 rounded-md space-y-4">
                             <Input label="Role" value={exp.role} onChange={e => handleNestedChange('experience', index, 'role', e.target.value)} />
                             <Input label="Company" value={exp.company} onChange={e => handleNestedChange('experience', index, 'company', e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Start Date" value={exp.startDate} onChange={e => handleNestedChange('experience', index, 'startDate', e.target.value)} />
                                <Input label="End Date" value={exp.endDate} onChange={e => handleNestedChange('experience', index, 'endDate', e.target.value)} />
                            </div>
                            <Textarea label="Responsibilities" rows={4} value={exp.responsibilities} onChange={e => handleNestedChange('experience', index, 'responsibilities', e.target.value)} />
                            <div className="flex justify-between items-center">
                                <Button onClick={() => handleGenerateAI('responsibilities', '', index)} isLoading={loadingSection === `responsibilities-${index}`}>Generate with AI</Button>
                                <Button onClick={() => removeEntry('experience', index)} className="bg-red-600 hover:bg-red-700">Remove</Button>
                            </div>
                        </div>
                    ))}
                    <Button onClick={() => addEntry('experience')}>Add Experience</Button>
                    
                     <h3 className="text-xl font-bold text-sky-400 border-b border-slate-600 pb-2 pt-4">Skills</h3>
                    <Textarea label="Skills (comma separated)" rows={3} value={resume.skills} onChange={e => handleChange('skills', e.target.value)} />

                </div>

                {/* Preview Section */}
                <div className="bg-white text-black p-8 rounded-lg font-serif">
                    <h1 className="text-3xl font-bold text-center">{resume.fullName}</h1>
                    <div className="text-center text-sm my-2 border-b pb-2">
                        {resume.email} | {resume.phone} | {resume.linkedin} | {resume.github}
                    </div>
                    <h2 className="text-lg font-bold mt-4 border-b">PROFESSIONAL SUMMARY</h2>
                    <p className="text-sm mt-1">{resume.summary}</p>
                    
                    <h2 className="text-lg font-bold mt-4 border-b">EXPERIENCE</h2>
                    {resume.experience.map(exp => (
                        <div key={exp.id} className="mt-2">
                            <div className="flex justify-between font-bold">
                                <span>{exp.role}</span>
                                <span>{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <div className="italic">{exp.company}</div>
                            <ul className="list-disc list-inside text-sm mt-1">
                                {exp.responsibilities.split('\n').map((line, i) => line && <li key={i}>{line.replace('-', '').trim()}</li>)}
                            </ul>
                        </div>
                    ))}

                    <h2 className="text-lg font-bold mt-4 border-b">EDUCATION</h2>
                     {resume.education.map(edu => (
                        <div key={edu.id} className="mt-2">
                            <div className="flex justify-between font-bold">
                                <span>{edu.school}</span>
                                <span>{edu.startDate} - {edu.endDate}</span>
                            </div>
                            <div className="italic">{edu.degree}</div>
                             <p className="text-sm">GPA: {edu.gpa}</p>
                        </div>
                    ))}
                    
                    <h2 className="text-lg font-bold mt-4 border-b">SKILLS</h2>
                    <p className="text-sm mt-1">{resume.skills}</p>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
