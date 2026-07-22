import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import './Cart.css'

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
    <main className="cartPage">
      <section className="cartContainer">
        <h1>Your Cart</h1>

{cart.length === 0 ? (
  <div className="cartEmptyState">
    <div className="cartEmptyIcon">🥧</div>

    <h2>Your cart is empty</h2>

    <p>
      Looks like you haven't added any freshly baked
      Pastéis de Nata yet.
    </p>

    <a
      href="/order-fresh"
      className="cartEmptyButton"
    >
      Order Fresh
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
      🥧
    </div>

    <div>
      <h2>Box of {item.boxSize}</h2>

      <p className="cartProductName">
        Freshly Baked Pastéis de Nata
      </p>
    </div>
  </div>
</div>
                  <div className="cartItemDetails">
                    <div className="cartQuantitySection">
                      <strong>Quantity</strong>

                      <div className="cartQuantityControl">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(index, -1)
                          }
                          aria-label={`Decrease quantity for box of ${item.boxSize}`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(index, 1)
                          }
                          aria-label={`Increase quantity for box of ${item.boxSize}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cartPriceRows">
                      <div className="cartPriceRow">
                        <span>Price</span>
                        <strong>
                          {item.unitPriceIncVat} Kč
                        </strong>
                      </div>

                      <div className="cartPriceRow cartLineSubtotal">
                        <span>Subtotal</span>
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
                <span>Subtotal (incl. VAT)</span>
                <strong>{cartTotal} Kč</strong>
              </div>

              <div className="cartSummaryRow">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="cartSummaryDivider" />

              <div className="cartSummaryRow cartSummaryTotal">
                <span>Total</span>
                <strong>{cartTotal} Kč</strong>
              </div>

              <p className="cartVatNote">
                All prices include 12% VAT.
              </p>

              <div className="cartSummaryActions">
              <Link
                to="/order-fresh"
                className="cartSecondaryButton"
              >
                Continue Shopping
            </Link>
            <Link
                to="/checkout"
                className="cartCheckoutButton"
            >
                Continue to Checkout
            </Link>
              </div>
            </div>

            <button
              type="button"
              className="cartClearButton"
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          </>
        )}
      </section>
    </main>
  )
}