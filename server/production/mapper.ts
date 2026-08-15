import type {
  ProductionOrder,
  ProductionStatus,
} from './types.js'

type ProductionOrderRow = {
  id: string
  order_number: string
  sales_channel: string

  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null

  currency: string
  total_amount: number

  production_status: ProductionStatus | null

  accepted_at: string | null
  baking_started_at: string | null
  packing_started_at: string | null
  ready_at: string | null
  collected_at: string | null
  delivered_at: string | null

  created_at: string
}

export function mapProductionOrder(
  row: ProductionOrderRow,
): ProductionOrder {
  if (!row.production_status) {
    throw new Error(
      `Order ${row.order_number} has no production status`,
    )
  }

  return {
    id:
      row.id,

    orderNumber:
      row.order_number,

    salesChannel:
      row.sales_channel,

    customerName:
      row.customer_name,

    customerEmail:
      row.customer_email,

    customerPhone:
      row.customer_phone,

    currency:
      row.currency,

    totalAmount:
      row.total_amount,

    productionStatus:
      row.production_status,

    acceptedAt:
      row.accepted_at,

    bakingStartedAt:
      row.baking_started_at,

    packingStartedAt:
      row.packing_started_at,

    readyAt:
      row.ready_at,

    collectedAt:
      row.collected_at,

    deliveredAt:
      row.delivered_at,

    createdAt:
      row.created_at,
  }
}