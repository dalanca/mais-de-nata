import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { supabase } from '../lib/supabaseClient'

type ProtectedAdminRouteProps = {
  children: ReactNode
}

function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          if (isMounted) {
            setHasAccess(false)
          }
          return
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
          adminUser.is_active !== true ||
          adminUser.role !== 'admin'
        ) {
          if (isMounted) {
            setHasAccess(false)
          }
          return
        }

        if (isMounted) {
          setHasAccess(true)
        }
      } catch (error) {
        console.error(
          'Admin access check failed:',
          error,
        )

        if (isMounted) {
          setHasAccess(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAdminAccess()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <main style={{ padding: '60px 24px' }}>
        Checking admin access...
      </main>
    )
  }

if (!hasAccess) {
  return (
    <Navigate
      to="/admin/sign-in"
      replace
    />
  )
}

  return <>{children}</>
}

export default ProtectedAdminRoute