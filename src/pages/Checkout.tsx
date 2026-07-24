import { useEffect, useMemo, useState } from 'react'
import './Checkout.css'
import type { CheckoutRequest } from '../../shared/checkout-types'
type CheckoutStep = 1 | 2 | 3

type CartItem = {
  product: string
  boxSize: number
  quantity: number
  unitPriceIncVat: number
  vatRate: number
  fulfilmentMethod: 'delivery'
  preferredDate: string
  preferredTime: string
}

function getTodayDate() {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60_000

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .split('T')[0]
}

function formatDisplayDate(date: string) {
  if (!date) return ''

  const [year, month, day] = date.split('-')

  return `${day}.${month}.${year}`
}

export default function Checkout() {
  const [currentStep, setCurrentStep] =
    useState<CheckoutStep>(1)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [apartment, setApartment] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')

  const [deliveryDate, setDeliveryDate] =
    useState(getTodayDate())

  const [deliveryTime, setDeliveryTime] =
    useState('asap')
  const [termsAccepted, setTermsAccepted] = useState(false)
  useEffect(() => {
  const savedCheckout = sessionStorage.getItem(
    'maisDeNataCheckout',
  )

  if (!savedCheckout) {
    return
  }

  try {
    const checkout = JSON.parse(savedCheckout)

    setFirstName(checkout.firstName || '')
    setLastName(checkout.lastName || '')
    setEmail(checkout.email || '')
    setPhone(checkout.phone || '')

    setStreet(checkout.street || '')
    setHouseNumber(checkout.houseNumber || '')
    setApartment(checkout.apartment || '')
    setCity(checkout.city || '')
    setPostcode(checkout.postcode || '')

    setDeliveryDate(
      checkout.deliveryDate || getTodayDate(),
    )
    setDeliveryTime(checkout.deliveryTime || 'asap')

    if (checkout.returnToReview) {
      setCurrentStep(3)
    }
  } catch {
    sessionStorage.removeItem('maisDeNataCheckout')
  }
}, [])
  const cartItems = useMemo<CartItem[]>(() => {
    const savedCart = localStorage.getItem('maisDeNataCart')

    if (!savedCart) {
      return []
    }

    try {
      const parsedCart = JSON.parse(savedCart)

      return Array.isArray(parsedCart) ? parsedCart : []
    } catch {
      return []
    }
  }, [])

  const subtotal = cartItems.reduce((total, item) => {
    return total + item.unitPriceIncVat * item.quantity
  }, 0)
  
const deliveryFee = 0
const orderTotal = subtotal + deliveryFee

  const formattedSubtotal = new Intl.NumberFormat('en-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(subtotal)

const formattedTotal = new Intl.NumberFormat('en-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
}).format(orderTotal)

  const selectedTimeLabel = {
    asap: 'As soon as possible',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  }[deliveryTime]

  function scrollToCheckoutTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
  function saveCheckoutState(returnToReview = false) {
  sessionStorage.setItem(
    'maisDeNataCheckout',
    JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
      street,
      houseNumber,
      apartment,
      city,
      postcode,
      deliveryDate,
      deliveryTime,
      returnToReview,
    }),
  )
}
  function handleCustomerContinue(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setCurrentStep(2)
    scrollToCheckoutTop()
  }

  function handleDeliveryContinue(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setCurrentStep(3)
    scrollToCheckoutTop()
  }

  function goBackToCustomerDetails() {
    setCurrentStep(1)
    scrollToCheckoutTop()
  }

  function goBackToDeliveryDetails() {
    setCurrentStep(2)
    scrollToCheckoutTop()
  }
async function handlePayment() {
  const checkoutRequest: CheckoutRequest = {
    customer: {
      firstName,
      lastName,
      email,
      phone,
    },

    delivery: {
      street,
      houseNumber,
      apartment,
      city,
      postcode,
      deliveryDate,
      preferredTime: deliveryTime,
    },

    cartItems,
  }

  console.log(checkoutRequest)

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(checkoutRequest),
    })

    const data = await response.json()
    console.log('Checkout API response:', data)

    if (!response.ok || !data.success || !data.checkoutUrl) {
  throw new Error(
    data.message || 'Unable to start payment',
  )
}

