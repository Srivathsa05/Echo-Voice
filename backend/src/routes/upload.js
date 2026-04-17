import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { AudioFile } from '../models/AudioFile.js';
import { Session } from '../models/Session.js';
import { sessionStore } from '../utils/sessionStore.js';
import { processingService } from '../services/processingService.js';
import { validateFile } from '../middleware/fileValidation.js';
import { validate } from '../middleware/validation.js';
import { uploadSchema } from '../validators/uploadValidator.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempPath = config.upload.tempStoragePath;
    const fs = await import('fs/promises');
    await fs.mkdir(tempPath, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = config.upload.allowedExtensions;
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  }
});

router.post('/', upload.single('audio'), validateFile, validate(uploadSchema), async (req, res, next) => {
  try {
    const { doctorName, patientName } = req.validatedData;
    const audioFile = req.file;

    const sessionId = uuidv4();

    const audio = new AudioFile({
      filename: audioFile.originalname,
      filepath: audioFile.path,
      size: audioFile.size,
      sessionId,
      mimeType: audioFile.mimetype
    });

    const session = await sessionStore.createSession({
      id: sessionId,
      doctorName,
      patientName,
      audioFile: audio
    });

    logger.info(`File uploaded: ${audioFile.originalname}, Session: ${sessionId}`);

    processingService.processUpload(sessionId, audioFile.path, req.io)
      .then(() => {
        logger.info(`Processing completed for session: ${sessionId}`);
      })
      .catch((error) => {
        logger.error(`Processing failed for session ${sessionId}:`, error);
      });

    res.status(201).json({
      sessionId,
      message: 'File uploaded successfully. Processing started.',
      status: session.status.toJSON()
    });
  } catch (error) {
    logger.error('Upload error:', error);
    next(error);
  }
});

export default router;
