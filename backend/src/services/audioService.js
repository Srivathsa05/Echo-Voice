import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

ffmpeg.setFfmpegPath(ffmpegStatic);

// Try to set ffprobe path - handle different package structures
try {
  const ffmpegDir = path.dirname(ffmpegStatic);
  const ffprobePath = path.join(ffmpegDir, 'ffprobe.exe');
  ffmpeg.setFfprobePath(ffprobePath);
  logger.info('FFprobe path set:', ffprobePath);
} catch (error) {
  logger.warn('Could not set ffprobe path:', error.message);
  // Continue without ffprobe - some operations will be limited
}

export const audioService = {
  async convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3') // Use MP3 instead of WAV for smaller file size
        .audioFrequency(config.audio.sampleRate)
        .audioBitrate('64k') // Lower bitrate to reduce file size
        .audioChannels(1)
        .on('start', (commandLine) => {
          logger.debug('FFmpeg command:', commandLine);
        })
        .on('end', () => {
          logger.info('Audio conversion completed');
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error('Audio conversion error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  },

  async getAudioDuration(filePath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.warn('Could not get audio duration (ffprobe not available):', err.message);
          resolve(null); // Return null instead of rejecting
          return;
        }

        const duration = metadata.format.duration;
        resolve(duration);
      });
    });
  },

  async normalizeAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters([
          'loudnorm=I=-16:TP=-1.5:LRA=11',
          'highpass=f=200',
          'lowpass=f=3000'
        ])
        .toFormat('mp3') // Use MP3 instead of WAV
        .audioBitrate('64k') // Lower bitrate for smaller file size
        .on('end', () => {
          logger.info('Audio normalization completed');
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error('Audio normalization error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  },

  async processAudioFile(inputPath, sessionId) {
    try {
      const outputDir = config.upload.tempStoragePath;
      await fs.mkdir(outputDir, { recursive: true });

      const normalizedPath = path.join(outputDir, `${sessionId}_normalized.mp3`);
      await this.normalizeAudio(inputPath, normalizedPath);

      const duration = await this.getAudioDuration(normalizedPath);

      return {
        processedPath: normalizedPath,
        duration
      };
    } catch (error) {
      logger.error('Error processing audio file:', error);
      throw error;
    }
  },

  async saveAudioBuffer(buffer, filename) {
    const outputDir = config.upload.tempStoragePath;
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, filename);
    await fs.writeFile(filePath, buffer);

    return filePath;
  }
};
