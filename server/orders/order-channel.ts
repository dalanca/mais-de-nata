/**
 * ============================================================
 * Order Sales Channel
 * ============================================================
 *
 * Identifies where an order originated.
 */

export const OrderSalesChannel = {
  WholesaleWebsite: 'WholesaleWebsite',
  ConsumerWebsite: 'ConsumerWebsite',
  WoltMarketplace: 'WoltMarketplace',
  BoltFood: 'BoltFood',
  Foodora: 'Foodora',
} as const

export type OrderSalesChannel =
  (typeof OrderSalesChannel)[keyof typeof OrderSalesChannel]