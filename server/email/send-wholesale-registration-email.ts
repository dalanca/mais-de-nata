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
      ? 'Váš velkoobchodní účet Mais de Nata je připraven'
      : 'Your Mais de Nata Wholesale Account is Ready'

  const html =
    language === 'cs'
      ? `
      <h2>Váš velkoobchodní účet je připraven</h2>

      <p>Dobrý den ${contactName},</p>

      <p>Registrace společnosti <strong>${companyName}</strong> byla úspěšně dokončena.</p>

      <p>Váš velkoobchodní účet Mais de Nata byl vytvořen a aktivován.</p>

      <p>Nyní se můžete přihlásit pomocí své kontaktní e-mailové adresy a hesla, které jste vytvořili při registraci.</p>

      <p>Po přihlášení budete mít přístup k velkoobchodním cenám a objednávkám.</p>

      <br>

      <p>Mais de Nata</p>
    `
      : `
      <h2>Your wholesale account is ready</h2>

      <p>Dear ${contactName},</p>

      <p>Your registration for <strong>${companyName}</strong> has been successfully completed.</p>

      <p>Your Mais de Nata wholesale account has been created and activated.</p>

      <p>You can now sign in using your contact email address and the password you created during registration.</p>

      <p>Once signed in, you will have access to wholesale pricing and ordering.</p>

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