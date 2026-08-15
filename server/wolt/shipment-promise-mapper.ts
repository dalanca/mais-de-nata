import type {
  WoltShipmentPromise,
} from './types.js'

export type WoltShipmentPromiseOrderFields = {
  wolt_shipment_promise_id: string
  wolt_shipment_promise_valid_until: string

  wolt_delivery_fee: number
  wolt_delivery_fee_currency: string

  wolt_pickup_eta_minutes: number
  wolt_dropoff_eta_minutes: number | null
  wolt_time_estimate_minutes: number

  wolt_dropoff_lat: number
  wolt_dropoff_lon: number
  wolt_dropoff_formatted_address: string

  wolt_shipment_promise_is_binding: boolean
}

export function mapShipmentPromiseToOrderFields(
  promise: WoltShipmentPromise,
): WoltShipmentPromiseOrderFields {
  return {
    wolt_shipment_promise_id:
      promise.id,

    wolt_shipment_promise_valid_until:
      promise.valid_until,

    wolt_delivery_fee:
      promise.price.amount,

    wolt_delivery_fee_currency:
      promise.price.currency,

    wolt_pickup_eta_minutes:
      promise.pickup.eta_minutes,

    wolt_dropoff_eta_minutes:
      promise.dropoff.eta_minutes,

    wolt_time_estimate_minutes:
      promise.time_estimate_minutes,

    wolt_dropoff_lat:
      promise.dropoff.location.coordinates.lat,

    wolt_dropoff_lon:
      promise.dropoff.location.coordinates.lon,

    wolt_dropoff_formatted_address:
      promise.dropoff.location.formatted_address,

    wolt_shipment_promise_is_binding:
      promise.is_binding,
  }
}