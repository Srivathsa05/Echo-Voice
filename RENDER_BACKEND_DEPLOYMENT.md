# Render Backend Deployment Guide

## Step-by-Step Guide to Deploy Echo Backend on Render

### Prerequisites
- GitHub account with the Echo backend code pushed
- Render account (free or paid)
- OpenAI API key
- Neon PostgreSQL connection string (optional, for persistent storage)
- Twilio credentials (optional, for SMS functionality)

---

## Step 1: Prepare Your Code

### 1.1 Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/echo-backend.git
git push -u origin main
```

### 1.2 Ensure `package.json` has start script
Check `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

## Step 2: Create Render Account

1. Go to https://render.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

---

## Step 3: Create New Web Service

### 3.1 Navigate to Dashboard
1. After signing in, you'll see the Render dashboard
2. Click the **"New +"** button (top left)
3. Select **"Web Service"**

### 3.2 Connect GitHub Repository
1. Under "Connect a repository", search for your repo: `echo-backend`
2. Click **"Connect"** next to your repository
3. If not listed, click "Configure account" to grant access

---

## Step 4: Configure Web Service

### 4.1 Name & Region

**Name:**
- Enter: `echo-backend`
- This will be your service name
- URL will be: `https://echo-backend.onrender.com`

**Region:**
- Select region closest to your users:
  - **Oregon (US West)** - Best for US West Coast
  - **Frankfurt (EU)** - Best for Europe
  - **Singapore (Asia)** - Best for Asia
  - **Mumbai (Asia)** - Best for India
- **Recommendation:** Choose region nearest to your target users

---

### 4.2 Branch

**Branch:**
- Select: `main`
- This is the branch Render will deploy from

---

### 4.3 Runtime

**Runtime:**
- Select: **Node**
- This is for Node.js applications

---

### 4.4 Build Command

**Build Command:**
```
npm install
```

**Explanation:**
- Installs all dependencies from `package.json`
- Runs automatically before starting the server

---

### 4.5 Start Command

**Start Command:**
```
node src/server.js
```

**Alternative:**
```
npm start
```

**Explanation:**
- This command starts your server
- Must match the script in `package.json`

---

## Step 5: Configure Environment Variables

### 5.1 Add Environment Variables

Scroll down to **"Environment Variables"** section and add:

#### Required Variables

**1. OPENAI_API_KEY**
- **Key:** `OPENAI_API_KEY`
- **Value:** Your OpenAI API key (starts with `sk-`)
- **Source:** https://platform.openai.com/api-keys
- **How to get:**
  1. Go to https://platform.openai.com
  2. Click "API Keys" in left sidebar
  3. Click "Create new secret key"
  4. Copy the key (starts with `sk-`)

**2. CORS_ORIGIN**
- **Key:** `CORS_ORIGIN`
- **Value:** Your frontend URL
- **Example:** `https://echo-frontend.vercel.app` (if deploying frontend to Vercel)
- **Example:** `http://localhost:5173` (for local development)
- **Note:** This allows your frontend to make requests to the backend

**3. NODE_ENV**
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Note:** Tells Node.js to run in production mode

#### Optional Variables

