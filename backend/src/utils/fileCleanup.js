import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export async function cleanupOldFiles() {
  try {
    const tempPath = config.upload.tempStoragePath;
    
    try {
      await fs.access(tempPath);
    } catch {
      await fs.mkdir(tempPath, { recursive: true });
      return;
    }

    const files = await fs.readdir(tempPath);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempPath, file);
      
      try {
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.debug(`Deleted old file: ${file}`);
        }
      } catch (error) {
        logger.warn(`Failed to process file ${file}:`, error.message);
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old files from temp directory`);
    }
  } catch (error) {
    logger.error('Error during file cleanup:', error);
  }
}
