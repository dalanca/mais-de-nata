import { supabaseAdmin } from '../../server/database/supabase.js'

import {
  mapProductionOrder,
} from '../../server/production/mapper.js'

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'GET') {
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
      data: orderRows,
      error: ordersError,
    } = await supabaseAdmin
      .from('orders')
      .select(
        `
          id,
          order_number,
          sales_channel,
          customer_name,
          customer_email,
          customer_phone,
          currency,
          total_amount,
          payment_status,
          production_status,
          accepted_at,
          baking_started_at,
          packing_started_at,
          ready_at,
          collected_at,
          delivered_at,

          wolt_delivery_status,
          wolt_pickup_eta,
          wolt_pickup_eta_updated_at,
          wolt_courier_id,
          wolt_courier_vehicle_type,
          wolt_tracking_url,

          created_at
        `,
      )
      .not(
        'production_status',
        'is',
        null,
      )
      .order(
        'created_at',
        {
          ascending: true,
        },
      )

    if (ordersError) {
      throw ordersError
    }

    const orderIds =
      (orderRows ?? []).map(
        (row) => row.id,
      )

    let orderItemRows: {
      order_id: string
      product_name: string
      quantity: number
    }[] = []

    if (orderIds.length > 0) {
      const {
        data: itemRows,
        error: itemsError,
      } = await supabaseAdmin
        .from('order_items')
        .select(
          `
        order_id,
        product_name,
        quantity
      `,
        )
        .in(
          'order_id',
          orderIds,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

      if (itemsError) {
        throw itemsError
      }

      orderItemRows =
        (itemRows ?? []) as {
          order_id: string
          product_name: string
          quantity: number
        }[]
    }

    const itemsByOrder = new Map<
      string,
      {
        productName: string
        quantity: number
      }[]
    >()

    for (const item of orderItemRows) {
      const existingItems =
        itemsByOrder.get(
          item.order_id,
        ) ?? []

      existingItems.push({
        productName:
          item.product_name,

        quantity:
          item.quantity,
      })

      itemsByOrder.set(
        item.order_id,
        existingItems,
      )
    }

    const orders =
      (orderRows ?? []).map(
        (row) => ({
          ...mapProductionOrder(row),

          items:
            itemsByOrder.get(
              row.id,
            ) ?? [],
        }),
      )

    return res.status(200).json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error(
      'Unable to load production orders:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to load production orders',
    })
  }
}