import { supabaseAdmin } from '../../server/database/supabase'

const allowedStatuses = [
  'pending',
  'confirmed',
  'processing',
  'fulfilled',
  'cancelled',
]

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const authorization =
      req.headers.authorization

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
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
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      })
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
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      })
    }

    const { orderId, fulfilmentStatus } =
      req.body ?? {}

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      })
    }

    if (
      !allowedStatuses.includes(
        fulfilmentStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fulfilment status',
      })
    }

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabaseAdmin
      .from('orders')
      .update({
        fulfilment_status:
          fulfilmentStatus,
      })
      .eq('id', orderId)
      .eq(
        'sales_channel',
        'WholesaleWebsite',
      )
      .select(
        `
          id,
          order_number,
          fulfilment_status
        `,
      )
      .single()

    if (updateError) {
      throw updateError
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error(
      'Unable to update wholesale order status:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to update wholesale order status',
    })
  }
}