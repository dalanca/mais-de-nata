import { useState } from 'react'
import type React from 'react'
import PasswordInput from '../components/PasswordInput'
import '../App.css'
import './WholesaleSignIn.css'
import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'
import { supabase } from '../lib/supabaseClient'

function WholesaleSignIn() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
 
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')
    setIsSigningIn(true)

    try {
      const {
        data,
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError) {
        throw signInError
      }

      const user = data.user

      if (!user) {
        throw new Error(t.wholesaleSignInUnable)
      }

      const {
        data: wholesaleCustomer,
        error: profileError,
      } = await supabase
        .from('wholesale_customers')
        .select('account_status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      if (
        wholesaleCustomer.account_status !== 'active'
      ) {
        await supabase.auth.signOut()

      throw new Error(
        t.wholesaleSignInInactive,
)
      }

      window.location.href = '/wholesale-account'
    } catch (err) {
      console.error('Wholesale sign in failed:', err)

      setError(
        err instanceof Error
          ? err.message
          : t.wholesaleSignInUnable,
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="wholesaleSignInPage">
        <section className="wholesaleSignInCard">
          <p className="wholesaleSignInEyebrow">
              Wholesale Account
          </p>

          <h1>{t.wholesaleSignInTitle}</h1>

          <p className="wholesaleSignInIntro">
            {t.wholesaleSignInIntro}
          </p>

          <form onSubmit={handleSignIn}>
            <label>
              {t.wholesaleSignInEmail}

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

<label>
  {t.wholesaleSignInPassword}

  <PasswordInput
    value={password}
    onChange={setPassword}
    autoComplete="current-password"
    required
  />
</label>

            <a
              href="/wholesale-forgot-password"
              className="wholesaleSignInForgot"
            >
              {t.wholesaleSignInForgotPassword}
            </a>

            {error && (
              <p className="wholesaleSignInError">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSigningIn}
            >
             {isSigningIn
              ? t.wholesaleSignInSubmitting
              : t.wholesaleSignInSubmit}
            </button>
          </form>

          <p className="wholesaleSignInRegister">
            {t.wholesaleSignInNoAccount}{' '}
            <a href="/register">
              {t.wholesaleSignInRegister}
            </a>
          </p>
        </section>
      </main>
    </>
  )
}

export default WholesaleSignIn