import {
  markWoltWebhookEventProcessed,
  storeWoltWebhookEvent,
} from '../../server/wolt/webhook-event-store.js'

import {
  processWoltOrderEvent,
} from '../../server/wolt/process-webhook-order-event.js'

import {
  verifyWoltWebhookToken,
} from '../../server/wolt/verify-webhook-token.js'

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const secret =
      process.env.WOLT_DRIVE_WEBHOOK_SECRET

    if (!secret) {
      throw new Error(
        'WOLT_DRIVE_WEBHOOK_SECRET is not configured',
      )
    }

    const token =
      req.body?.token

    if (
      !token ||
      typeof token !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Wolt webhook token is required',
      })
    }

    const event =
      verifyWoltWebhookToken(
        token,
        secret,
      )

    const stored =
      await storeWoltWebhookEvent(
        event,
      )

    if (stored.duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
      })
    }

    if (!stored.orderId) {
      return res.status(200).json({
        success: true,
        processed: false,
        reason:
          'Matching Mais de Nata order not found',
      })
    }

    const processed =
      await processWoltOrderEvent(
        stored.orderId,
        event,
      )

    if (stored.eventRecordId) {
      await markWoltWebhookEventProcessed(
        stored.eventRecordId,
      )
    }

    return res.status(200).json({
      success: true,
      duplicate: false,
      processed: true,
      ignoredAsOlderEvent:
        processed.ignoredAsOlderEvent,
    })
  } catch (error) {
    console.error(
      'Wolt webhook processing failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to process Wolt webhook',
    })
  }
}