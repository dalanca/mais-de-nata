import { useEffect, useState } from "react"
import "./WholesaleOrder.css"
import { useLanguage } from "../LanguageContext"
import { supabase } from "../lib/supabaseClient"
import SiteHeader from "../components/SiteHeader"

function WholesaleOrder() {
  const { t } = useLanguage()
  const [boxes, setBoxes] = useState(5)
  const [companyName, setCompanyName] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [isLoadingCustomer, setIsLoadingCustomer] =   useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const pricePerBox = boxes >= 10 ? 75 : 79
  const orderTotal = boxes * pricePerBox
  const totalNatas = boxes * 72

useEffect(() => {
  let isMounted = true

  async function loadWholesaleCustomer() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return
      }

      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("wholesale_customers")
.select(
  `
    company_name,
    company_id,
    vat_number,
    contact_name,
    email,
    phone,
    company_street,
    company_house_number,
    company_postcode,
    company_city,
    company_country,
    delivery_same_as_company,
    delivery_street,
    delivery_house_number,
    delivery_postcode,
    delivery_city,
    delivery_country
  `,
)
        .eq("id", user.id)
        .single()

      if (customerError) {
        throw customerError
      }

      if (!isMounted) {
        return
      }

      setCompanyName(customer.company_name ?? "")
      setCompanyId(customer.company_id ?? "")
      setVatNumber(customer.vat_number ?? "")
      setContactName(customer.contact_name ?? "")
      setEmail(customer.email ?? user.email ?? "")
      setPhone(customer.phone ?? "")
const deliveryStreet =
  customer.delivery_same_as_company
    ? customer.company_street
    : customer.delivery_street

const deliveryHouseNumber =
  customer.delivery_same_as_company
    ? customer.company_house_number
    : customer.delivery_house_number

const deliveryPostcode =
  customer.delivery_same_as_company
    ? customer.company_postcode
    : customer.delivery_postcode

const deliveryCity =
  customer.delivery_same_as_company
    ? customer.company_city
    : customer.delivery_city

const deliveryCountry =
  customer.delivery_same_as_company
    ? customer.company_country
    : customer.delivery_country

const formattedDeliveryAddress = [
  [deliveryStreet, deliveryHouseNumber]
    .filter(Boolean)
    .join(" "),
  [deliveryPostcode, deliveryCity]
    .filter(Boolean)
    .join(" "),
  deliveryCountry,
]
  .filter(Boolean)
  .join("\n")

setDeliveryAddress(formattedDeliveryAddress)
    } catch (error) {
      console.error(
        "Unable to load wholesale customer:",
        error,
      )
    } finally {
      if (isMounted) {
        setIsLoadingCustomer(false)
      }
    }
  }

  loadWholesaleCustomer()

  return () => {
    isMounted = false
  }
}, [])
async function handleSubmit(
  event: {
    preventDefault: () => void
    currentTarget: HTMLFormElement
  },
) {
          event.preventDefault()
     
     const form = event.currentTarget
     const formData = new FormData(form)

     const notes =
     formData.get('notes')?.toString().trim() ?? '' 
  if (isSubmitting) {
    return
  }

  setSubmitError('')
  setIsSubmitting(true)

  try {
    
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error(
        'Your session has expired. Please sign in again.',
      )
    }
    const response = await fetch(
      '/api/create-wholesale-order',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          boxes,
          contactName,
          email,
          phone,
          deliveryAddress,
          notes,
        }),
      },
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ??
          'Unable to submit your wholesale order.',
      )
    }

