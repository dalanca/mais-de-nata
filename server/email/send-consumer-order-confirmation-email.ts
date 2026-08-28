import path from 'node:path'
import { readFile } from 'node:fs/promises'

import {
    resend,
    EMAIL_FROM,
    EMAIL_REPLY_TO,
} from './resend.js'

import {
    createBrandedEmailLayout,
    createEmailButton,
} from './layout.js'

type OrderItem = {
    productName: string
    quantity: number
    totalPrice: number
}

type Props = {
    to: string
    customerName: string
    orderNumber: string
    language: 'en' | 'cs'

    totalAmount: number
    currency: string

    items: OrderItem[]
    deliveryFee: number

    deliveryAddress: string
    deliveryDate?: string
    deliveryTime?: string
    deliveryInstructions?: string

    trackingUrl?: string
}

function formatMoney(
    amount: number,
    currency: string,
    language: 'en' | 'cs',
) {
    return new Intl.NumberFormat(
        language === 'cs'
            ? 'cs-CZ'
            : 'en-GB',
        {
            style: 'currency',
            currency:
                currency.toUpperCase(),
        },
    ).format(amount / 100)
}

function formatDeliveryDate(
    value: string | undefined,
    language: 'en' | 'cs',
) {
    if (!value) {
        return ''
    }

    const date =
        new Date(`${value}T12:00:00`)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(
        language === 'cs'
            ? 'cs-CZ'
            : 'en-GB',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        },
    ).format(date)
}

function formatDeliveryTime(
    value: string | undefined,
    language: 'en' | 'cs',
) {
    if (!value) {
        return ''
    }

    if (value === 'asap') {
        return language === 'cs'
            ? 'Co nejdříve'
            : 'As soon as possible'
    }

    if (value === 'morning') {
        return language === 'cs'
            ? 'Dopoledne'
            : 'Morning'
    }

    if (value === 'afternoon') {
        return language === 'cs'
            ? 'Odpoledne'
            : 'Afternoon'
    }

    if (value === 'evening') {
        return language === 'cs'
            ? 'Večer'
            : 'Evening'
    }

    return value
}

