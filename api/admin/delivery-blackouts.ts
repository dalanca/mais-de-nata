import { supabaseAdmin } from '../../server/database/supabase.js'

async function requireAdmin(
  req: any,
  res: any,
) {
  const authorization =
    req.headers.authorization

  if (
    !authorization ||
    !authorization.startsWith('Bearer ')
  ) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    })

    return null
  }

  const accessToken =
    authorization.slice('Bearer '.length)

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(
    accessToken,
  )

  if (authError || !user) {
    res.status(401).json({
      success: false,
      error: 'Invalid session',
    })

    return null
  }

  const {
    data: adminUser,
    error: adminError,
  } = await supabaseAdmin
    .from('admin_users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (
    adminError ||
    !adminUser ||
    adminUser.role !== 'admin' ||
    adminUser.is_active !== true
  ) {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    })

    return null
  }

  return user
}

export default async function handler(
  req: any,
  res: any,
) {
  const adminUser =
    await requireAdmin(
      req,
      res,
    )

  if (!adminUser) {
    return
  }

  try {
    if (req.method === 'GET') {
      const now =
        new Date().toISOString()

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
            reason,
            created_at,
            updated_at
          `,
        )
        .or(
          `ends_at.is.null,ends_at.gte.${now}`,
        )
        .order(
          'starts_at',
          {
            ascending: true,
          },
        )

      if (error) {
        throw error
      }

      return res.status(200).json({
        success: true,
        blackouts:
          data ?? [],
      })
    }

    if (req.method === 'POST') {
      const {
        startsAt,
        endsAt,
        reason,
      } = req.body ?? {}

      if (
        !startsAt ||
        typeof startsAt !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'startsAt is required',
        })
      }

      if (
        endsAt != null &&
        typeof endsAt !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'endsAt must be a string or null',
        })
      }

      const startsDate =
        new Date(startsAt)

      const endsDate =
        endsAt
          ? new Date(endsAt)
          : null

      if (
        Number.isNaN(
          startsDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid startsAt',
        })
      }

      if (
        endsDate &&
        Number.isNaN(
          endsDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid endsAt',
        })
      }

      if (
        endsDate &&
        endsDate.getTime() <=
          startsDate.getTime()
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Blackout end must be after start',
        })
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from('delivery_blackouts')
        .insert({
          starts_at:
            startsDate.toISOString(),

          ends_at:
            endsDate
              ? endsDate.toISOString()
              : null,

          reason:
            typeof reason === 'string' &&
            reason.trim()
              ? reason.trim()
              : null,
        })
        .select(
          `
            id,
            starts_at,
            ends_at,
            reason,
            created_at,
            updated_at
          `,
        )
        .single()

      if (error || !data) {
        throw (
          error ??
          new Error(
            'Unable to create delivery blackout',
          )
        )
      }

      return res.status(201).json({
        success: true,
        blackout:
          data,
      })
    }

    if (req.method === 'DELETE') {
      const id =
        typeof req.query?.id ===
        'string'
          ? req.query.id
          : ''

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Blackout id is required',
        })
      }

      const {
        error,
      } = await supabaseAdmin
        .from('delivery_blackouts')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return res.status(200).json({
        success: true,
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error(
      'Delivery blackout API failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to manage delivery availability',
    })
  }
}