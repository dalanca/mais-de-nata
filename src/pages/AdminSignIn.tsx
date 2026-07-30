import { useState } from 'react'
import type React from 'react'

import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'

import './AdminSignIn.css'

function AdminSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (isSigningIn) {
      return
    }

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
        throw new Error('Unable to sign in.')
      }

      const {
        data: adminUser,
        error: adminError,
      } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (
        adminError ||
        !adminUser ||
        adminUser.role !== 'admin' ||
        adminUser.is_active !== true
      ) {
        await supabase.auth.signOut()

        throw new Error(
          'You do not have permission to access the admin area.',
        )
      }

      window.location.href = '/admin/orders'
    } catch (err) {
      console.error('Admin sign in failed:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in.',
      )
    } finally {
      setIsSigningIn(false)
    }
  }

 return (
  <>
    <SiteHeader />

    <main className="adminSignInPage">
      <section className="adminSignInCard">
        <p className="adminSignInEyebrow">
          Mais de Nata Administration
        </p>

        <h1 className="adminSignInTitle">
          Admin Sign In
        </h1>

        <p className="adminSignInIntro">
          Sign in to manage wholesale orders and customer activity.
        </p>

        <form onSubmit={handleSignIn}>
          <label className="adminSignInField">
            Email
            <input
              className="adminSignInInput"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </label>

         <label className="adminSignInField">
  Password

  <div className="adminSignInPasswordWrap">
    <input
      className="adminSignInInput"
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={(event) =>
        setPassword(event.target.value)
      }
      autoComplete="current-password"
      required
    />

    <button
      type="button"
      className="adminSignInPasswordToggle"
      onClick={() =>
        setShowPassword(!showPassword)
      }
      aria-label={
        showPassword
          ? 'Hide password'
          : 'Show password'
      }
    >
      {showPassword ? '🙈' : '👁'}
    </button>
  </div>
</label>

          <p className="adminSignInForgot">
            <a href="/admin/forgot-password">
              Forgot password?
            </a>
          </p>

          {error && (
            <p className="adminSignInError">
              {error}
            </p>
          )}

          <button
            className="adminSignInButton"
            type="submit"
            disabled={isSigningIn}
          >
            {isSigningIn
              ? 'Signing in...'
              : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  </>
)
}

export default AdminSignIn