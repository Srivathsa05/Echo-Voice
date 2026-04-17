import { config } from '../config/index.js';

export const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please upload an audio file'
    });
  }

  const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
  
  if (!config.upload.allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: `Allowed file types: ${config.upload.allowedExtensions.join(', ')}`
    });
  }

  if (req.file.size > config.upload.maxFileSize) {
    return res.status(400).json({
      error: 'File too large',
      message: `File size exceeds the limit of ${config.upload.maxFileSize / 1024 / 1024}MB`
    });
  }

  next();
};

export const validateAudioFile = (req, res, next) => {
  const { audioData } = req.body;

  if (!audioData) {
    return res.status(400).json({
      error: 'No audio data',
      message: 'Please provide audio data'
    });
  }

  try {
    const buffer = Buffer.from(audioData, 'base64');
    
    if (buffer.length === 0) {
      return res.status(400).json({
        error: 'Invalid audio data',
        message: 'Audio data is empty'
      });
    }

    if (buffer.length > config.upload.maxFileSize) {
      return res.status(400).json({
        error: 'Audio too large',
        message: `Audio size exceeds the limit of ${config.upload.maxFileSize / 1024 / 1024}MB`
      });
    }

    req.audioBuffer = buffer;
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid audio format',
      message: 'Audio data must be a valid base64 string'
    });
  }
};
