# Vercel Frontend Deployment Guide

## Step-by-Step Guide to Deploy Echo Frontend on Vercel

### Prerequisites
- GitHub account with the Echo frontend code pushed
- Vercel account (free)
- Backend deployed on Render (or other hosting)
- Backend URL ready (e.g., `https://echo-backend.onrender.com`)

---

## Step 1: Prepare Your Code

### 1.1 Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/echo-frontend.git
git push -u origin main
```

### 1.2 Ensure `package.json` has build script
Check `frontend/package.json` has:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.3 Update API URL for Production

**Option 1: Use Environment Variable (Recommended)**

In your frontend code, update API configuration:

```typescript
// src/routes/dashboard.tsx or wherever API_BASE is defined
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

**Option 2: Hardcode Production URL**

```typescript
const API_BASE = 'https://echo-backend.onrender.com';
```

---

## Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

---

## Step 3: Add Environment Variable Locally

### 3.1 Create `.env` file in frontend directory

```bash
cd frontend
touch .env
```

### 3.2 Add environment variables

```env
VITE_API_URL=https://echo-backend.onrender.com
```

**Note:** Environment variables in Vite must start with `VITE_` to be exposed to the frontend.

---

## Step 4: Create New Project on Vercel

### 4.1 Navigate to Dashboard

1. After signing in, you'll see the Vercel dashboard
2. Click the **"Add New..."** button (top right)
3. Select **"Project"**

---

## Step 5: Import Git Repository

### 5.1 Connect GitHub Repository

1. Under "Import Git Repository", search for your repo: `echo-frontend`
2. Click **"Import"** next to your repository
3. If not listed, click "Configure account" to grant access

---

## Step 6: Configure Project

### 6.1 Project Name

**Name:**
- Enter: `echo-frontend`
- This will be your project name
- URL will be: `https://echo-frontend.vercel.app`
- **Important:** This name determines your CORS_ORIGIN value

**Note:** If name is taken, Vercel will suggest alternatives like `echo-frontend-xyz`

---

### 6.2 Framework Preset

**Framework Preset:**
- Vercel should auto-detect: **Vite**
- If not detected, select: **Vite** manually

**Why:** Your frontend uses Vite as the build tool.

---

### 6.3 Root Directory

**Root Directory:**
- Enter: `frontend` (if frontend is in a subfolder)
- Or leave blank (if frontend is at repo root)

**Why:** Your frontend code is in the `frontend/` folder.

---

### 6.4 Build Command

**Build Command:**
```
npm run build
```

**Explanation:**
- Runs Vite build process
- Creates optimized production files
- Outputs to `dist/` folder

---

### 6.5 Output Directory

**Output Directory:**
```
dist
```

**Explanation:**
- Vite outputs built files to `dist/` by default
- Vercel serves files from this directory

---

### 6.6 Install Command

**Install Command:**
```
npm install
```

**Explanation:**
- Installs all dependencies before building
- Runs automatically by Vercel

---

## Step 7: Configure Environment Variables

### 7.1 Add Environment Variables

Scroll down to **"Environment Variables"** section and add:

**VITE_API_URL**
- **Key:** `VITE_API_URL`
- **Value:** Your deployed backend URL
- **Example:** `https://echo-backend.onrender.com`
- **Note:** Must start with `VITE_` for Vite to expose it

**Important:** Make sure this matches your backend URL exactly (including `https://` and no trailing slash).

---

## Step 8: Advanced Settings (Optional)

### 8.1 Node.js Version

**Node.js Version:**
- Select: **18.x** or **20.x**
- **Recommendation:** Use the same version as your local development

**Where to set:**
1. Click **"Settings"** tab (after deployment)
2. Go to **"General"**
3. Find **"Node.js Version"**

---

### 8.2 Environment Variables for Different Environments

You can set different environment variables for:
- **Production** (default)
- **Preview** (for pull requests)
- **Development**

**How to set:**
1. Go to **"Settings"** tab
2. Click **"Environment Variables"**
3. Select environment (Production/Preview/Development)
4. Add variables

---

## Step 9: Review and Deploy

### 9.1 Review Configuration

