import { supabaseAdmin } from '../../server/database/supabase.js'

const allowedTransitions: Record<
  string,
  string
> = {
  new: 'accepted',
  accepted: 'baking',
  baking: 'packing',
  packing: 'ready',
  ready: 'collected',
  collected: 'delivered',
}

const timestampColumnByStatus: Record<
  string,
  string
> = {
  accepted: 'accepted_at',
  baking: 'baking_started_at',
  packing: 'packing_started_at',
  ready: 'ready_at',
  collected: 'collected_at',
  delivered: 'delivered_at',
}

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

    const {
      orderId,
      nextStatus,
    } = req.body ?? {}

    if (!orderId || !nextStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing request data',
      })
    }

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from('orders')
      .select(
        'id, production_status',
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    const expectedNextStatus =
      allowedTransitions[
        order.production_status
      ]

    if (
      expectedNextStatus !==
      nextStatus
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid status transition',
      })
    }

    const timestampColumn =
      timestampColumnByStatus[
        nextStatus
      ]

    const updateData: Record<
      string,
      any
    > = {
      production_status:
        nextStatus,
    }

    if (timestampColumn) {
      updateData[
        timestampColumn
      ] = new Date().toISOString()
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      throw updateError
    }

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      error:
        'Unable to update production status',
    })
  }
}