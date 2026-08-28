type OrderItem = {
  product_name: string
  quantity: number
  total_price: number
}

type BoxSize = 4 | 6 | 12 | 18

const NATA_WEIGHT_GRAMS = 73

const boxPackagingWeightGrams: Record<
  BoxSize,
  number
> = {
  4: 15,
  6: 20,
  12: 25,
  18: 30,
}

const boxDimensions: Record<
  BoxSize,
  {
    widthCm: number
    heightCm: number
    depthCm: number
  }
> = {
  4: {
    widthCm: 14,
    heightCm: 5.5,
    depthCm: 7.5,
  },

  6: {
    widthCm: 21,
    heightCm: 5.5,
    depthCm: 7.5,
  },

  12: {
    widthCm: 21,
    heightCm: 5.5,
    depthCm: 15,
  },

  18: {
    widthCm: 21,
    heightCm: 5.5,
    depthCm: 22.5,
  },
}

function getBoxSize(
  productName: string,
): BoxSize {
  const match =
    productName.match(
      /Box of (4|6|12|18)/i,
    )

  if (!match) {
    throw new Error(
      `Unable to determine box size from product: ${productName}`,
    )
  }

  return Number(match[1]) as BoxSize
}

export function createParcelDetails(
  items: OrderItem[],
  currency: string,
) {
  let totalPastels = 0
  let totalBoxes = 0
  let totalWeightGrams = 0
  let totalProductValue = 0

  let widthCm = 0
  let depthCm = 0
  let heightCm = 0

  for (const item of items) {
    const boxSize =
      getBoxSize(
        item.product_name,
      )

    const quantity =
      item.quantity

    const dimensions =
      boxDimensions[boxSize]

    totalBoxes +=
      quantity

    totalPastels +=
      boxSize * quantity

    totalProductValue +=
      item.total_price

    totalWeightGrams +=
      (
        boxSize *
        NATA_WEIGHT_GRAMS +
        boxPackagingWeightGrams[
          boxSize
        ]
      ) *
      quantity

    widthCm =
      Math.max(
        widthCm,
        dimensions.widthCm,
      )

    depthCm =
      Math.max(
        depthCm,
        dimensions.depthCm,
      )

    heightCm +=
      dimensions.heightCm *
      quantity
  }

  return {
    totalPastels,
    totalBoxes,

    price: {
      amount:
        totalProductValue,

      currency:
        currency.toUpperCase(),
    },

    dimensions: {
      weightGram:
        totalWeightGrams,

      widthCm:
        Math.ceil(widthCm),

      heightCm:
        Math.ceil(heightCm),

      depthCm:
        Math.ceil(depthCm),
    },
  }
}