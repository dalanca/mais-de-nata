import { useEffect, useState } from 'react'
import { useLanguage } from '../LanguageContext'

export default function WebsiteDeliveryNotice() {
  const { language } = useLanguage()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadStatus() {
      try {
        const response = await fetch('/api/website-delivery-status', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = await response.json()

        if (!controller.signal.aborted && data.success === true) {
          setPaused(data.paused === true)
        }
      } catch {
        // Checkout continues to enforce delivery availability.
      }
    }

    void loadStatus()
    return () => controller.abort()
  }, [])

  if (!paused) return null

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
          ? 'Rozvoz objednávek přes náš web je momentálně pozastavený'
          : 'Website delivery is currently paused'}
      </h2>

      <p style={{ margin: 0, lineHeight: 1.6 }}>
        {isCzech
          ? 'Objednat si u nás můžete přes Wolt mezi 14:00 a 20:00.'
          : 'You can order from us on Wolt between 14:00 and 20:00.'}
      </p>

      <a
        href="https://wolt.com/cs/cze/prague/restaurant/mais-de-nata-1"
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
