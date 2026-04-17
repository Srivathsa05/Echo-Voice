# Echo Deployment Guide

Complete step-by-step guide for deploying Echo (frontend + backend) for the first time.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Production Deployment Options](#production-deployment-options)
7. [Testing the Deployment](#testing-the-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** - Version 18.x or higher
  - Download: https://nodejs.org/
  - Verify installation: `node --version` (should be v18+)
  
- **npm** - Comes with Node.js
  - Verify installation: `npm --version`

- **Git** - For cloning the repository (optional if using zip)
  - Download: https://git-scm.com/
  - Verify installation: `git --version`

- **OpenAI API Key** - Required for Whisper AI and GPT-4o-mini
  - Get from: https://platform.openai.com/api-keys
  - Ensure you have API credits available

### Optional Software

- **VS Code** - Recommended for editing files
- **Postman** - For API testing (optional)

---

## Project Structure

```
Echo voice/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   ├── .env             # Environment variables (create this)
│   ├── .env.example     # Environment template
│   ├── package.json     # Backend dependencies
│   └── server.js        # Entry point
│
├── frontend/            # React/Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── routes/      # Page routes
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Vite configuration
│
└── README.md            # Project documentation
```

---

## Backend Deployment

### Step 1: Navigate to Backend Directory

```bash
cd "d:/Echo voice/backend"
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all backend dependencies including:
- express
- socket.io
- openai
- fluent-ffmpeg
- multer
- And other required packages

**Expected output:** A long list of packages being installed. No errors should appear.

### Step 3: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 4: Configure Environment Variables

Open the `.env` file in a text editor and configure the following:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_GPT_MODEL=gpt-4o-mini
OPENAI_MAX_RETRIES=3

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=audio/mpeg,audio/wav,audio/mp3
TEMP_STORAGE_PATH=./temp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Cache Configuration
CACHE_TTL=3600000

# Audio Configuration
AUDIO_SAMPLE_RATE=16000
AUDIO_BITRATE=128k
```

**Important:** Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Step 5: Create Temp Directory

```bash
mkdir temp
```

This directory will store temporary audio files during processing.

### Step 6: Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
[nodemon] starting `node src/server.js`
[INFO] FFprobe path set: D:\...\ffprobe.exe
[INFO] Echo Backend Server running on port 3001
[INFO] Environment: development
[INFO] CORS Origin: http://localhost:8080
```

**Note:** The server will auto-restart when you make code changes (thanks to nodemon).

### Step 7: Verify Backend is Running

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-04-17T...",
  "environment": "development"
}
```

---

## Frontend Deployment

### Step 1: Navigate to Frontend Directory

```bash
cd "d:/Echo voice/frontend"
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all frontend dependencies including:
- React
- TanStack Router
- Framer Motion
- Tailwind CSS
- Radix UI components
- socket.io-client
- And other required packages

**Expected output:** A long list of packages being installed. No errors should appear.

### Step 3: Install Socket.IO Client

```bash
npm install socket.io-client
```

This is required for real-time progress updates.

### Step 4: Configure Backend URL (if needed)

If your backend is running on a different port or URL, update the API_BASE in `src/routes/dashboard.tsx`:

```typescript
const API_BASE = "http://localhost:3001/api";
```

And the Socket.IO connection:

```typescript
const newSocket = io("http://localhost:3001");
```

### Step 5: Start Frontend Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

You should see the Echo landing page.

---

## Environment Configuration

### Backend Environment Variables (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | 3001 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `OPENAI_API_KEY` | OpenAI API key | - | **Yes** |
| `OPENAI_WHISPER_MODEL` | Whisper model name | whisper-1 | No |
| `OPENAI_GPT_MODEL` | GPT model name | gpt-4o-mini | No |
| `OPENAI_MAX_RETRIES` | Max retry attempts for API calls | 3 | No |
| `CORS_ORIGIN` | Frontend URL for CORS | http://localhost:5173 | Yes |
| `MAX_FILE_SIZE` | Max file size in bytes | 10485760 (10MB) | No |
| `ALLOWED_FILE_TYPES` | Allowed audio MIME types | audio/mpeg,audio/wav,audio/mp3 | No |
| `TEMP_STORAGE_PATH` | Temporary file storage path | ./temp | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window | 60000 (1 minute) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 10 | No |
| `CACHE_TTL` | Cache time-to-live in ms | 3600000 (1 hour) | No |
| `AUDIO_SAMPLE_RATE` | Audio sample rate for processing | 16000 | No |
| `AUDIO_BITRATE` | Audio bitrate for processing | 128k | No |

### Frontend Configuration

The frontend configuration is in the code itself:

**Backend API URL:** `src/routes/dashboard.tsx`
```typescript
const API_BASE = "http://localhost:3001/api";
```

**Socket.IO URL:** `src/routes/dashboard.tsx`
```typescript
const newSocket = io("http://localhost:3001");
```

---

## Production Deployment Options

### Option 1: Vercel (Frontend) + Render/Railway (Backend)

#### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Go to https://vercel.com/
3. Click "New Project"
4. Import your GitHub repository
5. Select the `frontend` folder as root directory
6. Configure build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. Click "Deploy"

#### Backend Deployment (Render/Railway)

1. Push code to GitHub
2. Go to https://render.com/ or https://railway.app/
3. Click "New +"
4. Select "Web Service"
5. Connect your GitHub repository
6. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
7. Add environment variables (from .env)
8. Click "Deploy"

### Option 2: Single VPS (DigitalOcean, AWS, etc.)

#### Server Setup

1. **Get a VPS** (e.g., DigitalOcean Droplet, AWS EC2)
2. **SSH into the server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

5. **Install Nginx (Web Server):**
   ```bash
   sudo apt-get install nginx
   ```

6. **Clone your repository:**
   ```bash
   git clone your-repo-url
   cd Echo-voice
   ```

#### Backend Deployment

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create .env file:**
   ```bash
   nano .env
   ```
   Add your environment variables

3. **Start backend with PM2:**
   ```bash
   pm2 start src/server.js --name echo-backend
   pm2 save
   pm2 startup
   ```

#### Frontend Deployment

1. **Build frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

2. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/echo
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /path/to/Echo-voice/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Socket.IO
       location /socket.io/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

3. **Enable site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/echo /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### SSL Certificate (HTTPS)

1. **Install Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: Docker Deployment

#### Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN mkdir -p temp

EXPOSE 3001

CMD ["node", "src/server.js"]
```

#### Create Dockerfile for Frontend

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Create docker-compose.yml

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CORS_ORIGIN=http://localhost
    volumes:
      - ./backend/temp:/app/temp
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### Deploy with Docker

1. **Create .env file:**
   ```bash
   OPENAI_API_KEY=your_key_here
   ```

2. **Build and run:**
   ```bash
   docker-compose up -d --build
   ```

---

## Testing the Deployment

### Test Backend Health

```bash
curl http://localhost:3001/api/health
```

### Test File Upload

1. Open the frontend in your browser
2. Upload a small audio file (under 2MB)
3. Enter doctor and patient names
4. Watch the processing pipeline
5. Verify results appear

### Test Socket.IO Connection

Open browser console (F12) and check for:
- Connection established message
- Progress updates during processing
- No connection errors

### Test Chat Functionality

1. After processing completes
2. Ask a question about the consultation
3. Verify answer is based on consultation only
4. Ask an unrelated question
5. Verify it says the question is irrelevant

---

## Troubleshooting

### Backend Won't Start

**Issue:** Port already in use

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Frontend Won't Connect to Backend

**Issue:** CORS error

**Solution:**
1. Check `CORS_ORIGIN` in backend `.env`
2. Ensure it matches your frontend URL
3. Restart backend after changing

### Socket.IO Connection Failed

**Issue:** Connection refused

**Solution:**
1. Ensure backend is running
2. Check Socket.IO URL in frontend code
3. Verify no firewall blocking WebSocket connections

### File Upload Fails

**Issue:** File too large or wrong format

**Solution:**
1. Check `MAX_FILE_SIZE` in `.env`
2. Verify file is MP3 or WAV format
3. Check browser console for error messages

### OpenAI API Errors

**Issue:** Invalid API key or no credits

**Solution:**
1. Verify `OPENAI_API_KEY` is correct
2. Check OpenAI dashboard for credits
3. Ensure API key has necessary permissions

### FFmpeg Errors

**Issue:** FFprobe not found

**Solution:**
- This is handled gracefully now
- Audio duration will be null but processing continues
- Not critical for functionality

### Production Deployment Issues

**Issue:** App works locally but not in production

**Solution:**
1. Check environment variables are set in production
2. Verify CORS_ORIGIN is set to production domain
3. Check firewall rules allow required ports
4. Review server logs for errors

---

## Security Best Practices

### Backend Security

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong API keys** - Rotate regularly
3. **Enable HTTPS** - Use SSL certificates in production
4. **Rate limiting** - Already implemented, adjust as needed
5. **Input validation** - Already implemented with Joi
6. **File validation** - Check file types and sizes

### Frontend Security

1. **Validate on backend** - Never trust frontend validation
2. **Sanitize user input** - Prevent XSS attacks
3. **Use HTTPS** - Only serve over HTTPS in production
4. **CORS configuration** - Only allow trusted origins

---

## Monitoring and Maintenance

### Log Management

**Development:** Logs shown in terminal

**Production:** Use PM2 logs:
```bash
pm2 logs echo-backend
```

### Backup Strategy

- Regularly backup database (if using one)
- Archive processed consultation data
- Keep backups of `.env` file (securely)

### Updates

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Install new dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Restart services:**
   ```bash
   pm2 restart echo-backend
   # Rebuild frontend
   cd frontend && npm run build
   ```

---

## Quick Reference Commands

### Backend

```bash
cd backend
npm install              # Install dependencies
npm run dev             # Start development server
node src/server.js      # Start production server
pm2 start src/server.js --name echo-backend  # Start with PM2
pm2 logs echo-backend   # View logs
pm2 restart echo-backend # Restart
```

### Frontend

```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
```

### Testing

```bash
curl http://localhost:3001/api/health  # Test backend health
cd backend && node test-openai.js      # Test OpenAI API
```

---

## Support

If you encounter issues:

1. Check `TROUBLESHOOTING.md` for common problems
2. Review server logs for error messages
3. Check browser console (F12) for frontend errors
4. Verify all environment variables are set correctly
5. Ensure OpenAI API key has credits

---

## Deployment Checklist

Before going to production:

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` file configured with correct values
- [ ] OpenAI API key valid and has credits
- [ ] CORS_ORIGIN set to correct domain
- [ ] Temp directory created
- [ ] Backend server starts successfully
- [ ] Frontend server starts successfully
- [ ] Health endpoint returns success
- [ ] File upload works
- [ ] Processing pipeline completes
- [ ] Socket.IO connection works
- [ ] Chat functionality works
- [ ] PDF export works
- [ ] SSL certificate installed (production)
- [ ] Firewall rules configured
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place

---

**Deployment Complete!** 🎉

Your Echo application is now deployed and ready to use.
