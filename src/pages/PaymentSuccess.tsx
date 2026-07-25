import { useEffect, useState } from 'react'
import './PaymentSuccess.css'
import { useLanguage } from '../LanguageContext'

type VerifiedLineItem = {
  description: string
  quantity: number | null
  amountTotal: number | null
  currency: string
}

type VerifiedOrder = {
  sessionId: string
  customerEmail: string
  customerName: string
  customerPhone: string
  amountTotal: number | null
  currency: string | null

  delivery: {
    street: string
    houseNumber: string
    apartment: string
    city: string
    postcode: string
    deliveryDate: string
    preferredTime: string
  }

  lineItems: VerifiedLineItem[]
}

type VerificationResponse = {
  success: boolean
  verified?: boolean
  order?: VerifiedOrder
  error?: string
}

function formatMoney(
  amount: number | null,
  currency: string | null,
) {
  if (amount === null || !currency) {
    return ''
  }

  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function formatDeliveryDate(
  value: string,
  language: 'cs' | 'en',
) {
  if (!value) {
    return ''
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    language === 'cs' ? 'cs-CZ' : 'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date)
}

export default function PaymentSuccess() {
  const { t, language } = useLanguage()

  const [order, setOrder] = useState<VerifiedOrder | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function verifyPayment() {
      const searchParams = new URLSearchParams(
        window.location.search,
      )

      const sessionId = searchParams.get('session_id')

      if (!sessionId) {
        setErrorMessage(
          t.paymentSuccessMissingReference,
        )
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/verify-checkout-session?session_id=${encodeURIComponent(
            sessionId,
          )}`,
        )

        const data =
          (await response.json()) as VerificationResponse

        if (
          !response.ok ||
          !data.success ||
          !data.verified ||
          !data.order
        ) {
          throw new Error(
            data.error || t.paymentSuccessVerificationFailed,
          )
        }

        setOrder(data.order)

        localStorage.removeItem('maisDeNataCart')
        sessionStorage.removeItem('maisDeNataCheckout')
      } catch (error) {
        console.error('Payment verification failed:', error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : t.paymentSuccessVerificationFailed,
        )
      } finally {
        setIsLoading(false)
      }
    }

    verifyPayment()
  }, [])

  if (isLoading) {
    return (
      <main className="paymentSuccessPage">
        <section className="paymentSuccessCard">
          <div className="paymentSuccessSpinner" />

          <p className="paymentSuccessEyebrow">
            {t.paymentSuccessVerifying}
          </p>

          {t.paymentSuccessPleaseWait}

          {t.paymentSuccessVerifyingText}
        </section>
      </main>
    )
  }

  if (errorMessage || !order) {
    return (
      <main className="paymentSuccessPage">
        <section className="paymentSuccessCard">
          <div className="paymentSuccessErrorIcon">!</div>

          <p className="paymentSuccessEyebrow">
            {t.paymentSuccessNotVerified}
          </p>

          <h1>{t.paymentSuccessCouldNotConfirm}</h1>

          <p className="paymentSuccessIntro">
            {errorMessage}
          </p>

          <div className="paymentSuccessNotice">
            <strong>{t.paymentSuccessAlreadyPaid}</strong>

            <p>
             {t.paymentSuccessAlreadyPaidText}
            </p>
          </div>

          <a href="/" className="paymentSuccessButton">
            {t.paymentSuccessReturnHome}
          </a>
        </section>
      </main>
    )
  }

  const deliveryAddress = [
    `${order.delivery.street} ${order.delivery.houseNumber}`.trim(),
    order.delivery.apartment
      ? `${t.paymentSuccessApartment} ${order.delivery.apartment}`
      : '',
    `${order.delivery.postcode} ${order.delivery.city}`.trim(),
  ].filter(Boolean)

  return (
    <main className="paymentSuccessPage">
      <section className="paymentSuccessCard">
        <div className="paymentSuccessIcon">✓</div>

        <p className="paymentSuccessEyebrow">
          {t.paymentSuccessSuccessful}
        </p>

        <h1>{t.paymentSuccessThankYou}</h1>

        <p className="paymentSuccessIntro">
          {t.paymentSuccessConfirmed}
          {order.customerName
            ? `, ${order.customerName.split(' ')[0]}`
            : ''}
          .
        </p>

        <div className="paymentSuccessOrder">
          <div className="paymentSuccessOrderHeader">
            <h2>{t.paymentSuccessOrderSummary}</h2>

            <strong>
              {formatMoney(
                order.amountTotal,
                order.currency,
              )}
            </strong>
          </div>

          <div className="paymentSuccessItems">
            {order.lineItems.map((item, index) => (
              <div
                className="paymentSuccessItem"
                key={`${item.description}-${index}`}
              >
                <div>
                  <strong>{item.description}</strong>

                  <span>
                    {t.paymentSuccessQuantity}: {item.quantity ?? 0}
                  </span>
                </div>

                <strong>
                  {formatMoney(
                    item.amountTotal,
                    item.currency,
                  )}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="paymentSuccessDetails">
          <div className="paymentSuccessDetailCard">
            <h2><h2>{t.paymentSuccessDelivery}</h2></h2>

            {deliveryAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="paymentSuccessDetailCard">
            <h2><h2>{t.paymentSuccessRequestedTime}</h2></h2>

           <p>
            {formatDeliveryDate(
                order.delivery.deliveryDate,
                language,
            )}
            </p>

            <p>
              {order.delivery.preferredTime || t.paymentSuccessNotSpecified}
            </p>
          </div>
        </div>

        <div className="paymentSuccessNotice">
          <strong>{t.paymentSuccessNextTitle}</strong>

          <p>
            {t.paymentSuccessNextText}
          </p>
        </div>

        <p className="paymentSuccessEmail">
          {t.paymentSuccessEmailStart}{' '}{' '}
          <strong>{order.customerEmail}</strong>.
        </p>

        <a href="/" className="paymentSuccessButton">
          {t.paymentSuccessReturnHome}
        </a>
      </section>
    </main>
  )
}