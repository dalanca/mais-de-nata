import {
  createDeliverySlot,
  isDeliverySlotPastCutoff,
} from './delivery-slots.js'

import {
  isDeliveryPeriodBlocked,
} from './delivery-blackouts.js'

export type DeliveryAvailabilityReason =
  | 'available'
  | 'past_cutoff'
  | 'blackout'

export async function checkDeliverySlotAvailability(
  date: string,
  startHour: number,
  now = new Date(),
) {
  const slot =
    createDeliverySlot(
      date,
      startHour,
    )

  if (
    isDeliverySlotPastCutoff(
      slot,
      now,
    )
  ) {
    return {
      available: false,
      reason:
        'past_cutoff' as DeliveryAvailabilityReason,
      slot,
      blackouts: [],
    }
  }

  const blackoutResult =
    await isDeliveryPeriodBlocked(
      slot.startsAt,
      slot.endsAt,
    )

  if (blackoutResult.blocked) {
    return {
      available: false,
      reason:
        'blackout' as DeliveryAvailabilityReason,
      slot,
      blackouts:
        blackoutResult.blackouts,
    }
  }

  return {
    available: true,
    reason:
      'available' as DeliveryAvailabilityReason,
    slot,
    blackouts: [],
  }
}