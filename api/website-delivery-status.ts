import { isDeliveryPeriodBlocked } from '../server/delivery/delivery-blackouts.js'

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false })
  }

  try {
    const now = new Date()

    const result = await isDeliveryPeriodBlocked(
      now.toISOString(),
      new Date(now.getTime() + 1).toISOString(),
    )

    const paused = result.blackouts.some(
      (blackout) =>
        blackout.endsAt === null &&
        new Date(blackout.startsAt).getTime() <= now.getTime(),
    )

    return res.status(200).json({
      success: true,
      paused,
    })
  } catch (error) {
    console.error('Website delivery status lookup failed:', error)

    return res.status(500).json({ success: false })
  }
}
