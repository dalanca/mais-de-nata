import '../App.css'
import './OurPasteis.css'
import heroNata from '../assets/images/hero-nata.jpg'
import belemHistory from '../assets/images/belem-history.jpeg'
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

          <section className="ourPasteisHistory">
            <div className="ourPasteisHistoryGrid">
              <div className="ourPasteisHistoryImage">
                <img
                  src={belemHistory}
                  alt="Belém and the Jerónimos Monastery in Lisbon"
                />
              </div>

              <div className="ourPasteisHistoryContent">
                <p className="ourPasteisSectionEyebrow">
                  {t.ourPasteisHistoryEyebrow}
                </p>

                <h2>
                  {t.ourPasteisHistoryTitle}
                </h2>

                <div className="ourPasteisHistoryText">
                  <p>
                    {t.ourPasteisHistoryText1}
                  </p>

                  <p>
                    {t.ourPasteisHistoryText2}
                  </p>

                  <p>
                    {t.ourPasteisHistoryText3}
                  </p>
                </div>

                <p className="ourPasteisHistoryLocation">
                  {t.ourPasteisHistoryLocation}
                </p>
              </div>
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
              <article className="ourPasteisWhyItem">
                <span className="ourPasteisWhyNumber">
                  01
                </span>

                <h3>{t.ourPasteisWhyPortugalTitle}</h3>

                <p>{t.ourPasteisWhyPortugalText}</p>
              </article>

              <article className="ourPasteisWhyItem">
                <span className="ourPasteisWhyNumber">
                  02
                </span>

                <h3>{t.ourPasteisWhyFreshTitle}</h3>

                <p>{t.ourPasteisWhyFreshText}</p>
              </article>

              <article className="ourPasteisWhyItem">
                <span className="ourPasteisWhyNumber">
                  03
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