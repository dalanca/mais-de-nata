import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import '../App.css'
import './OrderFresh.css'
import heroNata from '../assets/images/hero-nata.jpg'
import { useLanguage } from '../LanguageContext'

type BoxSize = 4 | 6 | 12 | 18
const boxPrices: Record<BoxSize, number> = {
  4: 240,
  6: 348,
  12: 660,
  18: 936,
}
const boxSizes: BoxSize[] = [4, 6, 12, 18]

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

export default function OrderFresh() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()

  
  const [boxQuantities, setBoxQuantities] = useState<Record<BoxSize, number>>({
  4: 0,
  6: 0,
  12: 0,
  18: 0,
})
  const [preferredDate, setPreferredDate] = useState(getTodayDate())
  const [preferredTime, setPreferredTime] = useState('asap')
  const [addedToCart, setAddedToCart] = useState(false)
  const [hasExistingCart, setHasExistingCart] = useState(false)
  const subtotal = boxSizes
  .reduce((total, size) => {
    return total + boxPrices[size] * boxQuantities[size]
  }, 0)
  const totalBoxes = boxSizes.reduce(
  (total, size) => total + boxQuantities[size],
  0,
)
useEffect(() => {
  const savedCart = localStorage.getItem('maisDeNataCart')

  if (!savedCart) {
    setHasExistingCart(false)
    return
  }

  try {
    const parsedCart = JSON.parse(savedCart)

    setHasExistingCart(
      Array.isArray(parsedCart) && parsedCart.length > 0,
    )
  } catch {
    setHasExistingCart(false)
  }
}, [])
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0,
    }).format(subtotal)
  }, [language, subtotal])

const selectedBoxes = boxSizes
  .filter((size) => boxQuantities[size] > 0)
  .map((size) => ({
    size,
    quantity: boxQuantities[size],
  }))

const selectedMethodLabel = t.orderFreshDelivery

  const selectedTimeLabel = {
    asap: t.orderFreshTimeAsap,
    morning: t.orderFreshTimeMorning,
    afternoon: t.orderFreshTimeAfternoon,
    evening: t.orderFreshTimeEvening,
  }[preferredTime]
function updateBoxQuantity(size: BoxSize, change: number) {
 
  setBoxQuantities((currentQuantities) => ({
    ...currentQuantities,
    [size]: Math.max(0, currentQuantities[size] + change),
  }))

  setAddedToCart(false)
}
function saveCart() {
  const selectedItems = (
    Object.keys(boxQuantities) as unknown as BoxSize[]
  )
    .filter((size) => boxQuantities[size] > 0)
    .map((size) => ({
      product: 'fresh-pasteis-de-nata',
      boxSize: Number(size) as BoxSize,
      quantity: boxQuantities[size],
      unitPriceIncVat: boxPrices[size],
      vatRate: 12,
      fulfilmentMethod: 'delivery' as const,
      preferredDate,
      preferredTime,
    }))

  if (selectedItems.length === 0) {
    return false
  }

  localStorage.setItem(
    'maisDeNataCart',
    JSON.stringify(selectedItems),
  )

  setHasExistingCart(true)

  return true
}

