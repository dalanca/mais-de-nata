import { useState } from 'react'
import type React from 'react'
import PasswordInput from '../components/PasswordInput'
import '../App.css'
import './WholesaleResetPassword.css'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../LanguageContext'
function WholesaleResetPassword() {
  const { t } = useLanguage()
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
     setError(t.wholesaleResetPasswordInvalid)
      return
    }

    if (!passwordsMatch) {
      setError(t.wholesaleResetPasswordsMismatch)
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
        'Wholesale password update failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : t.wholesaleResetUpdateFailed,
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
            {t.wholesaleResetEyebrow}
          </p>

            <h1>{t.wholesaleResetExpiredTitle}</h1>

           <p className="wholesaleResetIntro">
              {t.wholesaleResetExpiredText}
          </p>

            <a
              href="/wholesale-forgot-password"
              className="wholesaleResetButton"
            >
              {t.wholesaleResetRequestNewLink}
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
              {t.wholesaleResetEyebrow}
          </p>

            <h1>{t.wholesaleResetSuccessTitle}</h1>

            <p className="wholesaleResetIntro">
              {t.wholesaleResetSuccessText}
            </p>

            <a
              href="/wholesale-sign-in"
              className="wholesaleResetButton"
            >
              {t.wholesaleResetContinue}
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
            {t.wholesaleResetEyebrow}
          </p>

          <h1>{t.wholesaleResetTitle}</h1>

          <p className="wholesaleResetIntro">
            {t.wholesaleResetIntro}
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              {t.wholesaleResetNewPassword}

              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
              />

              <p className="wholesaleResetPasswordHint">
                {t.wholesaleResetPasswordHint}
              </p>
            </label>

            <label>
              {t.wholesaleResetConfirmPassword}

              <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
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
                ? t.wholesaleResetUpdating
                : t.wholesaleResetUpdate}
            </button>
          </form>
        </section>
      </main>
    </>
  )
}

export default WholesaleResetPassword