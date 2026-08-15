import { pdfTranslations } from './translations.js'

import {
  colours,
  createBrandedPdf,
  drawAddressBlock,
  drawDocumentHeader,
  drawFooter,
  drawLabelValue,
  drawSectionTitle,
  drawSupplierBlock,
  drawTextLine,
  formatPdfCurrency,
  formatPdfDate,
  savePdf,
} from './pdf.js'

import {
  pdfLayout,
} from './styles.js'

export type WholesaleInvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type WholesaleInvoiceData = {
  language: 'en' | 'cs'

  invoiceNumber: string
  orderNumber: string

  issueDate: string | Date
  paymentDate: string | Date

  currency: string
  totalAmount: number

  customer: {
    companyName: string
    companyId?: string | null
    vatNumber?: string | null
    contactName?: string | null
    email?: string | null

    street?: string | null
    houseNumber?: string | null
    postcode?: string | null
    city?: string | null
    country?: string | null
  }

  items: WholesaleInvoiceItem[]
}

export async function generateWholesaleInvoicePdf(
  data: WholesaleInvoiceData,
) {
  const context =
    await createBrandedPdf()

  const {
    page,
    regularFont,
    boldFont,
  } = context

  const labels =
    pdfTranslations[data.language]

  let cursorY = drawDocumentHeader(
    context,
    labels.invoiceTitle,
    data.invoiceNumber,
  )

  /*
   * Supplier and customer columns
   */
  const supplierX =
    pdfLayout.marginLeft

  const customerX = 320

  let supplierY = drawSectionTitle(
    context,
    labels.supplier,
    supplierX,
    cursorY,
  )

  supplierY = drawSupplierBlock(
    context,
    supplierX,
    supplierY,
  )

  let customerY = drawSectionTitle(
    context,
    labels.customer,
    customerX,
    cursorY,
  )

  customerY = drawAddressBlock(
    context,
    {
      name: data.customer.companyName,
      companyId:
        data.customer.companyId,
      vatNumber:
        data.customer.vatNumber,
      street:
        data.customer.street,
      houseNumber:
        data.customer.houseNumber,
      postcode:
        data.customer.postcode,
      city:
        data.customer.city,
      country:
        data.customer.country,
      email:
        data.customer.email,
    },
    customerX,
    customerY,
  )

  if (data.customer.contactName) {
    customerY = drawTextLine(
      context,
      `${labels.contact}: ${data.customer.contactName}`,
      customerX,
      customerY,
      {
        colour: 'mutedText',
      },
    )
  }

  cursorY =
    Math.min(supplierY, customerY) - 18

  /*
   * Document information panel
   */
  page.drawRectangle({
    x: pdfLayout.marginLeft,
    y: cursorY - 78,
    width:
      pdfLayout.pageWidth -
      pdfLayout.marginLeft -
      pdfLayout.marginRight,
    height: 88,
    color: colours.cream,
    borderColor: colours.border,
    borderWidth: 0.75,
  })

  let infoLeftY = cursorY - 14

  infoLeftY = drawLabelValue(
    context,
    labels.invoiceNumber,
    data.invoiceNumber,
    pdfLayout.marginLeft + 14,
    infoLeftY,
    86,
  )

  infoLeftY = drawLabelValue(
    context,
    labels.orderNumber,
    data.orderNumber,
    pdfLayout.marginLeft + 14,
    infoLeftY,
    86,
  )

  let infoRightY = cursorY - 14

  infoRightY = drawLabelValue(
    context,
    labels.issueDate,
    formatPdfDate(data.issueDate),
    330,
    infoRightY,
    75,
  )

  infoRightY = drawLabelValue(
    context,
    labels.paymentDate,
    formatPdfDate(data.paymentDate),
    330,
    infoRightY,
    75,
  )

  drawLabelValue(
    context,
    labels.payment,
    labels.paidInFull,
    330,
    infoRightY,
    75,
  )

  cursorY -= 112

  /*
   * Order item table
   */
  const tableX =
    pdfLayout.marginLeft

  const tableWidth =
    pdfLayout.pageWidth -
    pdfLayout.marginLeft -
    pdfLayout.marginRight

  const descriptionX =
    tableX + 12

  const quantityX =
    data.language === 'cs'
      ? tableX + 278
      : tableX + 292

  const unitPriceX =
    tableX + 355

  const totalX =
    tableX + 440

  const headerHeight = 28

  page.drawRectangle({
    x: tableX,
    y: cursorY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: colours.espresso,
  })

  page.drawText(labels.description, {
    x: descriptionX,
    y: cursorY - 18,
    size: 8,
    font: boldFont,
    color: colours.white,
  })

  page.drawText(labels.quantity, {
    x: quantityX,
    y: cursorY - 18,
    size: 8,
    font: boldFont,
    color: colours.white,
  })

  page.drawText(labels.unitPrice, {
    x: unitPriceX,
    y: cursorY - 18,
    size: 8,
    font: boldFont,
    color: colours.white,
  })

  page.drawText(labels.total, {
    x: totalX,
    y: cursorY - 18,
    size: 8,
    font: boldFont,
    color: colours.white,
  })

  cursorY -= headerHeight

  for (const [index, item] of data.items.entries()) {
    const rowHeight = 34

    if (index % 2 === 1) {
      page.drawRectangle({
        x: tableX,
        y: cursorY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: colours.cream,
      })
    }

    page.drawLine({
      start: {
        x: tableX,
        y: cursorY - rowHeight,
      },
      end: {
        x: tableX + tableWidth,
        y: cursorY - rowHeight,
      },
      thickness: 0.5,
      color: colours.border,
    })

    page.drawText(item.description, {
      x: descriptionX,
      y: cursorY - 21,
      size: 9,
      font: regularFont,
      color: colours.darkText,
      maxWidth: 265,
    })

    page.drawText(
      String(item.quantity),
      {
        x: quantityX,
        y: cursorY - 21,
        size: 9,
        font: regularFont,
        color: colours.darkText,
      },
    )

    page.drawText(
      formatPdfCurrency(
        item.unitPrice,
        data.currency,
      ),
      {
        x: unitPriceX,
        y: cursorY - 21,
        size: 9,
        font: regularFont,
        color: colours.darkText,
      },
    )

    page.drawText(
      formatPdfCurrency(
        item.totalPrice,
        data.currency,
      ),
      {
        x: totalX,
        y: cursorY - 21,
        size: 9,
        font: boldFont,
        color: colours.darkText,
      },
    )

    cursorY -= rowHeight
  }

  /*
   * Payment received total
   */
  cursorY -= 18

  const totalBoxWidth = 220
  const totalBoxHeight = 74

  const totalBoxX =
    pdfLayout.pageWidth -
    pdfLayout.marginRight -
    totalBoxWidth

  page.drawRectangle({
    x: totalBoxX,
    y: cursorY - totalBoxHeight,
    width: totalBoxWidth,
    height: totalBoxHeight,
    color: colours.cream,
    borderColor: colours.gold,
    borderWidth: 1,
  })

  page.drawText(
    labels.paymentReceived,
    {
      x: totalBoxX + 14,
      y: cursorY - 23,
      size: 9,
      font: boldFont,
      color: colours.espresso,
    },
  )

  const formattedTotal =
    formatPdfCurrency(
      data.totalAmount,
      data.currency,
    )

  const formattedTotalWidth =
    boldFont.widthOfTextAtSize(
      formattedTotal,
      15,
    )

  page.drawText(formattedTotal, {
    x:
      totalBoxX +
      totalBoxWidth -
      14 -
      formattedTotalWidth,
    y: cursorY - 27,
    size: 15,
    font: boldFont,
    color: colours.espresso,
  })

  page.drawText(
    labels.balanceDue,
    {
      x: totalBoxX + 14,
      y: cursorY - 54,
      size: 8,
      font: regularFont,
      color: colours.mutedText,
    },
  )

  const zeroBalance =
    formatPdfCurrency(
      0,
      data.currency,
    )

  const zeroBalanceWidth =
    boldFont.widthOfTextAtSize(
      zeroBalance,
      10,
    )

  page.drawText(zeroBalance, {
    x:
      totalBoxX +
      totalBoxWidth -
      14 -
      zeroBalanceWidth,
    y: cursorY - 55,
    size: 10,
    font: boldFont,
    color: colours.espresso,
  })

  cursorY -= totalBoxHeight + 28

  /*
   * Payment confirmation
   */
  cursorY = drawSectionTitle(
    context,
    labels.paymentReceived,
    tableX,
    cursorY,
  )

  cursorY = drawTextLine(
    context,
    labels.invoicePaymentMessage,
    tableX,
    cursorY,
    {
      size: 9,
    },
  )

  cursorY -= 10

  drawTextLine(
    context,
    labels.invoiceFooterMessage,
    tableX,
    cursorY,
    {
      size: 8,
      colour: 'mutedText',
    },
  )

  drawFooter(context)

  return savePdf(context)
}