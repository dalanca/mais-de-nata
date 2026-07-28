import { useState } from 'react'
import type React from 'react'

import '../App.css'
import './WholesaleAccountSetup.css'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'

function WholesaleAccountSetup() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [accountCreated, setAccountCreated] = useState(false)

  const hashParams = new URLSearchParams(
  window.location.hash.replace(/^#/, ''),
)

const inviteError =
  hashParams.get('error') === 'access_denied'

const inviteErrorDescription =
  hashParams.get('error_description')

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

const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser()

if (userError) {
  throw userError
}

if (!user) {
  throw new Error(
    'Unable to identify the wholesale account.',
  )
}

const { error: profileError } = await supabase
  .from('wholesale_customers')
  .update({
    account_status: 'active',
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id)

if (profileError) {
  throw profileError
}

setAccountCreated(true)
    } catch (err) {
      console.error(
        'Wholesale account setup failed:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete account setup.',
      )
    } finally {
      setIsSaving(false)
    }
  }
const passwordIsValid =
  password.length >= 8 &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)

const passwordsMatch =
  password.length > 0 &&
  password === confirmPassword
 if (inviteError) {
  return (
    <>
      <SiteHeader />

      <main className="wholesaleAccountSetupPage">
        <section className="wholesaleAccountSetupCard">
          <p className="wholesaleAccountSetupEyebrow">
            Wholesale Account
          </p>

          <h1>Invitation link is no longer valid</h1>

          <p className="wholesaleAccountSetupIntro">
            This invitation link has expired or has already been used.
            Please return to the sign-in page and request a password reset
            if you already have an account.
          </p>

          {inviteErrorDescription && (
            <p className="wholesaleAccountSetupError">
              {inviteErrorDescription}
            </p>
          )}

          <div className="wholesaleAccountSetupActions">
            <a
              href="/"
              className="wholesaleAccountSecondaryButton"
            >
              Return to Home
            </a>

            <a
              href="/wholesale-sign-in"
              className="wholesaleAccountPrimaryButton"
            >
              Go to Sign In
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
 if (accountCreated) {
  return (
    <>
      <SiteHeader />

      <main className="wholesaleAccountSetupPage">
        <section className="wholesaleAccountSetupCard">
          <p className="wholesaleAccountSetupEyebrow">
            Wholesale Account
          </p>

          <h1>Your account is ready</h1>

          <p className="wholesaleAccountSetupIntro">
            Your Mais de Nata wholesale account has been created successfully.
            You can now access wholesale pricing and place orders whenever you
            are ready.
          </p>

          <div className="wholesaleAccountSetupActions">
            <a
              href="/"
              className="wholesaleAccountSecondaryButton"
            >
              Return to Home
            </a>

            <a
              href="/wholesale-order"
              className="wholesaleAccountPrimaryButton"
            >
              Place a Wholesale Order
            </a>
          </div>
        </section>
      </main>
    </>
  )
}

return (
    <>
      <SiteHeader />

      <main className="wholesaleAccountSetupPage">
        <section className="wholesaleAccountSetupCard">
          <p className="wholesaleAccountSetupEyebrow">
            Wholesale Account
          </p>

          <h1>Create your password</h1>

          <p className="wholesaleAccountSetupIntro">
            Your wholesale account has been verified.
            Create a password to access wholesale ordering.
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                required
              />
              <p className="wholesaleAccountPasswordHint">
                Minimum 8 characters, including one number and one special character.
             </p>
            </label>

            <label>
              Confirm password

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
              <p className="wholesaleAccountSetupError">
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
    ? 'Creating account...'
    : 'Create Account'}
</button>
          </form>
        </section>
      </main>
    </>
  )
}

export default WholesaleAccountSetup