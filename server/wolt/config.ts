export const WOLT_API_BASE_URL =
  process.env.WOLT_API_BASE_URL ??
  'https://restaurant-api.wolt.com'

export const WOLT_OAUTH_URL =
  process.env.WOLT_OAUTH_URL ??
  'https://authentication.wolt.com'

export const WOLT_CLIENT_ID =
  process.env.WOLT_CLIENT_ID ?? ''

export const WOLT_CLIENT_SECRET =
  process.env.WOLT_CLIENT_SECRET ?? ''

export const WOLT_WEBHOOK_SECRET =
  process.env.WOLT_DRIVE_WEBHOOK_SECRET ?? ''

export const WOLT_DEFAULT_PREPARATION_TIME =
  Number(
    process.env
      .WOLT_DEFAULT_PREPARATION_TIME ??
    '20',
  )

export const WOLT_ENVIRONMENT =
  process.env.WOLT_ENVIRONMENT ??
  'sandbox'

export const WOLT_MERCHANT_ID =
  process.env.WOLT_DRIVE_MERCHANT_ID ?? ''

export const WOLT_MERCHANT_KEY =
  process.env.WOLT_DRIVE_MERCHANT_KEY ?? ''

export const WOLT_VENUE_ID =
  process.env.WOLT_DRIVE_VENUE_ID ?? ''