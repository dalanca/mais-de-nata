import Stripe from 'stripe';
import type { CheckoutRequest } from '../shared/checkout-types.js';
import { OrderSalesChannel } from '../server/orders/order-channel.js'
import {
  checkDeliverySlotAvailability,
} from '../server/delivery/delivery-availability.js'
import {
  isImmediateDeliveryAvailable,
} from '../server/delivery/delivery-slots.js'
import {
  hashLaunchClaimToken,
} from '../server/launch/claim-token.js'
import {
  supabaseAdmin,
} from '../server/database/supabase.js'
import {
  createShipmentPromise,
} from '../server/wolt/shipment-promise.js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(stripeSecretKey);
type BoxSize = 4 | 6 | 12 | 18

const trustedBoxPrices: Record<BoxSize, number> = {
  4: 240,
  6: 348,
  12: 660,
  18: 936,
}

const allowedBoxSizes: BoxSize[] = [4, 6, 12, 18]

export default async function handler(
  request: any,
  response: any
) {
  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const body = request.body as CheckoutRequest | undefined;

    if (!body || typeof body !== 'object') {
      return response.status(400).json({
        success: false,
        message: 'Checkout data is required',
      });
    }

    const {
      customer,
      delivery,
      cartItems,
      language,
      claimToken,
    } = body;

    if (!customer || !delivery || !Array.isArray(cartItems)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid checkout data',
      });
    }

    if (language !== 'en' && language !== 'cs') {
      return response.status(400).json({
        success: false,
        message: 'Invalid checkout language',
      })
    }
    let validLaunchClaim:
      | {
        id: string
        prizeBoxSize: number
      }
      | null = null

    if (
      typeof claimToken === 'string' &&
      claimToken.trim()
    ) {
      const tokenHash =
        hashLaunchClaimToken(
          claimToken.trim(),
        )

      const {
        data: registration,
        error: claimError,
      } = await supabaseAdmin
        .from('launch_registrations')
        .select(`
      id,
      is_winner,
      prize_box_size,
      claim_expires_at,
      claimed_at
    `)
        .eq(
          'claim_token_hash',
          tokenHash,
        )
        .maybeSingle()

      if (claimError) {
        throw claimError
      }

      if (
        !registration ||
        !registration.is_winner ||
        registration.prize_box_size !== 4 ||
        registration.claimed_at ||
        !registration.claim_expires_at ||
        Date.now() >=
        new Date(
          registration.claim_expires_at,
        ).getTime()
      ) {
        return response.status(403).json({
          success: false,
          message:
            'This prize claim is not valid.',
        })
      }

      validLaunchClaim = {
        id: registration.id,
        prizeBoxSize:
          registration.prize_box_size,
      }
    }
    if (
      !validLaunchClaim &&
      cartItems.length === 0
    ) {
      return response.status(400).json({
        success: false,
        message: 'Cart is empty',
      })
    }
    console.log('Received cartItems:', cartItems)

    const hasInvalidCartItem =
      !validLaunchClaim &&
      cartItems.some((item) => {

        console.log('Validating item:', item)

        console.log('product valid:', item.product === 'fresh-pasteis-de-nata')
        console.log('boxSize:', item.boxSize, typeof item.boxSize)
        console.log('allowed:', allowedBoxSizes.includes(item.boxSize as BoxSize))
        console.log('quantity:', item.quantity)
        console.log('integer:', Number.isInteger(item.quantity))

        return (
          item.product !== 'fresh-pasteis-de-nata' ||
          !allowedBoxSizes.includes(item.boxSize as BoxSize) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
        )
      })

    if (hasInvalidCartItem) {
      return response.status(400).json({
        success: false,
        message: 'Invalid cart item',
      })
    }

    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from('delivery_settings')
      .select(
        `
      last_slot_end_hour,
      immediate_delivery_minutes
    `,
      )
      .eq('id', true)
      .single()

    if (settingsError || !settings) {
      throw (
        settingsError ??
        new Error(
          'Unable to load delivery settings',
        )
      )
    }

    const isImmediateDelivery =
      delivery.preferredTime === 'asap'

    if (
      isImmediateDelivery &&
      !isImmediateDeliveryAvailable(
        settings.last_slot_end_hour,
        settings.immediate_delivery_minutes,
      )
    ) {
      return response.status(409).json({
        success: false,
        message:
          'Within 90 minutes delivery is no longer available today.',
      })
    }

    let scheduledDropoffTime:
      string | undefined

    if (!isImmediateDelivery) {
      const deliveryTimeMatch =
        delivery.preferredTime.match(
          /^(\d{2}):00–(\d{2}):00$/,
        )

      if (!deliveryTimeMatch) {
        return response.status(400).json({
          success: false,
          message:
            'Please select a valid delivery time',
        })
      }

      const startHour =
        Number(deliveryTimeMatch[1])

      const endHour =
        Number(deliveryTimeMatch[2])

      if (
        !Number.isInteger(startHour) ||
        !Number.isInteger(endHour) ||
        endHour !== startHour + 1
      ) {
        return response.status(400).json({
          success: false,
          message:
            'Invalid delivery time',
        })
      }

      const availability =
        await checkDeliverySlotAvailability(
          delivery.deliveryDate,
          startHour,
        )

      if (!availability.available) {
        return response.status(409).json({
          success: false,
          message:
            'This delivery time is no longer available. Please choose another time.',
        })
      }

      if (
        delivery.slotStartsAt !==
        availability.slot.startsAt ||
        delivery.slotEndsAt !==
        availability.slot.endsAt ||
        delivery.slotCutoffAt !==
        availability.slot.cutoffAt
      ) {
        return response.status(400).json({
          success: false,
          message:
            'Delivery slot information is invalid',
        })
      }

      const slotStartTime =
        new Date(
          availability.slot.startsAt,
        ).getTime()

      const slotEndTime =
        new Date(
          availability.slot.endsAt,
        ).getTime()

      scheduledDropoffTime =
        new Date(
          slotStartTime +
          (
            slotEndTime -
            slotStartTime
          ) / 2,
        ).toISOString()
    }

    const shipmentPromise =
      await createShipmentPromise({
        street:
          `${delivery.street} ${delivery.houseNumber}`.trim(),

        city:
          delivery.city,

        postCode:
          delivery.postcode,

        minPreparationTimeMinutes:
          20,

        scheduledDropoffTime,
      })

    if (!shipmentPromise.is_binding) {
      return response.status(422).json({
        success: false,
        message:
          'Delivery is not available for this address',
      })
    }


    const origin =
      request.headers.origin || 'http://localhost:3000';

    const stripeDeliveryAmount =
      validLaunchClaim &&
        process.env.NODE_ENV !== 'production'
        ? Math.max(
          shipmentPromise.price.amount,
          1500,
        )
        : shipmentPromise.price.amount

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer.email,

      metadata: {
        salesChannel: OrderSalesChannel.ConsumerWebsite,
        language,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerPhone: customer.phone,
        deliveryStreet: delivery.street,
        deliveryHouseNumber: delivery.houseNumber,
        deliveryApartment: delivery.apartment || '',
        deliveryCity: delivery.city,
        deliveryPostcode: delivery.postcode,
        deliveryDate: delivery.deliveryDate,
        deliveryTime: delivery.preferredTime,
        deliverySlotEndsAt:
          delivery.slotEndsAt,

        launchClaimRegistrationId:
          validLaunchClaim?.id ?? '',

        launchClaim:
          validLaunchClaim
            ? 'true'
            : 'false',

        woltShipmentPromiseId:
          shipmentPromise.id,

        woltShipmentPromiseValidUntil:
          shipmentPromise.valid_until,

        woltShipmentPromiseIsBinding:
          String(
            shipmentPromise.is_binding,
          ),

        woltDeliveryFee:
          String(
            shipmentPromise.price.amount,
          ),

        woltDeliveryFeeCurrency:
          shipmentPromise.price.currency,

        woltDropoffLat:
          String(
            shipmentPromise.dropoff.location.coordinates.lat,
          ),

        woltDropoffLon:
          String(
            shipmentPromise.dropoff.location.coordinates.lon,
          ),

        woltDropoffFormattedAddress:
          shipmentPromise.dropoff.location.formatted_address,

        woltPickupEtaMinutes:
          String(
            shipmentPromise.pickup.eta_minutes,
          ),

        woltDropoffEtaMinutes:
          shipmentPromise.dropoff.eta_minutes == null
            ? ''
            : String(
              shipmentPromise.dropoff.eta_minutes,
            ),
      },
      line_items: [
        ...(validLaunchClaim
          ? [
            {
              price_data: {
                currency: 'czk',

                product_data: {
                  name:
                    'Box of 4 Pastéis de Nata — Launch Prize',
                },

                unit_amount: 0,
              },

              quantity: 1,
            },
          ]
          : cartItems.map((item) => {
            const boxSize =
              item.boxSize as BoxSize

            const trustedPrice =
              trustedBoxPrices[boxSize]

            return {
              price_data: {
                currency: 'czk',

                product_data: {
                  name:
                    `Box of ${boxSize} Pastéis de Nata`,
                },

                unit_amount:
                  trustedPrice * 100,
              },

              quantity:
                item.quantity,
            }
          })),

        {
          price_data: {
            currency:
              shipmentPromise.price.currency.toLowerCase(),

            product_data: {
              name:
                'Wolt Drive Delivery',
            },

            unit_amount:
              stripeDeliveryAmount,
          },

          quantity: 1,
        },
      ],

      success_url:
        `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${origin}/?payment=cancelled`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL');
    }

    return response.status(200).json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error(
      'Checkout Session creation failed:',
      error,
    )

    return response.status(500).json({
      success: false,
      message:
        'Unable to create Checkout Session',
    })
  }
}