import type {
  ChannelOrder,
} from '../orders/channel-order.js'

import {
  createWoltDelivery,
} from './create-delivery.js'

import {
  getOrderWoltDeliveryState,
} from './get-order-delivery-state.js'

import {
  saveDeliveryToOrder,
} from './save-delivery.js'

type Props = {
  orderId: string
  orderNumber: string
  channelOrder: ChannelOrder
}

export async function createDeliveryForOrder({
  orderId,
  orderNumber,
  channelOrder,
}: Props) {
  const woltDeliveryDetails =
    channelOrder.woltDelivery

  if (!woltDeliveryDetails) {
    return
  }

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

  const customerPhone =
    channelOrder.customer.phone

  if (!customerPhone) {
    throw new Error(
      'Consumer order is missing customer phone for Wolt delivery',
    )
  }

  const scheduledDropoffTime =
    channelOrder.delivery.slotEndsAt
      ? new Date(
          new Date(
            channelOrder.delivery.slotEndsAt,
          ).getTime() -
            30 * 60 * 1000,
        ).toISOString()
      : undefined

  const woltDelivery =
    await createWoltDelivery({
      shipmentPromiseId:
        woltDeliveryDetails
          .shipmentPromiseId,

      scheduledDropoffTime,

      recipient: {
        name:
          channelOrder.customer.name,

        phoneNumber:
          customerPhone,

        email:
          channelOrder.customer.email,
      },

      dropoff: {
        lat:
          woltDeliveryDetails.dropoffLat,

        lon:
          woltDeliveryDetails.dropoffLon,

        comment:
          channelOrder.delivery.apartment
            ? `Apartment ${channelOrder.delivery.apartment}`
            : '',
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