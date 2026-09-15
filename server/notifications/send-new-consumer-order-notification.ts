import {
    sendTelegramMessage,
} from './telegram.js'

type Props = {
    orderNumber: string
    customerName: string
    totalAmount: number
    currency: string

    items: Array<{
        productName: string
        quantity: number
    }>

    deliveryAddress: string
    deliveryDate?: string
    deliveryTime?: string
    trackingUrl?: string
}

export async function sendNewConsumerOrderNotification({
    orderNumber,
    customerName,
    totalAmount,
    currency,
    items,
    deliveryAddress,
    deliveryDate,
    deliveryTime,
    trackingUrl,
}: Props) {
    const itemLines =
        items
            .map(
                (item) =>
                    `${item.quantity} × ${item.productName}`,
            )
            .join('\n')

    const formattedTotal =
        new Intl.NumberFormat(
            'en-CZ',
            {
                style: 'currency',
                currency,
                maximumFractionDigits: 0,
            },
        ).format(totalAmount / 100)

    const message = [
        '🔔 NEW MAIS DE NATA ORDER',
        '',
        `Order: ${orderNumber}`,
        `Customer: ${customerName}`,
        '',
        itemLines,
        '',
        `Total: ${formattedTotal}`,
        `Delivery: ${deliveryDate ?? ''} ${deliveryTime ?? ''}`.trim(),
        `Address: ${deliveryAddress}`,
        '',
        trackingUrl
            ? `Wolt tracking: ${trackingUrl}`
            : '',
        '',
        'Production Board:',
        'https://maisdenata.com/admin/production',
    ]
        .filter(
            (line) => line !== '',
        )
        .join('\n')

    return sendTelegramMessage({
        text: message,
    })
}