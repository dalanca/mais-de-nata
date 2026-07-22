import type { OrderSalesChannel } from './order-channel'

/**
 * A normalized product line received from any sales channel.
 *
 * All monetary values are stored in the smallest currency unit.
 * For CZK, 34800 represents 348.00 Kč.
 */
export type ChannelOrderItem = {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

/**
 * A normalized order received from any external sales channel.
 *
 * Stripe, Wolt, Bolt Food and Foodora adapters will all convert
 * their own data formats into this structure before calling the
 * Order Service.
 */
export type ChannelOrder = {
  salesChannel: OrderSalesChannel

  /**
   * Unique event identifier supplied by the external channel.
   *
   * For Stripe, this will be the webhook event ID.
   */
  externalEventId?: string

  /**
   * Unique order or checkout identifier supplied by the channel.
   *
   * For Stripe, this will initially be the Checkout Session ID.
   */
  externalOrderId?: string

  customer: {
    name: string
    email: string
    phone?: string
  }

  delivery: {
    street?: string
    houseNumber?: string
    apartment?: string
    city?: string
    postcode?: string
    date?: string
    time?: string
  }

  currency: string
  totalAmount: number

  items: ChannelOrderItem[]
}