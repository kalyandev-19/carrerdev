

# CareerDev AI - AI-Driven Career Ecosystem

CareerDev AI is a modern React/Vite application backed by a secure Node/Express backend and MongoDB database. It leverages Gemini's spatial reasoning models to deliver senior-level career strategist chats, resume section building, strategic resume audits, search-grounded industry Q&As, and active opportunity lookups.

---

## 🚀 Key Architectural Features

### 1. Secure MongoDB Database Layer
To isolate client credentials and restrict storage space, direct database connections are handled via a local Node/Express backend.
- **Strict Data Minimization:** The database stores **only** user credentials (`profiles` collection) and saved resumes (`resumes` collection). No chat history, generated PDF uploads, or file archives are persisted.
- **Mongoose Models:** Set up under `/server` to sync profile credentials and store resume schemas securely.

### 2. High-Demand & Quota Protections
To prevent rate-limit locks on the free tier, the Gemini service includes the following enhancements:
- **Model Upgrades:** Primary queries map to `'gemini-flash-latest'` (which leverages `gemini-3.5-flash`), featuring a much higher request capacity than typical preview models.
- **Client-Side Caching (localStorage):** Repetitive lookups (Career Tips, Resume Audits, Resume sections, Q&A, and job searches) are cached with custom TTLs (30 minutes to 4 hours). Consecutive requests serve instantly from the cache, consuming 0 API quota.
- **Instant 503 Fallback:** If the primary model experiences high demand (HTTP 503 Service Unavailable), the wrapper instantly switches the active model to `'gemini-flash-lite-latest'` and retries the request immediately without waiting.
- **Exponential Backoff:** Standard HTTP 429 locks are caught, and requests retry after parsing the API's recommended wait time.

---

## 🛠️ Environment Variables Configuration

Both environments rely on `.env` files which are excluded from Git for security.

### Frontend (.env)
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend (server/.env)
Create a `.env` file in the `server/` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_atlas_connection_string_here
```

---

## 📦 Run Locally

### Prerequisites
- Node.js (v18 or higher)
- NPM

### Step 1: Set up and run the Backend Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the Express server in development mode:
   ```bash
   npm run dev
   ```
   *The server runs on http://localhost:5001 and connects to your MongoDB cluster.*

### Step 2: Set up and run the Frontend App
1. Open a new terminal window and navigate to the project root:
   ```bash
   cd carrerdev
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
   *The application will open on http://localhost:3000.*

---

## 🧪 Production Bundling & Checks
Verify type safety and compile assets for deployment:
```bash
# Type Check
npx tsc --noEmit

# Production Build
npm run build
```

