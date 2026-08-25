import {
  supabaseAdmin,
} from '../database/supabase.js'

export type DeliveryBlackout = {
  id: string
  startsAt: string
  endsAt: string | null
  reason: string | null
}

export async function findDeliveryBlackoutsForPeriod(
  startsAt: string,
  endsAt: string,
): Promise<DeliveryBlackout[]> {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from('delivery_blackouts')
    .select(
      `
        id,
        starts_at,
        ends_at,
        reason
      `,
    )
    .lt(
      'starts_at',
      endsAt,
    )
    .or(
      `ends_at.is.null,ends_at.gt.${startsAt}`,
    )
    .order(
      'starts_at',
      {
        ascending: true,
      },
    )

  if (error) {
    throw new Error(
      `Unable to check delivery blackouts: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (blackout) => ({
      id:
        blackout.id,

      startsAt:
        blackout.starts_at,

      endsAt:
        blackout.ends_at,

      reason:
        blackout.reason,
    }),
  )
}

export async function isDeliveryPeriodBlocked(
  startsAt: string,
  endsAt: string,
) {
  const blackouts =
    await findDeliveryBlackoutsForPeriod(
      startsAt,
      endsAt,
    )

  return {
    blocked:
      blackouts.length > 0,

    blackouts,
  }
}