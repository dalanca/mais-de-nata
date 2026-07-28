import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import '../App.css'
import './OrderFresh.css'
import heroNata from '../assets/images/hero-nata.jpg'
import { useLanguage } from '../LanguageContext'
import SiteHeader from '../components/SiteHeader'

type BoxSize = 4 | 6 | 12 | 18
const boxPrices: Record<BoxSize, number> = {
  4: 240,
  6: 348,
  12: 660,
  18: 936,
}
const boxSizes: BoxSize[] = [4, 6, 12, 18]
export default function OrderFresh() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()

  
  const [boxQuantities, setBoxQuantities] = useState<Record<BoxSize, number>>({
  4: 0,
  6: 0,
  12: 0,
  18: 0,
})
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

    if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
      setHasExistingCart(false)
      return
    }

    const restoredQuantities: Record<BoxSize, number> = {
      4: 0,
      6: 0,
      12: 0,
      18: 0,
    }

    for (const item of parsedCart) {
      if (
        item &&
        (item.boxSize === 4 ||
          item.boxSize === 6 ||
          item.boxSize === 12 ||
          item.boxSize === 18)
      ) {
        restoredQuantities[item.boxSize as BoxSize] =
          Number(item.quantity) || 0
      }
    }

    setBoxQuantities(restoredQuantities)

    setHasExistingCart(true)
    setAddedToCart(true)
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
  <>
    <SiteHeader />

    <main className="orderFreshPage">
      <section
        className="orderFreshHero"
        style={{ backgroundImage: `url(${heroNata})` }}
      >
        <div className="orderFreshHeroOverlay">
          <div className="orderFreshHeroContent">
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
              </p>            </div>

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
                    ? t.orderFreshAddedToCart
                    : hasExistingCart
                        ? t.orderFreshUpdateCart
                        : t.orderFreshAddToCart}
            </button>
            {hasExistingCart && addedToCart && (
              <button
                type="button"
                className="orderFreshCartButton"
                onClick={() => {
                  if (saveCart()) {
                    navigate('/cart')
                  }
                }}
              >
                <span>
                  {totalBoxes}{' '}
                  {totalBoxes === 1
                    ? t.orderFreshBoxInCart
                    : t.orderFreshBoxesInCart}
                </span>

                <strong>{t.orderFreshCheckout}</strong>
              </button>
            )}
          </aside>
        </div>
      </section>
    </main>
  </>
)
}