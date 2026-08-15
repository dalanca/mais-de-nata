import {
    supabaseAdmin,
} from '../../server/database/supabase.js'

import {
    createWoltDelivery,
} from '../../server/wolt/create-delivery.js'

import {
    saveDeliveryToOrder,
} from '../../server/wolt/save-delivery.js'

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
        const {
            orderId,
        } = req.body ?? {}

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'orderId is required',
            })
        }

        const {
            data: order,
            error,
        } = await supabaseAdmin
            .from('orders')
            .select(
                `
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          notes,
          wolt_shipment_promise_id,
          wolt_shipment_promise_valid_until,
          wolt_dropoff_lat,
          wolt_dropoff_lon,
          wolt_shipment_promise_is_binding
        `,
            )
            .eq('id', orderId)
            .single()

        if (error || !order) {
            throw (
                error ??
                new Error('Order not found')
            )
        }

        if (
            !order.wolt_shipment_promise_id
        ) {
            throw new Error(
                'Order has no Wolt shipment promise',
            )
        }

        if (
            !order.wolt_shipment_promise_is_binding
        ) {
            throw new Error(
                'Wolt shipment promise is not binding',
            )
        }

        if (
            !order.wolt_dropoff_lat ||
            !order.wolt_dropoff_lon
        ) {
            throw new Error(
                'Order has no Wolt dropoff coordinates',
            )
        }

        if (!order.customer_phone) {
            throw new Error(
                'Order has no customer phone number',
            )
        }

        const delivery =
            await createWoltDelivery({
                shipmentPromiseId:
                    order.wolt_shipment_promise_id,

                recipient: {
                    name:
                        order.customer_name,

                    phoneNumber:
                        order.customer_phone,

                    email:
                        order.customer_email ??
                        undefined,
                },

                dropoff: {
                    lat:
                        order.wolt_dropoff_lat,

                    lon:
                        order.wolt_dropoff_lon,

                    comment:
                        order.notes ??
                        undefined,
                },

                merchantOrderReferenceId:
                    order.id,

                orderNumber:
                    order.order_number,
            })

        const updatedOrder =
            await saveDeliveryToOrder(
                order.id,
                delivery,
            )

        return res.status(200).json({
            success: true,
            delivery,
            order: updatedOrder,
        })
    } catch (error) {
        console.error(
            'Wolt delivery test failed:',
            error,
        )

        return res.status(500).json({
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Unknown error',
        })
    }
}