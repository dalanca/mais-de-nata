import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(stripeSecretKey);

export default async function handler(
  request: any,
  response: any
) {
  try {
    const balance = await stripe.balance.retrieve();

    return response.status(200).json({
      success: true,
      message: 'Stripe connection is working',
      livemode: balance.livemode,
    });
  } catch (error) {
    console.error('Stripe connection test failed:', error);

    return response.status(500).json({
      success: false,
      message: 'Stripe connection failed',
    });
  }
}