Scroll through all settings:
- **Name:** `echo-frontend`
- **Framework:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_API_URL` configured

### 9.2 Deploy

Click the **"Deploy"** button at the bottom

---

## Step 10: Monitor Deployment

### 10.1 Deployment Process

After clicking "Deploy":

1. **Cloning** (10-30 seconds)
   - Vercel clones your repository
   - Shows git commit info

2. **Installing Dependencies** (30-60 seconds)
   - Runs `npm install`
   - Shows installed packages

3. **Building** (30-90 seconds)
   - Runs `npm run build`
   - Vite optimizes and bundles code
   - Shows build output

4. **Deploying** (10-30 seconds)
   - Uploads built files
   - Configures CDN
   - Shows progress

5. **Live Status**
   - Changes from "Building" to "Deploying" to "Ready"
   - Your site is now live!

### 10.2 View Deployment Logs

- Click on your deployment
- Go to **"Build Logs"** tab
- Monitor for any errors
- Common issues:
  - Build failures
  - Missing dependencies
  - Environment variable errors

---

## Step 11: Get Your URL

### 11.1 Project URL

After deployment is ready:
- Your URL will be: `https://echo-frontend.vercel.app`
- Or: `https://echo-frontend-xyz.vercel.app` (if name was taken)

### 11.2 Custom Domain (Optional)

To use a custom domain:
1. Go to **"Settings"** tab
2. Click **"Domains"**
3. Click **"Add"**
4. Enter your domain (e.g., `echo.yourdomain.com`)
5. Configure DNS records as instructed

---

## Step 12: Update Backend CORS

### 12.1 Update CORS_ORIGIN in Render

1. Go to your Render backend service
2. Click **"Settings"** tab
3. Scroll to **"Environment Variables"**
4. Find `CORS_ORIGIN`
5. Update to your Vercel URL:
   ```
   https://echo-frontend.vercel.app
   ```

### 12.2 Redeploy Backend

After updating CORS_ORIGIN:
1. Go to **"Events"** tab in Render
2. Click **"Manual Deploy"**
3. Select branch and click **"Deploy"**

---

## Step 13: Test Your Deployment

### 13.1 Visit Your Site

Open your browser and go to:
```
https://echo-frontend.vercel.app
```

### 13.2 Test Functionality

1. **Upload Audio:**
   - Click upload button
   - Select audio file
   - Enter doctor and patient names
   - Click upload
   - Should see processing progress

2. **Check Results:**
   - Wait for processing to complete
   - Should see summary, questions, transcript
   - All data should load from backend

3. **Test Ask Echo:**
   - Click "Ask Echo" on a question
   - Chat widget should open
   - Question should be sent

4. **Test SMS:**
   - Click "Share" → "Send via SMS"
   - Enter phone number
   - Click send (if Twilio configured)

---

## Step 14: Troubleshooting

### Common Issues & Solutions

#### Issue 1: Build Fails - "Module not found"
**Error:** `Cannot find module 'xxx'`

**Solution:**
- Check `package.json` has all dependencies
- Run `npm install` locally first
- Push updated `package-lock.json`
- Ensure Node.js version matches

#### Issue 2: API Requests Fail - CORS Error
**Error:** `Access-Control-Allow-Origin`

**Solution:**
- Verify `VITE_API_URL` is correct in Vercel
- Verify `CORS_ORIGIN` in Render matches Vercel URL
- Both should use `https://` (not `http://`)
- No trailing slashes

#### Issue 3: Environment Variables Not Working
**Error:** `undefined` when accessing environment variable

**Solution:**
- Ensure variable name starts with `VITE_`
- Restart deployment after adding variables
- Check variable is set in Production environment
- Access via `import.meta.env.VITE_API_URL`

#### Issue 4: Blank Page After Deployment
**Issue:** Site loads but shows blank screen

**Solution:**
- Check browser console for errors
- Verify build output in deployment logs
- Ensure `dist/` directory is correct
- Check for client-side routing issues

#### Issue 5: Slow First Load
**Issue:** First page load takes 10+ seconds

**Solution:**
- This is normal for Vercel's cold start
- Subsequent loads are faster
- Consider using edge functions for better performance

---

## Step 15: Update Deployments

