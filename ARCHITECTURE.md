# Echo System Architecture

## High-Level Architecture

```
                    +-------------------+
                    |   User Browser    |
                    |   (React Frontend)|
                    +---------+---------+
                              |
                              | HTTP/WebSocket
                              v
                    +-------------------+
                    |   Express Server  |
                    |   (Node.js)       |
                    +---------+---------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
    +-----------------+             +-----------------+
    |  In-Memory      |             |  OpenAI API     |
    |  Cache Store    |             |  (Whisper +     |
    |  (Session Data) |             |   GPT-4o-mini)  |
    +-----------------+             +-----------------+
              |
              v
    +-----------------+
    |  Temp Storage   |
    |  (Audio Files)  |
    +-----------------+
```

## Component Diagram

### Frontend Components

```
Frontend (React/TanStack Start)
|
+-- Pages
|   +-- Landing Page (index.tsx)
|   +-- Dashboard (dashboard.tsx)
|   +-- History (history.tsx)
|
+-- Components
|   +-- UI Components (ShadCN)
|   +-- Glass Components (Glass morphism)
|   +-- Voice Components (Audio visualization)
|
+-- State Management
|   +-- Zustand stores
|   +-- React hooks
|
+-- Services
|   +-- API client
|   +-- WebSocket client
|   +-- Audio recording
```

### Backend Components

```
Backend (Express/Node.js)
|
+-- Routes
|   +-- upload.js - File upload handling
|   +-- record.js - Live recording handling
|   +-- process.js - Processing status
|   +-- results.js - Results retrieval
|   +-- chat.js - Chatbot queries
|   +-- export.js - PDF export
|   +-- history.js - Consultation history
|   +-- health.js - Health checks
|
+-- Services
|   +-- audioService.js - Audio processing
|   +-- transcriptionService.js - Whisper integration
|   +-- analysisService.js - GPT-4o-mini analysis
|   +-- pdfService.js - PDF generation
|   +-- processingService.js - Pipeline orchestration
|
+-- Models
|   +-- Session.js - Consultation session
|   +-- AudioFile.js - Audio metadata
|   +-- Transcript.js - Transcription data
|   +-- ConsultationSummary.js - Summary data
|   +-- ForgottenQuestions.js - Q&A pairs
|   +-- ChatMessage.js - Chat history
|   +-- ProcessingStatus.js - Pipeline status
|
+-- Middleware
|   +-- errorHandler.js - Error handling
|   +-- fileValidation.js - File validation
|   +-- validation.js - Input validation
|
+-- Utils
|   +-- cache.js - In-memory caching
|   +-- sessionStore.js - Session management
|   +-- fileCleanup.js - File cleanup
|   +-- logger.js - Logging utility
```

## Data Flow

### Upload Flow

```
User Uploads File
       |
       v
Frontend: File selection & validation
       |
       v
POST /api/upload (multipart/form-data)
       |
       v
Backend: Multer saves to temp storage
       |
       v
Backend: Create session with UUID
       |
       v
Backend: Start processing pipeline (async)
       |
       v
WebSocket: Emit 'processing-progress' events
       |
       v
Frontend: Update progress UI
```

### Processing Pipeline Flow

```
1. Audio Processing (audioService)
   - Format conversion to WAV
   - Noise reduction
   - Normalization
   - Duration extraction
       |
       v
2. Transcription (transcriptionService)
   - OpenAI Whisper API call
   - Speaker identification
   - Transcript cleaning
   - Segment parsing
       |
       v
3. Analysis (analysisService)
   - GPT-4o-mini summary generation
   - Medication extraction
   - Warning identification
   - Next steps generation
       |
       v
4. Question Generation (analysisService)
   - Generate 5-7 questions
   - Generate answers
   - Compile Q&A pairs
       |
       v
5. Completion
   - Cache results
   - Emit completion event
   - Update session status
```

### Chat Flow

```
User Asks Question
       |
       v
POST /api/chat
       |
       v
Backend: Retrieve session transcript
       |
       v
Backend: GPT-4o-mini generates answer
       |
       v
Backend: Store message in chat history
       |
       v
Return: Question + Answer
```

### Export Flow

```
User Requests PDF
       |
       v
POST /api/export/pdf
       |
       v
Backend: Retrieve session data
       |
       v
Backend: Generate PDF (pdfService)
       |
       v
Backend: Stream PDF to client
       |
       v
Browser: Download PDF file
```

## API Layer Structure

