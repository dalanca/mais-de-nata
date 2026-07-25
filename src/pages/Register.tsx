import { useState } from 'react'
import '../App.css'
import './Contact.css'
import { useLanguage } from '../LanguageContext'

function Register() {
  const { t } = useLanguage()

  const [deliverySameAsCompany, setDeliverySameAsCompany] =
    useState(true)

  return (
    <main>
      <section className="contactPage">
        <a href="/" className="pageBack">
          {t.wholesaleRegisterBack}
        </a>

        <div className="contactHero">
          <p className="contactEyebrow">
            {t.wholesaleRegisterEyebrow}
          </p>

          <h1>{t.wholesaleRegisterTitle}</h1>

          <p className="contactHeroText">
            {t.wholesaleRegisterIntro}
          </p>
        </div>

        <div className="wholesaleRegistrationCard">
          <div className="wholesaleRegistrationHeader">
            <h2>{t.wholesaleRegisterFormTitle}</h2>

            <p>{t.wholesaleRegisterFormIntro}</p>
          </div>

          <form
            className="wholesaleRegistrationForm"
            action="https://formspree.io/f/mkoaqype"
            method="POST"
          >
            <input
              type="hidden"
              name="formType"
              value="Wholesale Registration"
            />

            <div className="wholesaleRegistrationGrid">
              {/* LEFT COLUMN */}
              <div className="wholesaleRegistrationColumn">
                <div className="wholesaleRegistrationSection">
                  <h3>
                    {t.wholesaleRegisterCompanySection}
                  </h3>

                  <input
                    name="companyName"
                    type="text"
                    placeholder={
                      t.wholesaleRegisterCompanyName
                    }
                    required
                  />

                  <div className="contactFormTwoColumns">
                    <input
                      name="companyId"
                      type="text"
                      placeholder={
                        t.wholesaleRegisterCompanyId
                      }
                      required
                    />

                    <input
                      name="vatNumber"
                      type="text"
                      placeholder={t.wholesaleRegisterVat}
                    />
                  </div>
                </div>

                <div className="wholesaleRegistrationSection">
                  <h3>
                    {t.wholesaleRegisterContactSection}
                  </h3>

                  <input
                    name="contactName"
                    type="text"
                    placeholder={
                      t.wholesaleRegisterContactName
                    }
                    required
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder={t.wholesaleRegisterEmail}
                    required
                  />

                  <input
                    name="phone"
                    type="tel"
                    placeholder={t.wholesaleRegisterPhone}
                    required
                  />
                </div>

                <div className="wholesaleRegistrationSection">
                  <h3>
                    {t.wholesaleRegisterBusinessSection}
                  </h3>

                  <textarea
                    name="businessDetails"
                    placeholder={
                      t.wholesaleRegisterBusinessPlaceholder
                    }
                  />

                  <button
                    type="submit"
                    className="wholesaleRegistrationSubmit"
                  >
                    {t.wholesaleRegisterSubmit}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="wholesaleRegistrationColumn">
                <div className="wholesaleRegistrationSection">
                  <h3>
                    {t.wholesaleRegisterCompanyAddress}
                  </h3>

                  <input
                    name="companyStreet"
                    type="text"
                    placeholder={t.wholesaleRegisterStreet}
                    required
                  />

                  <div className="contactFormTwoColumns">
                    <input
                      name="companyHouseNumber"
                      type="text"
                      placeholder={
                        t.wholesaleRegisterHouseNumber
                      }
                      required
                    />

                    <input
                      name="companyPostcode"
                      type="text"
                      placeholder={
                        t.wholesaleRegisterPostcode
                      }
                      required
                    />
                  </div>

                  <div className="contactFormTwoColumns">
                    <input
                      name="companyCity"
                      type="text"
                      placeholder={t.wholesaleRegisterCity}
                      required
                    />

                    <input
                      name="companyCountry"
                      type="text"
                      placeholder={
                        t.wholesaleRegisterCountry
                      }
                      defaultValue={
                        t.wholesaleRegisterCountryDefault
                      }
                      required
                    />
                  </div>
                </div>

                <div className="wholesaleRegistrationSection">
                  <h3>
                    {t.wholesaleRegisterDeliverySection}
                  </h3>

                  <label className="contactCheckbox">
                    <input
                      type="checkbox"
                      name="deliverySameAsCompany"
                      checked={deliverySameAsCompany}
                      onChange={(event) =>
                        setDeliverySameAsCompany(
                          event.target.checked,
                        )
                      }
                    />

                    <span>
                      {t.wholesaleRegisterDeliverySame}
                    </span>
                  </label>

                  {!deliverySameAsCompany && (
                    <div className="contactConditionalFields">
                      <input
                        name="deliveryStreet"
                        type="text"
                        placeholder={
                          t.wholesaleRegisterStreet
                        }
                        required
                      />

                      <div className="contactFormTwoColumns">
                        <input
                          name="deliveryHouseNumber"
                          type="text"
                          placeholder={
                            t.wholesaleRegisterHouseNumber
                          }
                          required
                        />

                        <input
                          name="deliveryPostcode"
                          type="text"
                          placeholder={
                            t.wholesaleRegisterPostcode
                          }
                          required
                        />
                      </div>

                      <div className="contactFormTwoColumns">
                        <input
                          name="deliveryCity"
                          type="text"
                          placeholder={
                            t.wholesaleRegisterCity
                          }
                          required
                        />

                        <input
                          name="deliveryCountry"
                          type="text"
                          placeholder={
                            t.wholesaleRegisterCountry
                          }
                          defaultValue={
                            t.wholesaleRegisterCountryDefault
                          }
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="wholesaleRegistrationSection wholesaleHowItWorks">
                  <h3>
                    {t.wholesaleRegisterHowItWorks}
                  </h3>

                  <div className="wholesaleMiniStep">
                    <span>1</span>
                    <p>{t.wholesaleRegisterStep1}</p>
                  </div>

                  <div className="wholesaleMiniStep">
                    <span>2</span>
                    <p>{t.wholesaleRegisterStep2}</p>
                  </div>

                  <div className="wholesaleMiniStep">
                    <span>3</span>
                    <p>{t.wholesaleRegisterStep3}</p>
                  </div>

                  <div className="wholesaleMiniStep">
                    <span>4</span>
                    <p>{t.wholesaleRegisterStep4}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="wholesaleRegistrationApproval">
              <strong>
                {t.wholesaleRegisterApprovalTitle}
              </strong>

              <p>
                {t.wholesaleRegisterApprovalText}
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Register