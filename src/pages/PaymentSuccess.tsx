import { useEffect, useState } from 'react'
import './PaymentSuccess.css'

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

function formatDeliveryDate(value: string) {
  if (!value) {
    return ''
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function PaymentSuccess() {
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
          'We could not find a payment reference for this order.',
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
            data.error || 'The payment could not be verified.',
          )
        }

        setOrder(data.order)

        localStorage.removeItem('maisDeNataCart')
      } catch (error) {
        console.error('Payment verification failed:', error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'The payment could not be verified.',
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
            Verifying payment
          </p>

          <h1>Please wait</h1>

          <p className="paymentSuccessIntro">
            We are confirming your payment and retrieving your
            order details.
          </p>
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
            Payment not verified
          </p>

          <h1>We could not confirm your order</h1>

          <p className="paymentSuccessIntro">
            {errorMessage}
          </p>

          <div className="paymentSuccessNotice">
            <strong>Have you already paid?</strong>

            <p>
              Please check your Stripe payment confirmation. If the
              payment was successful, contact Mais de Nata and include
              the email address used during checkout.
            </p>
          </div>

          <a href="/" className="paymentSuccessButton">
            Return to Home
          </a>
        </section>
      </main>
    )
  }

  const deliveryAddress = [
    `${order.delivery.street} ${order.delivery.houseNumber}`.trim(),
    order.delivery.apartment
      ? `Apartment ${order.delivery.apartment}`
      : '',
    `${order.delivery.postcode} ${order.delivery.city}`.trim(),
  ].filter(Boolean)

  return (
    <main className="paymentSuccessPage">
      <section className="paymentSuccessCard">
        <div className="paymentSuccessIcon">✓</div>

        <p className="paymentSuccessEyebrow">
          Payment successful
        </p>

        <h1>Thank you for your order</h1>

        <p className="paymentSuccessIntro">
          Your payment has been confirmed
          {order.customerName
            ? `, ${order.customerName.split(' ')[0]}`
            : ''}
          .
        </p>

        <div className="paymentSuccessOrder">
          <div className="paymentSuccessOrderHeader">
            <h2>Order summary</h2>

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
                    Quantity: {item.quantity ?? 0}
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
            <h2>Delivery</h2>

            {deliveryAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="paymentSuccessDetailCard">
            <h2>Requested time</h2>

            <p>
              {formatDeliveryDate(
                order.delivery.deliveryDate,
              )}
            </p>

            <p>
              {order.delivery.preferredTime || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="paymentSuccessNotice">
          <strong>What happens next?</strong>

          <p>
            We will contact you using the details provided to confirm
            the final delivery time.
          </p>
        </div>

        <p className="paymentSuccessEmail">
          A payment confirmation has been sent to{' '}
          <strong>{order.customerEmail}</strong>.
        </p>

        <a href="/" className="paymentSuccessButton">
          Return to Home
        </a>
      </section>
    </main>
  )
}