window.location.href =
  `/wholesale-order-success?order=${encodeURIComponent(
    result.orderNumber,
  )}`
  } catch (error) {
    console.error(
      'Wholesale order submission failed:',
      error,
    )

    setSubmitError(
      error instanceof Error
        ? error.message
        : 'Unable to submit your wholesale order.',
    )
  } finally {
    setIsSubmitting(false)
  }
}
if (isLoadingCustomer) {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="wholesalePage">
          <p>Loading your wholesale account...</p>
        </section>
      </main>
    </>
  )
}
return (
  <>
    <SiteHeader />

    <main>
      <section className="wholesalePage">
        <div className="wholesaleHero">

  <div className="wholesaleHeroLeft">

  <h1>
      {t.wholesaleHeroTitle}
 </h1>

 <p>
  {t.wholesaleHeroText}
</p>

<div className="quickFacts horizontalFacts">
  <span>{t.wholesaleBadgeUnits}</span>
  <span>{t.wholesaleBadgeMinimum}</span>
  <span>{t.wholesaleBadgeFrozen}</span>
</div>

  </div>

  <div className="wholesaleHeroSteps">
  <h2>{t.wholesaleProcessTitle}</h2>

  <div className="wholesaleHeroStep">
    <span>1</span>
    {t.wholesaleStep1}
  </div>

  <div className="wholesaleHeroStep">
    <span>2</span>
    {t.wholesaleStep2}
  </div>

  <div className="wholesaleHeroStep">
    <span>3</span>
    {t.wholesaleStep3}
  </div>

  <div className="wholesaleHeroStep">
    <span>4</span>
    {t.wholesaleStep4}
  </div>
</div>
</div>
<div className="wholesaleFormBox">
  <form
    onSubmit={handleSubmit}
    className="wholesaleForm"
  >
    <div className="wholesaleCheckout">
      <div className="wholesaleLeft">
        <div className="wholesaleInfoGrid">
          <div className="wholesaleCard">
            <h4 className="wholesaleCardTitle">
              <span className="wholesaleCardIcon">€</span>
              {t.wholesalePricingTitle}
            </h4>

            <p>
              <strong>{t.wholesalePricingTier1}</strong>
              <span>€79 {t.pricePerUnit}</span>
            </p>

            <p>
              <strong>{t.wholesalePricingTier2}</strong>
              <span>€75 {t.pricePerUnit}</span>
            </p>

            <p>
              <strong>{t.wholesalePricingTier3}</strong>
              <span>{t.wholesaleCustomQuote}</span>
            </p>
          </div>

          <div className="wholesaleCard">
            <h4 className="wholesaleCardTitle">
              <span className="wholesaleCardIcon">→</span>
              {t.wholesaleDeliveryTitle}
            </h4>

                <p>{t.wholesaleDeliveryMessage1}</p>

                <p>{t.wholesaleDeliveryMessage2}</p>
          </div>
        </div>
        <div className="wholesaleCard wholesaleSummaryCard">
          <div className="wholesaleSummaryHeader">
            <h4>{t.orderSummaryTitle}</h4>

            <select
              id="wholesaleBoxes"
              name="wholesaleBoxes"
              value={boxes}
              onChange={(e) =>
                setBoxes(Number(e.target.value))
              }
            >
              {Array.from(
                { length: 20 },
                (_, i) => i + 5,
              ).map((qty) => (
                <option key={qty} value={qty}>
                  {qty} {t.boxUnit}
                </option>
              ))}
            </select>
          </div>

          <div className="wholesaleSummaryRows">
            <p>
              <span>{t.orderSummaryBoxes}</span>
              <strong>{boxes}</strong>
            </p>

            <p>
              <span>{t.orderSummaryNatas}</span>
              <strong>{totalNatas}</strong>
            </p>

            <p>
              <span>{t.orderSummaryPricePerBox}</span>
              <strong>€{pricePerBox}</strong>
            </p>
          </div>

          <div className="wholesaleTotal">
            <span>{t.orderSummaryTotal}</span>
            <strong>€{orderTotal}</strong>
          </div>

          <div className="wholesaleNotes">
            <p>{t.orderSummaryNote1}</p>
            <p>{t.orderSummaryNote2}</p>
            <p>{t.orderSummaryNote3}</p>
            <p>{t.orderSummaryNote4}</p>
          </div>

          {submitError && (
            <p className="wholesaleOrderError">
              {submitError}
            </p>
          )}

          <button
            className="wholesaleSubmitButton"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : t.submitOrderButton}
          </button>
        </div>
      </div>

<div className="wholesaleDetails">
  <div className="wholesaleDetailsHeader">
    <h3>{t.wholesaleDetailsTitle}</h3>
    <p>{t.wholesaleDetailsMessage}</p>
  </div>

  <input
          type="text"
          name="companyName"
          placeholder={t.companyName}
          value={companyName}
          readOnly
          required
        />

        <input
          type="text"
          name="companyId"
          placeholder={t.companyId}
          value={companyId}
          readOnly
          required
        />

        <input
          type="text"
          name="vatNumber"
          placeholder={t.vatNumber}
          value={vatNumber}
          readOnly
        />
        <input
          type="text"
          name="contactName"
          placeholder={t.contactName}
          value={contactName}
          onChange={(e) =>
            setContactName(e.target.value)
          }
          required
        />

        <input
          type="email"
          name="email"
          placeholder={t.emailAddress}
          value={email}
          readOnly
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder={t.phoneNumber}
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <textarea
          name="notes"
          placeholder={t.notesPlaceholder}
        />
      </div>
    </div>
  </form>
</div>

      </section>
    </main>
  </>
)
}

export default WholesaleOrder