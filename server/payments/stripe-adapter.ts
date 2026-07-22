import Stripe from 'stripe'

import type { ChannelOrder } from '../orders/channel-order'
import { OrderSalesChannel } from '../orders/order-channel'

/**
 * Converts a paid Stripe Checkout Session and its line items
 * into a channel-neutral order.
 */
export function createChannelOrderFromStripeSession(
  eventId: string,
  session: Stripe.Checkout.Session,
  stripeLineItems: Stripe.LineItem[],
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

  const customerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    ''

  const customerName =
    session.metadata?.customerName ?? ''

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

  const items = stripeLineItems.map((lineItem) => {
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

  const calculatedTotal = items.reduce(
    (total, item) => total + item.totalPrice,
    0,
  )

  if (calculatedTotal !== amountTotal) {
    throw new Error(
      'Stripe line item total does not match the Checkout Session total',
    )
  }

  return {
    salesChannel:
      OrderSalesChannel.WholesaleWebsite,

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
        session.metadata?.deliveryDate ||
        undefined,

      time:
        session.metadata?.deliveryTime ||
        undefined,
    },

    currency: session.currency,
    totalAmount: amountTotal,
    items,
  }
}