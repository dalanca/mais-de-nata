import '../App.css'
import './OurPasteis.css'
import heroNata from '../assets/images/hero-nata.jpg'
import { useLanguage } from '../LanguageContext'
import boxRender from '../assets/images/mais-de-nata-box-6.jpeg'

function OurPasteis() {
  const { t } = useLanguage()

  return (
    <main className="ourPasteisMain">
      <section className="ourPasteisPage">
        <a href="/" className="pageBack">
          {t.ourPasteisBackHome}
        </a>

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

            <a href="/order-fresh" className="ourPasteisButton">
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
      <span className="ourPasteisWhyIcon" aria-hidden="true">
        🇵🇹
      </span>

      <h3>{t.ourPasteisWhyPortugalTitle}</h3>

      <p>{t.ourPasteisWhyPortugalText}</p>
    </article>

    <article className="ourPasteisWhyCard">
      <span className="ourPasteisWhyIcon" aria-hidden="true">
        🔥
      </span>

      <h3>{t.ourPasteisWhyFreshTitle}</h3>

      <p>{t.ourPasteisWhyFreshText}</p>
    </article>

    <article className="ourPasteisWhyCard">
      <span className="ourPasteisWhyIcon" aria-hidden="true">
        ❤️
      </span>

      <h3>{t.ourPasteisWhyLisbonTitle}</h3>

      <p>{t.ourPasteisWhyLisbonText}</p>
    </article>
  </div>
  <section className="ourPasteisBoxes">
  <div className="ourPasteisSectionHeading">
    <p className="ourPasteisSectionEyebrow">
      {t.ourPasteisBoxesEyebrow}
    </p>

    <h2>{t.ourPasteisBoxesTitle}</h2>

    <p className="ourPasteisSectionIntro">
      {t.ourPasteisBoxesIntro}
    </p>
  </div>

  <div className="ourPasteisBoxShowcase">
    <img
      src={boxRender}
      alt="Mais de Nata branded Pastéis de Nata box"
    />
  </div>

  <div className="ourPasteisBoxesGrid">
    <article className="ourPasteisBoxCard">
      <div className="ourPasteisBoxContent">
        <span className="ourPasteisBoxQuantity">4</span>

        <h3>{t.ourPasteisBoxFourTitle}</h3>

        <p>{t.ourPasteisBoxFourText}</p>

        <a href="/order-fresh" className="ourPasteisBoxButton">
          {t.ourPasteisBoxFourButton}
        </a>
      </div>
    </article>

    <article className="ourPasteisBoxCard ourPasteisBoxCardFeatured">
      <span className="ourPasteisBoxBadge">
        {t.ourPasteisBoxSixBadge}
      </span>

      <div className="ourPasteisBoxContent">
        <span className="ourPasteisBoxQuantity">6</span>

        <h3>{t.ourPasteisBoxSixTitle}</h3>

        <p>{t.ourPasteisBoxSixText}</p>

        <a href="/order-fresh" className="ourPasteisBoxButton">
          {t.ourPasteisBoxSixButton}
        </a>
      </div>
    </article>

    <article className="ourPasteisBoxCard">
      <div className="ourPasteisBoxContent">
        <span className="ourPasteisBoxQuantity">12</span>

        <h3>{t.ourPasteisBoxTwelveTitle}</h3>

        <p>{t.ourPasteisBoxTwelveText}</p>

        <a href="/order-fresh" className="ourPasteisBoxButton">
          {t.ourPasteisBoxTwelveButton}
        </a>
      </div>
    </article>

    <article className="ourPasteisBoxCard">
      <div className="ourPasteisBoxContent">
        <span className="ourPasteisBoxQuantity">18</span>

        <h3>{t.ourPasteisBoxEighteenTitle}</h3>

        <p>{t.ourPasteisBoxEighteenText}</p>

        <a href="/order-fresh" className="ourPasteisBoxButton">
          {t.ourPasteisBoxEighteenButton}
        </a>
      </div>
    </article>
  </div>
</section>
</section>
      </section>
    </main>
  )
}

export default OurPasteis