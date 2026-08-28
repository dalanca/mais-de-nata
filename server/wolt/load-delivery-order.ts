import {
    supabaseAdmin,
} from '../database/supabase.js'

export async function loadDeliveryOrder(
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
        order_number,
        sales_channel,

        currency,

        customer_name,
        customer_email,
        customer_phone,

        delivery_street,
        delivery_house_number,
        delivery_apartment,
        delivery_instructions,
        delivery_city,
        delivery_postcode,
        delivery_date,
        delivery_time,

        wolt_shipment_promise_id,
        wolt_shipment_promise_valid_until,
        wolt_shipment_promise_is_binding,

        wolt_delivery_fee,
        wolt_delivery_fee_currency,

        wolt_dropoff_lat,
        wolt_dropoff_lon,
        wolt_dropoff_formatted_address,

        wolt_pickup_eta_minutes,
        wolt_dropoff_eta_minutes,

        order_items (
          product_name,
          quantity,
          total_price
        ),

        wolt_delivery_id
      `,
        )
        .eq(
            'id',
            orderId,
        )
        .single()

    if (error || !data) {
        throw (
            error ??
            new Error(
                'Unable to load order for Wolt delivery',
            )
        )
    }

    return data
}