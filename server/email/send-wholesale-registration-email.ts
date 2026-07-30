import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
} from './resend.js'

type Props = {
  to: string
  contactName: string
  companyName: string
  language: 'en' | 'cs'
}

export async function sendWholesaleRegistrationEmail({
  to,
  contactName,
  companyName,
  language,
}: Props) {
  const subject =
    language === 'cs'
      ? 'Vítejte v Mais de Nata'
      : 'Welcome to Mais de Nata'

  const html =
    language === 'cs'
      ? `
        <h2>Vítejte v Mais de Nata!</h2>

        <p>Dobrý den ${contactName},</p>

        <p>Děkujeme za registraci společnosti <strong>${companyName}</strong>.</p>

        <p>Váš velkoobchodní účet byl úspěšně vytvořen.</p>

        <p>Nyní se můžete přihlásit a zadávat objednávky.</p>

        <br>

        <p>Mais de Nata</p>
      `
      : `
        <h2>Welcome to Mais de Nata!</h2>

        <p>Dear ${contactName},</p>

        <p>Thank you for registering <strong>${companyName}</strong>.</p>

        <p>Your wholesale account has been successfully created.</p>

        <p>You can now sign in and place wholesale orders.</p>

        <br>

        <p>Mais de Nata</p>
      `

  return resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to,
    subject,
    html,
  })
}