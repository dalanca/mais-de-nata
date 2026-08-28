export async function cancelWoltDelivery(
  woltOrderReferenceId: string,
  reason: string,
) {
  const accessToken =
    process.env.WOLT_DRIVE_MERCHANT_KEY

  if (!accessToken) {
    throw new Error(
      'WOLT_DRIVE_MERCHANT_KEY is not configured',
    )
  }

  const trimmedReason =
    reason.trim()

  if (!trimmedReason) {
    throw new Error(
      'Cancellation reason is required',
    )
  }

  const response =
    await fetch(
      `https://daas-public-api.development.dev.woltapi.com/order/${encodeURIComponent(
        woltOrderReferenceId,
      )}/status/cancel`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
          reason:
            trimmedReason,
        }),
      },
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      `Wolt cancellation failed: ${response.status} ${JSON.stringify(data)}`,
    )
  }

  return data
}