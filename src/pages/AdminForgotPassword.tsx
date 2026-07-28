import { useState } from 'react'
import type React from 'react'

import '../App.css'
import './WholesaleForgotPassword.css'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'

function AdminForgotPassword() {
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
              'http://localhost:5173/admin/reset-password',
          },
        )

      if (resetError) {
        throw resetError
      }

      setEmailSent(true)
    } catch (err) {
      console.error(
        'Admin password reset request failed:',
        err,
      )

      setError(
        'We could not send the reset email. Please try again.',
      )
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
            Mais de Nata Admin
          </p>

          <h1>Forgot your password?</h1>

          <p className="wholesaleForgotIntro">
            Enter your admin email address and we’ll send
            you a link to reset your password.
          </p>

          {emailSent ? (
            <div className="wholesaleForgotSuccess">
              <h2>Check your email</h2>

              <p>
                If an account exists for this email address,
                we’ve sent you a password reset link.
              </p>

              <a
                href="/admin/sign-in"
                className="wholesaleForgotBackButton"
              >
                Return to Admin Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Email

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
                  ? 'Sending...'
                  : 'Send Reset Link'}
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  )
}

export default AdminForgotPassword