function handleAddToCart() {
  if (!saveCart()) {
    return
  }

  setAddedToCart(true)
}  return (
    <main className="orderFreshPage">
      <section
        className="orderFreshHero"
        style={{ backgroundImage: `url(${heroNata})` }}
      >
        <div className="orderFreshHeroOverlay">
          <div className="orderFreshHeroContent">
            <a href="/" className="orderFreshBackLink">
              {t.orderFreshBackHome}
            </a>

            <p className="orderFreshEyebrow">{t.orderFreshEyebrow}</p>

            <h1>{t.orderFreshTitle}</h1>

            <p className="orderFreshIntro">{t.orderFreshIntro}</p>
          </div>
        </div>
      </section>

      <section className="orderFreshContent">
        <div className="orderFreshConfigurator">
          <div className="orderFreshPanel">
            <div className="orderFreshSection">
              <h2>{t.orderFreshChooseBox}</h2>

<div className="orderFreshBoxOptions">
  {([4, 6, 12, 18] as BoxSize[]).map((size) => (
    <div
      key={size}
      className={`orderFreshBoxOption ${
        boxQuantities[size] > 0 ? 'isSelected' : ''
      }`}
    >
      {size === 6 && (
        <span className="orderFreshPopularBadge">
          {t.orderFreshMostPopular}
        </span>
      )}

      <strong>{size}</strong>
      <span>Pastéis</span>

      <small>
        {new Intl.NumberFormat(
          language === 'cs' ? 'cs-CZ' : 'en-CZ',
          {
            style: 'currency',
            currency: 'CZK',
            maximumFractionDigits: 0,
          },
        ).format(boxPrices[size])}
      </small>

      <div className="orderFreshQuantityControl">
        <button
          type="button"
          aria-label={`Decrease quantity of box of ${size}`}
          onClick={() => updateBoxQuantity(size, -1)}
          disabled={boxQuantities[size] === 0}
        >
          −
        </button>

        <strong>{boxQuantities[size]}</strong>

        <button
          type="button"
          aria-label={`Increase quantity of box of ${size}`}
          onClick={() => updateBoxQuantity(size, 1)}
        >
          +
        </button>
      </div>
    </div>
  ))}
</div>
            </div>

<div className="orderFreshSection">
  <h2>{t.orderFreshFulfilmentTitle}</h2>

  <div className="orderFreshMethodOptions">
    <button
      type="button"
      className="orderFreshMethodOption isSelected"
    >
      <span className="orderFreshMethodIcon">🚚</span>

      <span>
        <strong>{t.orderFreshDelivery}</strong>
        <small>{t.orderFreshDeliveryText}</small>
      </span>
    </button>
  </div>
</div>

            <div className="orderFreshSection">
              <div className="orderFreshScheduleGrid">
                <label className="orderFreshField">
                  <span>{t.orderFreshDateLabel}</span>

                  <input
                    type="date"
                    min={getTodayDate()}
                    value={preferredDate}
                    onChange={(event) => {
                      setPreferredDate(event.target.value)
                      setAddedToCart(false)
                    }}
                  />
                </label>

                <label className="orderFreshField">
                  <span>{t.orderFreshTimeLabel}</span>

                  <select
                    value={preferredTime}
                    onChange={(event) => {
                      setPreferredTime(event.target.value)
                      setAddedToCart(false)
                    }}
                  >
                    <option value="asap">{t.orderFreshTimeAsap}</option>
                    <option value="morning">
                      {t.orderFreshTimeMorning}
                    </option>
                    <option value="afternoon">
                      {t.orderFreshTimeAfternoon}
                    </option>
                    <option value="evening">
                      {t.orderFreshTimeEvening}
                    </option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <aside className="orderFreshSummary">
            <h2>{t.orderFreshSummaryTitle}</h2>

<div className="orderFreshSummaryProduct">
  <img src={heroNata} alt="" />

  <div>
    <strong>{t.orderFreshSummaryProduct}</strong>
  </div>
</div>
            <div className="orderFreshSummaryRows">
              <p>
                <span>{t.orderFreshSummaryBox}</span>

<strong className="orderFreshSelectedBoxes">
  {selectedBoxes.length > 0 ? (
    selectedBoxes.map((item) => (
      <span key={item.size}>
        Box of {item.size} · Qty {item.quantity}
      </span>
    ))
  ) : (
    <span>—</span>
  )}
</strong>
              </p>

              <p>
                <span>{t.orderFreshSummaryMethod}</span>
                <strong>{selectedMethodLabel}</strong>
              </p>

 <p>
  <span>{t.orderFreshSummaryDate}</span>
  <strong>{formatDisplayDate(preferredDate)}</strong>
</p>

              <p>
                <span>{t.orderFreshSummaryTime}</span>
                <strong>{selectedTimeLabel}</strong>
              </p>
            </div>

            <div className="orderFreshSummaryTotals">
              <p>
                <span>{t.orderFreshSummarySubtotal}</span>
                <strong>{formattedPrice}</strong>
              </p>

<p>
  <span>{t.orderFreshSummaryDelivery}</span>
  <strong>{t.orderFreshDeliveryCalculated}</strong>
</p>

              <p className="orderFreshTotal">
                <span>{t.orderFreshSummaryTotal}</span>
                <strong>{formattedPrice}</strong>
              </p>
            </div>

            <button
                type="button"
                className="orderFreshAddButton"
                onClick={handleAddToCart}
            >
                {addedToCart
                ? '✓ Added to Cart'
                : hasExistingCart
                ? 'Update Cart'
                : t.orderFreshAddToCart}
            </button>
            {hasExistingCart && (
                <button
                type="button"
                className="orderFreshCartButton"
                onClick={() => {
                    if (saveCart()) {
                    navigate('/cart')
                }
            }}
            >
                <span>🛒</span>
                <span>
                  {totalBoxes} {totalBoxes === 1 ? 'box' : 'boxes'} in cart
                </span>
                <strong>Checkout →</strong>
            </button>
        )}
          </aside>
        </div>
      </section>
    </main>
  )
}