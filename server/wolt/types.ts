export type WoltEnvironment =
  | 'sandbox'
  | 'production'

export type WoltOrderStatus =
  | 'received'
  | 'accepted'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

export interface WoltMoney {
  amount: number
  currency: string
}

export interface WoltOrderItem {
  id: string
  name: string
  quantity: number
  price: WoltMoney
}

export interface WoltCustomer {
  firstName: string
  lastName: string
  phone?: string
}

export interface WoltDeliveryAddress {
  street: string
  city: string
  postcode: string
  country: string
}

export interface WoltOrder {
  id: string
  status: WoltOrderStatus
  createdAt: string

  customer: WoltCustomer

  deliveryAddress: WoltDeliveryAddress

  items: WoltOrderItem[]

  total: WoltMoney
}

export interface WoltVenue {
  id: string
  name: string
  online: boolean
}

export interface WoltWebhookEvent {
  event: string
  orderId: string
}

export interface WoltCoordinates {
  lat: number
  lon: number
}

export interface WoltLocation {
  coordinates: WoltCoordinates
  formatted_address: string
}

export interface WoltShipmentPromise {
  id: string
  created_at: string
  valid_until: string

  pickup: {
    venue_id: string
    location: WoltLocation
    options: {
      min_preparation_time_minutes: number
    }
    eta_minutes: number
  }

  dropoff: {
    location: WoltLocation
    options: {
      scheduled_time: string | null
    }
    eta_minutes: number | null
  }

  price: {
    amount: number
    currency: string
  }

  time_estimate_minutes: number
  is_binding: boolean
  parcels: unknown
}

export interface WoltDeliveryOrder {
  id: string
  status: string

  tracking: {
    id: string
    url: string
  }

  
  pickup: {
    location: WoltLocation
    comment?: string
    options: {
      min_preparation_time_minutes: number
    }
    eta: string
    display_name?: string
  }

  dropoff: {
    location: WoltLocation
    comment?: string
    options: {
      is_no_contact: boolean
      scheduled_time: string | null
    }
    eta: string | null
  }

  price: WoltMoney

  recipient: {
    name: string
    phone_number: string
    email?: string
  }

  parcels: unknown[]

  customer_support: {
    url?: string
    email?: string
    phone_number?: string
  }

  wolt_order_reference_id: string
  merchant_order_reference_id?: string

  tips: unknown[]

  order_number?: string
}

export type WoltDriveOrderEventType =
  | 'order.received'
  | 'order.rejected'
  | 'order.pickup_eta_updated'
  | 'order.pickup_started'
  | 'order.picked_up'
  | 'order.pickup_arrival'
  | 'order.dropoff_started'
  | 'order.dropoff_arrival'
  | 'order.dropoff_completed'
  | 'order.delivered'
  | 'order.customer_no_show'
  | 'order.dropoff_eta_updated'

export interface WoltDriveOrderEventDetails {
  id: string
  venue_id: string
  wolt_order_reference_id: string
  tracking_reference: string

  merchant_order_reference_id?: string | null
  order_number?: string | null

  price: WoltMoney

  pickup?: {
    eta?: string | null
  } | null

  dropoff?: {
    eta?: {
      min?: string | null
      max?: string | null
    } | null

    completed_at?: string | null
  } | null

  courier?: {
    id?: number | string | null
    vehicle_type?: string | null
  } | null

  parcels?: Array<{
    description?: string | null
    identifier?: string | null
  }> | null

  purchase_rejected_reason?:
    | string
    | null

  [key: string]: unknown
}

export interface WoltDriveOrderEvent {
  dispatched_at: string
  type: WoltDriveOrderEventType
  details: WoltDriveOrderEventDetails

  [key: string]: unknown
}