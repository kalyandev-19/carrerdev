<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1AoiB_MErRtNOmqLTGQwzpvzixOlJzqdy

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Getting Your Gemini API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **"Create API Key"** or visit [Google AI Studio Console](https://aistudio.google.com/app/apikey)
3. Select or create a new Google Cloud project
4. Enable the required APIs

### Step 2: Get Your Free API Key
1. In Google AI Studio, click **"Create API Key"**
2. Choose your Google Cloud project
3. Copy the generated API key (keep this secret!)

### Step 3: Configure Locally (.env.local)

1. Create a `.env.local` file in the root of your project:
```
GEMINI_API_KEY=your_actual_api_key_here
```

2. Replace `your_actual_api_key_here` with your actual API key from Step 2

3. **Important:** The `.env.local` file is already in `.gitignore`, so your API key will never be committed to the repository

### Step 4: Run Your App
```bash
npm run dev
```

The app will automatically load your `GEMINI_API_KEY` from the `.env.local` file.

## Deployment to GitHub Pages

The app is automatically deployed to GitHub Pages when you push to the `main` branch.

**Note for Production:**
For production deployment on GitHub Pages, you'll need to configure the API key through GitHub Actions Secrets. Contact the repository maintainer for setup instructions.

## Features

Once configured with your API key, the app provides:
- **Industry QA**: AI-powered Q&A for your industry
- **AI Resume Builder**: Generate professional resumes with AI assistance
- **Resume Analyzer**: Get AI-powered feedback on your resume
- **Opportunity Finder**: Discover career opportunities using AI

## Troubleshooting

### App is blank
- Clear your browser cache (Cmd+Shift+Delete)
- Hard refresh the page (Cmd+Shift+R)
- Check that you've set `GEMINI_API_KEY` in `.env.local`

### API Key Errors
- Verify your API key is correctly set in `.env.local`
- Make sure the key has no extra spaces or characters
- Check that the key is active in [Google AI Studio](https://aistudio.google.com/app/apikey)

### Need Help?
For issues or questions, please open an issue on the [GitHub repository](https://github.com/kalyandev-19/carrerdev/issues)
