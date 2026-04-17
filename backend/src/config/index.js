import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    whisperModel: 'whisper-1',
    gptModel: 'gpt-4o-mini',
    maxRetries: 3,
    timeout: 60000
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'mp3,wav,m4a').split(','),
    tempStoragePath: path.resolve(process.env.TEMP_STORAGE_PATH || './temp_audio/')
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
  },
  
  cache: {
    ttlHours: parseInt(process.env.CACHE_TTL_HOURS) || 24
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  
  audio: {
    bitrate: process.env.AUDIO_BITRATE || '128k',
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE) || 44100
  }
};

export default config;
