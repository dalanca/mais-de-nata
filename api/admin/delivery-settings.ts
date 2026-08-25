import {
  supabaseAdmin,
} from '../../server/database/supabase.js'

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
      const {
        data,
        error,
      } = await supabaseAdmin
        .from('delivery_settings')
        .select(
          `
            timezone,
            first_slot_start_hour,
            last_slot_end_hour,
            immediate_delivery_minutes,
            updated_at
          `,
        )
        .eq('id', true)
        .single()

      if (error || !data) {
        throw (
          error ??
          new Error(
            'Unable to load delivery settings',
          )
        )
      }

      return res.status(200).json({
        success: true,
        settings: data,
      })
    }

    if (req.method === 'PATCH') {
      const {
        firstSlotStartHour,
        lastSlotEndHour,
      } = req.body ?? {}

      if (
        !Number.isInteger(
          firstSlotStartHour,
        ) ||
        !Number.isInteger(
          lastSlotEndHour,
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Delivery hours must be whole hours',
        })
      }

      if (
        firstSlotStartHour < 0 ||
        firstSlotStartHour > 23 ||
        lastSlotEndHour < 1 ||
        lastSlotEndHour > 24 ||
        lastSlotEndHour <=
          firstSlotStartHour
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid delivery operating hours',
        })
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from('delivery_settings')
        .update({
          first_slot_start_hour:
            firstSlotStartHour,

          last_slot_end_hour:
            lastSlotEndHour,

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', true)
        .select(
          `
            timezone,
            first_slot_start_hour,
            last_slot_end_hour,
            immediate_delivery_minutes,
            updated_at
          `,
        )
        .single()

      if (error || !data) {
        throw (
          error ??
          new Error(
            'Unable to update delivery settings',
          )
        )
      }

      return res.status(200).json({
        success: true,
        settings: data,
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error(
      'Delivery settings API failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to manage delivery settings',
    })
  }
}