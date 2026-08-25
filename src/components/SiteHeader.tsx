import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import logo from '../assets/images/mais-de-nata-logo.png'
import { useLanguage } from '../LanguageContext'
import './SiteHeader.css'
import { supabase } from '../lib/supabaseClient'
export default function SiteHeader() {
  const location = useLocation()
  const { language, setLanguage, t } = useLanguage()
  const [isSignedIn, setIsSignedIn] = useState(false)

  const isWholesaleArea =
    location.pathname === '/wholesale' ||
    location.pathname === '/product-information' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/wholesale-')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(Boolean(data.session))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsSignedIn(Boolean(session))
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/wholesale'
  }

  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link
          to="/"
          className="siteHeaderLogo"
          aria-label="Mais de Nata"
        >
          <img src={logo} alt="Mais de Nata" />
        </Link>

        <nav className="siteHeaderNav">
          {isWholesaleArea ? (
            <>
              <Link to="/">
                {t.navHome}
              </Link>

              <Link to="/wholesale">
                {t.navWholesale}
              </Link>

              <Link to="/product-information">
                {t.navWholesaleProductInfo}
              </Link>

              {isSignedIn ? (
                <>
                  <Link to="/wholesale-account">
                    {t.navMyAccount}
                  </Link>

                  <button
                    type="button"
                    className="siteHeaderSignOut"
                    onClick={handleSignOut}
                  >
                    {t.navSignOut}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register">
                    Register
                  </Link>

                  <Link to="/wholesale-sign-in">
                    {t.navSignIn}
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/our-pasteis">
                {t.navOurPasteis}
              </Link>

              <Link to="/order-fresh">
                {t.navOrderFresh}
              </Link>

              <Link to="/contact">
                {t.navContact}
              </Link>
            </>
          )}

          <button
            type="button"
            className="siteHeaderLanguage"
            onClick={() =>
              setLanguage(
                language === 'cs'
                  ? 'en'
                  : 'cs',
              )
            }
          >
            {language === 'cs' ? 'EN' : 'CZ'}
          </button>
        </nav>
      </div>
    </header>
  )
}