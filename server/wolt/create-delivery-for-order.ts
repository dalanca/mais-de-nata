import {
    createDeliverySlot,
} from '../delivery/delivery-slots.js'

import {
    createWoltDelivery,
} from './create-delivery.js'

import {
    createShipmentPromise,
} from './shipment-promise.js'

import {
    createParcelDetails,
} from './parcel-details.js'

import {
    getOrderWoltDeliveryState,
} from './get-order-delivery-state.js'

import {
    loadDeliveryOrder,
} from './load-delivery-order.js'

import {
    saveDeliveryToOrder,
} from './save-delivery.js'

import {
    saveShipmentPromiseToOrder,
} from './save-shipment-promise.js'

type Props = {
    orderId: string
    orderNumber: string
}

function getScheduledDropoffTime(
    deliveryDate: string | null,
    deliveryTime: string | null,
) {
    if (
        !deliveryDate ||
        !deliveryTime ||
        deliveryTime === 'asap'
    ) {
        return undefined
    }

    const match =
        deliveryTime.match(
            /^(\d{2}):00–(\d{2}):00$/,
        )

    if (!match) {
        return undefined
    }

    const startHour =
        Number(match[1])

    const endHour =
        Number(match[2])

    if (
        !Number.isInteger(startHour) ||
        !Number.isInteger(endHour) ||
        endHour !== startHour + 1
    ) {
        return undefined
    }

    const slot =
        createDeliverySlot(
            deliveryDate,
            startHour,
        )

    return new Date(
        new Date(
            slot.endsAt,
        ).getTime() -
        30 * 60 * 1000,
    ).toISOString()
}

export async function createDeliveryForOrder({
    orderId,
    orderNumber,
}: Props) {
    const existingWoltDelivery =
        await getOrderWoltDeliveryState(
            orderId,
        )

    if (existingWoltDelivery.deliveryId) {
        console.log(
            'Wolt delivery already exists:',
            {
                orderId,

                woltDeliveryId:
                    existingWoltDelivery.deliveryId,
            },
        )

        return
    }

    let order =
        await loadDeliveryOrder(
            orderId,
        )

    if (
        order.sales_channel !==
        'ConsumerWebsite'
    ) {
        throw new Error(
            'Wolt delivery can only be created for consumer website orders',
        )
    }

    if (!order.customer_phone) {
        throw new Error(
            'Consumer order is missing customer phone for Wolt delivery',
        )
    }

    if (
        !order.delivery_street ||
        !order.delivery_house_number ||
        !order.delivery_city ||
        !order.delivery_postcode
    ) {
        throw new Error(
            'Consumer order is missing delivery address details',
        )
    }

    const scheduledDropoffTime =
        getScheduledDropoffTime(
            order.delivery_date,
            order.delivery_time,
        )

    const promiseValidUntil =
        order.wolt_shipment_promise_valid_until
            ? new Date(
                order.wolt_shipment_promise_valid_until,
            )
            : null

    const promiseStillValid =
        Boolean(
            order.wolt_shipment_promise_id &&
            order.wolt_shipment_promise_is_binding === true &&
            promiseValidUntil &&
            promiseValidUntil.getTime() >
            Date.now() + 60_000,
        )

    if (!promiseStillValid) {
        console.log(
            'Refreshing Wolt shipment promise:',
            {
                orderId,
                orderNumber,
            },
        )

        const shipmentPromise =
            await createShipmentPromise({
                street:
                    `${order.delivery_street} ${order.delivery_house_number}`.trim(),

                city:
                    order.delivery_city,

                postCode:
                    order.delivery_postcode,

                minPreparationTimeMinutes:
                    0,

                scheduledDropoffTime,
            })

        if (!shipmentPromise.is_binding) {
            throw new Error(
                'Wolt delivery is no longer available for this order',
            )
        }

        await saveShipmentPromiseToOrder(
            orderId,
            shipmentPromise,
        )

        order =
            await loadDeliveryOrder(
                orderId,
            )
    }

    if (
        !order.wolt_shipment_promise_id ||
        !order.wolt_dropoff_lat ||
        !order.wolt_dropoff_lon
    ) {
        throw new Error(
            'Order is missing valid Wolt shipment promise details',
        )
    }
    const parcelDetails =
        createParcelDetails(
            order.order_items ?? [],
            order.currency,
        )
    const dropoffComment = [
        order.delivery_apartment
            ? `Apartment ${order.delivery_apartment}`
            : '',

        order.delivery_instructions ?? '',
    ]
        .filter(Boolean)
        .join('. ')
    const woltDelivery =
        await createWoltDelivery({

            parcel: {
                priceAmount:
                    parcelDetails.price.amount,

                priceCurrency:
                    parcelDetails.price.currency,

                weightGram:
                    parcelDetails.dimensions
                        .weightGram,

                widthCm:
                    parcelDetails.dimensions
                        .widthCm,

                heightCm:
                    parcelDetails.dimensions
                        .heightCm,

                depthCm:
                    parcelDetails.dimensions
                        .depthCm,
            },
            shipmentPromiseId:
                order.wolt_shipment_promise_id,

            scheduledDropoffTime,

            recipient: {
                name:
                    order.customer_name,

                phoneNumber:
                    order.customer_phone,

                email:
                    order.customer_email,
            },

            dropoff: {
                lat:
                    order.wolt_dropoff_lat,

                lon:
                    order.wolt_dropoff_lon,

                comment:
                    dropoffComment,
            },

            merchantOrderReferenceId:
                orderId,
        })

    await saveDeliveryToOrder(
        orderId,
        woltDelivery,
    )

    console.log(
        'Wolt delivery created successfully:',
        {
            orderId,
            orderNumber,

            woltDeliveryId:
                woltDelivery.id,

            woltOrderReferenceId:
                woltDelivery
                    .wolt_order_reference_id,
        },
    )
}