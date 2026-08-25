import {
  supabaseAdmin,
} from '../database/supabase.js'

export async function getOrderWoltDeliveryState(
  orderId: string,
) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from('orders')
    .select(
      `
        id,
        wolt_delivery_id,
        wolt_order_reference_id,
        wolt_tracking_url
      `,
    )
    .eq('id', orderId)
    .single()

  if (error || !data) {
    throw (
      error ??
      new Error(
        'Unable to load Wolt delivery state',
      )
    )
  }

  return {
    deliveryId:
      data.wolt_delivery_id as
        | string
        | null,

    orderReferenceId:
      data.wolt_order_reference_id as
        | string
        | null,

    trackingUrl:
      data.wolt_tracking_url as
        | string
        | null,
  }
}