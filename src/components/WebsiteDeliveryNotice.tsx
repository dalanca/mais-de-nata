
import { useLanguage } from '../LanguageContext'

// October 2026:
// Direct B2C website ordering has been suspended due to
// Wolt Drive delivery costs.
// Customers should order exclusively through Wolt.
// This notice is intentionally always visible.

export default function WebsiteDeliveryNotice() {
  const { language } = useLanguage()
  const isCzech = language === 'cs'

  return (
    <section
      role="status"
      style={{
        margin: '24px auto',
        padding: '24px',
        width: 'calc(100% - 32px)',
        maxWidth: '1120px',
        border: '1px solid #d8c3a5',
        borderRadius: '16px',
        background: '#faf8f4',
        color: '#53332d',
      }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: '1.5rem' }}>
        {isCzech
          ? 'Objednávejte naše Pastéis de Nata přes Wolt'
          : 'Order our Pastéis de Nata on Wolt'}
      </h2>

      <p style={{ margin: 0, lineHeight: 1.6 }}>
        {isCzech
          ? 'Naše čerstvé Pastéis de Nata si můžete objednat přes Wolt mezi 14:00 a 20:00.'
          : 'You can order our fresh Pastéis de Nata on Wolt between 14:00 and 20:00.'}
      </p>

      <a
        href="https://wolt.com/cs/cze/prague/restaurant/mais-de-nata-1"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: '16px',
          padding: '12px 20px',
          borderRadius: '24px',
          background: '#53332d',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        {isCzech ? 'Objednat přes Wolt' : 'Order on Wolt'}
      </a>
    </section>
  )
}
