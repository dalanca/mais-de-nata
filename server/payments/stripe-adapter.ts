import Stripe from 'stripe'

import type { ChannelOrder } from '../orders/channel-order.js'
import { OrderSalesChannel } from '../orders/order-channel.js'
import {
  createDeliverySlot,
} from '../delivery/delivery-slots.js'

/**
 * Converts a paid Stripe Checkout Session and its line items
 * into a channel-neutral order.
 */
export function createChannelOrderFromStripeSession(
  eventId: string,
  session: Stripe.Checkout.Session,
  stripeLineItems: Stripe.LineItem[],
  salesChannel: OrderSalesChannel,
): ChannelOrder {
  const amountTotal = session.amount_total

  if (amountTotal == null) {
    throw new Error(
      'Stripe session is missing amount_total',
    )
  }

  if (!session.currency) {
    throw new Error(
      'Stripe session is missing currency',
    )
  }

  const language = session.metadata?.language

  if (language !== 'en' && language !== 'cs') {
    throw new Error(
      'Stripe session is missing a valid checkout language',
    )
  }

  const customerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    ''

  const customerName =
    session.customer_details?.name ??
    session.metadata?.customerName ??
    ''

  if (!customerEmail.trim()) {
    throw new Error(
      'Stripe session is missing customer email',
    )
  }

  if (!customerName.trim()) {
    throw new Error(
      'Stripe session is missing customer name',
    )
  }

  if (stripeLineItems.length === 0) {
    throw new Error(
      'Stripe session contains no line items',
    )
  }

  const productLineItems =
    stripeLineItems.filter(
      (lineItem) =>
        lineItem.description !==
        'Wolt Drive Delivery',
    )

  const items =
    productLineItems.map((lineItem) => {

      const quantity = lineItem.quantity
      const unitPrice = lineItem.price?.unit_amount

      if (
        quantity == null ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          `Stripe line item has an invalid quantity: ${lineItem.id}`,
        )
      }

      if (
        unitPrice == null ||
        !Number.isInteger(unitPrice) ||
        unitPrice < 0
      ) {
        throw new Error(
          `Stripe line item has an invalid unit price: ${lineItem.id}`,
        )
      }

      const totalPrice = unitPrice * quantity

      return {
        productName:
          lineItem.description || 'Pastéis de Nata',
        quantity,
        unitPrice,
        totalPrice,
      }
    })

  const calculatedProductTotal =
    items.reduce(
      (total, item) =>
        total + item.totalPrice,
      0,
    )

  const woltDeliveryFee =
    salesChannel ===
      OrderSalesChannel.ConsumerWebsite
      ? Number(
        session.metadata
          ?.woltDeliveryFee ||
        0,
      )
      : 0

  const isLaunchClaim =
    session.metadata?.launchClaim ===
    'true'

  const isNonProduction =
    process.env.NODE_ENV !==
    'production'

  const calculatedTotal =
    calculatedProductTotal +
    woltDeliveryFee

  if (
    calculatedTotal !== amountTotal &&
    !(
      isLaunchClaim &&
      isNonProduction &&
      amountTotal >= calculatedTotal
    )
  ) {
    throw new Error(
      'Stripe line item total does not match the Checkout Session total',
    )
  }

  const normalizedTotalAmount =
    isLaunchClaim &&
      isNonProduction
      ? calculatedTotal
      : amountTotal

  const deliveryDate =
    session.metadata?.deliveryDate ||
    undefined

  const deliveryTime =
    session.metadata?.deliveryTime ||
    undefined

  let derivedSlotEndsAt:
    string | undefined

  if (
    deliveryDate &&
    deliveryTime
  ) {
    const slotMatch =
      deliveryTime.match(
        /^(\d{2}):00–(\d{2}):00$/,
      )

    if (slotMatch) {
      const startHour =
        Number(slotMatch[1])

      const endHour =
        Number(slotMatch[2])

      if (
        Number.isInteger(startHour) &&
        Number.isInteger(endHour) &&
        endHour === startHour + 1
      ) {
        derivedSlotEndsAt =
          createDeliverySlot(
            deliveryDate,
            startHour,
          ).endsAt
      }
    }
  }

  return {
    salesChannel,
    language,

    externalEventId: eventId,
    externalOrderId: session.id,

    customer: {
      name: customerName,
      email: customerEmail,
      phone:
        session.metadata?.customerPhone ||
        undefined,
    },

    delivery: {
      street:
        session.metadata?.deliveryStreet ||
        undefined,

      houseNumber:
        session.metadata?.deliveryHouseNumber ||
        undefined,

      apartment:
        session.metadata?.deliveryApartment ||
        undefined,

      city:
        session.metadata?.deliveryCity ||
        undefined,

      postcode:
        session.metadata?.deliveryPostcode ||
        undefined,

      date:
        deliveryDate,

      time:
        deliveryTime,

      slotEndsAt:
        session.metadata?.deliverySlotEndsAt ||
        derivedSlotEndsAt,
    },

    ...(salesChannel ===
      OrderSalesChannel.ConsumerWebsite
      ? {
        woltDelivery: {
          shipmentPromiseId:
            session.metadata
              ?.woltShipmentPromiseId ||
            '',

          shipmentPromiseValidUntil:
            session.metadata
              ?.woltShipmentPromiseValidUntil ||
            '',

          shipmentPromiseIsBinding:
            session.metadata
              ?.woltShipmentPromiseIsBinding ===
            'true',

          deliveryFee:
            Number(
              session.metadata
                ?.woltDeliveryFee ||
              0,
            ),

          deliveryFeeCurrency:
            session.metadata
              ?.woltDeliveryFeeCurrency ||
            '',

          dropoffLat:
            Number(
              session.metadata
                ?.woltDropoffLat ||
              0,
            ),

          dropoffLon:
            Number(
              session.metadata
                ?.woltDropoffLon ||
              0,
            ),

          dropoffFormattedAddress:
            session.metadata
              ?.woltDropoffFormattedAddress ||
            '',

          pickupEtaMinutes:
            Number(
              session.metadata
                ?.woltPickupEtaMinutes ||
              0,
            ),

          dropoffEtaMinutes:
            session.metadata
              ?.woltDropoffEtaMinutes
              ? Number(
                session.metadata
                  .woltDropoffEtaMinutes,
              )
              : null,
        },
      }
      : {}),

    currency: session.currency,
    totalAmount: normalizedTotalAmount,
    items,
  }
}