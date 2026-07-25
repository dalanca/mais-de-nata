import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import './Cart.css'
import { useLanguage } from '../LanguageContext'
import nataProductIcon from '../assets/images/nata-product-icon.jpg'
import SiteHeader from '../components/SiteHeader'
interface CartItem {
  product: string
  boxSize: number
  quantity: number
  unitPriceIncVat: number
  vatRate: number
  fulfilmentMethod: 'delivery'
  preferredDate: string
  preferredTime: string
}

export default function Cart() {
    const { t } = useLanguage()

    const [cart, setCart] = useState<CartItem[]>([])

  const cartTotal = cart.reduce((total, item) => {
    return total + item.quantity * item.unitPriceIncVat
  }, 0)

  useEffect(() => {
    const savedCart = localStorage.getItem('maisDeNataCart')

    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  function handleClearCart() {
    localStorage.removeItem('maisDeNataCart')
    setCart([])
  }

  function updateQuantity(index: number, change: number) {
    setCart((currentCart) => {
      const updatedCart = [...currentCart]
      const newQuantity = updatedCart[index].quantity + change

      if (newQuantity <= 0) {
        updatedCart.splice(index, 1)
      } else {
        updatedCart[index] = {
          ...updatedCart[index],
          quantity: newQuantity,
        }
      }

      localStorage.setItem(
        'maisDeNataCart',
        JSON.stringify(updatedCart),
      )

      return updatedCart
    })
  }

return (
  <>
    <SiteHeader />

    <main className="cartPage">
      <section className="cartContainer">
        <h1>{t.cartTitle}</h1>

{cart.length === 0 ? (
  <div className="cartEmptyState">
    <div className="cartEmptyIcon">🥧</div>

<h2>{t.cartEmptyTitle}</h2>

<p>{t.cartEmptyText}</p>

    <a
      href="/order-fresh"
      className="cartEmptyButton"
    >
      {t.cartEmptyButton}
    </a>
  </div>
) : (
          <>
            <div className="cartItems">
              {cart.map((item, index) => (
                <div
                  className="cartItem"
                  key={item.boxSize}
                >
<div className="cartItemHeader">
  <div className="cartProductInfo">
<div className="cartProductIcon">
  <img src={nataProductIcon} alt="Pastel de Nata" />
</div>

    <div>
<h2>
  <span>{t.cartBoxOf}</span>
  <span className="cartBoxSize">{item.boxSize}</span>
</h2>

      <p className="cartProductName">
        {t.cartFreshProduct}
      </p>
    </div>
  </div>
</div>
                  <div className="cartItemDetails">
                    <div className="cartQuantitySection">
                      <strong>{t.cartQuantity}</strong>

                      <div className="cartQuantityControl">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(index, -1)
                          }
                          aria-label={`${t.cartDecreaseQuantity} ${item.boxSize}`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(index, 1)
                          }
                          aria-label={`${t.cartIncreaseQuantity} ${item.boxSize}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cartPriceRows">
                      <div className="cartPriceRow">
                        <span>{t.cartPrice}</span>
                        <strong>
                          {item.unitPriceIncVat} Kč
                        </strong>
                      </div>

                      <div className="cartPriceRow cartLineSubtotal">
                        <span>{t.cartSubtotal}</span>
                        <strong>
                          {item.quantity *
                            item.unitPriceIncVat}{' '}
                          Kč
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cartSummary">
              <div className="cartSummaryRow">
                <span>{t.cartSummarySubtotal}</span>
                <strong>{cartTotal} Kč</strong>
              </div>

              <div className="cartSummaryRow">
              <span>{t.cartDelivery}</span>
<span>{t.cartDeliveryCalculated}</span>
              </div>

              <div className="cartSummaryDivider" />

              <div className="cartSummaryRow cartSummaryTotal">
                <span>{t.cartTotal}</span>
                <strong>{cartTotal} Kč</strong>
              </div>

              <p className="cartVatNote">
                {t.cartVatNote}
              </p>

              <div className="cartSummaryActions">
              <Link
                to="/order-fresh"
                className="cartSecondaryButton"
              >
                {t.cartContinueShopping}
            </Link>
            <Link
                to="/checkout"
                className="cartCheckoutButton"
            >
                {t.cartContinueCheckout}
            </Link>
              </div>
            </div>

            <button
              type="button"
              className="cartClearButton"
              onClick={handleClearCart}
            >
              {t.cartClear}
            </button>
          </>
        )}
      </section>
    </main>
  </>
)
}