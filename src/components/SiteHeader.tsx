import { Link } from 'react-router'
import logo from '../assets/images/mais-de-nata-logo.png'
import { useLanguage } from '../LanguageContext'
import './SiteHeader.css'

export default function SiteHeader() {
  const { language, setLanguage, t } = useLanguage()

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
          <Link to="/our-pasteis">
            {t.navOurPasteis}
          </Link>

          <Link to="/order-fresh">
            {t.navOrderFresh}
          </Link>

          <Link to="/register">
            {t.navWholesale}
          </Link>

          <Link to="/register">
            {t.navContact}
          </Link>

          <button
            type="button"
            className="siteHeaderLanguage"
            onClick={() =>
              setLanguage(language === 'cs' ? 'en' : 'cs')
            }
          >
            {language === 'cs' ? 'EN' : 'CZ'}
          </button>
        </nav>
      </div>
    </header>
  )
}