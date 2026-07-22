import type { OrderSalesChannel } from './order-channel'

/**
 * Represents the financial state of an order.
 */
export const OrderPaymentStatus = {
  Pending: 'Pending',
  Paid: 'Paid',
  Failed: 'Failed',
  Refunded: 'Refunded',
} as const

export type OrderPaymentStatus =
  (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus]

/**
 * Represents the operational progress of an order.
 */
export const OrderFulfilmentStatus = {
  Received: 'Received',
  Preparing: 'Preparing',
  Ready: 'Ready',
  OutForDelivery: 'OutForDelivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
} as const

export type OrderFulfilmentStatus =
  (typeof OrderFulfilmentStatus)[keyof typeof OrderFulfilmentStatus]

/**
 * A product line ready to be persisted in the OMS database.
 */
export type CreateOrderItemInput = {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

/**
 * Internal order record produced by the Order Service.
 *
 * Unlike ChannelOrder, this contains the Mais de Nata order
 * number and internal OMS statuses.
 */
export type CreateOrderInput = {
  orderNumber: string
  salesChannel: OrderSalesChannel

  externalEventId?: string
  externalOrderId?: string

  paymentStatus: OrderPaymentStatus
  fulfilmentStatus: OrderFulfilmentStatus

  customerName: string
  customerEmail: string
  customerPhone?: string

  deliveryStreet?: string
  deliveryHouseNumber?: string
  deliveryApartment?: string
  deliveryCity?: string
  deliveryPostcode?: string
  deliveryDate?: string
  deliveryTime?: string

  currency: string
  totalAmount: number

  items: CreateOrderItemInput[]
}

/**
 * The minimal order information returned after persistence.
 */
export type CreatedOrder = {
  id: string
  orderNumber: string
}