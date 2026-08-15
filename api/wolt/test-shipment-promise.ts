import {
  createShipmentPromise,
} from '../../server/wolt/shipment-promise.js'

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const {
      street,
      city,
      postCode,
    } = req.body ?? {}

    if (
      !street ||
      !city ||
      !postCode
    ) {
      return res.status(400).json({
        success: false,
        error:
          'street, city and postCode are required',
      })
    }

    const promise =
      await createShipmentPromise({
        street,
        city,
        postCode,
        minPreparationTimeMinutes:
          20,
      })

    return res.status(200).json({
      success: true,
      shipmentPromise:
        promise,
    })
  } catch (error) {
    console.error(
      'Wolt shipment promise test failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create shipment promise',
    })
  }
}