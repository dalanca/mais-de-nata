import {
  supabaseAdmin,
} from '../database/supabase.js'

import type {
  WoltDriveOrderEvent,
} from './types.js'

export type StoredWoltWebhookEvent = {
  duplicate: boolean
  eventRecordId?: string
  orderId?: string | null
}

export async function storeWoltWebhookEvent(
  event: WoltDriveOrderEvent,
): Promise<StoredWoltWebhookEvent> {
  const merchantOrderReferenceId =
    event.details
      .merchant_order_reference_id ??
    null

  let orderId: string | null = null

  if (merchantOrderReferenceId) {
    const {
      data: order,
    } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq(
        'id',
        merchantOrderReferenceId,
      )
      .maybeSingle()

    orderId =
      order?.id ??
      null
  }

  if (!orderId) {
    const {
      data: order,
    } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq(
        'wolt_order_reference_id',
        event.details
          .wolt_order_reference_id,
      )
      .maybeSingle()

    orderId =
      order?.id ??
      null
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from('wolt_webhook_events')
    .insert({
      wolt_event_id:
        event.details.id,

      event_type:
        event.type,

      dispatched_at:
        event.dispatched_at,

      wolt_order_reference_id:
        event.details
          .wolt_order_reference_id,

      merchant_order_reference_id:
        merchantOrderReferenceId,

      order_id:
        orderId,

      payload:
        event,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        duplicate: true,
        orderId,
      }
    }

    throw error
  }

  return {
    duplicate: false,
    eventRecordId:
      data.id,
    orderId,
  }
}

export async function markWoltWebhookEventProcessed(
  eventRecordId: string,
) {
  const {
    error,
  } = await supabaseAdmin
    .from('wolt_webhook_events')
    .update({
      processed_at:
        new Date().toISOString(),

      processing_error:
        null,
    })
    .eq(
      'id',
      eventRecordId,
    )

  if (error) {
    throw error
  }
}