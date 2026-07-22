import { randomBytes } from 'node:crypto'

const ORDER_NUMBER_PREFIX = 'MDN'

/**
 * Characters chosen to avoid easily confused values such as:
 * 0/O, 1/I and 5/S.
 */
const ORDER_CODE_CHARACTERS = '2346789ABCDEFGHJKLMNPQRTUVWXYZ'

const ORDER_CODE_LENGTH = 6

function createOrderCode(): string {
  const randomValues = randomBytes(ORDER_CODE_LENGTH)

  return Array.from(randomValues, (value) => {
    const index = value % ORDER_CODE_CHARACTERS.length
    return ORDER_CODE_CHARACTERS[index]
  }).join('')
}

/**
 * Returns the current date as YYYYMMDD in the Prague timezone.
 */
function createPragueDateStamp(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Unable to generate the order date')
  }

  return `${year}${month}${day}`
}

/**
 * Generates a customer-friendly Mais de Nata order number.
 *
 * Example:
 * MDN-20260722-H7K4QP
 */
export function generateOrderNumber(
  date: Date = new Date(),
): string {
  const dateStamp = createPragueDateStamp(date)
  const orderCode = createOrderCode()

  return `${ORDER_NUMBER_PREFIX}-${dateStamp}-${orderCode}`
}