# Echo - AI-Powered Patient Recall System

A sophisticated full-stack application that transforms medical consultation audio recordings into clear, patient-friendly summaries, medication timelines, and follow-up questions using OpenAI's Whisper and GPT-4o-mini models.

## Overview

Echo helps patients and caregivers remember and understand medical consultations by automatically transcribing audio recordings and generating comprehensive summaries with:

- **Plain language explanations** of diagnoses and treatments
- **Medication timelines** with dosages and schedules
- **Forgotten questions** patients should ask
- **Real-time processing** with live status updates
- **Multi-language support** (English)
- **PDF export** for sharing and archiving

## Tech Stack

### Frontend
- **Framework**: TanStack Start (React-based)
- **UI Components**: Radix UI + ShadCN
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Routing**: TanStack Router
- **Icons**: Lucide React
- **Audio Visualization**: WaveSurfer.js
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **AI Services**: OpenAI (Whisper, GPT-4o-mini)
- **File Processing**: Multer, FFmpeg
- **PDF Generation**: PDFKit
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

## Features

### Frontend Features
- **Audio Upload**: Drag-and-drop or click to upload MP3/WAV files
- **Live Recording**: Record consultations directly in the browser
- **Real-time Processing**: Live progress updates via WebSocket
- **Interactive Results**: Tabbed interface for summary, questions, and transcript
- **Medication Timeline**: Visual medication cards with schedules
- **Urgency Indicators**: Color-coded warnings and important notes
- **Transcript View**: Full consultation transcript with speaker identification
- **Chatbot Integration**: Ask follow-up questions about your consultation
- **History Management**: Browse and search past consultations
- **PDF Export**: Download consultation summaries as PDFs
- **Sharing Options**: WhatsApp, SMS, and link sharing
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Glass Morphism UI**: Modern, elegant user interface

### Backend Features
- **Audio Processing**: Noise reduction and format conversion
- **Whisper Transcription**: High-quality speech-to-text
- **GPT-4o-mini Analysis**: Intelligent summary and question generation
- **Session Management**: UUID-based session tracking
- **In-memory Caching**: Fast result retrieval with TTL
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Comprehensive error management
- **File Cleanup**: Automatic cleanup of old files
- **Health Checks**: Monitoring endpoints for orchestration
- **Scalable Architecture**: Ready for horizontal scaling

## Project Structure

```
Echo voice/
  frontend/                 # React/TanStack Start frontend
    src/
      components/           # UI components
        ui/                # ShadCN components
        glass/             # Glass morphism components
        voice/             # Audio-related components
      routes/              # Page routes
        index.tsx          # Landing page
        dashboard.tsx      # Main dashboard
        history.tsx        # Consultation history
      hooks/               # Custom React hooks
      lib/                 # Utilities and configurations
      styles.css           # Global styles
    package.json
    vite.config.ts
    tailwind.config.js

  backend/                 # Node.js/Express backend
    src/
      config/             # Configuration files
      controllers/        # Route controllers
      models/             # Data models
      middleware/         # Custom middleware
      routes/             # API routes
      services/           # Business logic
      utils/              # Utility functions
      validators/        # Input validation
      server.js           # Main entry point
    package.json
    .env.example
    nodemon.json
```

## Installation

### Prerequisites
- Node.js 18+ installed
- OpenAI API key with access to Whisper and GPT-4o-mini
- Git (optional)

### Frontend Setup

```bash
cd frontend
npm install
```

### Backend Setup

```bash
cd backend
npm install
```

### Environment Configuration

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=3001
NODE_ENV=development
```

## Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### 1. Upload Audio File
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- audio: File (MP3/WAV, max 10MB)
- doctorName: string
- patientName: string

Response:
{
  "sessionId": "uuid",
  "message": "File uploaded successfully. Processing started.",
  "status": { ... }
}
```

#### 2. Live Recording
```http
POST /api/record
Content-Type: application/json

Body:
{
  "doctorName": "string",
  "patientName": "string",
  "audioData": "base64_encoded_audio"
}

Response:
{
  "sessionId": "uuid",
  "message": "Recording saved successfully. Processing started.",
  "status": { ... }
}
```

#### 3. Get Processing Status
```http
GET /api/process/:sessionId

Response:
{
  "sessionId": "uuid",
  "status": {
    "currentStage": "transcribe",
    "progress": 30,
    "completed": false,
    "stages": { ... }
  }
}
```

#### 4. Get Results
```http
GET /api/results/:sessionId

Response:
{
  "sessionId": "uuid",
  "doctorName": "string",
  "patientName": "string",
  "summary": { ... },
  "questions": { ... },
  "transcript": { ... }
}
```

#### 5. Chatbot Query
```http
POST /api/chat
Content-Type: application/json

Body:
{
  "sessionId": "uuid",
  "question": "string"
}

Response:
{
  "sessionId": "uuid",
  "chat": {
    "question": { ... },
    "answer": { ... }
  }
}
```

