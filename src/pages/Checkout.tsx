import { useEffect, useMemo, useState } from 'react'
import './Checkout.css'
import type { CheckoutRequest } from '../../shared/checkout-types'
import { useLanguage } from '../LanguageContext'
import nataProductIcon from '../assets/images/nata-product-icon.jpg'
import SiteHeader from '../components/SiteHeader'
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
    const { t, language } = useLanguage()
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
  asap: t.checkoutTimeAsap,
  morning: t.checkoutTimeMorning,
  afternoon: t.checkoutTimeAfternoon,
  evening: t.checkoutTimeEvening,
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

  language,
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
  <>
    <SiteHeader />

    <main className="checkoutPage">
      <section className="checkoutContainer">
        <h1>{t.checkoutTitle}</h1>

        <div className="checkoutProgress">
          <div
            className={`checkoutProgressStep ${
              currentStep >= 1 ? 'isActive' : ''
            }`}
          >
            <span>{currentStep > 1 ? '✓' : '1'}</span>
            <small>{t.checkoutProgressCustomer}</small>
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
            <small>{t.checkoutProgressDelivery}</small>
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
            <small>{t.checkoutProgressReview}</small>
          </div>
        </div>

        <p className="checkoutStepIndicator">
            {t.checkoutStepOf} {currentStep} {t.checkoutOf} 3
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
                  <h2>{t.checkoutCustomerTitle}</h2>

                  <p>{t.checkoutCustomerIntro}</p>
                </div>
              </div>

              <div className="checkoutTwoColumnGrid">
                <label>
                  {t.checkoutFirstName}

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
                  {t.checkoutLastName}

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
                {t.checkoutEmail}

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
                {t.checkoutPhone}

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
              {t.checkoutContinueDelivery}
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
                  <h2>{t.checkoutDeliveryTitle}</h2>

                  <p>{t.checkoutDeliveryIntro}</p>
                </div>
              </div>

              <div className="checkoutAddressGrid">
                <label className="checkoutStreetField">
                  {t.checkoutStreet}

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
                  {t.checkoutHouseNumber}

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
                {t.checkoutApartment}

                <input
                  type="text"
                  autoComplete="address-line2"
                  value={apartment}
                  onChange={(event) =>
                    setApartment(event.target.value)
                  }
                  placeholder={t.checkoutOptional}
                />
              </label>

              <div className="checkoutTwoColumnGrid">
                <label>
                  {t.checkoutCity}

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
                  {t.checkoutPostcode}

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
                <h3>{t.checkoutPreferredDelivery}</h3>

                <div className="checkoutTwoColumnGrid">
                  <label>
                    {t.checkoutDeliveryDate}

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
                    {t.checkoutPreferredTime}

                    <select
                      value={deliveryTime}
                      onChange={(event) =>
                        setDeliveryTime(event.target.value)
                      }
                    >
                    <option value="asap">
                        {t.checkoutTimeAsap}
                    </option>

                    <option value="morning">
                        {t.checkoutTimeMorning}
                    </option>

                    <option value="afternoon">
                        {t.checkoutTimeAfternoon}
                    </option>

                    <option value="evening">
                        {t.checkoutTimeEvening}
                    </option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="checkoutDeliveryNotice">
                <strong>{t.checkoutDeliveryAvailability}</strong>

                <p>{t.checkoutDeliveryAvailabilityText}</p>
              </div>
            </section>

            <div className="checkoutNavigation">
              <button
                type="button"
                className="checkoutBackButton"
                onClick={goBackToCustomerDetails}
              >
                {t.checkoutBack}
              </button>

              <button
                type="submit"
                className="checkoutButton"
              >{t.checkoutContinueReview}
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
          <h2>{t.checkoutReviewTitle}</h2>

          <p>{t.checkoutReviewIntro}</p>
        </div>
      </div>

      <div className="checkoutChangeNotice">
        <strong>{t.checkoutChangeTitle}</strong>

        <p>{t.checkoutChangeText}</p>
      </div>

        <div className="checkoutFreshMessage">
            <span className="checkoutFreshMessageIcon">
                <img
                    src={nataProductIcon}
                    alt=""
                />
            </span>

        <div>
            <strong>{t.checkoutFreshTitle}</strong>

            <p>{t.checkoutFreshText}</p>
        </div>
    </div>

      <div className="checkoutReviewCards">
        <article className="checkoutPremiumCard">
          <div className="checkoutPremiumCardHeader">
            <div>
              <span className="checkoutPremiumCardIcon">👤</span>
              <h3>{t.checkoutCustomerCard}</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(1)
                scrollToCheckoutTop()
              }}
            >
              {t.checkoutEdit}
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
              <h3>{t.checkoutDeliveryCard}</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(2)
                scrollToCheckoutTop()
              }}
            >
              {t.checkoutEdit}
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
                <span>{t.checkoutDate}</span>
                <strong>
                  {formatDisplayDate(deliveryDate)}
                </strong>
              </p>

              <p>
                <span>{t.checkoutTime}</span>
                <strong>{selectedTimeLabel}</strong>
              </p>
            </div>
          </div>
        </article>

        <article className="checkoutPremiumCard checkoutOrderCard">
          <div className="checkoutPremiumCardHeader"><div>

            <span className="checkoutPremiumCardIcon checkoutNataCardIcon">
                <img
                    src={nataProductIcon}
                    alt=""
                />
            </span>

            <h3>{t.checkoutOrderCard}</h3>
        </div>

            <a
                href="/cart"
                onClick={() => saveCheckoutState(true)}
            >
                {t.checkoutEditCart}
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
                            <img
                                src={nataProductIcon}
                                alt="Pastel de Nata"
                            />
                        </span>

                      <div>
                        <strong>
                          {t.checkoutBoxOf} {item.boxSize}
                        </strong>

                        <small>
                          {item.quantity}{' '}
                          {item.quantity === 1
                            ? t.checkoutBox
                            : t.checkoutBoxes}
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
                        {' '}{t.checkoutEach}
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
                <p>{t.checkoutEmptyCart}</p>

                <a href="/order-fresh">
                  {t.checkoutReturnOrderFresh}
                </a>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="checkoutFinalTotals">
        <div className="checkoutFinalTotalsRows">
          <p>
            <span>{t.checkoutSubtotal}</span>
            <strong>{formattedSubtotal}</strong>
          </p>

          <p>
            <span>{t.checkoutDelivery}</span>

            <strong className="checkoutDeliveryPending">
              {t.checkoutDeliveryCalculated}
            </strong>
          </p>
        </div>

        <div className="checkoutFinalTotal">
          <div>
            <span>{t.checkoutTotalBeforeDelivery}</span>
            <small>{t.checkoutVatIncluded}</small>
          </div>

          <strong>{formattedTotal}</strong>
        </div>
      </div>
      <div className="checkoutPaymentMethods">
        <div className="checkoutPaymentMethodsText">
          <span className="checkoutPaymentIcon">🔒</span>

          <div>
            <strong>{t.checkoutSecurePayment}</strong>

            <p>{t.checkoutSecurePaymentText}</p>
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
    {t.checkoutBack}
  </button>

  <button
    type="button"
    className="checkoutButton"
    onClick={handlePayment}
    disabled={cartItems.length === 0}
  >
    {t.checkoutContinuePayment}
  </button>
</div>
  </div>
  
)}
</section>
</main>
</>
)
}