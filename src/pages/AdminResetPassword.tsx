import { useState } from 'react'
import type React from 'react'

import '../App.css'
import './WholesaleResetPassword.css'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'

function AdminResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [passwordUpdated, setPasswordUpdated] =
    useState(false)
  const [error, setError] = useState('')

  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, ''),
  )

  const resetError =
    hashParams.get('error') === 'access_denied'

  const passwordIsValid =
    password.length >= 8 &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    if (!passwordIsValid) {
      setError(
        'Password must contain at least 8 characters, including one number and one special character.',
      )
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setIsSaving(true)

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        })

      if (updateError) {
        throw updateError
      }

      setPasswordUpdated(true)
    } catch (err) {
      console.error(
        'Admin password update failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update your password.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (resetError) {
    return (
      <>
        <SiteHeader />

        <main className="wholesaleResetPage">
          <section className="wholesaleResetCard">
            <p className="wholesaleResetEyebrow">
              Mais de Nata Admin
            </p>

            <h1>Reset link is no longer valid</h1>

            <p className="wholesaleResetIntro">
              This password reset link has expired or has
              already been used. Please request a new reset
              link.
            </p>

            <a
              href="/admin/forgot-password"
              className="wholesaleResetButton"
            >
              Request New Reset Link
            </a>
          </section>
        </main>
      </>
    )
  }

  if (passwordUpdated) {
    return (
      <>
        <SiteHeader />

        <main className="wholesaleResetPage">
          <section className="wholesaleResetCard">
            <p className="wholesaleResetEyebrow">
              Mais de Nata Admin
            </p>

            <h1>Password updated</h1>

            <p className="wholesaleResetIntro">
              Your admin password has been updated
              successfully.
            </p>

            <a
              href="/admin/sign-in"
              className="wholesaleResetButton"
            >
              Continue to Admin Sign In
            </a>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <main className="wholesaleResetPage">
        <section className="wholesaleResetCard">
          <p className="wholesaleResetEyebrow">
            Mais de Nata Admin
          </p>

          <h1>Create a new password</h1>

          <p className="wholesaleResetIntro">
            Enter a new password for your Mais de Nata
            admin account.
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              New password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                required
              />

              <p className="wholesaleResetPasswordHint">
                Minimum 8 characters, including one number
                and one special character.
              </p>
            </label>

            <label>
              Confirm new password

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                required
              />
            </label>

            {error && (
              <p className="wholesaleResetError">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isSaving ||
                !passwordIsValid ||
                !passwordsMatch
              }
            >
              {isSaving
                ? 'Updating password...'
                : 'Update Password'}
            </button>
          </form>
        </section>
      </main>
    </>
  )
}

export default AdminResetPassword