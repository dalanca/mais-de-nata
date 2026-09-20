import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'
import './ComingSoon.css'

export default function ComingSoon() {
    const { t } = useLanguage()

    return (
        <>
            <SiteHeader />

            <main className="comingSoonPage">
                <section className="comingSoonHero">
                    <div className="comingSoonGrid">
                        <div className="comingSoonContent">
                            <p className="comingSoonEyebrow">
                                {t.launchLiveEyebrow}
                            </p>

                            <h1>
                                {t.launchLiveTitle}
                            </h1>

                            <p className="comingSoonIntro">
                                {t.launchLiveIntro}
                            </p>

                            <div className="comingSoonOffer">
                                <p className="comingSoonOfferEyebrow">
                                    {t.launchLiveOfferEyebrow}
                                </p>

                                <h2>
                                    {t.launchLiveOfferTitle}
                                </h2>

                                <p>
                                    {t.launchLiveOfferText}
                                </p>
                            </div>

                            <div className="comingSoonActions">
                                <a
                                    href="/order"
                                    className="comingSoonPrimaryButton"
                                >
                                    {t.launchLiveOrderButton}
                                </a>

                                <a
                                    href="/our-pasteis"
                                    className="comingSoonSecondaryButton"
                                >
                                    {t.launchLiveLearnButton}
                                </a>
                            </div>
                        </div>

                        <div className="comingSoonVisual">
                            <div className="comingSoonVisualOverlay">
                                <span>
                                    {t.launchLiveVisualLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}