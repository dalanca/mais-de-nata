import { supabaseAdmin } from '../server/database/supabase.js'
import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
} from '../server/email/resend.js'

type WholesaleOrderRequest = {
  wholesaleCustomerId: string
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
      wholesaleCustomerId,
      boxes,
      contactName,
      email,
      phone,
      deliveryAddress,
      notes,
    } = req.body as WholesaleOrderRequest

    if (
      !wholesaleCustomerId ||
      !Number.isInteger(boxes) ||
      boxes < 5 ||
      boxes > 24 ||
      !contactName?.trim() ||
      !email?.trim() ||
      !deliveryAddress?.trim()
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
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      })
    }

    /*
     * Verify that:
     * 1. the selected company exists;
     * 2. it belongs to the signed-in user;
     * 3. it is active.
     *
     * Never trust the company UUID sent by the browser
     * without checking ownership on the server.
     */
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
      .eq('id', wholesaleCustomerId)
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (customerError) {
      throw customerError
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error:
          'The selected wholesale company was not found',
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

        /*
         * Link the order to the selected company,
         * not directly to the Auth user.
         */
        wholesale_customer_id: customer.id,

        company_name:
          customer.company_name,

        company_id:
          customer.company_id,

        vat_number:
          customer.vat_number,

        customer_name:
          contactName.trim(),

        customer_email:
          email.trim().toLowerCase(),

        customer_phone:
          phone?.trim() || null,

        payment_status: 'pending',
        fulfilment_status: 'pending',
        currency: 'EUR',
        total_amount: totalAmount,
        sales_channel: 'WholesaleWebsite',

        notes:
          notes?.trim() || null,

        delivery_street:
          deliveryStreet,

        delivery_house_number:
          deliveryHouseNumber,

        delivery_city:
          deliveryCity,

        delivery_postcode:
          deliveryPostcode,
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      throw (
        orderError ??
        new Error(
          'Unable to create wholesale order',
        )
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
        unit_price:
          pricePerBox * 100,
        total_price:
          totalAmount,
      })

    if (itemError) {
      throw itemError
    }

    const { error: emailError } =
  await resend.emails.send({
    from: EMAIL_FROM,
    to: email.trim().toLowerCase(),
    replyTo: EMAIL_REPLY_TO,
    subject: `Wholesale order received — ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #4e312d; line-height: 1.6;">
        <h2>Thank you for your wholesale order</h2>

        <p>Dear ${contactName.trim()},</p>

        <p>
          We have received your wholesale order
          <strong>${order.order_number}</strong>.
        </p>

        <p>
          <strong>Company:</strong> ${customer.company_name}<br />
          <strong>Cartons:</strong> ${boxes}<br />
          <strong>Total:</strong> €${(totalAmount / 100).toFixed(2)}
        </p>

        <p>
          We will review availability and contact you to confirm
          the delivery arrangements and payment details.
        </p>

        <p>
          Kind regards,<br />
          Mais de Nata
        </p>
      </div>
    `,
  })

if (emailError) {
  console.error(
    'Wholesale order email failed:',
    emailError,
  )
}

    return res.status(200).json({
      success: true,
      orderNumber:
        order.order_number,
    })
  } catch (error) {
    console.error(
      'Wholesale order creation failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to create wholesale order',
    })
  }
}