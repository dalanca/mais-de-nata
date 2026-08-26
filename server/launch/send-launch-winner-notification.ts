import {
  supabaseAdmin,
} from '../database/supabase.js'

import {
  sendLaunchWinnerEmail,
} from '../email/send-launch-winner-email.js'

import {
  createLaunchClaimToken,
} from './claim-token.js'

type Props = {
  registrationId: string
  language?: 'en' | 'cs'
}

export async function sendLaunchWinnerNotification({
  registrationId,
  language = 'cs',
}: Props) {
  const {
    data: registration,
    error: loadError,
  } = await supabaseAdmin
    .from('launch_registrations')
    .select(`
      id,
      registration_number,
      first_name,
      email,
      is_winner,
      prize_box_size,
      winner_contacted_at,
      claim_token_hash,
      claim_expires_at,
      claimed_at
    `)
    .eq('id', registrationId)
    .single()

  if (loadError || !registration) {
    throw (
      loadError ??
      new Error(
        'Unable to load launch registration',
      )
    )
  }

  if (!registration.is_winner) {
    throw new Error(
      'Launch registration is not a winner',
    )
  }

  if (registration.winner_contacted_at) {
    return {
      alreadySent: true,
    }
  }

  if (registration.claimed_at) {
    throw new Error(
      'Launch prize has already been claimed',
    )
  }

  const {
    token,
    tokenHash,
  } = createLaunchClaimToken()

  const expiresAt =
    new Date(
      Date.now() +
        14 * 24 * 60 * 60 * 1000,
    ).toISOString()

  const siteUrl =
    process.env.SITE_URL ||
    'http://localhost:5173'

  const claimUrl =
    `${siteUrl}/claim?token=${encodeURIComponent(token)}`

  const {
    error: tokenUpdateError,
  } = await supabaseAdmin
    .from('launch_registrations')
    .update({
      claim_token_hash:
        tokenHash,

      claim_expires_at:
        expiresAt,
    })
    .eq('id', registration.id)

  if (tokenUpdateError) {
    throw tokenUpdateError
  }

  await sendLaunchWinnerEmail({
    to:
      registration.email,

    firstName:
      registration.first_name,

    registrationNumber:
      Number(
        registration.registration_number,
      ),

    claimUrl,

    language,
  })

  const {
    error: contactedUpdateError,
  } = await supabaseAdmin
    .from('launch_registrations')
    .update({
      winner_contacted_at:
        new Date().toISOString(),
    })
    .eq('id', registration.id)

  if (contactedUpdateError) {
    throw contactedUpdateError
  }

  return {
    alreadySent: false,
    expiresAt,
  }
}