import { Link } from 'react-router'

import logo from '../assets/images/mais-de-nata-logo.png'
import { supabase } from '../lib/supabaseClient'
import './AdminHeader.css'

export default function AdminHeader() {
  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/admin/sign-in'
  }

  return (
    <header className="adminHeader">
      <div className="adminHeaderInner">
        <Link
          to="/admin/orders"
          className="adminHeaderBrand"
          aria-label="Mais de Nata Admin"
        >
          <img
            src={logo}
            alt="Mais de Nata"
            className="adminHeaderLogo"
          />

          <div className="adminHeaderBrandText">
            <strong>Mais de Nata</strong>
            <span>Administration</span>
          </div>
        </Link>

        <nav className="adminHeaderNav">
          <Link
            to="/admin/orders"
            className="adminHeaderNavLink adminHeaderNavLinkActive"
          >
            Orders
          </Link>

          <span className="adminHeaderUser">
            Admin
          </span>

          <button
            type="button"
            className="adminHeaderSignOut"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}