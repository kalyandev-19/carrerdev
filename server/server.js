import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('Critical MongoDB Connection Error:', err);
    process.exit(1);
  });

// --- SCHEMAS & MODELS ---

// 1. Profile Model (stores synchronized user credentials)
const ProfileSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom string user ID from frontend
  email: { type: String, required: true, lowercase: true, trim: true },
  fullName: { type: String, default: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false }); // Disable automatic ObjectId since we supply string _id

const Profile = mongoose.model('Profile', ProfileSchema);

// 2. Resume Model
const ResumeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, default: 'Untitled Resume' },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  summary: { type: String, default: '' },
  education: [{
    id: { type: String },
    school: { type: String, default: '' },
    degree: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    gpa: { type: String, default: '' }
  }],
  experience: [{
    id: { type: String },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    responsibilities: { type: String, default: '' }
  }],
  skills: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const Resume = mongoose.model('Resume', ResumeSchema);



// --- REST API ENDPOINTS ---

// Sync User Profile
app.post('/api/profiles/sync', async (req, res) => {
  try {
    const { id, email, fullName } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required profile attributes: id, email' });
    }

    const profile = await Profile.findByIdAndUpdate(
      id,
      { email, fullName, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    
    res.json({
      id: profile._id,
      email: profile.email,
      fullName: profile.fullName
    });
  } catch (err) {
    console.error('Error syncing user profile:', err);
    res.status(500).json({ error: err.message || 'Failed to sync profile.' });
  }
});

// Fetch all Resumes for a specific User
app.get('/api/resumes', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing query parameter: userId' });
    }
    
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });
    
    res.json(resumes.map(r => ({
      id: r._id,
      userId: r.userId,
      title: r.title,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      linkedin: r.linkedin,
      github: r.github,
      summary: r.summary,
      education: r.education,
      experience: r.experience,
      skills: r.skills,
      updatedAt: r.updatedAt
    })));
  } catch (err) {
    console.error('Error fetching resumes:', err);
    res.status(500).json({ error: 'Failed to fetch resumes.' });
  }
});

// Fetch single Resume
app.get('/api/resumes/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    
    res.json({
      id: resume._id,
      userId: resume.userId,
      title: resume.title,
      fullName: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      summary: resume.summary,
      education: resume.education,
      experience: resume.experience,
      skills: resume.skills,
      updatedAt: resume.updatedAt
    });
  } catch (err) {
    console.error('Error fetching resume details:', err);
    res.status(500).json({ error: 'Failed to fetch resume details.' });
  }
});

// Save or Update a Resume
app.post('/api/resumes', async (req, res) => {
  try {
    const { id, userId, title, fullName, email, phone, linkedin, github, summary, education, experience, skills } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing user identification. Please log in again.' });
    }

    const payload = {
      userId,
      title: title || 'Untitled Resume',
      fullName: fullName || '',
      email: email || '',
      phone: phone || '',
      linkedin: linkedin || '',
      github: github || '',
      summary: summary || '',
      education: education || [],
      experience: experience || [],
      skills: skills || '',
      updatedAt: new Date()
    };

    let resume;
    if (id) {
      resume = await Resume.findByIdAndUpdate(id, payload, { new: true });
      if (!resume) {
        return res.status(404).json({ error: 'Resume to update not found.' });
      }
    } else {
      resume = new Resume(payload);
      await resume.save();
    }

    res.json({
      id: resume._id,
      userId: resume.userId,
      title: resume.title,
      fullName: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      summary: resume.summary,
      education: resume.education,
      experience: resume.experience,
      skills: resume.skills,
      updatedAt: resume.updatedAt
    });
  } catch (err) {
    console.error('Error saving resume:', err);
    res.status(500).json({ error: err.message || 'Failed to save resume.' });
  }
});

// Delete Resume
app.delete('/api/resumes/:id', async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting resume:', err);
    res.status(500).json({ error: 'Failed to delete resume.' });
  }
});



// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // Serve index.html for any frontend SPA routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Express Listener
app.listen(PORT, () => {
  console.log(`Express CareerDev server running on http://localhost:${PORT}`);
});
