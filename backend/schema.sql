-- Drop all tables (WARNING: This deletes all data)
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS summaries CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;

-- Consultations table
CREATE TABLE consultations (
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

-- Transcripts table with unique constraint
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT NOT NULL,
  segments JSONB NOT NULL,
  language VARCHAR(10),
  duration DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table with unique constraint
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE UNIQUE NOT NULL,
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

-- Questions table with unique constraint
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table (no unique constraint - multiple messages per consultation)
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_consultations_session_id ON consultations(session_id);
CREATE INDEX idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX idx_transcripts_consultation_id ON transcripts(consultation_id);
CREATE INDEX idx_summaries_consultation_id ON summaries(consultation_id);
CREATE INDEX idx_questions_consultation_id ON questions(consultation_id);
CREATE INDEX idx_chat_history_consultation_id ON chat_history(consultation_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
