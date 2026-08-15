import type {
  WoltDriveOrderEvent,
} from './types.js'

export type WoltOrderWebhookUpdate = {
  wolt_delivery_status?: string

  wolt_pickup_eta?: string
  wolt_pickup_eta_updated_at?: string

  wolt_dropoff_eta_min?: string
  wolt_dropoff_eta_max?: string

  wolt_pickup_started_at?: string
  wolt_picked_up_at?: string
  wolt_dropoff_completed_at?: string
  wolt_delivered_at?: string

  wolt_courier_id?: string
  wolt_courier_vehicle_type?: string

  wolt_rejection_reason?: string

  wolt_last_event_type: string
  wolt_last_event_at: string
}

export function mapWoltOrderEventToUpdate(
  event: WoltDriveOrderEvent,
): WoltOrderWebhookUpdate {
  const update: WoltOrderWebhookUpdate = {
    wolt_delivery_status:
      event.type,

    wolt_last_event_type:
      event.type,

    wolt_last_event_at:
      event.dispatched_at,
  }

  const pickupEta =
    event.details.pickup?.eta

  if (pickupEta) {
    update.wolt_pickup_eta =
      pickupEta

    update.wolt_pickup_eta_updated_at =
      event.dispatched_at
  }

  const dropoffEta =
    event.details.dropoff?.eta

  if (dropoffEta?.min) {
    update.wolt_dropoff_eta_min =
      dropoffEta.min
  }

  if (dropoffEta?.max) {
    update.wolt_dropoff_eta_max =
      dropoffEta.max
  }

  if (
    event.details.courier?.id !==
    undefined &&
    event.details.courier?.id !==
    null
  ) {
    update.wolt_courier_id =
      String(
        event.details.courier.id,
      )
  }

  if (
    event.details.courier
      ?.vehicle_type
  ) {
    update.wolt_courier_vehicle_type =
      event.details.courier
        .vehicle_type
  }

  switch (event.type) {
    case 'order.pickup_started':
      update.wolt_pickup_started_at =
        event.dispatched_at
      break

    case 'order.picked_up':
      update.wolt_picked_up_at =
        event.dispatched_at
      break

    case 'order.dropoff_completed':
      if (
        event.details.dropoff
          ?.completed_at
      ) {
        update.wolt_dropoff_completed_at =
          event.details.dropoff
            .completed_at
      } else {
        update.wolt_dropoff_completed_at =
          event.dispatched_at
      }
      break

    case 'order.delivered':
      update.wolt_delivered_at =
        event.details.dropoff
          ?.completed_at ??
        event.dispatched_at
      break

    case 'order.rejected':
      if (
        event.details
          .purchase_rejected_reason
      ) {
        update.wolt_rejection_reason =
          event.details
            .purchase_rejected_reason
      }
      break
  }

  return update
}