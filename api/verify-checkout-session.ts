import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured')
}

const stripe = new Stripe(stripeSecretKey)

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    return response.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  const sessionId = request.query?.session_id

  if (!sessionId || typeof sessionId !== 'string') {
    return response.status(400).json({
      success: false,
      error: 'Missing or invalid session_id',
    })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    })

    if (session.payment_status !== 'paid') {
      return response.status(400).json({
        success: false,
        verified: false,
        error: 'Payment has not been completed',
      })
    }

    const lineItems =
      session.line_items?.data.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amountTotal: item.amount_total,
        currency: item.currency,
      })) ?? []

    return response.status(200).json({
      success: true,
      verified: true,

      order: {
        sessionId: session.id,
        customerEmail:
          session.customer_details?.email ??
          session.customer_email ??
          '',

        customerName:
          session.metadata?.customerName ?? '',

        customerPhone:
          session.metadata?.customerPhone ?? '',

        amountTotal: session.amount_total,
        currency: session.currency,

        delivery: {
          street:
            session.metadata?.deliveryStreet ?? '',

          houseNumber:
            session.metadata?.deliveryHouseNumber ?? '',

          apartment:
            session.metadata?.deliveryApartment ?? '',

          city:
            session.metadata?.deliveryCity ?? '',

          postcode:
            session.metadata?.deliveryPostcode ?? '',

          deliveryDate:
            session.metadata?.deliveryDate ?? '',

          preferredTime:
            session.metadata?.deliveryTime ?? '',
        },

        lineItems,
      },
    })
  } catch (error) {
    console.error('Checkout session verification failed:', error)

    if (
      error instanceof Stripe.errors.StripeInvalidRequestError
    ) {
      return response.status(404).json({
        success: false,
        verified: false,
        error: 'Checkout session not found',
      })
    }

    return response.status(500).json({
      success: false,
      verified: false,
      error: 'Unable to verify payment',
    })
  }
}