import type {
    CheckoutRequest,
} from '../shared/checkout-types.js'

import {
    checkDeliverySlotAvailability,
} from '../server/delivery/delivery-availability.js'

import {
    isImmediateDeliveryAvailable,
} from '../server/delivery/delivery-slots.js'

import {
    supabaseAdmin,
} from '../server/database/supabase.js'

import {
    createShipmentPromise,
} from '../server/wolt/shipment-promise.js'

export default async function handler(
    request: any,
    response: any,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            success: false,
            message: 'Method not allowed',
        })
    }

    try {
        const body =
            request.body as
            | CheckoutRequest
            | undefined

        if (
            !body ||
            typeof body !== 'object'
        ) {
            return response.status(400).json({
                success: false,
                message:
                    'Checkout data is required',
            })
        }

        const {
            delivery,
        } = body

        if (!delivery) {
            return response.status(400).json({
                success: false,
                message:
                    'Delivery details are required',
            })
        }

        const {
            data: settings,
            error: settingsError,
        } = await supabaseAdmin
            .from('delivery_settings')
            .select(
                `
          last_slot_end_hour,
          immediate_delivery_minutes
        `,
            )
            .eq('id', true)
            .single()

        if (settingsError || !settings) {
            throw (
                settingsError ??
                new Error(
                    'Unable to load delivery settings',
                )
            )
        }

        const isImmediateDelivery =
            delivery.preferredTime === 'asap'

        if (
            isImmediateDelivery &&
            !isImmediateDeliveryAvailable(
                settings.last_slot_end_hour,
                settings.immediate_delivery_minutes,
            )
        ) {
            return response.status(409).json({
                success: false,
                message:
                    'Within 90 minutes delivery is no longer available today.',
            })
        }

        let scheduledDropoffTime:
            string | undefined

        if (!isImmediateDelivery) {
            const deliveryTimeMatch =
                delivery.preferredTime.match(
                    /^(\d{2}):00–(\d{2}):00$/,
                )

            if (!deliveryTimeMatch) {
                return response.status(400).json({
                    success: false,
                    message:
                        'Please select a valid delivery time',
                })
            }

            const startHour =
                Number(deliveryTimeMatch[1])

            const endHour =
                Number(deliveryTimeMatch[2])

            if (
                !Number.isInteger(startHour) ||
                !Number.isInteger(endHour) ||
                endHour !== startHour + 1
            ) {
                return response.status(400).json({
                    success: false,
                    message:
                        'Invalid delivery time',
                })
            }

            const availability =
                await checkDeliverySlotAvailability(
                    delivery.deliveryDate,
                    startHour,
                )

            if (!availability.available) {
                return response.status(409).json({
                    success: false,
                    message:
                        'This delivery time is no longer available. Please choose another time.',
                })
            }

            if (
                delivery.slotStartsAt !==
                availability.slot.startsAt ||
                delivery.slotEndsAt !==
                availability.slot.endsAt ||
                delivery.slotCutoffAt !==
                availability.slot.cutoffAt
            ) {
                return response.status(400).json({
                    success: false,
                    message:
                        'Delivery slot information is invalid',
                })
            }

            scheduledDropoffTime =
                availability.slot.endsAt
        }

        const shipmentPromise =
            await createShipmentPromise({
                street:
                    `${delivery.street} ${delivery.houseNumber}`.trim(),

                city:
                    delivery.city,

                postCode:
                    delivery.postcode,

                minPreparationTimeMinutes:
                    20,

                scheduledDropoffTime,
            })

        if (!shipmentPromise.is_binding) {
            return response.status(422).json({
                success: false,
                message:
                    'Delivery is not available for this address',
            })
        }

        return response.status(200).json({
            success: true,

            quote: {
                shipmentPromiseId:
                    shipmentPromise.id,

                validUntil:
                    shipmentPromise.valid_until,

                amount:
                    shipmentPromise.price.amount,

                currency:
                    shipmentPromise.price.currency,

                pickupEtaMinutes:
                    shipmentPromise.pickup
                        .eta_minutes,

                dropoffEtaMinutes:
                    shipmentPromise.dropoff
                        .eta_minutes,
            },
        })
    } catch (error) {
        console.error(
            'Delivery quote failed:',
            error,
        )

        return response.status(500).json({
            success: false,
            message:
                'Unable to calculate delivery charge',
        })
    }
}