import '../App.css'
import './Wholesale.css'

import heroNata from '../assets/images/hero-nata.jpg'
import { Link } from 'react-router'

import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'
export default function Wholesale() {
    const { t } = useLanguage()

    return (
        <>
            <SiteHeader />

            <main className="wholesaleLandingPage">
                <section className="wholesaleLandingHero">
                    <div className="wholesaleLandingContent">
                        <p className="wholesaleLandingEyebrow">
                            {t.wholesaleLandingEyebrow}
                        </p>

                        <h1>
                            {t.wholesaleLandingTitle}
                        </h1>

                        <p className="wholesaleLandingIntro">
                            {t.wholesaleLandingIntro}
                        </p>

                        <div className="wholesaleLandingActions">
                            <Link
                                to="/product-information"
                                className="wholesaleLandingPrimary"
                            >
                                {t.wholesaleLandingProductInfo}
                            </Link>

                            <Link
                                to="/register"
                                className="wholesaleLandingSecondary"
                            >
                                {t.wholesaleLandingRegister}
                            </Link>
                        </div>

                        <p className="wholesaleLandingSignIn">
                            {t.wholesaleLandingAlreadyAccount}{' '}
                            <Link to="/wholesale-sign-in">
                                {t.wholesaleLandingSignIn}
                            </Link>
                        </p>
                    </div>

                    <div className="wholesaleLandingImage">
                        <img
                            src={heroNata}
                            alt="Pastéis de Nata"
                        />
                    </div>
                </section>
            </main>
        </>
    )
}