```
API Layer
|
+-- REST Endpoints
|   +-- POST /api/upload
|   +-- POST /api/record
|   +-- GET /api/process/:sessionId
|   +-- GET /api/results/:sessionId
|   +-- POST /api/chat
|   +-- GET /api/chat/:sessionId
|   +-- POST /api/export/pdf
|   +-- GET /api/history
|   +-- GET /api/history/:sessionId
|   +-- GET /api/health
|   +-- GET /api/health/ready
|
+-- WebSocket Events
|   +-- join-session
|   +-- leave-session
|   +-- processing-progress
```

## Data Model Relationships

```
Session (1)
  |
  +-- has 1 AudioFile
  |
  +-- has 1 Transcript
  |
  +-- has 1 ConsultationSummary
  |
  +-- has 1 ForgottenQuestions
  |
  +-- has 1 ProcessingStatus
  |
  +-- has many ChatMessages
```

## Security Layers

```
Security
|
+-- Network Layer
|   +-- Helmet.js (Security headers)
|   +-- CORS (Cross-origin restrictions)
|
+-- Application Layer
|   +-- Rate limiting (10 req/min)
|   +-- Input validation (Joi schemas)
|   +-- File type validation
|   +-- File size limits
|
+-- Data Layer
|   +-- Environment variable protection
|   +-- Error message sanitization
|   +-- No sensitive data in logs
```

## Scalability Considerations

### Current Architecture
- Single-node deployment
- In-memory caching
- File-based storage
- No database

### Scaling Path

```
Phase 1: Current (Single Node)
  - In-memory cache
  - File storage
  - Single instance

Phase 2: Horizontal Scaling
  - Load balancer
  - Multiple instances
  - Shared cache (Redis)
  - Shared storage (S3)

Phase 3: Database Integration
  - PostgreSQL for sessions
  - S3 for audio files
  - Redis for caching
  - Queue system for processing

Phase 4: Microservices
  - Separate audio processing service
  - Separate AI processing service
  - Separate storage service
  - API Gateway
```

## Performance Optimization

### Caching Strategy
```
Request -> Check Cache -> Hit? -> Return
                     |
                     v
                  Miss -> Process -> Cache -> Return
```

### Async Processing
```
Request -> Queue -> Worker Process -> Cache -> Notify
```

### File Cleanup
```
Scheduled Job (hourly)
  -> Scan temp directory
  -> Delete files > 24h
  -> Log cleanup
```

## Error Handling Strategy

```
Error Occurs
    |
    v
Log Error (with context)
    |
    v
Determine Error Type
    |
    +-- ValidationError -> 400 + details
    |
    +-- FileNotFoundError -> 404
    |
    +-- APIError -> Retry (3x)
    |
    +-- Unknown -> 500 + generic message
```

## Monitoring & Observability

### Health Checks
```
/api/health
  - Server status
  - Cache status
  - Dependency status

/api/health/ready
  - API key configured
  - Services operational
```

### Logging
```
[INFO] - Normal operations
[WARN] - Non-critical issues
[ERROR] - Errors requiring attention
[DEBUG] - Development info (dev only)
```

## Technology Stack Rationale

### Frontend Choices
- **TanStack Start**: Modern React framework with excellent routing
- **ShadCN**: Beautiful, accessible components
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Zustand**: Simple state management

### Backend Choices
- **Express.js**: Mature, widely-used Node framework
- **Socket.IO**: Real-time communication
- **OpenAI SDK**: Official SDK for AI services
- **Multer**: Robust file upload handling
- **FFmpeg**: Powerful audio processing
- **PDFKit**: PDF generation in Node.js

## Deployment Architecture

### Development
```
Local Machine
  +-- Frontend (localhost:5173)
  +-- Backend (localhost:3001)
  +-- OpenAI API (external)
```

### Production
```
Load Balancer
  |
  +-- Frontend Server (CDN)
  |   +-- Static files
  |
  +-- Backend Servers (PM2 Cluster)
  |   +-- API endpoints
  |   +-- WebSocket
  |
  +-- Storage (S3)
  |   +-- Audio files
  |
  +-- Database (PostgreSQL)
  |   +-- Session data
  |
  +-- Cache (Redis)
  |   +-- Session cache
  |
  +-- OpenAI API (external)
```

## Future Enhancements

### Planned Features
- [ ] User authentication
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] EHR integration
- [ ] Voice commands
- [ ] Offline mode (PWA)
- [ ] Analytics dashboard
- [ ] Admin panel

### Technical Improvements
- [ ] PostgreSQL database
- [ ] Redis distributed cache
- [ ] Queue system (BullMQ)
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] TypeScript migration
- [ ] Comprehensive testing
- [ ] CI/CD pipeline

---

This architecture document provides a comprehensive view of the Echo system's design, data flow, and future scalability path.
