import '../App.css'
import './ContactPage.css'
import { useLanguage } from '../LanguageContext'
import SiteHeader from '../components/SiteHeader'

function Contact() {
  const { t } = useLanguage()

  return (
    <>
      <SiteHeader />

      <main className="contactSimplePage">
        <section className="contactSimpleHero">
          <p className="contactSimpleEyebrow">
            {t.contactEyebrow}
          </p>

          <h1>{t.contactTitle}</h1>

          <p>{t.contactIntro}</p>
        </section>

        <section className="contactSimpleCard">
          <form
            className="contactSimpleForm"
            action="https://formspree.io/f/mkoaqype"
            method="POST"
          >
            <input
              type="hidden"
              name="formType"
              value="General Contact"
            />

            <label>
              {t.contactName}

              <input
                type="text"
                name="name"
                required
              />
            </label>

            <label>
              {t.contactEmail}

              <input
                type="email"
                name="email"
                required
              />
            </label>

            <label>
              {t.contactPhone}

              <input
                type="tel"
                name="phone"
              />
            </label>

            <label>
              {t.contactSubject}

              <input
                type="text"
                name="subject"
                required
              />
            </label>

            <label>
              {t.contactMessage}

              <textarea
                name="message"
                required
              />
            </label>

            <button type="submit">
              {t.contactSubmit}
            </button>
          </form>
        </section>
      </main>
    </>
  )
}

export default Contact