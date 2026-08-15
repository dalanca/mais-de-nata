import {
  WOLT_CLIENT_ID,
  WOLT_CLIENT_SECRET,
  WOLT_OAUTH_URL,
} from './config.js'

export type WoltAccessToken = {
  accessToken: string
  expiresIn: number
  tokenType: string
}

export async function requestAccessToken(): Promise<WoltAccessToken> {
  if (!WOLT_CLIENT_ID) {
    throw new Error(
      'WOLT_CLIENT_ID is not configured',
    )
  }

  if (!WOLT_CLIENT_SECRET) {
    throw new Error(
      'WOLT_CLIENT_SECRET is not configured',
    )
  }

  throw new Error(
    'OAuth implementation will be completed once Wolt issues sandbox credentials.',
  )
}