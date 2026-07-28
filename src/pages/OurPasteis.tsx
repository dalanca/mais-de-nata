import '../App.css'
import './OurPasteis.css'
import heroNata from '../assets/images/hero-nata.jpg'
import { useLanguage } from '../LanguageContext'
import SiteHeader from '../components/SiteHeader'

function OurPasteis() {
  const { t } = useLanguage()

  return (
    <>
      <SiteHeader />

      <main className="ourPasteisMain">
        <section className="ourPasteisPage">
          <section
            className="ourPasteisHero"
            style={{ backgroundImage: `url(${heroNata})` }}
          >
            <div className="ourPasteisHeroContent">
              <p className="ourPasteisEyebrow">
                {t.ourPasteisEyebrow}
              </p>

              <h1>{t.ourPasteisTitle}</h1>

              <p className="ourPasteisIntro">
                {t.ourPasteisIntro}
              </p>

              <a
                href="/order-fresh"
                className="ourPasteisButton"
              >
                {t.ourPasteisOrderButton}
              </a>
            </div>
          </section>

          <section className="ourPasteisWhy">
            <div className="ourPasteisSectionHeading">
              <p className="ourPasteisSectionEyebrow">
                {t.ourPasteisWhyEyebrow}
              </p>

              <h2>{t.ourPasteisWhyTitle}</h2>

              <p className="ourPasteisSectionIntro">
                {t.ourPasteisWhyIntro}
              </p>
            </div>

            <div className="ourPasteisWhyGrid">
              <article className="ourPasteisWhyCard">
                <span
                  className="ourPasteisWhyIcon"
                  aria-hidden="true"
                >
                  🇵🇹
                </span>

                <h3>{t.ourPasteisWhyPortugalTitle}</h3>

                <p>{t.ourPasteisWhyPortugalText}</p>
              </article>

              <article className="ourPasteisWhyCard">
                <span
                  className="ourPasteisWhyIcon"
                  aria-hidden="true"
                >
                  🔥
                </span>

                <h3>{t.ourPasteisWhyFreshTitle}</h3>

                <p>{t.ourPasteisWhyFreshText}</p>
              </article>

              <article className="ourPasteisWhyCard">
                <span
                  className="ourPasteisWhyIcon"
                  aria-hidden="true"
                >
                  ❤️
                </span>

                <h3>{t.ourPasteisWhyLisbonTitle}</h3>

                <p>{t.ourPasteisWhyLisbonText}</p>
              </article>
            </div>
          </section>
        </section>
      </main>
    </>
  )
}

export default OurPasteis