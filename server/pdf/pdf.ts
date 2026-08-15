import fs from 'node:fs/promises'
import path from 'node:path'

import {
  PDFDocument,
  PDFImage,
  PDFFont,
  PDFPage,
  rgb,
} from 'pdf-lib'

import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  pdfColours,
  pdfLayout,
  supplierDetails,
} from './styles.js'

export type BrandedPdfContext = {
  document: PDFDocument
  page: PDFPage
  regularFont: PDFFont
  boldFont: PDFFont
  logo: PDFImage
}

export type PdfAddress = {
  name: string
  companyId?: string | null
  vatNumber?: string | null
  street?: string | null
  houseNumber?: string | null
  postcode?: string | null
  city?: string | null
  country?: string | null
  email?: string | null
}
const currentFilePath =
  fileURLToPath(import.meta.url)

const currentDirectory =
  path.dirname(currentFilePath)

const regularFontPath =
  path.join(
    currentDirectory,
    'fonts',
    'DejaVuSans.ttf',
  )

const boldFontPath =
  path.join(
    currentDirectory,
    'fonts',
    'DejaVuSans-Bold.ttf',
  )
function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '')

  if (cleaned.length !== 6) {
    throw new Error(
      `Invalid PDF colour value: ${hex}`,
    )
  }

  const red = Number.parseInt(
    cleaned.slice(0, 2),
    16,
  )

  const green = Number.parseInt(
    cleaned.slice(2, 4),
    16,
  )

  const blue = Number.parseInt(
    cleaned.slice(4, 6),
    16,
  )

  return rgb(
    red / 255,
    green / 255,
    blue / 255,
  )
}

export const colours = {
  espresso: hexToRgb(
    pdfColours.espresso,
  ),
  gold: hexToRgb(
    pdfColours.gold,
  ),
  cream: hexToRgb(
    pdfColours.cream,
  ),
  darkText: hexToRgb(
    pdfColours.darkText,
  ),
  mutedText: hexToRgb(
    pdfColours.mutedText,
  ),
  border: hexToRgb(
    pdfColours.border,
  ),
  white: hexToRgb(
    pdfColours.white,
  ),
}

async function loadLogo(
  document: PDFDocument,
) {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'mais-de-nata-logo.png',
  )

  const logoBytes =
    await fs.readFile(logoPath)

  return document.embedPng(logoBytes)
}

export async function createBrandedPdf(): Promise<BrandedPdfContext> {
  const document =
    await PDFDocument.create()

  document.setTitle(
    'Mais de Nata Wholesale Document',
  )

  document.setAuthor(
    supplierDetails.legalName,
  )

  document.setCreator(
    'Mais de Nata Wholesale Portal',
  )

  document.setProducer(
    'Mais de Nata',
  )

document.registerFontkit(fontkit)

const [
  regularFontBytes,
  boldFontBytes,
] = await Promise.all([
  readFile(regularFontPath),
  readFile(boldFontPath),
])

const regularFont =
  await document.embedFont(
    regularFontBytes,
    {
      subset: true,
    },
  )

const boldFont =
  await document.embedFont(
    boldFontBytes,
    {
      subset: true,
    },
  )

  const logo = await loadLogo(document)

  const page = document.addPage([
    pdfLayout.pageWidth,
    pdfLayout.pageHeight,
  ])

  return {
    document,
    page,
    regularFont,
    boldFont,
    logo,
  }
}

export function drawDocumentHeader(
  context: BrandedPdfContext,
  documentTitle: string,
  documentNumber: string,
) {
  const {
    page,
    regularFont,
    boldFont,
    logo,
  } = context

  const top =
    pdfLayout.pageHeight -
    pdfLayout.marginTop

  const logoSize = 72

  page.drawImage(logo, {
    x: pdfLayout.marginLeft,
    y: top - logoSize,
    width: logoSize,
    height: logoSize,
  })

  page.drawText(
    supplierDetails.tradingName.toUpperCase(),
    {
      x:
        pdfLayout.marginLeft +
        logoSize +
        18,
      y: top - 24,
      size: 18,
      font: boldFont,
      color: colours.espresso,
    },
  )

  page.drawText(
    supplierDetails.tagline,
    {
      x:
        pdfLayout.marginLeft +
        logoSize +
        18,
      y: top - 43,
      size: 9,
      font: regularFont,
      color: colours.mutedText,
    },
  )

  const titleWidth =
    boldFont.widthOfTextAtSize(
      documentTitle,
      18,
    )

  page.drawText(documentTitle, {
    x:
      pdfLayout.pageWidth -
      pdfLayout.marginRight -
      titleWidth,
    y: top - 20,
    size: 18,
    font: boldFont,
    color: colours.espresso,
  })

  const numberWidth =
    regularFont.widthOfTextAtSize(
      documentNumber,
      10,
    )

  page.drawText(documentNumber, {
    x:
      pdfLayout.pageWidth -
      pdfLayout.marginRight -
      numberWidth,
    y: top - 41,
    size: 10,
    font: regularFont,
    color: colours.mutedText,
  })

  page.drawLine({
    start: {
      x: pdfLayout.marginLeft,
      y: top - 90,
    },
    end: {
      x:
        pdfLayout.pageWidth -
        pdfLayout.marginRight,
      y: top - 90,
    },
    thickness: 1.5,
    color: colours.gold,
  })

  return top - 114
}

