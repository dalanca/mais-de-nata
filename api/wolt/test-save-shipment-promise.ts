import {
  createShipmentPromise,
} from '../../server/wolt/shipment-promise.js'

import {
  saveShipmentPromiseToOrder,
} from '../../server/wolt/save-shipment-promise.js'

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
      orderId,
      street,
      city,
      postCode,
    } = req.body ?? {}

    if (
      !orderId ||
      !street ||
      !city ||
      !postCode
    ) {
      return res.status(400).json({
        success: false,
        error:
          'orderId, street, city and postCode are required',
      })
    }

    const shipmentPromise =
      await createShipmentPromise({
        street,
        city,
        postCode,
        minPreparationTimeMinutes:
          20,
      })

    const updatedOrder =
      await saveShipmentPromiseToOrder(
        orderId,
        shipmentPromise,
      )

    return res.status(200).json({
      success: true,
      shipmentPromise,
      order: updatedOrder,
    })
  } catch (error) {
    console.error(
      'Wolt shipment promise save test failed:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create and save shipment promise',
    })
  }
}