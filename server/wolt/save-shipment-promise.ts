import {
    supabaseAdmin,
} from '../database/supabase.js'

import type {
    WoltShipmentPromise,
} from './types.js'

import {
    mapShipmentPromiseToOrderFields,
} from './shipment-promise-mapper.js'

export async function saveShipmentPromiseToOrder(
    orderId: string,
    promise: WoltShipmentPromise,
) {
    const fields =
        mapShipmentPromiseToOrderFields(
            promise,
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
    wolt_shipment_promise_id,
    wolt_shipment_promise_valid_until,
    wolt_delivery_fee,
    wolt_delivery_fee_currency,
    wolt_pickup_eta_minutes,
    wolt_dropoff_eta_minutes,
    wolt_time_estimate_minutes,
    wolt_dropoff_lat,
    wolt_dropoff_lon,
    wolt_dropoff_formatted_address,
    wolt_shipment_promise_is_binding
  `,
        )
        .single()

    if (error || !updatedOrder) {
        throw (
            error ??
            new Error(
                'Unable to save Wolt shipment promise',
            )
        )
    }

    return updatedOrder
}