# Neon PostgreSQL Integration Guide

Complete guide for integrating Neon PostgreSQL database with Echo for persistent storage.

## Prerequisites

- Neon PostgreSQL connection string
- Node.js 18+
- Completed backend setup

## Step 1: Add Connection String to .env

Yes, saving the connection string in `.env` is sufficient and recommended for security.

Add this to your `backend/.env` file:

```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Important:** Replace the connection string with your actual Neon connection string from the Neon dashboard.

## Step 2: Install PostgreSQL Dependencies

```bash
cd backend
npm install pg
```

## Step 3: Create Database Schema

Create the database tables needed for Echo:

```sql
-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  audio_file_name VARCHAR(255),
  audio_duration DECIMAL(10, 2),
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
  questions TEXT[] NOT NULL,
  answers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_consultation_id ON transcripts(consultation_id);
CREATE INDEX IF NOT EXISTS idx_summaries_consultation_id ON summaries(consultation_id);
CREATE INDEX IF NOT EXISTS idx_questions_consultation_id ON questions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_consultation_id ON chat_history(consultation_id);
```

## Step 4: Create Database Connection Module

Create `backend/src/config/database.js`:

```javascript
import pkg from 'pg';
const { Pool } = pkg;
import { logger } from '../utils/logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params)
    .then(res => {
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    })
    .catch(err => {
      logger.error('Database query error:', err);
      throw err;
    });
};

export const getClient = () => {
  return pool.connect();
};