**4. DATABASE_URL** (Neon PostgreSQL - Recommended)
- **Key:** `DATABASE_URL`
- **Value:** Your Neon PostgreSQL connection string
- **Format:** `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
- **How to get:**
  1. Go to https://console.neon.tech
  2. Create or select your project
  3. Copy the connection string from Dashboard
  4. Make sure it includes `?sslmode=require`

**5. TWILIO_ACCOUNT_SID** (SMS Feature - Optional)
- **Key:** `TWILIO_ACCOUNT_SID`
- **Value:** Your Twilio Account SID
- **Format:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Source:** https://console.twilio.com

**6. TWILIO_AUTH_TOKEN** (SMS Feature - Optional)
- **Key:** `TWILIO_AUTH_TOKEN`
- **Value:** Your Twilio Auth Token
- **Format:** Starts with your account SID
- **Source:** https://console.twilio.com

**7. TWILIO_PHONE_NUMBER** (SMS Feature - Optional)
- **Key:** `TWILIO_PHONE_NUMBER`
- **Value:** Your Twilio phone number
- **Format:** `+1234567890`
- **Source:** https://console.twilio.com

---

## Step 6: Advanced Settings (Optional)

### 6.1 Instance Type

**Free Plan:**
- **Instance Type:** Free
- **RAM:** 512 MB
- **CPU:** 0.1 CPU
- **Limitations:**
  - Spins down after 15 minutes of inactivity
  - Takes ~30 seconds to spin up
  - Not recommended for production

**Paid Plan (Recommended for Production):**
- **Instance Type:** Starter ($7/month)
- **RAM:** 512 MB - 2 GB
- **CPU:** 0.5 - 1 CPU
- **Benefits:**
  - Always running
  - Faster response times
  - Better for production

### 6.2 Health Check Path

**Health Check Path:**
```
/api/health
```

**Explanation:**
- Render checks this endpoint to ensure service is healthy
- Your backend should have this endpoint defined

### 6.3 Auto-Deploy

**Auto-Deploy:**
- **Enabled:** Yes (recommended)
- **What it does:** Automatically deploys when you push to GitHub
- **Disable if:** You want manual control over deployments

---

## Step 7: Review and Deploy

### 7.1 Review Configuration

Scroll through all settings:
- Name: `echo-backend`
- Region: [Your chosen region]
- Branch: `main`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `node src/server.js`
- Environment Variables: All configured

### 7.2 Create Web Service

Click the **"Create Web Service"** button at the bottom

---

## Step 8: Monitor Deployment

### 8.1 Deployment Process

After clicking "Create Web Service":

1. **Build Phase** (2-5 minutes)
   - Render clones your repository
   - Runs `npm install`
   - Shows build logs

2. **Deploy Phase** (1-2 minutes)
   - Starts your server
   - Runs health checks
   - Shows deploy logs

3. **Live Status**
   - Changes from "Building" to "Deploying" to "Live"
   - Your service is now accessible!

### 8.2 View Logs

- Click on your service
- Go to **"Logs"** tab
- Monitor for any errors
- Common issues to watch for:
  - Missing environment variables
  - Database connection errors
  - Port binding errors

---

## Step 9: Get Your Service URL

### 9.1 Service URL

After deployment is live:
- Your URL will be: `https://echo-backend.onrender.com`
- Or: `https://echo-backend-xxxx.onrender.com` (if name was taken)

### 9.2 Test Your API

Test the health endpoint:
```bash
curl https://echo-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-17T..."
}
```

---

## Step 10: Update Frontend Configuration

### 10.1 Update Frontend API URL

In your frontend code, update the API base URL:

**Development:**
```typescript
const API_BASE = 'http://localhost:3001';
```

**Production:**
```typescript
const API_BASE = 'https://echo-backend.onrender.com';
```

**Or use environment variable:**
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 10.2 Add Frontend Environment Variable

In frontend `.env`:
```
VITE_API_URL=https://echo-backend.onrender.com
```

---

## Step 11: Run Database Schema (If Using Neon)

### 11.1 Connect to Neon Database

1. Go to https://console.neon.tech
2. Select your project
3. Click **"SQL Editor"**

### 11.2 Run Schema

Copy contents of `backend/schema.sql` and paste into SQL Editor:

```sql
-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  audio_file_name VARCHAR(255),
  audio_duration DECIMAL(10, 2),
  specialty VARCHAR(255) DEFAULT 'General Practice',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT NOT NULL,
  segments JSONB NOT NULL,
  language VARCHAR(10),
  duration DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  diagnosis JSONB,
  medications JSONB,
  next_steps JSONB,
  warnings JSONB,
  important_notes JSONB,
  vitals JSONB,
  lifestyle JSONB,
  labs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_consultation_id ON transcripts(consultation_id);
CREATE INDEX IF NOT EXISTS idx_summaries_consultation_id ON summaries(consultation_id);
CREATE INDEX IF NOT EXISTS idx_questions_consultation_id ON questions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_consultation_id ON chat_history(consultation_id);
```

