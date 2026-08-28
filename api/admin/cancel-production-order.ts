import {
  supabaseAdmin,
} from '../../server/database/supabase.js'

import {
  cancelWoltDelivery,
} from '../../server/wolt/cancel-delivery.js'

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'POST') {
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
      authorization.slice(
        'Bearer '.length,
      )

    const {
      data: { user },
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
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
      reason,
    } = req.body ?? {}

    if (
      !orderId ||
      typeof orderId !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      })
    }

    const cancellationReason =
      typeof reason === 'string'
        ? reason.trim()
        : ''

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required',
      })
    }

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from('orders')
      .select(
        `
          id,
          production_status,
          wolt_order_reference_id,
          wolt_delivery_id
        `,
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    if (
      order.production_status ===
        'delivered' ||
      order.production_status ===
        'cancelled'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'This order can no longer be cancelled',
      })
    }

    if (
      order.production_status ===
      'collected'
    ) {
      return res.status(409).json({
        success: false,
        error:
          'The courier has already collected this order. Contact Wolt support to cancel it.',
      })
    }

    if (
      order.production_status ===
        'ready' &&
      order.wolt_delivery_id
    ) {
      if (
        !order.wolt_order_reference_id
      ) {
        throw new Error(
          'Wolt order reference is missing',
        )
      }

      await cancelWoltDelivery(
        order.wolt_order_reference_id,
        cancellationReason,
      )
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from('orders')
      .update({
        production_status:
          'cancelled',

        fulfilment_status:
          'Cancelled',
      })
      .eq('id', orderId)

    if (updateError) {
      throw updateError
    }

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Unable to cancel production order:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to cancel order',
    })
  }
}