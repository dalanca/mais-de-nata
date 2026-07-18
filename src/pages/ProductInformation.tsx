import '../App.css'
import heroNata from '../assets/images/hero-nata.jpg'
import { useLanguage } from "../LanguageContext"
function ProductInformation() {
  const { t } = useLanguage()
  return (
    <main>
      <section className="productPage">
      <a href="/" className="pageBack">
      {t.productInfoBackHome}
      </a>
        <div className="productIntro productIntroWithImage"><div>
        <h1>{t.productInfoTitle}</h1>
        <p>{t.productInfoIntro}</p>

    <div className="quickFacts horizontalFacts">
    <span>{t.productInfoFactBox}</span>
    <span>{t.productInfoFactTime}</span>
    </div>
  </div>

  <div className="productHeroImage">
  <img src={heroNata} alt={t.productInfoImageAlt} />
  </div>
</div>

        <div className="productInfoGrid">
        <div className="productCard">
            <div className="cardHeader">
                <div className="cardIcon">●</div>
                <h2>{t.productOverviewTitle}</h2>
        </div>
        <ul className="featureList cardContent">
  {t.productOverviewItems.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>
</div>

        <div className="productCard">
          <div className="cardHeader">
              <div className="cardIcon">+</div>
              <h2>{t.whyBusinessesTitle}</h2>
        </div>
        
        <ul className="cardContent">
            {t.whyBusinessesItems.map((item) => (
             <li key={item}>{item}</li>
             ))}
       </ul>
          </div>

          <div className="productCard">
              <div className="cardHeader">
                <div className="cardIcon">1</div>
                <h2>{t.bakingTitle}</h2>
             </div>
             <ol>
                 {t.bakingSteps.map((step) => (
                 <li key={step}>{step}</li>
                 ))}
            </ol>
          </div>

          <div className="productCard">
              <div className="cardHeader">
                  <div className="cardIcon">●</div>
                  <h2>{t.technicalInfoTitle}</h2>
             </div>
             <ul>
  {t.technicalInfoItems.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>
          </div>

          <div className="productCard wideCard">
              <div className="cardHeader">
                  <div className="cardIcon">✓</div>
                  <h2>{t.suitableForTitle}</h2>
             </div>

             <p className="suitableIntro">
                 {t.suitableForIntro}
            </p>

            <div className="suitableGrid">
  {[
    "☕",
    "🥐",
    "🏨",
    "⛽",
    "🛒",
    "🍽️",
  ].map((icon, index) => (
    <div className="suitableItem" key={index}>
      <div className="businessIcon">{icon}</div>
      <span>{t.businessTypes[index]}</span>
    </div>
  ))}
</div>
</div>
</div>  
</section>
</main>
  )
}

export default ProductInformation