### 15.1 Automatic Updates

With Git integration enabled:
1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically detects and deploys
4. Preview deployments created for pull requests

### 15.2 Manual Deploy

1. Go to your project in Vercel
2. Click **"Deployments"** tab
3. Click **"..."** (three dots) on latest deployment
4. Click **"Redeploy"**

---

## Step 16: Monitoring & Analytics

### 16.1 View Analytics

1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. View:
   - Page views
   - Unique visitors
   - Top pages
   - Geographic distribution
   - Device breakdown

### 16.2 View Logs

1. Go to **"Deployments"** tab
2. Click on a deployment
3. Go to **"Build Logs"** or **"Function Logs"**
4. Filter by:
   - Timestamp
   - Log level
   - Function name

---

## Step 17: Performance Optimization

### 17.1 Enable Edge Functions

For better performance:
1. Go to **"Settings"** tab
2. Click **"Functions"**
3. Configure edge regions

### 17.2 Enable Image Optimization

If using images:
1. Go to **"Settings"** tab
2. Click **"Images"**
3. Enable image optimization

---

## Step 18: Branch Previews

### 18.1 Enable Branch Previews

For pull request previews:
1. Go to **"Settings"** tab
2. Click **"Git"**
3. Enable **"Branch Previews"**
4. Select branches to preview

### 18.2 View Preview Deployments

1. Create a pull request
2. Vercel automatically creates preview deployment
3. Share preview URL for testing
4. Preview deleted when PR merged

---

## Environment Variables Reference

### Required
```
VITE_API_URL=https://echo-backend.onrender.com
```

### Optional (if you have other frontend config)
```
VITE_APP_NAME=Echo
VITE_FEATURE_FLAGS=feature1,feature2
```

---

## Cost Summary

### Hobby Plan (Free)
- **Cost:** $0/month
- **Includes:**
  - Unlimited projects
  - 100GB bandwidth per month
  - Automatic HTTPS
  - Edge network
  - Git integration
  - Perfect for personal projects

### Pro Plan ($20/month)
- **Cost:** $20/month
- **Includes:**
  - Everything in Hobby
  - 1TB bandwidth
  - No bandwidth limits
  - Priority support
  - Advanced analytics
  - Team collaboration

### Enterprise (Custom)
- **Cost:** Custom pricing
- **Includes:**
  - Everything in Pro
  - SSO
  - SLA
  - Dedicated support
  - Custom contracts

---

## Quick Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] `package.json` has build script
- [ ] API URL configured (environment variable or hardcoded)
- [ ] All dependencies in `package.json`
- [ ] `.env` file created locally (for testing)

After deploying:
- [ ] Deployment shows "Ready" status
- [ ] Site loads in browser
- [ ] No console errors
- [ ] API requests work
- [ ] Upload functionality works
- [ ] Results display correctly
- [ ] Backend CORS updated

---

## Integration Checklist

### Backend + Frontend Integration

1. **Backend deployed on Render**
   - [ ] Backend URL accessible
   - [ ] Health endpoint responds
   - [ ] CORS_ORIGIN configured

2. **Frontend deployed on Vercel**
   - [ ] Frontend URL accessible
   - [ ] VITE_API_URL configured
   - [ ] Build successful

3. **Connected**
   - [ ] Backend CORS allows frontend URL
   - [ ] Frontend can call backend API
   - [ ] Upload flow works end-to-end
   - [ ] Results display correctly

---

## Support

### Vercel Documentation
- https://vercel.com/docs

### Vercel Community
- https://vercel.com/community

### Vercel Status
- https://www.vercel-status.com

---

## Next Steps After Deployment

1. **Test thoroughly**
   - Upload audio
   - Check processing
   - Verify results
   - Test all features

2. **Monitor performance**
   - Check analytics
   - Monitor error rates
   - Review logs

3. **Set up custom domain** (optional)
   - Buy domain
   - Configure DNS
   - Add to Vercel

4. **Configure CI/CD** (optional)
   - Set up automated testing
   - Configure preview deployments
   - Enable branch protection

5. **Set up monitoring** (optional)
   - Configure error tracking (Sentry)
   - Set up uptime monitoring
   - Configure alerts
