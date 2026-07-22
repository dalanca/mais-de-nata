import Stripe from 'stripe'

import { createOrderFromChannel } from '../server/orders/order-service'
import { createChannelOrderFromStripeSession } from '../server/payments/stripe-adapter'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured')
}

const stripe = new Stripe(stripeSecretKey)

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json(
        {
          success: false,
          error: 'Method not allowed',
        },
        {
          status: 405,
        },
      )
    }

    const stripeWebhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeWebhookSecret) {
      console.error(
        'STRIPE_WEBHOOK_SECRET is not configured',
      )

      return Response.json(
        {
          success: false,
          error: 'Webhook is not configured',
        },
        {
          status: 500,
        },
      )
    }

    const signature = request.headers.get(
      'stripe-signature',
    )

    if (!signature) {
      return Response.json(
        {
          success: false,
          error: 'Missing Stripe signature',
        },
        {
          status: 400,
        },
      )
    }

    let event: Stripe.Event

    try {
      const rawBody = await request.text()

      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret,
      )
    } catch (error) {
      console.error(
        'Stripe webhook signature verification failed:',
        error,
      )

      return Response.json(
        {
          success: false,
          error: 'Invalid webhook signature',
        },
        {
          status: 400,
        },
      )
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session =
            event.data.object as Stripe.Checkout.Session

          if (session.payment_status !== 'paid') {
            console.log(
              'Checkout completed but payment is not yet paid:',
              session.id,
            )

            break
          }

const lineItemsResponse =
  await stripe.checkout.sessions.listLineItems(
    session.id,
    {
      limit: 100,
    },
  )

const channelOrder =
  createChannelOrderFromStripeSession(
    event.id,
    session,
    lineItemsResponse.data,
  )

          const result =
            await createOrderFromChannel(channelOrder)

          if (result.alreadyExists) {
            console.log(
              'Stripe order was already processed:',
              {
                eventId: event.id,
                sessionId: session.id,
                orderNumber: result.order.orderNumber,
              },
            )
          } else {
            console.log(
              'Stripe order created successfully:',
              {
                eventId: event.id,
                sessionId: session.id,
                orderId: result.order.id,
                orderNumber: result.order.orderNumber,
              },
            )
          }

          break
        }

        default:
          console.log(
            `Unhandled Stripe event type: ${event.type}`,
          )
      }

      return Response.json({
        received: true,
      })
    } catch (error) {
console.error(
  'Stripe webhook processing failed:',
  error instanceof Error ? error.stack : error,
)

      return Response.json(
        {
          success: false,
          error: 'Webhook processing failed',
        },
        {
          status: 500,
        },
      )
    }
  },
}