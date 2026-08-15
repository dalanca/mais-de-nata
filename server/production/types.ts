export type ProductionStatus =
  | 'new'
  | 'accepted'
  | 'baking'
  | 'packing'
  | 'ready'
  | 'collected'
  | 'delivered'
  | 'cancelled'

export type ProductionOrder = {
  id: string
  orderNumber: string
  salesChannel: string

  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null

  currency: string
  totalAmount: number

  productionStatus: ProductionStatus

  acceptedAt: string | null
  bakingStartedAt: string | null
  packingStartedAt: string | null
  readyAt: string | null
  collectedAt: string | null
  deliveredAt: string | null

  createdAt: string
}