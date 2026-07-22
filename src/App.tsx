import "./App.css";
import "./Home.css";

import tramBg from "./assets/images/lisbon-tram.png";
import nataTransparent from "./assets/images/nata-transparent.png";
import logo from "./assets/images/mais-de-nata-logo.png";

import { useLanguage } from "./LanguageContext";

function App() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <main>
      <section
        className="homeHero tramHero"
        style={{
          backgroundImage: `linear-gradient(
            rgba(0, 0, 0, 0.45),
            rgba(0, 0, 0, 0.45)
          ), url(${tramBg})`,
        }}
      >
        <nav className="homeNavbar heroNavbar">
          <a href="/" className="homeLogo heroLogo">
            <img
              src={logo}
              alt="Mais de Nata"
              className="heroLogoImage"
            />
          </a>

          <div className="homeNavControls">
            <div
              id="homepage-navigation"
              className="homeNavLinks heroNavLinks"
            >
              <a href="/product-information">
                {t.navProductInfo}
              </a>

              <a href="/wholesale-order">
                {t.navWholesaleOrder}
              </a>

              <a href="/register">
                {t.navContact}
              </a>
            </div>

<span
  className="languageToggle"
  onClick={() =>
    setLanguage(language === "cs" ? "en" : "cs")
  }
  role="button"
  tabIndex={0}
>
  {language === "cs" ? "EN" : "CZ"}
</span>          </div>
        </nav>

        <div className="tramHeroContent">
          <h1>
            {t.heroTitle1}
            <br />
            {t.heroTitle2}
          </h1>

          <p>{t.heroText}</p>
        </div>
      </section>

      <section id="why-nata" className="nataStorySection">
        <div className="nataStoryIntro">
          <p className="sectionLabel">{t.whyTitle}</p>

          <h2>
            {t.whyHeading1}
            <br />
            {t.whyHeading2}
          </h2>

          <p>{t.whyText}</p>
        </div>

        <div className="nataStoryVisual">
          <div className="goldDotCircle" />

          <img
            src={nataTransparent}
            alt="Pastéis de Nata"
            className="nataStoryImage"
          />
        </div>

        <div className="nataStoryCard">
          <div className="storyIcon">☕</div>

          <div>
            <p className="goldLabel">{t.storyTitle}</p>
            <p>{t.storyText}</p>
          </div>
        </div>
      </section>

      <section id="why-us" className="homeWhySection">
        <h2>{t.whyUsHeading}</h2>

        <div className="homeWhyGrid">
          {[
            ["flag", t.authentic, t.authenticText],
            ["flame", t.flexible, t.flexibleText],
            ["check", t.consistent, t.consistentText],
            ["star", t.premium, t.premiumText],
          ].map(([icon, title, text]) => (
            <div className="homeWhyCard" key={title}>
              <div className="homeWhyIconWrap">
                <span
                  className={`homeWhyIcon homeWhyIcon-${icon}`}
                />
              </div>

              <div className="homeWhyCopy">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="siteFooter">
        <div className="footerInner">
          <div className="footerBrand">
            <h3>MAIS DE NATA</h3>
            <p>{t.footerBrand}</p>
            <p className="footerTagline">{t.footerTagline}</p>
          </div>

          <div className="footerLinks">
            <a href="/product-information">
              {t.navProductInfo}
            </a>

            <a href="/wholesale-order">
              {t.navWholesaleOrder}
            </a>

            <a href="/register">
              {t.navContact}
            </a>
          </div>

          <div className="footerBottom">
            <span>© 2026 Mais de Nata</span>
            <a href="/">{t.footerBackToTop}</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default App;