3. Click **"Run"**

---

## Step 12: Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Port already in use"
**Error:** `EADDRINUSE: address already in use`

**Solution:**
- Ensure your server uses `process.env.PORT` or defaults to 3001
- Render provides `PORT` environment variable automatically

#### Issue 2: "Database connection failed"
**Error:** `Connection refused` or `Connection timeout`

**Solution:**
- Verify `DATABASE_URL` is correct
- Ensure it includes `?sslmode=require`
- Check Neon database is active

#### Issue 3: "Module not found"
**Error:** `Cannot find module 'xxx'`

**Solution:**
- Check `package.json` has all dependencies
- Run `npm install` locally first
- Push updated `package-lock.json`

#### Issue 4: "CORS error"
**Error:** `Access-Control-Allow-Origin`

**Solution:**
- Verify `CORS_ORIGIN` environment variable
- Should match your frontend URL exactly

#### Issue 5: Service spins down (Free plan)
**Issue:** First request takes 30+ seconds

**Solution:**
- Upgrade to Starter plan ($7/month)
- Or accept the spin-up delay

---

## Step 13: Monitoring & Maintenance

### 13.1 View Metrics

- Go to your service in Render
- Click **"Metrics"** tab
- Monitor:
  - CPU usage
  - Memory usage
  - Response times
  - Error rates

### 13.2 Set Up Alerts (Paid Plans)

- Go to **"Settings"** tab
- Click **"Alerts"**
- Configure alerts for:
  - High CPU usage (>80%)
  - High memory usage (>90%)
  - High error rate (>5%)

### 13.3 View Logs

- Go to **"Logs"** tab
- Filter by:
  - Timestamp
  - Log level (info, warn, error)
  - Search terms

---

## Step 14: Update Deployments

### 14.1 Automatic Updates

With Auto-Deploy enabled:
1. Make changes locally
2. Commit and push to GitHub
3. Render automatically detects and deploys

### 14.2 Manual Deploy

1. Go to your service in Render
2. Click **"Manual Deploy"** (top right)
3. Select branch and click **"Deploy"**

---

## Step 15: Scaling (Optional)

### 15.1 Vertical Scaling

1. Go to your service
2. Click **"Settings"** tab
3. Scroll to **"Instance Type"**
4. Select higher tier:
   - Starter ($7/mo) - 0.5 CPU, 512MB RAM
   - Standard ($25/mo) - 1 CPU, 2GB RAM
   - Pro Plus ($100/mo) - 4 CPU, 8GB RAM

### 15.2 Horizontal Scaling

1. Go to your service
2. Click **"Settings"** tab
3. Scroll to **"Instances"**
4. Increase instance count
5. Render automatically load balances

---

## Environment Variables Reference

### Required
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CORS_ORIGIN=https://echo-frontend.vercel.app
NODE_ENV=production
```

### Optional
```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Cost Summary

### Free Plan
- **Cost:** $0/month
- **Limitations:**
  - Spins down after 15 min inactivity
  - 512MB RAM, 0.1 CPU
  - 750 hours/month
  - Not recommended for production

### Starter Plan (Recommended)
- **Cost:** $7/month
- **Includes:**
  - Always running
  - 512MB RAM, 0.5 CPU
  - Unlimited hours
  - Good for small production apps

### Standard Plan
- **Cost:** $25/month
- **Includes:**
  - 2GB RAM, 1 CPU
  - Better performance
  - Good for medium traffic

---

## Quick Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] `package.json` has start script
- [ ] All dependencies in `package.json`
- [ ] Environment variables documented
- [ ] Database schema ready (if using Neon)

After deploying:
- [ ] Service shows "Live" status
- [ ] Health endpoint responds
- [ ] Frontend can connect
- [ ] Database connected (if using)
- [ ] Logs show no errors
- [ ] Test upload functionality

---

## Support

### Render Documentation
- https://render.com/docs

### Render Community
- https://community.render.com

### Render Status
- https://status.render.com
