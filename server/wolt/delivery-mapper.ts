import type {
  WoltDeliveryOrder,
} from './types.js'

export type WoltDeliveryOrderFields = {
  wolt_delivery_id: string
  wolt_delivery_status: string

  wolt_tracking_id: string
  wolt_tracking_url: string

  wolt_order_reference_id: string

  wolt_pickup_eta: string
  wolt_dropoff_eta: string | null

  wolt_delivery_created_at: string
}

export function mapDeliveryToOrderFields(
  delivery: WoltDeliveryOrder,
): WoltDeliveryOrderFields {
  return {
    wolt_delivery_id:
      delivery.id,

    wolt_delivery_status:
      delivery.status,

    wolt_tracking_id:
      delivery.tracking.id,

    wolt_tracking_url:
      delivery.tracking.url,

    wolt_order_reference_id:
      delivery.wolt_order_reference_id,

    wolt_pickup_eta:
      delivery.pickup.eta,

    wolt_dropoff_eta:
      delivery.dropoff.eta,

    wolt_delivery_created_at:
      new Date().toISOString(),
  }
}