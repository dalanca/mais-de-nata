import {
    supabaseAdmin,
} from '../database/supabase.js'

import type {
    WoltDriveOrderEvent,
} from './types.js'

import {
    mapWoltOrderEventToUpdate,
} from './webhook-event-mapper.js'

export async function processWoltOrderEvent(
    orderId: string,
    event: WoltDriveOrderEvent,
) {
    const update =
        mapWoltOrderEventToUpdate(
            event,
        )

    const {
        data: existingOrder,
        error: loadError,
    } = await supabaseAdmin
        .from('orders')
        .select(
            `
    id,
    production_status,
    wolt_last_event_at
  `,
        )
        .eq('id', orderId)
        .single()

    if (
        loadError ||
        !existingOrder
    ) {
        throw (
            loadError ??
            new Error(
                'Order not found',
            )
        )
    }

    const previousEventAt =
        existingOrder.wolt_last_event_at

    const incomingEventAt =
        new Date(
            event.dispatched_at,
        ).getTime()

    if (previousEventAt) {
        const previousEventTime =
            new Date(
                previousEventAt,
            ).getTime()

        if (
            incomingEventAt <
            previousEventTime
        ) {
            return {
                ignoredAsOlderEvent:
                    true,
            }
        }
    }

    const orderUpdate = {
        ...update,

        ...(event.type === 'order.picked_up' &&
            existingOrder.production_status === 'ready'
            ? {
                production_status: 'collected',
                collected_at:
                    event.dispatched_at,
            }
            : {}),

        ...(
            (
                event.type === 'order.dropoff_completed' ||
                event.type === 'order.delivered'
            ) &&
                existingOrder.production_status === 'collected'
                ? {
                    production_status: 'delivered',
                    delivered_at:
                        event.dispatched_at,
                }
                : {}
        ),
    }

    const {
        error: updateError,
    } = await supabaseAdmin
        .from('orders')
        .update(orderUpdate)
        .eq('id', orderId)

    if (updateError) {
        throw updateError
    }

    return {
        ignoredAsOlderEvent:
            false,
    }
}