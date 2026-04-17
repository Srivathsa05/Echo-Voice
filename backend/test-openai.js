import OpenAI from 'openai';
import dotenv from 'dotenv';
import { logger } from './src/utils/logger.js';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('ERROR: OPENAI_API_KEY not found in .env file');
  console.error('Please add your OpenAI API key to backend/.env');
  process.exit(1);
}

console.log('Testing OpenAI API connection...\n');

const openai = new OpenAI({ apiKey });

async function testConnection() {
  try {
    // Test 1: List models (simple API call)
    console.log('Test 1: Listing available models...');
    const models = await openai.models.list();
    console.log('  SUCCESS: API connection working');
    console.log(`  Available models: ${models.data.length} found\n`);

    // Test 2: Whisper API with a tiny audio file
    console.log('Test 2: Testing Whisper API...');
    console.log('  Creating a tiny test audio file...');
    
    // Create a minimal WAV file (1 second of silence)
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size - 8
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk1Size
      0x01, 0x00,             // AudioFormat (PCM)
      0x01, 0x00,             // NumChannels (mono)
      0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
      0x88, 0x58, 0x01, 0x00, // ByteRate
      0x02, 0x00,             // BlockAlign
      0x10, 0x00,             // BitsPerSample
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // Subchunk2Size
    ]);
    
    const audioFile = new File([wavHeader], 'test.wav', { type: 'audio/wav' });
    
    console.log('  Sending to Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });
    
    console.log('  SUCCESS: Whisper API working');
    console.log(`  Transcription result: "${transcription}"\n`);

    // Test 3: GPT-4o-mini API
    console.log('Test 3: Testing GPT-4o-mini API...');
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" in one word.' }
      ],
      max_tokens: 10
    });
    
    console.log('  SUCCESS: GPT-4o-mini API working');
    console.log(`  Response: "${chatResponse.choices[0].message.content}"\n`);

    console.log('All tests passed! Your OpenAI API is working correctly.\n');
    console.log('If you still have issues with large files, it may be:');
    console.log('  1. File size too large (try files under 5MB)');
    console.log('  2. Network instability during upload');
    console.log('  3. OpenAI API rate limiting');
    console.log('  4. Timeout on long audio files');

  } catch (error) {
    console.error('\nERROR: API test failed');
    console.error(`Error type: ${error.constructor.name}`);
    console.error(`Error message: ${error.message}`);
    
    if (error.status) {
      console.error(`HTTP Status: ${error.status}`);
    }
    
    if (error.code === 'ECONNRESET') {
      console.error('\nConnection was reset. This could be:');
      console.error('  - Network instability');
      console.error('  - Proxy/firewall blocking');
      console.error('  - OpenAI API server issues');
    }
    
    if (error.status === 401) {
      console.error('\nInvalid API key. Please check your OPENAI_API_KEY in .env');
    }
    
    if (error.status === 429) {
      console.error('\nRate limit exceeded. Check your OpenAI API credits');
    }
    
    process.exit(1);
  }
}

testConnection();