export function drawSectionTitle(
  context: BrandedPdfContext,
  title: string,
  x: number,
  y: number,
) {
  context.page.drawText(
    title.toUpperCase(),
    {
      x,
      y,
      size: 9,
      font: context.boldFont,
      color: colours.espresso,
    },
  )

  return y - 18
}

export function drawTextLine(
  context: BrandedPdfContext,
  text: string,
  x: number,
  y: number,
  options?: {
    bold?: boolean
    size?: number
    colour?: keyof typeof colours
  },
) {
  const font = options?.bold
    ? context.boldFont
    : context.regularFont

  const colour =
    colours[
      options?.colour ?? 'darkText'
    ]

  context.page.drawText(text, {
    x,
    y,
    size: options?.size ?? 9,
    font,
    color: colour,
  })

  return y - 14
}

export function drawAddressBlock(
  context: BrandedPdfContext,
  address: PdfAddress,
  x: number,
  y: number,
) {
  let cursorY = y

  cursorY = drawTextLine(
    context,
    address.name,
    x,
    cursorY,
    {
      bold: true,
      size: 10,
    },
  )

  const streetLine = [
    address.street,
    address.houseNumber,
  ]
    .filter(Boolean)
    .join(' ')

  if (streetLine) {
    cursorY = drawTextLine(
      context,
      streetLine,
      x,
      cursorY,
    )
  }

  const cityLine = [
    address.postcode,
    address.city,
  ]
    .filter(Boolean)
    .join(' ')

  if (cityLine) {
    cursorY = drawTextLine(
      context,
      cityLine,
      x,
      cursorY,
    )
  }

  if (address.country) {
    cursorY = drawTextLine(
      context,
      address.country,
      x,
      cursorY,
    )
  }

  if (address.companyId) {
    cursorY = drawTextLine(
      context,
      `Company ID: ${address.companyId}`,
      x,
      cursorY,
    )
  }

  if (address.vatNumber) {
    cursorY = drawTextLine(
      context,
      `VAT number: ${address.vatNumber}`,
      x,
      cursorY,
    )
  }

  if (address.email) {
    cursorY = drawTextLine(
      context,
      address.email,
      x,
      cursorY,
      {
        colour: 'mutedText',
      },
    )
  }

  return cursorY
}

export function drawSupplierBlock(
  context: BrandedPdfContext,
  x: number,
  y: number,
) {
  return drawAddressBlock(
    context,
    {
      name: supplierDetails.legalName,
      street:
        supplierDetails.addressLine1,
      city: [
        supplierDetails.addressLine2,
        supplierDetails.postcode,
        supplierDetails.city,
      ].join(', '),
      country:
        supplierDetails.country,
      companyId:
        supplierDetails.companyId,
      email: supplierDetails.email,
    },
    x,
    y,
  )
}

export function drawLabelValue(
  context: BrandedPdfContext,
  label: string,
  value: string,
  x: number,
  y: number,
  valueXOffset = 100,
) {
  context.page.drawText(label, {
    x,
    y,
    size: 9,
    font: context.regularFont,
    color: colours.mutedText,
  })

  context.page.drawText(value, {
    x: x + valueXOffset,
    y,
    size: 9,
    font: context.boldFont,
    color: colours.darkText,
  })

  return y - 16
}

export function drawFooter(
  context: BrandedPdfContext,
) {
  const { page, regularFont } =
    context

  const footerY =
    pdfLayout.marginBottom

  page.drawLine({
    start: {
      x: pdfLayout.marginLeft,
      y: footerY + 24,
    },
    end: {
      x:
        pdfLayout.pageWidth -
        pdfLayout.marginRight,
      y: footerY + 24,
    },
    thickness: 0.75,
    color: colours.border,
  })

  const footerText =
    `${supplierDetails.legalName} · ` +
    `IČO ${supplierDetails.companyId} · ` +
    `${supplierDetails.website}`

  page.drawText(footerText, {
    x: pdfLayout.marginLeft,
    y: footerY + 8,
    size: 7.5,
    font: regularFont,
    color: colours.mutedText,
  })

  const vatText =
    'CafSpresso s.r.o. is not registered for VAT.'

  const vatWidth =
    regularFont.widthOfTextAtSize(
      vatText,
      7.5,
    )

  page.drawText(vatText, {
    x:
      pdfLayout.pageWidth -
      pdfLayout.marginRight -
      vatWidth,
    y: footerY + 8,
    size: 7.5,
    font: regularFont,
    color: colours.mutedText,
  })
}

export function formatPdfCurrency(
  amountInMinorUnits: number,
  currency: string,
) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountInMinorUnits / 100)
}

export function formatPdfDate(
  value: string | Date,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

export async function savePdf(
  context: BrandedPdfContext,
) {
  return context.document.save()
}