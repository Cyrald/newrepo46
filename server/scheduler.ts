import { storage } from './storage';
import { logger } from './utils/logger';
import fs from 'fs/promises';
import path from 'path';

const DATA_RETENTION_MONTHS = 37;
const LOG_RETENTION_DAYS = 120;

async function cleanupOldData() {
  try {
    logger.info('Starting data retention cleanup...');

    const deletedMessages = await storage.deleteOldMessages(DATA_RETENTION_MONTHS);
    logger.info(`Deleted ${deletedMessages} old support messages`);

    const anonymizedOrders = await storage.anonymizeOldOrders(DATA_RETENTION_MONTHS);
    logger.info(`Anonymized ${anonymizedOrders} old orders`);

    await cleanupOldLogs();

    logger.info('Data retention cleanup completed successfully');
  } catch (error: any) {
    logger.error('Data retention cleanup failed', { error: error.message });
  }
}

async function cleanupOldLogs() {
  const logsDir = path.join(process.cwd(), 'logs');
  
  try {
    try {
      await fs.access(logsDir);
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
      logger.info('Created logs directory');
    }

    const files = await fs.readdir(logsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      try {
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      } catch (error: any) {
        logger.warn('Failed to delete log file', { file, error: error.message });
      }
    }

    logger.info(`Deleted ${deletedCount} old log files`);
  } catch (error: any) {
    logger.error('Failed to cleanup old logs', { error: error.message });
  }
}

export function startDataRetentionScheduler() {
  const DAILY_MS = 24 * 60 * 60 * 1000;

  cleanupOldData();

  setInterval(cleanupOldData, DAILY_MS);

  logger.info('Data retention scheduler started', {
    dataRetentionMonths: DATA_RETENTION_MONTHS,
    logRetentionDays: LOG_RETENTION_DAYS,
  });
}
