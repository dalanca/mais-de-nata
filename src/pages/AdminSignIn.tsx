import { useState } from 'react'
import type React from 'react'

import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabaseClient'

function AdminSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

      <main style={{ padding: '60px 24px' }}>
        <section
          style={{
            width: '100%',
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          <p>MAIS DE NATA ADMIN</p>

          <h1>Admin Sign In</h1>

          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '18px' }}>
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
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            </div>
            
            <p>
                <a href="/admin/forgot-password">
                    Forgot password?
                </a>
            </p>
            
            {error && (
              <p style={{ color: '#9b2525' }}>
                {error}
              </p>
            )}

            <button
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