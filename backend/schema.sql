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
