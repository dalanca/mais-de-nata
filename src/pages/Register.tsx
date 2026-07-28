import { useState } from 'react'
import '../App.css'
import './Register.css'
import { useLanguage } from '../LanguageContext'
import SiteHeader from '../components/SiteHeader'

function Register() {
  const { t } = useLanguage()

  const [deliverySameAsCompany, setDeliverySameAsCompany] =
    useState(true)
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [vatNumber, setVatNumber] = useState('')

  const [companyStreet, setCompanyStreet] = useState('')
  const [companyHouseNumber, setCompanyHouseNumber] =
    useState('')
  const [companyPostcode, setCompanyPostcode] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyCountry, setCompanyCountry] =
    useState(t.wholesaleRegisterCountryDefault)

  const [isVerifyingCompany, setIsVerifyingCompany] =
    useState(false)

  const [companyVerified, setCompanyVerified] =
    useState(false)

  const [companyVerificationError, setCompanyVerificationError] =
    useState('')
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false)

  const [registrationSuccess, setRegistrationSuccess] =
    useState(false)

  const [registrationError, setRegistrationError] =
    useState('')
  
  async function handleVerifyCompany() {
    const normalizedIco = companyId.replace(/\s/g, '')

  if (!/^\d{8}$/.test(normalizedIco)) {
    setCompanyVerified(false)
    setCompanyVerificationError(
      t.wholesaleRegisterAresInvalidIco,
    )
    return
  }

  setIsVerifyingCompany(true)
  setCompanyVerified(false)
  setCompanyVerificationError('')

  try {
    const response = await fetch(
      `/api/ares-company?ico=${encodeURIComponent(
        normalizedIco,
      )}`,
    )

    const data = await response.json()

    if (!response.ok || !data.success || !data.company) {
      throw new Error(
        data.message || t.wholesaleRegisterAresNotFound,
      )
    }

    setCompanyId(data.company.ico || normalizedIco)
    setCompanyName(data.company.companyName || '')
    setVatNumber(data.company.vatNumber || '')
    setCompanyStreet(data.company.street || '')
    setCompanyHouseNumber(data.company.houseNumber || '')
    setCompanyPostcode(data.company.postcode || '')
    setCompanyCity(data.company.city || '')
    setCompanyCountry(
      data.company.country ||
        t.wholesaleRegisterCountryDefault,
    )

    setCompanyVerified(true)
  } catch (error) {
    console.error('ARES company verification failed:', error)

    setCompanyVerificationError(
      error instanceof Error
        ? error.message
        : t.wholesaleRegisterAresError,
    )
  } finally {
    setIsVerifyingCompany(false)
  }
}
async function handleWholesaleRegistration(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault()

  if (!companyVerified) {
    setRegistrationError(
      t.wholesaleRegisterAresRequired,
    )
    return
  }

  setIsSubmittingRegistration(true)
  setRegistrationSuccess(false)
  setRegistrationError('')

  const form = new FormData(event.currentTarget)

  const payload = {
    companyId,
    contactName: String(form.get('contactName') || ''),
    email: String(form.get('email') || ''),
    phone: String(form.get('phone') || ''),

    deliverySameAsCompany,

    deliveryStreet: deliverySameAsCompany
      ? ''
      : String(form.get('deliveryStreet') || ''),

    deliveryHouseNumber: deliverySameAsCompany
      ? ''
      : String(form.get('deliveryHouseNumber') || ''),

    deliveryPostcode: deliverySameAsCompany
      ? ''
      : String(form.get('deliveryPostcode') || ''),

    deliveryCity: deliverySameAsCompany
      ? ''
      : String(form.get('deliveryCity') || ''),

    deliveryCountry: deliverySameAsCompany
      ? ''
      : String(form.get('deliveryCountry') || ''),

    businessDetails: String(
      form.get('businessDetails') || '',
    ),
  }

  try {
    const response = await fetch('/api/register-wholesale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          t.wholesaleRegisterSubmissionError,
      )
    }

    setRegistrationSuccess(true)
  } catch (error) {
    console.error(
      'Wholesale registration failed:',
      error,
    )

    setRegistrationError(
      error instanceof Error
        ? error.message
        : t.wholesaleRegisterSubmissionError,
    )
  } finally {
    setIsSubmittingRegistration(false)
  }
}
return (
  <>
    <SiteHeader />

    <main>
      <section className="contactPage">

        <div className="contactHero">


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
            onSubmit={handleWholesaleRegistration}
          >
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
                    placeholder={t.wholesaleRegisterCompanyName}
                    value={companyName}
                    onChange={(event) =>
                      setCompanyName(event.target.value)
                    }
                    readOnly={companyVerified}
                    required
                  /> 
<div className="wholesaleCompanyLookup">
  <div className="wholesaleCompanyLookupField">
    <input
      name="companyId"
      type="text"
      placeholder={t.wholesaleRegisterCompanyId}
      value={companyId}
      onChange={(event) => {
        setCompanyId(event.target.value)
        setCompanyVerified(false)
        setCompanyVerificationError('')
      }}
      inputMode="numeric"
      required
    />

    <button
      type="button"
      className="wholesaleVerifyButton"
      onClick={handleVerifyCompany}
      disabled={isVerifyingCompany}
    >
      {isVerifyingCompany
        ? t.wholesaleRegisterAresVerifying
        : t.wholesaleRegisterAresVerify}
    </button>
  </div>

  {companyVerified && (
    <p className="wholesaleVerificationSuccess">
      ✓ {t.wholesaleRegisterAresVerified}
    </p>
  )}

  {companyVerificationError && (
    <p className="wholesaleVerificationError">
      {companyVerificationError}
    </p>
  )}

  <input
    name="vatNumber"
    type="text"
    placeholder={t.wholesaleRegisterVat}
    value={vatNumber}
    onChange={(event) =>
      setVatNumber(event.target.value)
    }
    readOnly={companyVerified}
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
  disabled={
    !companyVerified ||
    isSubmittingRegistration
  }
>
  {isSubmittingRegistration
    ? t.wholesaleRegisterSubmitting
    : t.wholesaleRegisterSubmit}
</button>

{registrationSuccess && (
  <p className="wholesaleRegistrationSuccess">
    {t.wholesaleRegisterSubmissionSuccess}
  </p>
)}

{registrationError && (
  <p className="wholesaleRegistrationError">
    {registrationError}
  </p>
)}
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
                    value={companyStreet}
                    onChange={(event) =>
                    setCompanyStreet(event.target.value)
                  }
                    readOnly={companyVerified}
                    required
                />

              <div className="contactFormTwoColumns">
                <input
                  name="companyHouseNumber"
                  type="text"
                  placeholder={t.wholesaleRegisterHouseNumber}
                  value={companyHouseNumber}
                  onChange={(event) =>
                      setCompanyHouseNumber(event.target.value)
                  }
                    readOnly={companyVerified}
                    required
                  />

                <input
                  name="companyPostcode"
                  type="text"
                  placeholder={t.wholesaleRegisterPostcode}
                  value={companyPostcode}
                  onChange={(event) =>
                    setCompanyPostcode(event.target.value)
                  }
                    readOnly={companyVerified}
                    required
                  />
              </div>

              <div className="contactFormTwoColumns">
                <input
                  name="companyCity"
                  type="text"
                  placeholder={t.wholesaleRegisterCity}
                  value={companyCity}
                  onChange={(event) =>
                  setCompanyCity(event.target.value)
                  }
                    readOnly={companyVerified}
                    required
                  />

                <input
                  name="companyCountry"
                  type="text"
                  placeholder={t.wholesaleRegisterCountry}
                  value={companyCountry}
                  onChange={(event) =>
                    setCompanyCountry(event.target.value)
                  }
                    readOnly={companyVerified}
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
  </>
)
}
export default Register