export async function sendConsumerOrderConfirmationEmail({
    to,
    customerName,
    orderNumber,
    language,
    totalAmount,
    currency,
    items,
    deliveryFee,
    deliveryAddress,
    deliveryDate,
    deliveryTime,
    deliveryInstructions,
    trackingUrl,
}: Props) {
    const isCzech =
        language === 'cs'

    const firstName =
        customerName
            .trim()
            .split(/\s+/)[0] || ''

    const formattedTotal =
        formatMoney(
            totalAmount,
            currency,
            language,
        )

    const formattedDeliveryFee =
        formatMoney(
            deliveryFee,
            currency,
            language,
        )

    const formattedDeliveryDate =
        formatDeliveryDate(
            deliveryDate,
            language,
        )

    const formattedDeliveryTime =
        formatDeliveryTime(
            deliveryTime,
            language,
        )

    const orderItemsHtml =
        items
            .map(
                (item) => `
          <tr>
            <td
              style="
                padding: 5px 0;
                color: #2b1d16;
                font-size: 14px;
              "
            >
              ${item.quantity} × ${item.productName}
            </td>

            <td
              align="right"
              style="
                padding: 5px 0;
                color: #2b1d16;
                font-size: 14px;
                font-weight: 700;
              "
            >
              ${formatMoney(
                    item.totalPrice,
                    currency,
                    language,
                )}
            </td>
          </tr>
        `,
            )
            .join('')

    const trackingSection =
        trackingUrl
            ? `
        <p style="margin: 24px 0 10px;">
          ${isCzech
                ? 'Průběh doručení můžete sledovat živě:'
                : 'You can follow your delivery live:'
            }
        </p>

        ${createEmailButton(
                isCzech
                    ? 'Sledovat doručení'
                    : 'Track your delivery',
                trackingUrl,
            )}
      `
            : ''

    const emailTitle =
        isCzech
            ? 'Vaše objednávka je potvrzena'
            : 'Your order is confirmed'

    const emailSubject =
        isCzech
            ? `Objednávka ${orderNumber} potvrzena`
            : `Order ${orderNumber} confirmed`

    const emailContent =
        isCzech
            ? `
        <p style="margin: 0 0 18px;">
          Dobrý den ${firstName},
        </p>

        <p style="margin: 0 0 22px;">
          Vaše objednávka
          <strong>${orderNumber}</strong>
          byla úspěšně zaplacena a potvrzena.
        </p>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            margin: 0 0 24px;
            background-color: #fffaf2;
            border: 1px solid #eadfce;
            border-radius: 12px;
          "
        >
          <tr>
            <td
              style="
                padding: 18px 20px;
                color: #2b1d16;
                font-size: 14px;
                line-height: 1.7;
              "
            >
              <strong>Číslo objednávky:</strong>
              ${orderNumber}<br />

              <strong>Doručení:</strong>
              ${deliveryAddress}<br />

              ${formattedDeliveryDate
                ? `
                    <strong>Datum:</strong>
                    ${formattedDeliveryDate}<br />
                  `
                : ''
            }

${formattedDeliveryTime
                ? `
      <strong>Čas:</strong>
      ${formattedDeliveryTime}<br />
    `
                : ''
            }

${deliveryInstructions
                ? `
      <strong>Pokyny k doručení:</strong>
      ${deliveryInstructions}
    `
                : ''
            }
            </td>
          </tr>
        </table>

        <h3
          style="
            margin: 0 0 12px;
            color: #4e312d;
            font-family: Georgia, 'Times New Roman', serif;
          "
        >
          Objednávka
        </h3>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            margin: 0 0 20px;
          "
        >
          ${orderItemsHtml}

          <tr>
            <td
              style="
                padding: 8px 0;
                border-top: 1px solid #eadfce;
                color: #2b1d16;
                font-size: 14px;
              "
            >
              Doručení Wolt
            </td>

            <td
              align="right"
              style="
                padding: 8px 0;
                border-top: 1px solid #eadfce;
                color: #2b1d16;
                font-size: 14px;
                font-weight: 700;
              "
            >
              ${formattedDeliveryFee}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 12px 0 0;
                color: #4e312d;
                font-size: 15px;
                font-weight: 700;
              "
            >
              Celkem
            </td>

            <td
              align="right"
              style="
                padding: 12px 0 0;
                color: #4e312d;
                font-size: 15px;
                font-weight: 700;
              "
            >
              ${formattedTotal}
            </td>
          </tr>
        </table>

        ${trackingSection}

        <p style="margin: 28px 0 0;">
          S pozdravem,<br />
          <strong>Mais de Nata</strong>
        </p>
      `
            : `
        <p style="margin: 0 0 18px;">
          Dear ${firstName},
        </p>

        <p style="margin: 0 0 22px;">
          Your order
          <strong>${orderNumber}</strong>
          has been successfully paid and confirmed.
        </p>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            margin: 0 0 24px;
            background-color: #fffaf2;
            border: 1px solid #eadfce;
            border-radius: 12px;
          "
        >
          <tr>
            <td
              style="
                padding: 18px 20px;
                color: #2b1d16;
                font-size: 14px;
                line-height: 1.7;
              "
            >
              <strong>Order number:</strong>
              ${orderNumber}<br />

              <strong>Delivery:</strong>
              ${deliveryAddress}<br />

              ${formattedDeliveryDate
                ? `
                    <strong>Date:</strong>
                    ${formattedDeliveryDate}<br />
                  `
                : ''
            }
${formattedDeliveryTime
                ? `
      <strong>Requested time:</strong>
      ${formattedDeliveryTime}<br />
    `
                : ''
            }

${deliveryInstructions
                ? `
      <strong>Delivery instructions:</strong>
      ${deliveryInstructions}
    `
                : ''
            }
            </td>
          </tr>
        </table>

        <h3
          style="
            margin: 0 0 12px;
            color: #4e312d;
            font-family: Georgia, 'Times New Roman', serif;
          "
        >
          Order
        </h3>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            margin: 0 0 20px;
          "
        >
          ${orderItemsHtml}

          <tr>
            <td
              style="
                padding: 8px 0;
                border-top: 1px solid #eadfce;
                color: #2b1d16;
                font-size: 14px;
              "
            >
              Wolt delivery
            </td>

            <td
              align="right"
              style="
                padding: 8px 0;
                border-top: 1px solid #eadfce;
                color: #2b1d16;
                font-size: 14px;
                font-weight: 700;
              "
            >
              ${formattedDeliveryFee}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 12px 0 0;
                color: #4e312d;
                font-size: 15px;
                font-weight: 700;
              "
            >
              Total
            </td>

            <td
              align="right"
              style="
                padding: 12px 0 0;
                color: #4e312d;
                font-size: 15px;
                font-weight: 700;
              "
            >
              ${formattedTotal}
            </td>
          </tr>
        </table>

        ${trackingSection}

        <p style="margin: 28px 0 0;">
          Kind regards,<br />
          <strong>Mais de Nata</strong>
        </p>
      `

    const emailHtml =
        createBrandedEmailLayout({
            title:
                emailTitle,

            previewText:
                isCzech
                    ? `Objednávka ${orderNumber} byla potvrzena.`
                    : `Order ${orderNumber} has been confirmed.`,

            content:
                emailContent,

            language,
        })

    const logoContent =
        await readFile(
            path.join(
                process.cwd(),
                'public',
                'mais-de-nata-logo.png',
            ),
        )

    return resend.emails.send({
        from:
            EMAIL_FROM,

        replyTo:
            EMAIL_REPLY_TO,

        to,

        subject:
            emailSubject,

        html:
            emailHtml,

        attachments: [
            {
                filename:
                    'mais-de-nata-logo.png',

                content:
                    logoContent.toString('base64'),

                contentId:
                    'mais-de-nata-logo',
            },
        ],
    })
}