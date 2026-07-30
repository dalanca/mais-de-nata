import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { supabase } from '../lib/supabaseClient'

type ProtectedWholesaleRouteProps = {
  children: ReactNode
}

function ProtectedWholesaleRoute({
  children,
}: ProtectedWholesaleRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkAccess() {
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
          data: wholesaleCustomer,
          error: profileError,
        } = await supabase
          .from('wholesale_customers')
          .select('id, company_name, account_status')
          .eq('auth_user_id', user.id)
          .eq('account_status', 'active')
          .limit(1)
          .maybeSingle()

        if (profileError || !wholesaleCustomer) {
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
          'Wholesale access check failed:',
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

    checkAccess()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <main style={{ padding: '60px 24px' }}>
        Checking wholesale access...
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <Navigate
        to="/wholesale-sign-in"
        replace
      />
    )
  }

  return <>{children}</>
}

export default ProtectedWholesaleRoute