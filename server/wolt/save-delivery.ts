import {
  supabaseAdmin,
} from '../database/supabase.js'

import type {
  WoltDeliveryOrder,
} from './types.js'

import {
  mapDeliveryToOrderFields,
} from './delivery-mapper.js'

export async function saveDeliveryToOrder(
  orderId: string,
  delivery: WoltDeliveryOrder,
) {
  const fields =
    mapDeliveryToOrderFields(
      delivery,
    )

  const {
    data: updatedOrder,
    error,
  } = await supabaseAdmin
    .from('orders')
    .update(fields)
    .eq('id', orderId)
    .select(
      `
        id,
        order_number,
        wolt_delivery_id,
        wolt_delivery_status,
        wolt_tracking_id,
        wolt_tracking_url,
        wolt_order_reference_id,
        wolt_pickup_eta,
        wolt_dropoff_eta,
        wolt_delivery_created_at
      `,
    )
    .single()

  if (error || !updatedOrder) {
    throw (
      error ??
      new Error(
        'Unable to save Wolt delivery',
      )
    )
  }

  return updatedOrder
}