window.location.href = data.checkoutUrl
} catch (error) {
  console.error('Checkout request failed:', error)

  alert(
    error instanceof Error
      ? error.message
      : 'Unable to start payment'
  )
}
}

  return (
    <main className="checkoutPage">
      <section className="checkoutContainer">
        <h1>Checkout</h1>

        <div className="checkoutProgress">
          <div
            className={`checkoutProgressStep ${
              currentStep >= 1 ? 'isActive' : ''
            }`}
          >
            <span>{currentStep > 1 ? '✓' : '1'}</span>
            <small>Customer</small>
          </div>

          <div
            className={`checkoutProgressLine ${
              currentStep >= 2 ? 'isActive' : ''
            }`}
          />

          <div
            className={`checkoutProgressStep ${
              currentStep >= 2 ? 'isActive' : ''
            }`}
          >
            <span>{currentStep > 2 ? '✓' : '2'}</span>
            <small>Delivery</small>
          </div>

          <div
            className={`checkoutProgressLine ${
              currentStep >= 3 ? 'isActive' : ''
            }`}
          />

          <div
            className={`checkoutProgressStep ${
              currentStep >= 3 ? 'isActive' : ''
            }`}
          >
            <span>3</span>
            <small>Review &amp; Pay</small>
          </div>
        </div>

        <p className="checkoutStepIndicator">
          Step {currentStep} of 3
        </p>

        {currentStep === 1 && (
          <form
            className="checkoutForm"
            onSubmit={handleCustomerContinue}
          >
            <section className="checkoutSection">
              <div className="checkoutSectionHeader">
                <span className="checkoutStepNumber">1</span>

                <div>
                  <h2>Customer Details</h2>

                  <p>
                    We will use these details to confirm your order.
                  </p>
                </div>
              </div>

              <div className="checkoutTwoColumnGrid">
                <label>
                  First Name

                  <input
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Last Name

                  <input
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    required
                  />
                </label>
              </div>

              <label>
                Email

                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Mobile Number

                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+420"
                  required
                />
              </label>
            </section>

            <button
              type="submit"
              className="checkoutButton"
            >
              Continue to Delivery →
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <form
            className="checkoutForm"
            onSubmit={handleDeliveryContinue}
          >
            <section className="checkoutSection">
              <div className="checkoutSectionHeader">
                <span className="checkoutStepNumber">2</span>

                <div>
                  <h2>Delivery Details</h2>

                  <p>
                    Tell us where and when you would like your
                    freshly baked Pastéis delivered.
                  </p>
                </div>
              </div>

              <div className="checkoutAddressGrid">
                <label className="checkoutStreetField">
                  Street

                  <input
                    type="text"
                    autoComplete="address-line1"
                    value={street}
                    onChange={(event) =>
                      setStreet(event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  House Number

                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(event) =>
                      setHouseNumber(event.target.value)
                    }
                    required
                  />
                </label>
              </div>

              <label>
                Apartment, Floor or Doorbell Name

                <input
                  type="text"
                  autoComplete="address-line2"
                  value={apartment}
                  onChange={(event) =>
                    setApartment(event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <div className="checkoutTwoColumnGrid">
                <label>
                  City

                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Postcode

                  <input
                    type="text"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={postcode}
                    onChange={(event) =>
                      setPostcode(event.target.value)
                    }
                    placeholder="110 00"
                    required
                  />
                </label>
              </div>

              <div className="checkoutDeliverySchedule">
                <h3>Preferred Delivery</h3>

                <div className="checkoutTwoColumnGrid">
                  <label>
                    Delivery Date

                    <input
                      type="date"
                      min={getTodayDate()}
                      value={deliveryDate}
                      onChange={(event) =>
                        setDeliveryDate(event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Preferred Time

                    <select
                      value={deliveryTime}
                      onChange={(event) =>
                        setDeliveryTime(event.target.value)
                      }
                    >
                      <option value="asap">
                        As soon as possible
                      </option>

                      <option value="morning">
                        Morning
                      </option>

                      <option value="afternoon">
                        Afternoon
                      </option>

                      <option value="evening">
                        Evening
                      </option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="checkoutDeliveryNotice">
                <strong>Delivery availability</strong>

                <p>
                  The delivery charge and final delivery time will
                  be confirmed before payment.
                </p>
              </div>
            </section>

            <div className="checkoutNavigation">
              <button
                type="button"
                className="checkoutBackButton"
                onClick={goBackToCustomerDetails}
              >
                ← Back
              </button>

              <button
                type="submit"
                className="checkoutButton"
              >
                Continue to Review &amp; Pay →
              </button>
            </div>
          </form>
        )}

{currentStep === 3 && (
  <div className="checkoutForm">
    <section className="checkoutSection checkoutReviewSection">
      <div className="checkoutSectionHeader">
        <span className="checkoutStepNumber">3</span>

        <div>
          <h2>Review &amp; Pay</h2>

          <p>
            Please check your order and delivery details before
            continuing to payment.
          </p>
        </div>
      </div>

      <div className="checkoutChangeNotice">
        <strong>Need to make a change?</strong>

        <p>
          You can edit your customer details, delivery details or
          cart before completing your payment.
        </p>
      </div>

      <div className="checkoutFreshMessage">
        <span className="checkoutFreshMessageIcon">🥧</span>

        <div>
          <strong>Freshly baked in Prague</strong>

          <p>
            Your Pastéis de Nata will be baked fresh on the day of
            delivery to ensure the best taste and quality.
          </p>
        </div>
      </div>

      <div className="checkoutReviewCards">
        <article className="checkoutPremiumCard">
          <div className="checkoutPremiumCardHeader">
            <div>
              <span className="checkoutPremiumCardIcon">👤</span>
              <h3>Customer</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(1)
                scrollToCheckoutTop()
              }}
            >
              Edit
            </button>
          </div>

          <div className="checkoutPremiumCardContent">
            <p>
              <strong>
                {firstName} {lastName}
              </strong>
            </p>

            <p>{email}</p>
            <p>{phone}</p>
          </div>
        </article>

        <article className="checkoutPremiumCard">
          <div className="checkoutPremiumCardHeader">
            <div>
              <span className="checkoutPremiumCardIcon">📍</span>
              <h3>Delivery</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(2)
                scrollToCheckoutTop()
              }}
            >
              Edit
            </button>
          </div>

          <div className="checkoutPremiumCardContent">
            <p>
              <strong>
                {street} {houseNumber}
              </strong>
            </p>

            {apartment && <p>{apartment}</p>}

            <p>
              {postcode} {city}
            </p>

            <div className="checkoutPremiumCardDetails">
              <p>
                <span>Date</span>
                <strong>
                  {formatDisplayDate(deliveryDate)}
                </strong>
              </p>

              <p>
                <span>Time</span>
                <strong>{selectedTimeLabel}</strong>
              </p>
            </div>
          </div>
        </article>

        <article className="checkoutPremiumCard checkoutOrderCard">
          <div className="checkoutPremiumCardHeader">
            <div>
              <span className="checkoutPremiumCardIcon">🥧</span>
              <h3>Your Order</h3>
            </div>

            <a
                href="/cart"
                onClick={() => saveCheckoutState(true)}
            >
                Edit Cart
            </a>
          </div>

          <div className="checkoutPremiumCardContent">
            {cartItems.length > 0 ? (
              <div className="checkoutPremiumOrderItems">
                {cartItems.map((item) => (
                  <div
                    key={item.boxSize}
                    className="checkoutPremiumOrderItem"
                  >
                    <div className="checkoutPremiumOrderProduct">
                      <span className="checkoutOrderPastryIcon">
                        🥧
                      </span>

                      <div>
                        <strong>
                          Box of {item.boxSize}
                        </strong>

                        <small>
                          {item.quantity}{' '}
                          {item.quantity === 1
                            ? 'box'
                            : 'boxes'}
                        </small>
                      </div>
                    </div>

                    <div className="checkoutPremiumOrderPrice">
                      <span>
                        {new Intl.NumberFormat('en-CZ', {
                          style: 'currency',
                          currency: 'CZK',
                          maximumFractionDigits: 0,
                        }).format(item.unitPriceIncVat)}
                        {' '}each
                      </span>

                      <strong>
                        {new Intl.NumberFormat('en-CZ', {
                          style: 'currency',
                          currency: 'CZK',
                          maximumFractionDigits: 0,
                        }).format(
                          item.unitPriceIncVat *
                            item.quantity,
                        )}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="checkoutEmptyOrder">
                <p>Your cart is empty.</p>

                <a href="/order-fresh">
                  Return to Order Fresh
                </a>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="checkoutFinalTotals">
        <div className="checkoutFinalTotalsRows">
          <p>
            <span>Subtotal</span>
            <strong>{formattedSubtotal}</strong>
          </p>

          <p>
            <span>Delivery</span>

            <strong className="checkoutDeliveryPending">
              Calculated before payment
            </strong>
          </p>
        </div>

        <div className="checkoutFinalTotal">
          <div>
            <span>Total before delivery</span>
            <small>Product prices include 12% VAT</small>
          </div>

          <strong>{formattedTotal}</strong>
        </div>
      </div>

      <label className="checkoutTerms">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) =>
            setTermsAccepted(event.target.checked)
          }
        />

        <span>
          I have reviewed my order and accept the{' '}
          <a href="/terms">Terms &amp; Conditions</a> and{' '}
          <a href="/privacy">Privacy Policy</a>.
        </span>
      </label>

      <div className="checkoutPaymentMethods">
        <div className="checkoutPaymentMethodsText">
          <span className="checkoutPaymentIcon">🔒</span>

          <div>
            <strong>Secure payment</strong>

            <p>
              Your payment will be processed securely through
              Stripe.
            </p>
          </div>
        </div>

        <div
          className="checkoutPaymentBadges"
          aria-label="Available payment methods"
        >
          <span>VISA</span>
          <span>Mastercard</span>
          <span>Apple Pay</span>
          <span>Google Pay</span>
        </div>
      </div>
    </section>

    <div className="checkoutNavigation">
      <button
        type="button"
        className="checkoutBackButton"
        onClick={goBackToDeliveryDetails}
      >
        ← Back
      </button>

      <button
        type="button"
        className="checkoutButton"
        onClick={handlePayment}
        disabled={
          cartItems.length === 0 || !termsAccepted
        }
      >
        Continue to Payment
      </button>
    </div>

    {!termsAccepted && cartItems.length > 0 && (
      <p className="checkoutTermsReminder">
        Please accept the Terms &amp; Conditions to continue.
      </p>
    )}
  </div>
)}      </section>
    </main>
  )
}