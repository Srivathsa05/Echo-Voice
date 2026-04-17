# Echo Backend - AI-Powered Patient Recall System

Production-ready Node.js backend for the Echo patient recall system, featuring OpenAI Whisper transcription and GPT-4o-mini analysis.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_key_here

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### Upload & Recording
- `POST /api/upload` - Upload audio file (MP3/WAV)
- `POST /api/record` - Submit live recording

### Processing & Results
- `GET /api/process/:sessionId` - Get processing status
- `GET /api/results/:sessionId` - Get consultation results

### Chatbot
- `POST /api/chat` - Ask a question about consultation
- `GET /api/chat/:sessionId` - Get chat history

### Export & History
- `POST /api/export/pdf` - Download PDF summary
- `GET /api/history` - Get consultation history
- `GET /api/history/:sessionId` - Get specific consultation

### Health & Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/health/ready` - Readiness probe

## WebSocket Events

### Client to Server
- `join-session` - Join a processing session
- `leave-session` - Leave a processing session

### Server to Client
- `processing-progress` - Real-time processing updates

## Architecture

### Directory Structure
```
src/
  config/           # Configuration management
  controllers/      # Request handlers
  models/          # Data models
  middleware/      # Express middleware
  routes/          # API route definitions
  services/        # Business logic
  utils/           # Utility functions
  validators/      # Input validation schemas
  server.js        # Application entry point
```

### Core Services

1. **Audio Processing** (`services/audioService.js`)
   - FFmpeg-based audio conversion
   - Noise reduction and normalization
   - Duration extraction

2. **Transcription** (`services/transcriptionService.js`)
   - OpenAI Whisper integration
   - Speaker identification
   - Transcript cleaning

3. **Analysis** (`services/analysisService.js`)
   - GPT-4o-mini summary generation
   - Question generation
   - Chatbot responses

4. **PDF Generation** (`services/pdfService.js`)
   - PDFKit-based PDF creation
   - Formatted consultation reports

5. **Processing Pipeline** (`services/processingService.js`)
   - Orchestrates entire pipeline
   - WebSocket progress updates
   - Error handling and retries

### Data Models

- **Session**: Complete consultation session
- **AudioFile**: Uploaded audio metadata
- **Transcript**: Transcription with speakers
- **ConsultationSummary**: AI-generated summary
- **ForgottenQuestions**: Generated Q&A pairs
- **ChatMessage**: Chatbot conversation history
- **ProcessingStatus**: Pipeline progress tracking

## Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=required

# Server Configuration
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

## Processing Pipeline

```
1. Upload/Record
   - File validation
   - Save to temp storage
   - Create session

2. Audio Processing
   - Format conversion (WAV)
   - Noise reduction
   - Normalization

3. Transcription
   - Whisper API call
   - Speaker identification
   - Transcript parsing

4. Analysis
   - Summary generation
   - Medication extraction
   - Warning identification

5. Question Generation
   - Generate 5-7 questions
   - Generate answers
   - Compile results

6. Complete
   - Cache results
   - Notify via WebSocket
```

## Error Handling

### Retry Logic
- OpenAI API calls: 3 retries with exponential backoff
- Transcription: Automatic retry on failure
- Analysis: Automatic retry on failure

### Error Types
- `ValidationError`: Input validation errors (400)
- `MulterError`: File upload errors (400)
- `AppError`: Application errors (custom status)
- Default: Internal server error (500)

## Security

### Implemented Measures
- Helmet.js security headers
- CORS configuration
- Rate limiting (10 req/min)
- File type validation
- File size limits
- Input sanitization
- Error message sanitization

### Best Practices
- Never expose API keys in logs
- Validate all user inputs
- Use parameterized queries (when DB added)
- Implement HTTPS in production
- Regular dependency updates

## Performance

### Optimization Strategies
- In-memory caching (24h TTL)
- Async/await for non-blocking ops
- Connection pooling ready
- Automatic file cleanup
- Efficient audio processing

### Monitoring
- Health check endpoint
- Readiness probe endpoint
- Structured logging
- Error tracking

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Upload file
curl -X POST http://localhost:3001/api/upload \
  -F "audio=@test.mp3" \
  -F "doctorName=Dr. Smith" \
  -F "patientName=John Doe"

# Get results
curl http://localhost:3001/api/results/{sessionId}

# Export PDF
curl -X POST http://localhost:3001/api/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"uuid","format":"pdf"}' \
  --output consultation.pdf
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure all environment variables
- [ ] Use process manager (PM2)
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up logging aggregation
- [ ] Configure monitoring/alerting
- [ ] Set up database (if using)
- [ ] Configure backup strategy

### PM2 Setup

```bash
npm install -g pm2
pm2 start src/server.js --name echo-backend
pm2 save
pm2 startup
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p temp_audio

EXPOSE 3001

CMD ["node", "src/server.js"]
```

## Troubleshooting

### OpenAI API Issues
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### File Upload Issues
```bash
# Check temp directory permissions
ls -la temp_audio/

# Check disk space
df -h
```

### FFmpeg Issues
```bash
# Verify FFmpeg installation
ffmpeg -version

# Check audio file
ffprobe test.mp3
```

## Development

### Adding New Endpoints

1. Create route file in `src/routes/`
2. Add controller logic
3. Register route in `src/server.js`
4. Add validation schema if needed
5. Update documentation

### Adding New Services

1. Create service file in `src/services/`
2. Implement business logic
3. Add error handling
4. Write tests
5. Update documentation

## Future Enhancements

- [ ] PostgreSQL database integration
- [ ] Redis for distributed caching
- [ ] User authentication (JWT)
- [ ] File upload to S3
- [ ] Queue system for heavy processing
- [ ] Analytics and metrics
- [ ] API rate limiting per user
- [ ] Webhook notifications

## License

MIT License - See parent project LICENSE file

## Support

For backend-specific issues:
- Check logs in console
- Verify environment variables
- Test OpenAI API connectivity
- Review error messages

---

Built with Node.js, Express, and OpenAI.
