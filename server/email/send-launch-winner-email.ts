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

type Props = {
  to: string
  firstName: string
  registrationNumber: number
  claimUrl: string
  language: 'en' | 'cs'
}

export async function sendLaunchWinnerEmail({
  to,
  firstName,
  registrationNumber,
  claimUrl,
  language,
}: Props) {
  const isCzech =
    language === 'cs'

  const emailTitle =
    isCzech
      ? 'Vyhráli jste!'
      : 'You’ve won!'

  const emailSubject =
    isCzech
      ? 'Vyhráli jste krabičku Mais de Nata 🎉'
      : 'You’ve won a Mais de Nata box 🎉'

  const emailContent =
    isCzech
      ? `
        <p style="margin: 0 0 18px;">
          Dobrý den ${firstName},
        </p>

        <p style="margin: 0 0 22px;">
          Byli jste naší
          <strong>${registrationNumber}. platnou registrací</strong>
          a získáváte zdarma krabičku
          <strong>4 čerstvě upečených Pastéis de Nata</strong>.
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
              <strong>Vaše výhra:</strong>
              Krabička 4 Pastéis de Nata<br />

              <strong>Cena produktu:</strong>
              0 Kč<br />

              <strong>Doručení:</strong>
              Hradíte pouze cenu doručení prostřednictvím Wolt.
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 22px;">
          Klikněte na tlačítko níže, vyberte datum a čas doručení
          a zadejte své doručovací údaje.
        </p>

        ${createEmailButton(
          'VYZVEDNOUT VÝHRU',
          claimUrl,
        )}

        <p
          style="
            margin: 24px 0 0;
            color: #70564f;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Tento odkaz je určen pouze pro vás, lze jej použít pouze jednou
          a jeho platnost je časově omezená.
        </p>

        <p style="margin: 28px 0 0;">
          S pozdravem,<br />
          <strong>Mais de Nata</strong>
        </p>
      `
      : `
        <p style="margin: 0 0 18px;">
          Hi ${firstName},
        </p>

        <p style="margin: 0 0 22px;">
          You were our
          <strong>${registrationNumber}th valid registration</strong>
          and you’ve won a free box of
          <strong>4 freshly baked Pastéis de Nata</strong>.
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
              <strong>Your prize:</strong>
              Box of 4 Pastéis de Nata<br />

              <strong>Product price:</strong>
              0 Kč<br />

              <strong>Delivery:</strong>
              You pay only the Wolt delivery charge.
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 22px;">
          Use the button below to choose your delivery date and time
          and enter your delivery details.
        </p>

        ${createEmailButton(
          'CLAIM MY FREE BOX',
          claimUrl,
        )}

        <p
          style="
            margin: 24px 0 0;
            color: #70564f;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          This claim link is personal to you, can only be used once,
          and is valid for a limited time.
        </p>

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
          ? 'Vyhráli jste krabičku 4 Pastéis de Nata zdarma.'
          : 'You’ve won a free box of 4 Pastéis de Nata.',

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