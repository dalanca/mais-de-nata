const baseUrl =
    'https://daas-public-api.development.dev.woltapi.com'

const merchantKey =
    process.env.WOLT_DRIVE_MERCHANT_KEY

const venueId =
    process.env.WOLT_DRIVE_VENUE_ID

if (!merchantKey) {
    throw new Error(
        'WOLT_DRIVE_MERCHANT_KEY is not configured',
    )
}

if (!venueId) {
    throw new Error(
        'WOLT_DRIVE_VENUE_ID is not configured',
    )
}

const headers = {
    Authorization:
        `Bearer ${merchantKey}`,
    'Content-Type':
        'application/json',
}

const promiseResponse =
    await fetch(
        `${baseUrl}/v1/venues/${venueId}/shipment-promises`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                street:
                    'Václavské náměstí 1',
                city:
                    'Praha',
                post_code:
                    '110 00',
                language:
                    'en',
                min_preparation_time_minutes:
                    20,
            }),
        },
    )

const shipmentPromise =
    await promiseResponse.json()

if (!promiseResponse.ok) {
    throw new Error(
        `Shipment promise failed: ${promiseResponse.status} ${JSON.stringify(shipmentPromise)}`,
    )
}

console.log(
    'Shipment promise created:',
    shipmentPromise.id,
)

const maisDeNataOrderId =
    '3a648dfa-6b72-4f03-a63f-6f5f0c2506b7'

const testReference =
    `${maisDeNataOrderId}-${Date.now()}`

const deliveryResponse =
    await fetch(
        `${baseUrl}/v1/venues/${venueId}/deliveries`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                pickup: {
                    comment:
                        'Mais de Nata webhook test',
                },

                dropoff: {
                    location: {
                        coordinates: {
                            lat:
                                shipmentPromise.dropoff.location.coordinates.lat,
                            lon:
                                shipmentPromise.dropoff.location.coordinates.lon,
                        },
                    },

                    comment: '',

                    options: {
                        is_no_contact:
                            false,
                    },
                },

                recipient: {
                    name:
                        'Dean CZ',
                    phone_number:
                        '+420999999999',
                },

                parcels: [
                    {
                        description:
                            'Pastéis de Nata',
                        identifier:
                            testReference,
                        count:
                            1,
                    },
                ],

                shipment_promise_id:
                    shipmentPromise.id,

                customer_support: {
                    email:
                        'info@maisdenata.com',
                },

                merchant_order_reference_id:
                    testReference,

                order_number:
                    '4LXF',

                language:
                    'en',
            }),
        },
    )

const delivery =
    await deliveryResponse.json()

if (!deliveryResponse.ok) {
    throw new Error(
        `Delivery creation failed: ${deliveryResponse.status} ${JSON.stringify(delivery)}`,
    )
}

console.log(
    'Delivery created:',
    delivery.wolt_order_reference_id,
)