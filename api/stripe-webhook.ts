import Stripe from 'stripe'
import {
  supabaseAdmin,
} from '../server/database/supabase.js'
import { OrderSalesChannel } from '../server/orders/order-channel.js'
import { createOrderFromChannel } from '../server/orders/order-service.js'
import { createChannelOrderFromStripeSession } from '../server/payments/stripe-adapter.js'
import {
  createWoltDelivery,
} from '../server/wolt/create-delivery.js'

import {
  saveDeliveryToOrder,
} from '../server/wolt/save-delivery.js'

import {
  getOrderWoltDeliveryState,
} from '../server/wolt/get-order-delivery-state.js'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

import {
  sendConsumerOrderConfirmationOnce,
} from '../server/email/send-consumer-order-confirmation-once.js'

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

          const salesChannel =
            session.metadata?.salesChannel

          if (
            salesChannel !== OrderSalesChannel.ConsumerWebsite &&
            salesChannel !== OrderSalesChannel.WholesaleWebsite
          ) {
            throw new Error(
              `Unsupported Stripe sales channel: ${salesChannel}`,
            )
          }

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
              salesChannel,
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

          if (
            session.metadata?.launchClaim === 'true' &&
            session.metadata?.launchClaimRegistrationId
          ) {
            const {
              error: claimUpdateError,
            } = await supabaseAdmin
              .from('launch_registrations')
              .update({
                claimed_at:
                  new Date().toISOString(),
              })
              .eq(
                'id',
                session.metadata
                  .launchClaimRegistrationId,
              )
              .eq(
                'is_winner',
                true,
              )
              .is(
                'claimed_at',
                null,
              )

            if (claimUpdateError) {
              throw claimUpdateError
            }

            console.log(
              'Launch prize marked as claimed:',
              {
                registrationId:
                  session.metadata
                    .launchClaimRegistrationId,

                orderId:
                  result.order.id,

                orderNumber:
                  result.order.orderNumber,
              },
            )
          }

          if (
            salesChannel ===
            OrderSalesChannel.ConsumerWebsite &&
            channelOrder.woltDelivery
          ) {
            const existingWoltDelivery =
              await getOrderWoltDeliveryState(
                result.order.id,
              )

            if (!existingWoltDelivery.deliveryId) {
              const customerPhone =
                channelOrder.customer.phone

              if (!customerPhone) {
                throw new Error(
                  'Consumer order is missing customer phone for Wolt delivery',
                )
              }

              const woltDelivery =
                await createWoltDelivery({
                  shipmentPromiseId:
                    channelOrder.woltDelivery
                      .shipmentPromiseId,
                  scheduledDropoffTime:
                    channelOrder.delivery.slotEndsAt
                      ? new Date(
                        new Date(
                          channelOrder.delivery.slotEndsAt,
                        ).getTime() -
                        30 * 60 * 1000,
                      ).toISOString()
                      : undefined,

                  recipient: {
                    name:
                      channelOrder.customer.name,

                    phoneNumber:
                      customerPhone,

                    email:
                      channelOrder.customer.email,
                  },

                  dropoff: {
                    lat:
                      channelOrder.woltDelivery
                        .dropoffLat,

                    lon:
                      channelOrder.woltDelivery
                        .dropoffLon,

                    comment:
                      channelOrder.delivery.apartment
                        ? `Apartment ${channelOrder.delivery.apartment}`
                        : '',
                  },

                  merchantOrderReferenceId:
                    result.order.id,

                })

              await saveDeliveryToOrder(
                result.order.id,
                woltDelivery,
              )

              console.log(
                'Wolt delivery created successfully:',
                {
                  orderId:
                    result.order.id,
                  orderNumber:
                    result.order.orderNumber,
                  woltDeliveryId:
                    woltDelivery.id,
                  woltOrderReferenceId:
                    woltDelivery
                      .wolt_order_reference_id,
                },
              )
            } else {
              console.log(
                'Wolt delivery already exists:',
                {
                  orderId:
                    result.order.id,
                  woltDeliveryId:
                    existingWoltDelivery.deliveryId,
                },
              )
            }
          }

          if (
            salesChannel ===
            OrderSalesChannel.ConsumerWebsite
          ) {
            try {
              const woltState =
                await getOrderWoltDeliveryState(
                  result.order.id,
                )

              const deliveryAddress = [
                [
                  channelOrder.delivery.street,
                  channelOrder.delivery.houseNumber,
                ]
                  .filter(Boolean)
                  .join(' '),

                channelOrder.delivery.apartment
                  ? `Apartment ${channelOrder.delivery.apartment}`
                  : '',

                [
                  channelOrder.delivery.postcode,
                  channelOrder.delivery.city,
                ]
                  .filter(Boolean)
                  .join(' '),
              ]
                .filter(Boolean)
                .join(', ')

              await sendConsumerOrderConfirmationOnce({
                orderId:
                  result.order.id,

                to:
                  channelOrder.customer.email,

                customerName:
                  channelOrder.customer.name,

                orderNumber:
                  result.order.orderNumber,

                language:
                  channelOrder.language,

                totalAmount:
                  channelOrder.totalAmount,

                currency:
                  channelOrder.currency,

                items:
                  channelOrder.items.map((item) => ({
                    productName:
                      item.productName,

                    quantity:
                      item.quantity,

                    totalPrice:
                      item.totalPrice,
                  })),

                deliveryFee:
                  channelOrder.woltDelivery
                    ?.deliveryFee ?? 0,

                deliveryAddress,

                deliveryDate:
                  channelOrder.delivery.date,

                deliveryTime:
                  channelOrder.delivery.time,

                trackingUrl:
                  woltState.trackingUrl ??
                  undefined,
              })

              console.log(
                'Consumer confirmation email processed:',
                {
                  orderId:
                    result.order.id,
                  orderNumber:
                    result.order.orderNumber,
                },
              )
            } catch (emailError) {
              console.error(
                'Consumer confirmation email failed:',
                emailError,
              )
            }
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