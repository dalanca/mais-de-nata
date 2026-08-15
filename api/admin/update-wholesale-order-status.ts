import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { supabaseAdmin } from '../../server/database/supabase.js'

import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
} from '../../server/email/resend.js'

import {
  createBrandedEmailLayout,
} from '../../server/email/layout.js'

import { generateWholesaleProformaPdf } from '../../server/pdf/proforma.js'
import { generateWholesaleInvoicePdf } from '../../server/pdf/invoice.js'

const allowedFulfilmentStatuses = [
  'pending',
  'confirmed',
  'fulfilled',
]

const allowedPaymentStatuses = [
  'pending',
  'paid',
]

const PROFORMA_PAYMENT_DAYS = 7

function escapeHtml(
  value: string | null | undefined,
) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatCurrency(
  amountInMinorUnits: number,
  currency: string,
) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInMinorUnits / 100)
}

function addDays(
  date: Date,
  days: number,
) {
  const result = new Date(date)
  result.setUTCDate(
    result.getUTCDate() + days,
  )

  return result
}

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const authorization =
      req.headers.authorization

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    const accessToken =
      authorization.slice('Bearer '.length)

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(
      accessToken,
    )

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      })
    }

    const {
      data: adminUser,
      error: adminError,
    } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (
      adminError ||
      !adminUser ||
      adminUser.role !== 'admin' ||
      adminUser.is_active !== true
    ) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      })
    }

    const {
      orderId,
      fulfilmentStatus,
      paymentStatus,
    } = req.body ?? {}

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      })
    }

    if (!fulfilmentStatus && !paymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'A status update is required',
      })
    }

    if (
      fulfilmentStatus &&
      !allowedFulfilmentStatuses.includes(
        fulfilmentStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fulfilment status',
      })
    }

    if (
      paymentStatus &&
      !allowedPaymentStatuses.includes(
        paymentStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment status',
      })
    }

    /*
     * Load the current order first so that we can
     * detect genuine status transitions.
     */
    const {
      data: existingOrder,
      error: existingOrderError,
    } = await supabaseAdmin
      .from('orders')
      .select(
        `
  id,
  order_number,
  wholesale_customer_id,
  customer_name,
  customer_email,
  company_name,
  company_id,
  vat_number,
  total_amount,
  currency,
  document_language,
  payment_status,
  fulfilment_status,
  proforma_number,
  proforma_issued_at,
  invoice_number,
  invoice_issued_at,
  payment_date
        `,
      )
      .eq('id', orderId)
      .eq(
        'sales_channel',
        'WholesaleWebsite',
      )
      .single()

    if (
      existingOrderError ||
      !existingOrder
    ) {
      return res.status(404).json({
        success: false,
        error: 'Wholesale order not found',
      })
    }

    /*
     * Only this exact transition generates a
     * proforma and confirmation email.
     */
    const becameConfirmed =
      fulfilmentStatus === 'confirmed' &&
      existingOrder.fulfilment_status ===
      'pending'

    const becamePaid =
      paymentStatus === 'paid' &&
      existingOrder.payment_status ===
      'pending'

    const becameDelivered =
      fulfilmentStatus === 'fulfilled' &&
      existingOrder.fulfilment_status ===
      'confirmed'

    let proformaNumber =
      existingOrder.proforma_number

    let proformaIssuedAt =
      existingOrder.proforma_issued_at

    let invoiceNumber =
      existingOrder.invoice_number

    let invoiceIssuedAt =
      existingOrder.invoice_issued_at

    let paymentDate =
      existingOrder.payment_date

    /*
     * Generate the permanent proforma number before
     * saving the confirmed status.
     */
    /*
     * Generate the permanent proforma number before
     * saving the confirmed status.
     */
    if (
      becameConfirmed &&
      !proformaNumber
    ) {
      const {
        data: generatedNumber,
        error: numberError,
      } = await supabaseAdmin.rpc(
        'next_wholesale_proforma_number',
      )

      if (
        numberError ||
        !generatedNumber
      ) {
        throw (
          numberError ??
          new Error(
            'Unable to generate proforma number',
          )
        )
      }

      proformaNumber =
        String(generatedNumber)

      proformaIssuedAt =
        new Date().toISOString()
    }

    /*
     * Generate a permanent invoice number when
     * payment changes from pending to paid.
     */
    if (
      becamePaid &&
      !invoiceNumber
    ) {
      const {
        data: generatedInvoiceNumber,
        error: invoiceNumberError,
      } = await supabaseAdmin.rpc(
        'next_wholesale_invoice_number',
      )

      if (
        invoiceNumberError ||
        !generatedInvoiceNumber
      ) {
        throw (
          invoiceNumberError ??
          new Error(
            'Unable to generate invoice number',
          )
        )
      }

      const paidAt =
        new Date().toISOString()

      invoiceNumber =
        String(generatedInvoiceNumber)

      invoiceIssuedAt = paidAt
      paymentDate = paidAt
    }

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabaseAdmin
      .from('orders')
      .update({
        ...(fulfilmentStatus
          ? {
            fulfilment_status:
              fulfilmentStatus,
          }
          : {}),

        ...(paymentStatus
          ? {
            payment_status:
              paymentStatus,
          }
          : {}),

        ...(becameConfirmed
          ? {
            proforma_number:
              proformaNumber,

            proforma_issued_at:
              proformaIssuedAt,
          }
          : {}),

        ...(becamePaid
          ? {
            invoice_number:
              invoiceNumber,

            invoice_issued_at:
              invoiceIssuedAt,

            payment_date:
              paymentDate,
          }
          : {}),

      })
      .eq('id', orderId)
      .eq(
        'sales_channel',
        'WholesaleWebsite',
      )
      .select(
        `
          id,
          order_number,
          wholesale_customer_id,
          customer_name,
          customer_email,
          company_name,
          company_id,
          vat_number,
          total_amount,
          currency,
          document_language,
          payment_status,
          fulfilment_status,
          proforma_number,
          proforma_issued_at,
          invoice_number,
          invoice_issued_at,
          payment_date
        `,
      )
      .single()

    if (
      updateError ||
      !updatedOrder
    ) {
      throw (
        updateError ??
        new Error(
          'Unable to update wholesale order',
        )
      )
    }

    if (
      becameConfirmed &&
      updatedOrder.customer_email
    ) {
      let proformaAttachment:
        | {
          filename: string
          content: Buffer
        }
        | undefined

      /*
       * PDF generation is isolated from the order
       * update. A PDF problem must not reverse a
       * successfully confirmed order.
       */
      try {
        const [
          customerResult,
          itemsResult,
        ] = await Promise.all([
          supabaseAdmin
            .from('wholesale_customers')
            .select(
              `
                id,
                company_name,
                company_id,
                vat_number,
                company_street,
                company_house_number,
                company_postcode,
                company_city,
                company_country
              `,
            )
            .eq(
              'id',
              updatedOrder.wholesale_customer_id,
            )
            .single(),

          supabaseAdmin
            .from('order_items')
            .select(
              `
                product_name,
                quantity,
                unit_price,
                total_price
              `,
            )
            .eq(
              'order_id',
              updatedOrder.id,
            ),
        ])

        if (customerResult.error) {
          throw customerResult.error
        }

        if (itemsResult.error) {
          throw itemsResult.error
        }

        if (!customerResult.data) {
          throw new Error(
            'Wholesale customer details not found',
          )
        }

        if (
          !itemsResult.data ||
          itemsResult.data.length === 0
        ) {
          throw new Error(
            'Wholesale order items not found',
          )
        }

        const issueDate = new Date(
          updatedOrder.proforma_issued_at ??
          new Date().toISOString(),
        )

        const dueDate = addDays(
          issueDate,
          PROFORMA_PAYMENT_DAYS,
        )

        const pdfBytes =
          await generateWholesaleProformaPdf({
            language: updatedOrder.document_language,
            proformaNumber:
              updatedOrder.proforma_number,

            orderNumber:
              updatedOrder.order_number,

            issueDate,
            dueDate,

            currency:
              updatedOrder.currency,

            totalAmount:
              updatedOrder.total_amount,

            customer: {
              companyName:
                customerResult.data
                  .company_name,

              companyId:
                customerResult.data
                  .company_id,

              vatNumber:
                customerResult.data
                  .vat_number,

              contactName:
                updatedOrder.customer_name,

              email:
                updatedOrder.customer_email,

              street:
                customerResult.data
                  .company_street,

              houseNumber:
                customerResult.data
                  .company_house_number,

              postcode:
                customerResult.data
                  .company_postcode,

              city:
                customerResult.data
                  .company_city,

              country:
                customerResult.data
                  .company_country,
            },

            items:
              itemsResult.data.map(
                (item) => ({
                  description:
                    item.product_name,

                  quantity:
                    item.quantity,

                  unitPrice:
                    item.unit_price,

                  totalPrice:
                    item.total_price,
                }),
              ),
          })

        proformaAttachment = {
          filename:
            `${updatedOrder.proforma_number}.pdf`,

          content:
            Buffer.from(pdfBytes),
        }
      } catch (pdfError) {
        console.error(
          'Wholesale proforma PDF generation failed:',
          pdfError,
        )
      }

      const customerName = escapeHtml(
        updatedOrder.customer_name,
      )

      const companyName = escapeHtml(
        updatedOrder.company_name,
      )

      const orderNumber = escapeHtml(
        updatedOrder.order_number,
      )

      const safeProformaNumber =
        escapeHtml(
          updatedOrder.proforma_number,
        )

      const formattedTotal =
        formatCurrency(
          updatedOrder.total_amount,
          updatedOrder.currency,
        )

      const isCzech =
        updatedOrder.document_language === 'cs'

      const emailSubject = isCzech
        ? `Velkoobchodní objednávka potvrzena — ${updatedOrder.order_number}`
        : `Wholesale order confirmed — ${updatedOrder.order_number}`

      const emailTitle = isCzech
        ? 'Vaše velkoobchodní objednávka byla potvrzena'
        : 'Your wholesale order is confirmed'

      const emailContent = isCzech
        ? `
      <p style="margin: 0 0 18px;">
        Dobrý den, ${customerName},
      </p>

      <p style="margin: 0 0 22px;">
        Potvrzujeme vaši velkoobchodní objednávku
        <strong>${orderNumber}</strong>.
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
            <strong>Společnost:</strong>
            ${companyName}<br />

            <strong>Číslo objednávky:</strong>
            ${orderNumber}<br />

            <strong>Celková částka:</strong>
            ${formattedTotal}<br />

            <strong>Zálohová faktura:</strong>
            ${safeProformaNumber}
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 18px;">
        Částku uhraďte bankovním převodem a jako referenci
        platby uveďte <strong>${orderNumber}</strong>.
      </p>

      <p style="margin: 0 0 18px;">
        Zálohová faktura s bankovními údaji a platebními
        pokyny je přiložena k tomuto e-mailu.
      </p>

      <p style="margin: 0 0 18px;">
        Aktuální stav objednávky můžete sledovat ve svém
        velkoobchodním účtu Mais de Nata.
      </p>

      <p style="margin: 28px 0 0;">
        S pozdravem,<br />
        <strong>Mais de Nata</strong>
      </p>
    `
        : `
      <p style="margin: 0 0 18px;">
        Dear ${customerName},
      </p>

      <p style="margin: 0 0 22px;">
        We are pleased to confirm your wholesale order
        <strong>${orderNumber}</strong>.
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
            <strong>Company:</strong>
            ${companyName}<br />

            <strong>Order number:</strong>
            ${orderNumber}<br />

            <strong>Order total:</strong>
            ${formattedTotal}<br />

            <strong>Proforma invoice:</strong>
            ${safeProformaNumber}
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 18px;">
        Please pay the amount due by bank transfer using
        <strong>${orderNumber}</strong> as the payment
        reference.
      </p>

      <p style="margin: 0 0 18px;">
        The proforma invoice containing our bank details
        and payment instructions is attached to this email.
      </p>

      <p style="margin: 0 0 18px;">
        You can view the current status of your order in
        your Mais de Nata wholesale account.
      </p>

      <p style="margin: 28px 0 0;">
        Kind regards,<br />
        <strong>Mais de Nata</strong>
      </p>
    `

      const emailHtml =
        createBrandedEmailLayout({
          title: emailTitle,

          previewText: isCzech
            ? `Objednávka ${orderNumber} byla potvrzena.`
            : `Order ${orderNumber} has been confirmed.`,

          content: emailContent,

          language:
            isCzech ? 'cs' : 'en',
        })

      let logoAttachment:
        | {
          filename: string
          content: string
          contentId: string
        }
        | undefined

      try {
        const logoContent =
          await readFile(
            path.join(
              process.cwd(),
              'public',
              'mais-de-nata-logo.png',
            ),
          )

        logoAttachment = {
          filename:
            'mais-de-nata-logo.png',

          content:
            logoContent.toString('base64'),

          contentId:
            'mais-de-nata-logo',
        }
      } catch (logoError) {
        console.error(
          'Wholesale confirmation logo loading failed:',
          logoError,
        )
      }

      const attachments = [
        ...(logoAttachment
          ? [logoAttachment]
          : []),

        ...(proformaAttachment
          ? [proformaAttachment]
          : []),
      ]

      const {
        error: emailError,
      } = await resend.emails.send({
        from: EMAIL_FROM,

        to:
          updatedOrder.customer_email,

        replyTo: EMAIL_REPLY_TO,

        subject:
          emailSubject,

        html:
          emailHtml,

        ...(attachments.length > 0
          ? {
            attachments,
          }
          : {}),
      })

      if (emailError) {
        console.error(
          'Wholesale order confirmation email failed:',
          emailError,
        )
      }
    }
    if (
      becamePaid &&
      updatedOrder.customer_email
    ) {
      let invoiceAttachment:
        | {
          filename: string
          content: Buffer
        }
        | undefined

      /*
       * Generate the paid invoice PDF.
       * A PDF or email failure must not reverse the
       * successful payment-status update.
       */
      try {
        const [
          customerResult,
          itemsResult,
        ] = await Promise.all([
          supabaseAdmin
            .from('wholesale_customers')
            .select(
              `
            id,
            company_name,
            company_id,
            vat_number,
            company_street,
            company_house_number,
            company_postcode,
            company_city,
            company_country
          `,
            )
            .eq(
              'id',
              updatedOrder.wholesale_customer_id,
            )
            .single(),

          supabaseAdmin
            .from('order_items')
            .select(
              `
            product_name,
            quantity,
            unit_price,
            total_price
          `,
            )
            .eq(
              'order_id',
              updatedOrder.id,
            ),
        ])

        if (customerResult.error) {
          throw customerResult.error
        }

        if (itemsResult.error) {
          throw itemsResult.error
        }

        if (!customerResult.data) {
          throw new Error(
            'Wholesale customer details not found',
          )
        }

        if (
          !itemsResult.data ||
          itemsResult.data.length === 0
        ) {
          throw new Error(
            'Wholesale order items not found',
          )
        }

        const invoiceIssueDate =
          new Date(
            updatedOrder.invoice_issued_at ??
            new Date().toISOString(),
          )

        const paidDate =
          new Date(
            updatedOrder.payment_date ??
            invoiceIssueDate,
          )

        const pdfBytes =
          await generateWholesaleInvoicePdf({
            language:
              updatedOrder.document_language === 'cs'
                ? 'cs'
                : 'en',

            invoiceNumber:
              updatedOrder.invoice_number,

            orderNumber:
              updatedOrder.order_number,

            issueDate:
              invoiceIssueDate,

            paymentDate:
              paidDate,

            currency:
              updatedOrder.currency,

            totalAmount:
              updatedOrder.total_amount,

            customer: {
              companyName:
                customerResult.data.company_name,

              companyId:
                customerResult.data.company_id,

              vatNumber:
                customerResult.data.vat_number,

              contactName:
                updatedOrder.customer_name,

              email:
                updatedOrder.customer_email,

              street:
                customerResult.data.company_street,

              houseNumber:
                customerResult.data
                  .company_house_number,

              postcode:
                customerResult.data.company_postcode,

              city:
                customerResult.data.company_city,

              country:
                customerResult.data.company_country,
            },

            items:
              itemsResult.data.map(
                (item) => ({
                  description:
                    item.product_name,

                  quantity:
                    item.quantity,

                  unitPrice:
                    item.unit_price,

                  totalPrice:
                    item.total_price,
                }),
              ),
          })

        invoiceAttachment = {
          filename:
            `${updatedOrder.invoice_number}.pdf`,

          content:
            Buffer.from(pdfBytes),
        }
      } catch (pdfError) {
        console.error(
          'Wholesale invoice PDF generation failed:',
          pdfError,
        )
      }

      const customerName = escapeHtml(
        updatedOrder.customer_name,
      )

      const orderNumber = escapeHtml(
        updatedOrder.order_number,
      )

      const safeInvoiceNumber =
        escapeHtml(
          updatedOrder.invoice_number,
        )

      const formattedTotal =
        formatCurrency(
          updatedOrder.total_amount,
          updatedOrder.currency,
        )

      const isCzech =
        updatedOrder.document_language === 'cs'

      const paymentEmailSubject =
        isCzech
          ? `Platba přijata — ${updatedOrder.order_number}`
          : `Payment received — ${updatedOrder.order_number}`

      const paymentEmailTitle =
        isCzech
          ? 'Platba byla přijata'
          : 'Payment received'

      const paymentEmailContent =
        isCzech
          ? `
        <p style="margin: 0 0 18px;">
          Dobrý den, ${customerName},
        </p>

        <p style="margin: 0 0 22px;">
          Potvrzujeme přijetí platby za objednávku
          <strong>${orderNumber}</strong>.
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

              <strong>Přijatá částka:</strong>
              ${formattedTotal}<br />

              <strong>Číslo faktury:</strong>
              ${safeInvoiceNumber}<br />

              <strong>Zbývá uhradit:</strong>
              €0.00
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 18px;">
          Faktura potvrzující úplnou úhradu je přiložena
          k tomuto e-mailu.
        </p>

        <p style="margin: 0 0 18px;">
          Aktuální stav objednávky můžete sledovat ve svém
          velkoobchodním účtu Mais de Nata.
        </p>

        <p style="margin: 0 0 18px;">
          Děkujeme za vaši platbu.
        </p>

        <p style="margin: 28px 0 0;">
          S pozdravem,<br />
          <strong>Mais de Nata</strong>
        </p>
      `
          : `
        <p style="margin: 0 0 18px;">
          Dear ${customerName},
        </p>

        <p style="margin: 0 0 22px;">
          We confirm receipt of payment for your order
          <strong>${orderNumber}</strong>.
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

              <strong>Payment received:</strong>
              ${formattedTotal}<br />

              <strong>Invoice number:</strong>
              ${safeInvoiceNumber}<br />

              <strong>Balance due:</strong>
              €0.00
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 18px;">
          The invoice confirming payment in full is attached
          to this email.
        </p>

        <p style="margin: 0 0 18px;">
          You can view the current status of your order in
          your Mais de Nata wholesale account.
        </p>

        <p style="margin: 0 0 18px;">
          Thank you for your payment.
        </p>

        <p style="margin: 28px 0 0;">
          Kind regards,<br />
          <strong>Mais de Nata</strong>
        </p>
      `

      const paymentEmailHtml =
        createBrandedEmailLayout({
          title:
            paymentEmailTitle,

          previewText:
            isCzech
              ? `Platba za objednávku ${orderNumber} byla přijata.`
              : `Payment for order ${orderNumber} has been received.`,

          content:
            paymentEmailContent,

          language:
            isCzech ? 'cs' : 'en',
        })

      let paymentLogoAttachment:
        | {
          filename: string
          content: string
          contentId: string
        }
        | undefined

      try {
        const logoContent =
          await readFile(
            path.join(
              process.cwd(),
              'public',
              'mais-de-nata-logo.png',
            ),
          )

        paymentLogoAttachment = {
          filename:
            'mais-de-nata-logo.png',

          content:
            logoContent.toString('base64'),

          contentId:
            'mais-de-nata-logo',
        }
      } catch (logoError) {
        console.error(
          'Wholesale payment email logo loading failed:',
          logoError,
        )
      }

      const paymentAttachments = [
        ...(paymentLogoAttachment
          ? [paymentLogoAttachment]
          : []),

        ...(invoiceAttachment
          ? [invoiceAttachment]
          : []),
      ]

      const {
        error: paymentEmailError,
      } = await resend.emails.send({
        from: EMAIL_FROM,

        to:
          updatedOrder.customer_email,

        replyTo: EMAIL_REPLY_TO,

        subject:
          paymentEmailSubject,

        html:
          paymentEmailHtml,

        ...(paymentAttachments.length > 0
          ? {
            attachments:
              paymentAttachments,
          }
          : {}),
      })

      if (paymentEmailError) {
        console.error(
          'Wholesale payment received email failed:',
          paymentEmailError,
        )
      }
    }

    if (
      becameDelivered &&
      updatedOrder.customer_email
    ) {
      const customerName = escapeHtml(
        updatedOrder.customer_name,
      )

      const orderNumber = escapeHtml(
        updatedOrder.order_number,
      )

      const companyName = escapeHtml(
        updatedOrder.company_name,
      )

      const isCzech =
        updatedOrder.document_language === 'cs'

      const deliveredEmailSubject =
        isCzech
          ? `Objednávka doručena — ${updatedOrder.order_number}`
          : `Order delivered — ${updatedOrder.order_number}`

      const deliveredEmailTitle =
        isCzech
          ? 'Vaše objednávka byla doručena'
          : 'Your order has been delivered'

      const deliveredEmailContent =
        isCzech
          ? `
        <p style="margin: 0 0 18px;">
          Dobrý den, ${customerName},
        </p>

        <p style="margin: 0 0 22px;">
          Potvrzujeme, že velkoobchodní objednávka
          <strong>${orderNumber}</strong> pro společnost
          <strong>${companyName}</strong> byla doručena.
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
              <strong>Společnost:</strong>
              ${companyName}<br />

              <strong>Číslo objednávky:</strong>
              ${orderNumber}<br />

              <strong>Stav:</strong>
              Doručeno
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 18px;">
          Stav objednávky a historii předchozích objednávek
          můžete kdykoli zobrazit ve svém velkoobchodním
          účtu Mais de Nata.
        </p>

        <p style="margin: 0 0 18px;">
          Děkujeme za vaši objednávku a těšíme se na další
          spolupráci.
        </p>

        <p style="margin: 28px 0 0;">
          S pozdravem,<br />
          <strong>Mais de Nata</strong>
        </p>
      `
          : `
        <p style="margin: 0 0 18px;">
          Dear ${customerName},
        </p>

        <p style="margin: 0 0 22px;">
          We confirm that wholesale order
          <strong>${orderNumber}</strong> for
          <strong>${companyName}</strong> has been delivered.
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
              <strong>Company:</strong>
              ${companyName}<br />

              <strong>Order number:</strong>
              ${orderNumber}<br />

              <strong>Status:</strong>
              Delivered
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 18px;">
          You can view the current status and your previous
          order history at any time in your Mais de Nata
          wholesale account.
        </p>

        <p style="margin: 0 0 18px;">
          Thank you for your order. We look forward to
          working with you again.
        </p>

        <p style="margin: 28px 0 0;">
          Kind regards,<br />
          <strong>Mais de Nata</strong>
        </p>
      `

      const deliveredEmailHtml =
        createBrandedEmailLayout({
          title:
            deliveredEmailTitle,

          previewText:
            isCzech
              ? `Objednávka ${orderNumber} byla doručena.`
              : `Order ${orderNumber} has been delivered.`,

          content:
            deliveredEmailContent,

          language:
            isCzech ? 'cs' : 'en',
        })

      let deliveredLogoAttachment:
        | {
          filename: string
          content: string
          contentId: string
        }
        | undefined

      try {
        const logoContent =
          await readFile(
            path.join(
              process.cwd(),
              'public',
              'mais-de-nata-logo.png',
            ),
          )

        deliveredLogoAttachment = {
          filename:
            'mais-de-nata-logo.png',

          content:
            logoContent.toString('base64'),

          contentId:
            'mais-de-nata-logo',
        }
      } catch (logoError) {
        console.error(
          'Wholesale delivered email logo loading failed:',
          logoError,
        )
      }

      const {
        error: deliveredEmailError,
      } = await resend.emails.send({
        from: EMAIL_FROM,

        to:
          updatedOrder.customer_email,

        replyTo: EMAIL_REPLY_TO,

        subject:
          deliveredEmailSubject,

        html:
          deliveredEmailHtml,

        ...(deliveredLogoAttachment
          ? {
            attachments: [
              deliveredLogoAttachment,
            ],
          }
          : {}),
      })

      if (deliveredEmailError) {
        console.error(
          'Wholesale order delivered email failed:',
          deliveredEmailError,
        )
      }
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error(
      'Unable to update wholesale order status:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to update wholesale order status',
    })
  }
}