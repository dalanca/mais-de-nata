export type EmailLanguage = 'en' | 'cs'

export const emailTranslations = {
    en: {
        wholesaleCancellation: {
            subject: 'Wholesale order cancelled — {{orderNumber}}',
            title: 'Your wholesale order has been cancelled',
            greeting: 'Dear {{customerName}},',
            message:
                'We confirm that wholesale order {{orderNumber}} for {{companyName}} has been cancelled.',
            company: 'Company',
            orderNumber: 'Order number',
            status: 'Status',
            cancelled: 'Cancelled',
            questions:
                'If you have any questions regarding this order, please reply to this email.',
            signOff: 'Kind regards',
            preview:
                'Order {{orderNumber}} has been cancelled.',
        },
    },

    cs: {
        wholesaleCancellation: {
            subject:
                'Velkoobchodní objednávka zrušena — {{orderNumber}}',
            title:
                'Vaše velkoobchodní objednávka byla zrušena',
            greeting:
                'Dobrý den, {{customerName}},',
            message:
                'Potvrzujeme, že velkoobchodní objednávka {{orderNumber}} pro společnost {{companyName}} byla zrušena.',
            company: 'Společnost',
            orderNumber: 'Číslo objednávky',
            status: 'Stav',
            cancelled: 'Zrušeno',
            questions:
                'Pokud máte jakékoli dotazy ohledně této objednávky, odpovězte prosím na tento e-mail.',
            signOff: 'S pozdravem',
            preview:
                'Objednávka {{orderNumber}} byla zrušena.',
        },
    },
} as const
export function getEmailTranslation(
    language: EmailLanguage,
) {
    return emailTranslations[language]
}

export function interpolateEmailText(
    text: string,
    values: Record<string, string>,
) {
    return text.replace(
        /\{\{(\w+)\}\}/g,
        (_, key: string) =>
            values[key] ?? `{{${key}}}`,
    )
}