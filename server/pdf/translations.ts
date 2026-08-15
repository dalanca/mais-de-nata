export const pdfTranslations = {
  en: {
    documentTitle: "PROFORMA INVOICE",
    supplier: "Supplier",
    customer: "Customer",
    contact: "Contact",

    proformaNumber: "Proforma no.",
    orderNumber: "Order no.",

    issueDate: "Issue date",
    dueDate: "Due date",

    payment: "Payment",
    bankTransfer: "Bank transfer",

    description: "DESCRIPTION",
    quantity: "QTY",
    unitPrice: "UNIT PRICE",
    total: "TOTAL",

    amountDue: "AMOUNT DUE",

    paymentInstructions: "Payment Instructions",

    paymentMessage:
      "Please pay the amount due by bank transfer using the order number as the payment reference.",

    bank: "Bank",
    iban: "IBAN",
    bic: "SWIFT/BIC",
    reference: "Reference",

    nonTaxDocument:
      "This document is a payment request and is not a tax document.",

    invoiceTitle: 'INVOICE',
    invoiceNumber: 'Invoice no.',
    paymentDate: 'Payment date',
    paymentReceived: 'PAYMENT RECEIVED',
    balanceDue: 'BALANCE DUE',
    paidInFull: 'Paid in full',
    invoicePaymentMessage:
      'Payment has been received in full. Thank you for your payment.',
    invoiceFooterMessage:
      'This invoice confirms receipt of payment. CafSpresso s.r.o. is not registered for VAT.',
  },

  cs: {
    documentTitle: "ZÁLOHOVÁ FAKTURA",
    supplier: "Dodavatel",
    customer: "Odběratel",
    contact: "Kontaktní osoba",

    proformaNumber: "Číslo zálohové faktury",
    orderNumber: "Číslo objednávky",

    issueDate: "Datum vystavení",
    dueDate: "Datum splatnosti",

    payment: "Platba",
    bankTransfer: "Bankovní převod",

    description: "POPIS",
    quantity: "MNOŽSTVÍ",
    unitPrice: "CENA ZA JEDNOTKU",
    total: "CELKEM",

    amountDue: "ČÁSTKA K ÚHRADĚ",

    paymentInstructions: "Platební údaje",

    paymentMessage:
      "Částku uhraďte bankovním převodem. Jako variabilní symbol použijte číslo objednávky.",

    bank: "Banka",
    iban: "IBAN",
    bic: "SWIFT/BIC",
    reference: "Variabilní symbol",

    nonTaxDocument:
      "Tento dokument je výzvou k úhradě a není daňovým dokladem.",

    invoiceTitle: 'FAKTURA',
    invoiceNumber: 'Číslo faktury',
    paymentDate: 'Datum úhrady',
    paymentReceived: 'UHRAZENO',
    balanceDue: 'ZBÝVÁ UHRADIT',
    paidInFull: 'Uhrazeno v plné výši',
    invoicePaymentMessage:
      'Platba byla přijata v plné výši. Děkujeme za úhradu.',
    invoiceFooterMessage:
      'Tato faktura potvrzuje přijetí platby. CafSpresso s.r.o. není plátcem DPH.',
  },

} as const

export type PdfLanguage =
  keyof typeof pdfTranslations