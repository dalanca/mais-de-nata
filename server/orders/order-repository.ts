import { supabaseAdmin } from '../database/supabase.js'
import type {
  CreateOrderInput,
  CreatedOrder,
} from './order-types.js'

type OrderRecord = {
  id: string
  order_number: string
}

/**
 * Finds an existing order using the external event identifier.
 *
 * This is important for Stripe webhook idempotency because Stripe may
 * deliver the same webhook event more than once.
 */
export async function findOrderByExternalEventId(
  externalEventId: string,
): Promise<CreatedOrder | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_number')
    .eq('stripe_event_id', externalEventId)
    .maybeSingle<OrderRecord>()

  if (error) {
    throw new Error(
      `Unable to check for an existing order: ${error.message}`,
    )
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    orderNumber: data.order_number,
  }
}

/**
 * Persists an order and its items.
 *
 * Implementation will be added after we create an atomic database
 * operation so that an order cannot be saved without all its items.
 */
export async function insertOrder(
  input: CreateOrderInput,
): Promise<CreatedOrder> {
  const { data, error } = await supabaseAdmin.rpc(
    'create_order_with_items',
    {
      p_order_number: input.orderNumber,
      p_sales_channel: input.salesChannel,
      p_external_event_id: input.externalEventId ?? null,
      p_external_order_id: input.externalOrderId ?? null,
      p_payment_status: input.paymentStatus,
      p_fulfilment_status: input.fulfilmentStatus,
      p_customer_name: input.customerName,
      p_customer_email: input.customerEmail,
      p_customer_phone: input.customerPhone ?? null,
      p_delivery_street: input.deliveryStreet ?? null,
      p_delivery_house_number:
        input.deliveryHouseNumber ?? null,
      p_delivery_apartment:
        input.deliveryApartment ?? null,
      p_delivery_city: input.deliveryCity ?? null,
      p_delivery_postcode:
        input.deliveryPostcode ?? null,
      p_delivery_date: input.deliveryDate ?? null,
      p_delivery_time: input.deliveryTime ?? null,
      p_currency: input.currency,
      p_total_amount: input.totalAmount,
      p_items: input.items.map((item) => ({
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      })),
    },
  )

  if (error) {
    throw new Error(
      `Unable to create order: ${error.message}`,
    )
  }

  const createdOrder = Array.isArray(data)
    ? data[0]
    : data

  if (
    !createdOrder ||
    typeof createdOrder.id !== 'string' ||
    typeof createdOrder.order_number !== 'string'
  ) {
    throw new Error(
      'The database did not return the created order',
    )
  }

  return {
    id: createdOrder.id,
    orderNumber: createdOrder.order_number,
  }
}