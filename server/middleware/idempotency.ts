import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { idempotencyKeys } from '@shared/schema';
import { eq, lt } from 'drizzle-orm';
import { logger } from '../utils/logger';

const IDEMPOTENCY_KEY_EXPIRY_HOURS = 24;

export async function handleIdempotency(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    return res.status(400).json({
      message: 'Заголовок Idempotency-Key обязателен для этого запроса',
    });
  }

  if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 255) {
    return res.status(400).json({
      message: 'Некорректный формат Idempotency-Key (требуется строка 16-255 символов)',
    });
  }

  try {
    const [existingKey] = await db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, idempotencyKey))
      .limit(1);

    if (existingKey) {
      if (new Date() > new Date(existingKey.expiresAt)) {
        await db
          .delete(idempotencyKeys)
          .where(eq(idempotencyKeys.key, idempotencyKey));

        return next();
      }

      if (existingKey.userId !== req.userId) {
        return res.status(403).json({
          message: 'Idempotency-Key принадлежит другому пользователю',
        });
      }

      logger.info('Idempotent request detected, returning cached response', {
        idempotencyKey,
        userId: req.userId,
      });

      return res.status(200).json(existingKey.response);
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_KEY_EXPIRY_HOURS);

            await db.insert(idempotencyKeys).values({
              key: idempotencyKey,
              userId: req.userId!,
              response: body,
              expiresAt,
            });

            logger.info('Idempotency key stored', {
              idempotencyKey,
              userId: req.userId,
              expiresAt,
            });
          } catch (error: any) {
            logger.error('Failed to store idempotency key', {
              error: error.message,
              idempotencyKey,
            });
          }
        });
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    logger.error('Idempotency middleware error', { error });
    next(error);
  }
}

export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  try {
    const result = await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.expiresAt, new Date()));

    logger.info('Cleaned up expired idempotency keys', {
      deletedCount: result.rowCount || 0,
    });

    return result.rowCount || 0;
  } catch (error: any) {
    logger.error('Failed to cleanup expired idempotency keys', {
      error: error.message,
    });
    return 0;
  }
}
