import crypto from 'crypto';
import WebhookEvent from '../models/WebhookEvent.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Handle incoming Razorpay Webhook events
// @route   POST /api/webhooks/razorpay
// @access  Public (Webhook endpoint with signature verification)
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'subsync_mock_secret';

    const eventPayload = req.body;
    const eventId = eventPayload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const eventType = eventPayload.event;

    // 1. Check for Duplicate Webhook Events (Idempotent Processing)
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      console.log(`[Webhook] Duplicate webhook received for event ${eventId}. Skipping.`);
      return res.status(200).json({ success: true, message: 'Event already processed.' });
    }

    // 2. Cryptographic Signature Verification
    if (signature && (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)) {
      const shasum = crypto.createHmac('sha256', secret);
      const rawPayload = req.rawBody ? req.rawBody : JSON.stringify(req.body);
      shasum.update(rawPayload);
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.warn('[Webhook] Invalid Razorpay webhook signature mismatch.');
        await WebhookEvent.create({
          eventId,
          event: eventType || 'unknown',
          payload: eventPayload,
          status: 'Failed',
          signature,
        });
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }
    }

    // 3. Process Specific Event Types
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      if (paymentEntity) {
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        const payment = await Payment.findOne({ orderId });
        if (payment && payment.status !== 'Successful') {
          payment.status = 'Successful';
          payment.paymentId = paymentId;
          await payment.save();

          if (payment.subscription) {
            await Subscription.findByIdAndUpdate(payment.subscription, { status: 'Active' });
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      if (paymentEntity) {
        const orderId = paymentEntity.order_id;
        await Payment.findOneAndUpdate(
          { orderId },
          { status: 'Failed', failureReason: paymentEntity.error_description || 'Payment gateway failure' }
        );
      }
    }

    // 4. Save Event in Audit History
    await WebhookEvent.create({
      eventId,
      event: eventType || 'custom.event',
      payload: eventPayload,
      status: 'Processed',
      signature: signature || 'simulated',
    });

    res.status(200).json({ success: true, status: 'ok' });
  } catch (err) {
    console.error('[Webhook] Error processing Razorpay webhook:', err);
    res.status(500).json({ success: false, message: 'Internal server error processing webhook.' });
  }
};
