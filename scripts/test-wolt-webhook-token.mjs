import crypto from 'node:crypto'

const secret =
  process.env.WOLT_DRIVE_WEBHOOK_SECRET

if (!secret) {
  throw new Error(
    'WOLT_DRIVE_WEBHOOK_SECRET is not configured',
  )
}

const base64Url = (value) =>
  Buffer.from(value)
    .toString('base64url')

const header = base64Url(
  JSON.stringify({
    alg: 'HS256',
    typ: 'JWT',
  }),
)

const payload = base64Url(
  JSON.stringify({
    dispatched_at:
      new Date().toISOString(),

    type: 'order.received',

    details: {
      id: `test-event-${Date.now()}`,

      venue_id:
        '6a79e0fcfb5e2fae72989cd2',

      wolt_order_reference_id:
        '6a7dd4ae695bc1abec062f40',

      tracking_reference:
        'test-tracking-reference',

      merchant_order_reference_id:
        '3a648dfa-6b72-4f03-a63f-6f5f0c2506b7',

      order_number:
        '9Z4L',

      price: {
        amount: 1000,
        currency: 'CZK',
      },
    },
  }),
)

const signature =
  crypto
    .createHmac(
      'sha256',
      secret,
    )
    .update(
      `${header}.${payload}`,
    )
    .digest('base64url')

console.log(
  `${header}.${payload}.${signature}`,
)