export default pool;
```

## Step 5: Create Database Models

Create `backend/src/models/consultationModel.js`:

```javascript
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const consultationModel = {
  async createConsultation(data) {
    try {
      const { sessionId, doctorName, patientName, audioFileName, audioDuration } = data;
      const result = await query(
        `INSERT INTO consultations (session_id, doctor_name, patient_name, audio_file_name, audio_duration)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [sessionId, doctorName, patientName, audioFileName, audioDuration]
      );
      logger.info(`Consultation created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating consultation:', error);
      throw error;
    }
  },

  async getConsultationBySessionId(sessionId) {
    try {
      const result = await query(
        'SELECT * FROM consultations WHERE session_id = $1',
        [sessionId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching consultation:', error);
      throw error;
    }
  },

  async getAllConsultations(limit = 50, offset = 0, search = '') {
    try {
      let queryText = `
        SELECT c.id, c.session_id, c.doctor_name, c.patient_name, 
               c.audio_file_name, c.audio_duration, c.created_at
        FROM consultations c
      `;
      let params = [];
      let paramCount = 1;

      if (search) {
        queryText += ` WHERE c.doctor_name ILIKE $${paramCount} OR c.patient_name ILIKE $${paramCount}`;
        params.push(`%${search}%`);
        paramCount++;
      }

      queryText += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching consultations:', error);
      throw error;
    }
  },

  async saveTranscript(consultationId, transcriptData) {
    try {
      const { rawText, cleanedText, segments, language, duration } = transcriptData;
      const result = await query(
        `INSERT INTO transcripts (consultation_id, raw_text, cleaned_text, segments, language, duration)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (consultation_id) DO UPDATE
         SET raw_text = $2, cleaned_text = $3, segments = $4, language = $5, duration = $6
         RETURNING *`,
        [consultationId, rawText, cleanedText, JSON.stringify(segments), language, duration]
      );
      logger.info(`Transcript saved for consultation: ${consultationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving transcript:', error);
      throw error;
    }
  },

  async saveSummary(consultationId, summaryData) {
    try {
      const result = await query(
        `INSERT INTO summaries (consultation_id, diagnosis, medications, next_steps, warnings, important_notes, vitals, lifestyle, labs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (consultation_id) DO UPDATE
         SET diagnosis = $2, medications = $3, next_steps = $4, warnings = $5, important_notes = $6, vitals = $7, lifestyle = $8, labs = $9
         RETURNING *`,
        [consultationId, JSON.stringify(summaryData.diagnosis), JSON.stringify(summaryData.medications), 
         JSON.stringify(summaryData.nextSteps), JSON.stringify(summaryData.warnings), JSON.stringify(summaryData.importantNotes),
         JSON.stringify(summaryData.vitals), JSON.stringify(summaryData.lifestyle), JSON.stringify(summaryData.labs)]
      );
      logger.info(`Summary saved for consultation: ${consultationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving summary:', error);
      throw error;
    }
  },

  async saveQuestions(consultationId, questionsData) {
    try {
      const { questions, answers } = questionsData;
      const result = await query(
        `INSERT INTO questions (consultation_id, questions, answers)
         VALUES ($1, $2, $3)
         ON CONFLICT (consultation_id) DO UPDATE
         SET questions = $2, answers = $3
         RETURNING *`,
        [consultationId, questions, answers]
      );
      logger.info(`Questions saved for consultation: ${consultationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving questions:', error);
      throw error;
    }
  },

  async getFullConsultation(sessionId) {
    try {
      const consultation = await this.getConsultationBySessionId(sessionId);
      if (!consultation) return null;

      const transcriptResult = await query(
        'SELECT * FROM transcripts WHERE consultation_id = $1',
        [consultation.id]
      );

      const summaryResult = await query(
        'SELECT * FROM summaries WHERE consultation_id = $1',
        [consultation.id]
      );

      const questionsResult = await query(
        'SELECT * FROM questions WHERE consultation_id = $1',
        [consultation.id]
      );

      return {
        ...consultation,
        transcript: transcriptResult.rows[0] || null,
        summary: summaryResult.rows[0] || null,
        questions: questionsResult.rows[0] || null
      };
    } catch (error) {
      logger.error('Error fetching full consultation:', error);
      throw error;
    }
  }
};
```

## Step 6: Update Processing Service to Save to Database

Update `backend/src/services/processingService.js` to save results to database after processing completes.

Add database save calls at the end of `processUpload` function.

## Step 7: Update History Route

Update `backend/src/routes/history.js` to fetch from database instead of static data.

## Step 8: Run Initial Database Setup

Run the SQL schema in your Neon database dashboard or use a migration tool.

### Option A: Run via Neon Dashboard
1. Go to Neon dashboard
2. Open SQL Editor
3. Paste the schema SQL
4. Click Run

### Option B: Run via Node.js Script

Create `backend/scripts/setup-database.js`:

```javascript
import { query } from '../src/config/database.js';
import fs from 'fs';

const schema = fs.readFileSync('./schema.sql', 'utf8');

async function setupDatabase() {
  try {
    await query(schema);
    console.log('Database schema created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
```

Run:
```bash
cd backend
node scripts/setup-database.js
```

## Step 9: Update .env.example

Add to `backend/.env.example`:

```env
# Neon PostgreSQL Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Step 10: Test the Integration

1. Restart backend server
2. Upload a consultation audio
3. Check if data is saved to database
4. Test history endpoint

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL is correct
- Check if SSL mode is required (Neon requires SSL)
- Ensure network allows connections to Neon

### SSL Certificate Errors
Neon uses SSL by default. The database config handles this automatically with:
```javascript
ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
```

### Table Already Exists
The schema uses `IF NOT EXISTS` so it's safe to run multiple times.

### Performance Issues
- Add more indexes as needed
- Use connection pooling (already configured)
- Consider read replicas for high traffic

## Security Notes

- **Never commit .env file** with DATABASE_URL
- Use environment-specific databases (dev/staging/prod)
- Rotate connection strings if compromised
- Use Neon's built-in backup features
- Enable row-level security if needed

## Migration Guide from In-Memory to PostgreSQL

### Before Migration
- Export existing consultations if any
- Backup current .env file

### After Migration
- Test all endpoints
- Verify data integrity
- Monitor database performance
- Set up automated backups (Neon does this automatically)

## Benefits of Using Neon PostgreSQL

1. **Serverless** - No infrastructure management
2. **Auto-scaling** - Handles growth automatically
3. **Backups** - Automatic point-in-time recovery
4. **Branching** - Database branching for development
5. **Free Tier** - Generous free tier for development
6. **Fast** - Built on PostgreSQL with optimizations

## Next Steps

After integration:
1. Monitor database usage in Neon dashboard
2. Set up alerts for database metrics
3. Implement database migrations for schema changes
4. Add data retention policies
5. Consider adding Redis for caching frequently accessed data
