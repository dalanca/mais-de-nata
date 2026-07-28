import { Link } from 'react-router'
import SiteHeader from '../components/SiteHeader'

import '../App.css'
import './WholesaleOrderSuccess.css'

function WholesaleOrderSuccess() {
  const params = new URLSearchParams(
    window.location.search,
  )

  const orderNumber = params.get('order')

  return (
    <>
      <SiteHeader />

      <main className="wholesaleOrderSuccessPage">
        <section className="wholesaleOrderSuccessCard">
          <p className="wholesaleOrderSuccessEyebrow">
            Wholesale Order
          </p>

          <h1>Thank you for your order</h1>

          <p className="wholesaleOrderSuccessIntro">
            Your wholesale order has been received
            successfully.
          </p>

          {orderNumber && (
            <div className="wholesaleOrderSuccessNumber">
              <span>Order number</span>
              <strong>{orderNumber}</strong>
            </div>
          )}

          <div className="wholesaleOrderSuccessMessage">
            <p>
              We will review product availability and
              delivery details and confirm your order.
            </p>

            <p>
              Payment is not required yet. Once your order
              has been confirmed, we will send you the
              payment details.
            </p>
          </div>

          <div className="wholesaleOrderSuccessActions">
            <Link
                to="/wholesale-account"
                className="wholesaleOrderSuccessPrimary"
            >
                My Account
            </Link>

            <Link
              to="/"
              className="wholesaleOrderSuccessSecondary"
            >
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default WholesaleOrderSuccess