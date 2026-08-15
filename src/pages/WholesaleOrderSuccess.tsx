import { Link } from 'react-router'

import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'

import '../App.css'
import './WholesaleOrderSuccess.css'

function WholesaleOrderSuccess() {
  const { language } = useLanguage()

  const params = new URLSearchParams(
    window.location.search,
  )

  const orderNumber = params.get('order')

  const text =
    language === 'cs'
      ? {
          eyebrow: 'VELKOOBCHODNÍ OBJEDNÁVKA',
          title: 'Děkujeme za vaši objednávku',
          intro:
            'Vaše velkoobchodní objednávka byla úspěšně přijata.',
          orderNumber: 'Číslo objednávky',
          reviewMessage:
            'Ověříme dostupnost zboží a podrobnosti doručení a následně vaši objednávku potvrdíme.',
          paymentMessage:
            'Platba zatím není vyžadována. Po potvrzení objednávky vám zašleme platební údaje.',
          myAccount: 'Můj účet',
          returnHome: 'Zpět na hlavní stránku',
        }
      : {
          eyebrow: 'WHOLESALE ORDER',
          title: 'Thank you for your order',
          intro:
            'Your wholesale order has been received successfully.',
          orderNumber: 'Order number',
          reviewMessage:
            'We will review product availability and delivery details and confirm your order.',
          paymentMessage:
            'Payment is not required yet. Once your order has been confirmed, we will send you the payment details.',
          myAccount: 'My Account',
          returnHome: 'Return to Home',
        }

  return (
    <>
      <SiteHeader />

      <main className="wholesaleOrderSuccessPage">
        <section className="wholesaleOrderSuccessCard">
          <p className="wholesaleOrderSuccessEyebrow">
            {text.eyebrow}
          </p>

          <h1>{text.title}</h1>

          <p className="wholesaleOrderSuccessIntro">
            {text.intro}
          </p>

          {orderNumber && (
            <div className="wholesaleOrderSuccessNumber">
              <span>{text.orderNumber}</span>
              <strong>{orderNumber}</strong>
            </div>
          )}

          <div className="wholesaleOrderSuccessMessage">
            <p>{text.reviewMessage}</p>

            <p>{text.paymentMessage}</p>
          </div>

          <div className="wholesaleOrderSuccessActions">
            <Link
              to="/wholesale-account"
              className="wholesaleOrderSuccessPrimary"
            >
              {text.myAccount}
            </Link>

            <Link
              to="/"
              className="wholesaleOrderSuccessSecondary"
            >
              {text.returnHome}
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default WholesaleOrderSuccess