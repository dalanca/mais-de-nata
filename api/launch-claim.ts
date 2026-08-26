import {
  supabaseAdmin,
} from '../server/database/supabase.js'

import {
  hashLaunchClaimToken,
} from '../server/launch/claim-token.js'

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    })
  }

  try {
    const token =
      typeof req.body?.token === 'string'
        ? req.body.token.trim()
        : ''

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Claim token is required',
      })
    }

    const tokenHash =
      hashLaunchClaimToken(token)

    const {
      data: registration,
      error,
    } = await supabaseAdmin
      .from('launch_registrations')
      .select(`
        id,
        first_name,
        email,
        registration_number,
        is_winner,
        prize_box_size,
        claim_expires_at,
        claimed_at
      `)
      .eq(
        'claim_token_hash',
        tokenHash,
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message:
          'This claim link is not valid.',
      })
    }

    if (!registration.is_winner) {
      return res.status(403).json({
        success: false,
        message:
          'This registration is not eligible for a prize.',
      })
    }

    if (registration.claimed_at) {
      return res.status(409).json({
        success: false,
        message:
          'This prize has already been claimed.',
      })
    }

    if (!registration.claim_expires_at) {
      return res.status(410).json({
        success: false,
        message:
          'This claim link has expired.',
      })
    }

    const expiresAt =
      new Date(
        registration.claim_expires_at,
      ).getTime()

    if (
      Number.isNaN(expiresAt) ||
      Date.now() >= expiresAt
    ) {
      return res.status(410).json({
        success: false,
        message:
          'This claim link has expired.',
      })
    }

    if (
      registration.prize_box_size !== 4
    ) {
      return res.status(422).json({
        success: false,
        message:
          'Prize configuration is invalid.',
      })
    }

    return res.status(200).json({
      success: true,

      firstName:
        registration.first_name,

      prizeBoxSize:
        registration.prize_box_size,

      claimExpiresAt:
        registration.claim_expires_at,
    })
  } catch (error) {
    console.error(
      'Launch claim validation failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to validate this claim link.',
    })
  }
}