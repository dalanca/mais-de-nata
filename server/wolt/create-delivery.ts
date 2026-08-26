import type {
  WoltDeliveryOrder,
} from './types.js'

type CreateWoltDeliveryInput = {
  shipmentPromiseId: string

  recipient: {
    name: string
    phoneNumber: string
    email?: string
  }

  dropoff: {
    lat: number
    lon: number
    comment?: string
  }

  merchantOrderReferenceId: string

  scheduledDropoffTime?: string
}
function createCourierOrderNumber(
  merchantOrderReferenceId: string,
) {
  let hash = 0

  for (
    let index = 0;
    index < merchantOrderReferenceId.length;
    index += 1
  ) {
    hash =
      (
        hash * 31 +
        merchantOrderReferenceId.charCodeAt(
          index,
        )
      ) >>> 0
  }

  return String(
    hash % 100000,
  ).padStart(
    5,
    '0',
  )
}

export async function createWoltDelivery(
  input: CreateWoltDeliveryInput,

): Promise<WoltDeliveryOrder> {
  const accessToken =
    process.env.WOLT_DRIVE_MERCHANT_KEY

  const venueId =
    process.env.WOLT_DRIVE_VENUE_ID

  const courierOrderNumber =
    createCourierOrderNumber(
      input.merchantOrderReferenceId,
    )

  if (!accessToken) {
    throw new Error(
      'WOLT_DRIVE_MERCHANT_KEY is not configured'
    )
  }

  if (!venueId) {
    throw new Error(
      'WOLT_DRIVE_VENUE_ID is not configured'
    )
  }

  const response = await fetch(
    `https://daas-public-api.development.dev.woltapi.com/v1/venues/${venueId}/deliveries`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${accessToken}`,
      },

      body: JSON.stringify({
        pickup: {
          comment:
            'Mais de Nata order',
        },

        dropoff: {
          location: {
            coordinates: {
              lat: input.dropoff.lat,
              lon: input.dropoff.lon,
            },
          },

          comment:
            input.dropoff.comment ?? '',

          options: {
            is_no_contact: false,

            ...(input.scheduledDropoffTime
              ? {
                scheduled_time:
                  input.scheduledDropoffTime,
              }
              : {}),
          },
        },

        recipient: {
          name:
            input.recipient.name,

          phone_number:
            input.recipient.phoneNumber,

          ...(input.recipient.email
            ? {
              email:
                input.recipient.email,
            }
            : {}),
        },

        parcels: [
          {
            description:
              'Pastéis de Nata',

            identifier:
              'PASTEIS',

            count: 1,
          },
        ],

        shipment_promise_id:
          input.shipmentPromiseId,

        customer_support: {
          email:
            'info@maisdenata.com',
        },

        merchant_order_reference_id:
          input.merchantOrderReferenceId,

        order_number:
          courierOrderNumber,

        language: 'en',
      }),
    },
  )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      `Wolt delivery creation failed: ${response.status} ${JSON.stringify(data)}`,
    )
  }

  return data as WoltDeliveryOrder
}