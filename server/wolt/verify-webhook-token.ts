import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto'

import type {
  WoltDriveOrderEvent,
} from './types.js'

function decodeBase64Url(
  value: string,
): Buffer {
  return Buffer.from(
    value.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  )
}

export function verifyWoltWebhookToken(
  token: string,
  secret: string,
): WoltDriveOrderEvent {
  const parts =
    token.split('.')

  if (parts.length !== 3) {
    throw new Error(
      'Invalid Wolt webhook token',
    )
  }

  const [
    encodedHeader,
    encodedPayload,
    encodedSignature,
  ] = parts

  const header = JSON.parse(
    decodeBase64Url(
      encodedHeader,
    ).toString('utf8'),
  ) as {
    alg?: string
    typ?: string
  }

  if (header.alg !== 'HS256') {
    throw new Error(
      'Unsupported Wolt webhook signing algorithm',
    )
  }

  const signingInput =
    `${encodedHeader}.${encodedPayload}`

  const expectedSignature =
    createHmac(
      'sha256',
      secret,
    )
      .update(signingInput)
      .digest()

  const receivedSignature =
    decodeBase64Url(
      encodedSignature,
    )

  if (
    receivedSignature.length !==
    expectedSignature.length
  ) {
    throw new Error(
      'Invalid Wolt webhook signature',
    )
  }

  if (
    !timingSafeEqual(
      receivedSignature,
      expectedSignature,
    )
  ) {
    throw new Error(
      'Invalid Wolt webhook signature',
    )
  }

  const payload =
    JSON.parse(
      decodeBase64Url(
        encodedPayload,
      ).toString('utf8'),
    ) as WoltDriveOrderEvent

  if (
    !payload ||
    typeof payload !== 'object' ||
    !payload.type ||
    !payload.dispatched_at ||
    !payload.details
  ) {
    throw new Error(
      'Invalid Wolt webhook payload',
    )
  }

  return payload
}