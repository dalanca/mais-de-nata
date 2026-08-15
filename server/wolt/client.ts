import {
  WOLT_MERCHANT_KEY,
} from './config.js'

const WOLT_DRIVE_BASE_URL =
  process.env.WOLT_DRIVE_ENV ===
  'production'
    ? 'https://daas-public-api.wolt.com'
    : 'https://daas-public-api.development.dev.woltapi.com'

export class WoltClient {
  async get(
    path: string,
  ) {
    return this.request(
      'GET',
      path,
    )
  }

  async post(
    path: string,
    body?: unknown,
  ) {
    return this.request(
      'POST',
      path,
      body,
    )
  }

  async put(
    path: string,
    body?: unknown,
  ) {
    return this.request(
      'PUT',
      path,
      body,
    )
  }

  async patch(
    path: string,
    body?: unknown,
  ) {
    return this.request(
      'PATCH',
      path,
      body,
    )
  }

  async delete(
    path: string,
    body?: unknown,
  ) {
    return this.request(
      'DELETE',
      path,
      body,
    )
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ) {
    if (!WOLT_MERCHANT_KEY) {
      throw new Error(
        'WOLT_DRIVE_MERCHANT_KEY is not configured',
      )
    }

    const response =
      await fetch(
        `${WOLT_DRIVE_BASE_URL}${path}`,
        {
          method,

          headers: {
            Authorization:
              `Bearer ${WOLT_MERCHANT_KEY}`,

            'Content-Type':
              'application/json',
          },

          body:
            body === undefined
              ? undefined
              : JSON.stringify(
                  body,
                ),
        },
      )

    return response
  }
}

export const woltClient =
  new WoltClient()