#### 6. Export PDF
```http
POST /api/export/pdf
Content-Type: application/json

Body:
{
  "sessionId": "uuid",
  "format": "pdf"
}

Response:
PDF file download
```

#### 7. Get History
```http
GET /api/history?search=query&tag=cardiology

Response:
{
  "total": 5,
  "consultations": [ ... ]
}
```

#### 8. Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-04-17T...",
  "services": { ... }
}
```

### WebSocket Events

#### Join Session
```javascript
socket.emit('join-session', sessionId);
```

#### Processing Progress
```javascript
socket.on('processing-progress', (status) => {
  console.log('Progress:', status.progress);
});
```

## Processing Pipeline

1. **Upload** (0-100%)
   - File validation
   - Audio preprocessing
   - Noise reduction
   - Format conversion

2. **Transcribe** (100-300%)
   - Whisper API call
   - Speaker identification
   - Transcript cleaning

3. **Analyze** (300-600%)
   - GPT-4o-mini summary generation
   - Medication extraction
   - Warning identification

4. **Generate** (600-1000%)
   - Question generation
   - Answer generation
   - Result compilation

## Data Models

### Session
```javascript
{
  id: "uuid",
  doctorName: "string",
  patientName: "string",
  createdAt: "ISO8601",
  audioFile: { ... },
  transcript: { ... },
  summary: { ... },
  questions: { ... },
  status: { ... },
  chatHistory: [ ... ]
}
```

### Consultation Summary
```javascript
{
  diagnosis: [{ title, urgency }],
  medications: [{ name, dose, frequency, timing, color }],
  nextSteps: [{ title, urgency }],
  warnings: [{ title, urgency }],
  importantNotes: [{ title, urgency }],
  vitals: [{ title, urgency }],
  lifestyle: [{ title, urgency }],
  labs: [{ title, urgency }]
}
```

### Processing Status
```javascript
{
  currentStage: "upload|transcribe|analyze|generate|completed",
  progress: 0-100,
  completed: boolean,
  error: string | null,
  stages: {
    upload: { status, progress, message },
    transcribe: { status, progress, message },
    analyze: { status, progress, message },
    generate: { status, progress, message }
  }
}
```

## Configuration

### Backend Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your_key_here

# Server
PORT=3001
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=mp3,wav,m4a
TEMP_STORAGE_PATH=./temp_audio/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Cache
CACHE_TTL_HOURS=24

# CORS
CORS_ORIGIN=http://localhost:5173

# Audio Processing
AUDIO_BITRATE=128k
AUDIO_SAMPLE_RATE=44100
```

## Deployment

### Backend Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure all environment variables
   - Ensure OpenAI API key is set

2. **Build & Run**
   ```bash
   cd backend
   npm install --production
   npm start
   ```

3. **Process Manager** (PM2)
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name echo-backend
   pm2 save
   pm2 startup
   ```

### Frontend Deployment

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Static Hosting** (Vercel, Netlify, etc.)
   - Deploy the `dist/` folder
   - Configure API proxy to backend URL

3. **Docker** (Optional)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   CMD ["npm", "run", "preview"]
   ```

## Security Considerations

- **API Key Protection**: Never commit `.env` files
- **Rate Limiting**: Configured to prevent abuse
- **File Validation**: Strict file type and size checks
- **CORS**: Configured for specific origins
- **Helmet**: Security headers enabled
- **Input Validation**: All inputs validated with Joi
- **Error Handling**: No sensitive data in error messages

## Performance Optimization

- **Caching**: In-memory cache with 24-hour TTL
- **Async Processing**: Non-blocking operations
- **Connection Pooling**: Ready for database integration
- **File Cleanup**: Automatic cleanup of old files
- **Retry Logic**: Automatic retries for transient errors

## Future Enhancements

- **Database Integration**: PostgreSQL for persistent storage
- **User Authentication**: Multi-user support
- **Cloud Storage**: S3 for audio file storage
- **Multi-language**: Enhanced language support
- **Mobile App**: React Native mobile application
- **Analytics**: Usage analytics and insights
- **EHR Integration**: Integration with electronic health records
- **Voice Commands**: Voice-activated features
- **Offline Mode**: PWA capabilities

## Troubleshooting

### Common Issues

**1. OpenAI API Errors**
- Verify API key is correct
- Check API quota and billing
- Ensure model access is enabled

**2. File Upload Fails**
- Check file size (max 10MB)
- Verify file format (MP3/WAV/M4A)
- Check temp directory permissions

**3. Processing Stuck**
- Check backend logs for errors
- Verify OpenAI API connectivity
- Restart backend server

**4. WebSocket Connection Issues**
- Check CORS configuration
- Verify Socket.IO version compatibility
- Check network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: [Repository URL]
- Email: support@echo-health.com

## Acknowledgments

- OpenAI for Whisper and GPT-4o-mini
- Radix UI for component library
- ShadCN for UI patterns
- TanStack for router and state management
- Framer Motion for animations

---

Built with care for better healthcare communication.
