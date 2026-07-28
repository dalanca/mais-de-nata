import { supabaseAdmin } from '../server/database/supabase.js'

type WholesaleOrderRequest = {
  boxes: number
  contactName: string
  email: string
  phone?: string
  deliveryAddress: string
  notes?: string
}

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
const {
  boxes,
  contactName,
  email,
  phone,
  deliveryAddress,
  notes,
} = req.body as WholesaleOrderRequest

if (
  !Number.isInteger(boxes) ||
  boxes < 5 ||
  boxes > 24 ||
  !contactName ||
  !email ||
  !deliveryAddress
) {
return res.status(400).json({
  success: false,
  error: 'Invalid wholesale order details',
})
    }

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
return Response.json(
  {
    success: false,
    error: 'Invalid session',
  },
  { status: 401 },
)
}

    const {
      data: customer,
      error: customerError,
    } = await supabaseAdmin
      .from('wholesale_customers')
      .select(
        `
          id,
          company_name,
          company_id,
          vat_number,
          account_status,
          company_street,
          company_house_number,
          company_postcode,
          company_city,
          company_country,
          delivery_same_as_company,
          delivery_street,
          delivery_house_number,
          delivery_postcode,
          delivery_city,
          delivery_country
        `,
      )
      .eq('id', user.id)
      .single()

    if (customerError || !customer) {
return res.status(404).json({
  success: false,
  error: 'Wholesale customer not found',
})
    }

    if (customer.account_status !== 'active') {
return res.status(403).json({
  success: false,
  error: 'Wholesale account is not active',
})
    }

    const deliveryStreet =
  customer.delivery_same_as_company
    ? customer.company_street
    : customer.delivery_street

const deliveryHouseNumber =
  customer.delivery_same_as_company
    ? customer.company_house_number
    : customer.delivery_house_number

const deliveryPostcode =
  customer.delivery_same_as_company
    ? customer.company_postcode
    : customer.delivery_postcode

const deliveryCity =
  customer.delivery_same_as_company
    ? customer.company_city
    : customer.delivery_city

    const pricePerBox =
      boxes >= 10 ? 75 : 79

    const totalAmount =
      boxes * pricePerBox * 100

    const orderNumber =
      `WH-${Date.now()}`

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        wholesale_customer_id:
            user.id,
        company_name:
          customer.company_name,
        company_id:
          customer.company_id,
        vat_number:
          customer.vat_number,
        customer_name: contactName,
        customer_email: email,
        customer_phone: phone ?? null,
        payment_status: 'pending',
        fulfilment_status: 'pending',
        currency: 'EUR',
        total_amount: totalAmount,
        sales_channel: 'WholesaleWebsite',
        notes: notes ?? null,
        delivery_street: deliveryStreet,
        delivery_house_number: deliveryHouseNumber,
        delivery_city: deliveryCity,
        delivery_postcode: deliveryPostcode,
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      throw orderError ?? new Error(
        'Unable to create wholesale order',
      )
    }

    const {
      error: itemError,
    } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        product_name:
          'Pastéis de Nata — 72 pcs carton',
        quantity: boxes,
        unit_price: pricePerBox * 100,
        total_price: totalAmount,
      })

    if (itemError) {
      throw itemError
    }

return res.status(200).json({
  success: true,
  orderNumber: order.order_number,
})
} catch (error) {
  console.error(
    'Wholesale order creation failed:',
    error,
  )

  return res.status(500).json({
    success: false,
    error: 'Unable to create wholesale order',
  })
}
}