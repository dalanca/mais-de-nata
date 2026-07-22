import Stripe from 'stripe';
import type { CheckoutRequest } from '../shared/checkout-types';
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

    const { customer, delivery, cartItems } = body;

    if (!customer || !delivery || !Array.isArray(cartItems)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid checkout data',
      });
    }
    if (cartItems.length === 0) {
  return response.status(400).json({
    success: false,
    message: 'Cart is empty',
  })
}
console.log('Received cartItems:', cartItems)

const hasInvalidCartItem = cartItems.some((item) => {

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

    const origin =
      request.headers.origin || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer.email,

      metadata: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        deliveryStreet: delivery.street,
        deliveryHouseNumber: delivery.houseNumber,
        deliveryApartment: delivery.apartment || '',
        deliveryCity: delivery.city,
        deliveryPostcode: delivery.postcode,
        deliveryDate: delivery.deliveryDate,
        deliveryTime: delivery.preferredTime,
    },
      line_items: cartItems.map((item) => {
        const boxSize = item.boxSize as BoxSize
        const trustedPrice = trustedBoxPrices[boxSize]

        return {
            price_data: {
                currency: 'czk',

                product_data: {
                    name: `Box of ${boxSize} Pastéis de Nata`,
            },

            unit_amount: trustedPrice * 100,
        },

        quantity: item.quantity,
    }
}),

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
    console.error('Checkout Session creation failed:', error);

    return response.status(500).json({
      success: false,
      message: 'Unable to create Checkout Session',
    });
  }
}