import { supabaseAdmin } from '../../server/database/supabase'

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
  data: orders,
  error: ordersError,
} = await supabaseAdmin
  .from('orders')
  .select(
    `
      id,
      order_number,
      created_at,
      wholesale_customer_id,
      company_name,
      company_id,
      vat_number,
      customer_name,
      customer_email,
      customer_phone,
      delivery_street,
      delivery_house_number,
      delivery_city,
      delivery_postcode,
      currency,
      total_amount,
      payment_status,
      fulfilment_status,
      notes
    `,
  )
  .eq('sales_channel', 'WholesaleWebsite')
  .order('created_at', {
    ascending: false,
  })

if (ordersError) {
  throw ordersError
}

const orderIds =
  (orders ?? []).map((order) => order.id)

let orderItems: {
  order_id: string
  quantity: number
}[] = []

if (orderIds.length > 0) {
  const {
    data: orderItemData,
    error: orderItemsError,
  } = await supabaseAdmin
    .from('order_items')
    .select(`
      order_id,
      quantity
    `)
    .in('order_id', orderIds)

  if (orderItemsError) {
    throw orderItemsError
  }

  orderItems =
    (orderItemData ?? []) as {
      order_id: string
      quantity: number
    }[]
}

const cartonsByOrder: Record<string, number> = {}

for (const item of orderItems) {
  cartonsByOrder[item.order_id] =
    (cartonsByOrder[item.order_id] ?? 0) +
    item.quantity
}

const enrichedOrders = (orders ?? []).map(
  (order) => ({
    ...order,
    cartons:
      cartonsByOrder[order.id] ?? 0,
  }),
)

return res.status(200).json({
  success: true,
  orders: enrichedOrders,
})
  } catch (error) {
    console.error(
      'Unable to load admin wholesale orders:',
      error,
    )

    return res.status(500).json({
      success: false,
      error: 'Unable to load wholesale orders',
    })
  }
}