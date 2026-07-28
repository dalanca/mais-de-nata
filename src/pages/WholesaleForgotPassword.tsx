import { useState } from 'react'
import type React from 'react'
import { useLanguage } from '../LanguageContext'
import '../App.css'
import './WholesaleForgotPassword.css'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'

function WholesaleForgotPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')
    setEmailSent(false)
    setIsSending(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo:
              'http://localhost:5173/wholesale-reset-password',
          },
        )

      if (resetError) {
        throw resetError
      }

      setEmailSent(true)
    } catch (err) {
      console.error(
        'Wholesale password reset request failed:',
        err,
      )

     setError(t.wholesaleForgotSendError)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="wholesaleForgotPage">
        <section className="wholesaleForgotCard">
          <p className="wholesaleForgotEyebrow">
              {t.wholesaleForgotEyebrow}
          </p>

          <h1>{t.wholesaleForgotTitle}</h1>

         <p className="wholesaleForgotIntro">
          {t.wholesaleForgotIntro}
        </p>

          {emailSent ? (
            <div className="wholesaleForgotSuccess">
              <h2>{t.wholesaleForgotSuccessTitle}</h2>

             <p>
                {t.wholesaleForgotSuccessText}
            </p>

              <a
                href="/wholesale-sign-in"
                className="wholesaleForgotBackButton"
              >
                {t.wholesaleForgotReturnSignIn}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                {t.wholesaleForgotEmail}

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </label>

              {error && (
                <p className="wholesaleForgotError">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSending}
              >
                {isSending
                  ? t.wholesaleForgotSending
                  : t.wholesaleForgotSendLink}
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  )
}

export default WholesaleForgotPassword