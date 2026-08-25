import {
    WOLT_VENUE_ID,
} from './config.js'

import {
    woltClient,
} from './client.js'

import type {
    WoltShipmentPromise,
} from './types.js'

export type CreateShipmentPromiseInput = {
    street: string
    city: string
    postCode: string

    minPreparationTimeMinutes?: number

    scheduledDropoffTime?: string
}

export async function createShipmentPromise(
    input: CreateShipmentPromiseInput,
) {
    if (!WOLT_VENUE_ID) {
        throw new Error(
            'WOLT_DRIVE_VENUE_ID is not configured',
        )
    }

    const response =
        await woltClient.post(
            `/v1/venues/${WOLT_VENUE_ID}/shipment-promises`,
            {
                street: input.street,
                city: input.city,
                post_code: input.postCode,
                language: 'en',

                min_preparation_time_minutes:
                    input.minPreparationTimeMinutes ??
                    20,

                ...(input.scheduledDropoffTime
                    ? {
                        scheduled_dropoff_time:
                            input.scheduledDropoffTime,
                    }
                    : {}),
            },
        )

    const data =
        await response.json() as WoltShipmentPromise

    if (!response.ok) {
        console.error(
            'Wolt shipment promise failed:',
            response.status,
            data,
        )

        throw new Error(
            `Wolt shipment promise failed (${response.status})`,
        )
    }

    return data
}