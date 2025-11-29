import { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { logger } from '../utils/logger';
import { sql, eq, and } from 'drizzle-orm';
import { orders, promocodeUsage, promocodes } from '@shared/schema';
import { env } from '../env';
import crypto from 'crypto';

const router = Router();

function verifyYooKassaSignature(body: Buffer | string, signature: string, secretKey: string): boolean {
  try {
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      logger.warn('Invalid signature format - not hex');
      return false;
    }

    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(hmac, 'hex')
    );
  } catch (error) {
    logger.error('YooKassa signature verification failed', { error });
    return false;
  }
}

router.post('/yookassa', async (req, res) => {
  try {
    if (!env.YUKASSA_SECRET_KEY) {
      logger.error('YUKASSA_SECRET_KEY not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const signature = req.headers['x-yookassa-signature'] as string;
    
    if (!signature) {
      logger.warn('YooKassa webhook: missing signature header');
      return res.status(401).json({ message: 'Missing signature' });
    }

    const rawBody = req.rawBody ? (req.rawBody as Buffer) : Buffer.from(JSON.stringify(req.body));
    
    if (!verifyYooKassaSignature(rawBody, signature, env.YUKASSA_SECRET_KEY)) {
      logger.warn('YooKassa webhook: invalid signature', {
        signature,
        ip: req.ip,
        hasRawBody: !!req.rawBody,
      });
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;
    
    if (event.type !== 'payment.succeeded') {
      return res.status(200).json({ message: 'Event type not processed' });
    }

    const paymentId = event.object?.id;
    const yukassaPaymentId = event.object?.metadata?.order_id;

    if (!paymentId || !yukassaPaymentId) {
      logger.warn('YooKassa webhook: missing payment data', { event });
      return res.status(400).json({ message: 'Invalid payment data' });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.yukassaPaymentId, yukassaPaymentId))
      .limit(1);

    if (!order) {
      logger.warn('YooKassa webhook: order not found', { yukassaPaymentId });
      return res.status(404).json({ message: 'Order not found' });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          paymentStatus: 'paid',
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      if (order.promocodeId) {
        const [promo] = await tx
          .select()
          .from(promocodes)
          .where(eq(promocodes.id, order.promocodeId))
          .limit(1);

        if (promo && promo.type === 'temporary') {
          const existingUsage = await tx
            .select()
            .from(promocodeUsage)
            .where(
              and(
                eq(promocodeUsage.promocodeId, order.promocodeId!),
                eq(promocodeUsage.userId, order.userId!)
              )
            )
            .limit(1);

          if (!existingUsage.length) {
            await tx.insert(promocodeUsage).values({
              promocodeId: order.promocodeId!,
              userId: order.userId!,
              orderId: order.id,
            });
          }
        }
      }
    });

    logger.info('Payment confirmed', { yukassaPaymentId, orderId: order.id });
    res.json({ message: 'Payment processed successfully' });
  } catch (error: any) {
    logger.error('YooKassa webhook error', { error: error.message });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

export default router;
