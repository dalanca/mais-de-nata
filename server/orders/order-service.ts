import type { ChannelOrder } from './channel-order'
import { generateOrderNumber } from './order-number'
import {
  findOrderByExternalEventId,
  insertOrder,
} from './order-repository'
import {
  OrderFulfilmentStatus,
  OrderPaymentStatus,
  type CreateOrderInput,
  type CreatedOrder,
} from './order-types'

export type CreateChannelOrderResult = {
  order: CreatedOrder
  alreadyExists: boolean
}

/**
 * Converts a normalized channel order into an internal OMS order
 * and persists it.
 */
export async function createOrderFromChannel(
  channelOrder: ChannelOrder,
): Promise<CreateChannelOrderResult> {
  validateChannelOrder(channelOrder)

  if (channelOrder.externalEventId) {
    const existingOrder = await findOrderByExternalEventId(
      channelOrder.externalEventId,
    )

    if (existingOrder) {
      return {
        order: existingOrder,
        alreadyExists: true,
      }
    }
  }

  const input: CreateOrderInput = {
    orderNumber: generateOrderNumber(),
    salesChannel: channelOrder.salesChannel,

    externalEventId: channelOrder.externalEventId,
    externalOrderId: channelOrder.externalOrderId,

    paymentStatus: OrderPaymentStatus.Paid,
    fulfilmentStatus: OrderFulfilmentStatus.Received,

    customerName: channelOrder.customer.name.trim(),
    customerEmail: channelOrder.customer.email.trim().toLowerCase(),
    customerPhone:
      channelOrder.customer.phone?.trim() || undefined,

    deliveryStreet:
      channelOrder.delivery.street?.trim() || undefined,
    deliveryHouseNumber:
      channelOrder.delivery.houseNumber?.trim() || undefined,
    deliveryApartment:
      channelOrder.delivery.apartment?.trim() || undefined,
    deliveryCity:
      channelOrder.delivery.city?.trim() || undefined,
    deliveryPostcode:
      channelOrder.delivery.postcode?.trim() || undefined,
    deliveryDate:
      channelOrder.delivery.date?.trim() || undefined,
    deliveryTime:
      channelOrder.delivery.time?.trim() || undefined,

    currency: channelOrder.currency.trim().toLowerCase(),
    totalAmount: channelOrder.totalAmount,

    items: channelOrder.items.map((item) => ({
      productName: item.productName.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  }

  const order = await insertOrder(input)

  return {
    order,
    alreadyExists: false,
  }
}

function validateChannelOrder(
  channelOrder: ChannelOrder,
): void {
  if (!channelOrder.customer.name.trim()) {
    throw new Error('Customer name is required')
  }

  if (!channelOrder.customer.email.trim()) {
    throw new Error('Customer email is required')
  }

  if (!channelOrder.currency.trim()) {
    throw new Error('Currency is required')
  }

  if (
    !Number.isInteger(channelOrder.totalAmount) ||
    channelOrder.totalAmount < 0
  ) {
    throw new Error(
      'Order total amount must be a non-negative integer',
    )
  }

  if (channelOrder.items.length === 0) {
    throw new Error('At least one order item is required')
  }

  for (const item of channelOrder.items) {
    if (!item.productName.trim()) {
      throw new Error('Order item product name is required')
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error(
        'Order item quantity must be a positive integer',
      )
    }

    if (
      !Number.isInteger(item.unitPrice) ||
      item.unitPrice < 0
    ) {
      throw new Error(
        'Order item unit price must be a non-negative integer',
      )
    }

    if (
      !Number.isInteger(item.totalPrice) ||
      item.totalPrice < 0
    ) {
      throw new Error(
        'Order item total price must be a non-negative integer',
      )
    }

    if (item.totalPrice !== item.unitPrice * item.quantity) {
      throw new Error(
        `Invalid total price for ${item.productName}`,
      )
    }
  }

  const calculatedTotal = channelOrder.items.reduce(
    (total, item) => total + item.totalPrice,
    0,
  )

  if (calculatedTotal !== channelOrder.totalAmount) {
    throw new Error(
      'Order total does not match the sum of its items',
    )
  }
}