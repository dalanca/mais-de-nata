import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import "./WholesaleOrder.css"
import { useLanguage } from "../LanguageContext"
import { supabase } from "../lib/supabaseClient"
import SiteHeader from "../components/SiteHeader"

function WholesaleOrder() {
  const { t, language } = useLanguage()

  const [searchParams] = useSearchParams()
  const selectedCompanyId =
    searchParams.get("company")

  const [boxes, setBoxes] = useState(5)

  const [wholesaleCustomerId, setWholesaleCustomerId] =
    useState("")

  const [companyName, setCompanyName] =
    useState("")
  const [companyId, setCompanyId] =
    useState("")
  const [vatNumber, setVatNumber] =
    useState("")

  const [contactName, setContactName] =
    useState("")
  const [email, setEmail] =
    useState("")
  const [phone, setPhone] =
    useState("")

  const [deliveryAddress, setDeliveryAddress] =
    useState("")

  const [isLoadingCustomer, setIsLoadingCustomer] =
    useState(true)

  const [loadError, setLoadError] =
    useState("")

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState("")

  const pricePerBox = boxes >= 10 ? 75 : 79
  const orderTotal = boxes * pricePerBox
  const totalNatas = boxes * 72

  useEffect(() => {
    let isMounted = true

    async function loadWholesaleCustomer() {
      try {
        setLoadError("")

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error(
            "Your session has expired. Please sign in again.",
          )
        }

        let customerQuery = supabase
          .from("wholesale_customers")
          .select(
            `
              id,
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
          .eq("auth_user_id", user.id)
          .eq("account_status", "active")

        /*
         * When the user arrived from My Account,
         * load the company selected there.
         *
         * If the page was opened directly without
         * a company parameter, load the first active
         * company linked to the user.
         */
        if (selectedCompanyId) {
          customerQuery = customerQuery.eq(
            "id",
            selectedCompanyId,
          )
        }

        const {
          data: customer,
          error: customerError,
        } = await customerQuery
          .order("created_at", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle()

        if (customerError) {
          throw customerError
        }

        if (!customer) {
          throw new Error(
            "The selected wholesale company could not be found.",
          )
        }

        if (!isMounted) {
          return
        }

        /*
         * This is the internal company UUID used
         * by orders.wholesale_customer_id.
         */
        setWholesaleCustomerId(customer.id)

        /*
         * Company details are loaded from the
         * verified wholesale customer record.
         */
        setCompanyName(
          customer.company_name ?? "",
        )

        setCompanyId(
          customer.company_id ?? "",
        )

        setVatNumber(
          customer.vat_number ?? "",
        )

        /*
         * These provide useful defaults but remain
         * editable for each individual order.
         */
        setContactName(
          customer.contact_name ?? "",
        )

        setEmail(
          customer.email ??
            user.email ??
            "",
        )

        setPhone(
          customer.phone ?? "",
        )

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
          [
            deliveryStreet,
            deliveryHouseNumber,
          ]
            .filter(Boolean)
            .join(" "),
          [
            deliveryPostcode,
            deliveryCity,
          ]
            .filter(Boolean)
            .join(" "),
          deliveryCountry,
        ]
          .filter(Boolean)
          .join("\n")

        setDeliveryAddress(
          formattedDeliveryAddress,
        )
      } catch (error) {
        console.error(
          "Unable to load wholesale customer:",
          error,
        )

        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load your wholesale account.",
          )
        }
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
  }, [selectedCompanyId])

  async function handleSubmit(
    event: {
      preventDefault: () => void
      currentTarget: HTMLFormElement
    },
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (!wholesaleCustomerId) {
      setSubmitError(
        "Unable to identify the selected company.",
      )
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const notes =
      formData
        .get("notes")
        ?.toString()
        .trim() ?? ""

    setSubmitError("")
    setIsSubmitting(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error(
          "Your session has expired. Please sign in again.",
        )
      }

      const response = await fetch(
        "/api/create-wholesale-order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
body: JSON.stringify({
  wholesaleCustomerId,

  boxes,
  contactName,
  email,
  phone,
  deliveryAddress,
  notes,

  documentLanguage: language,
}),
        },
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            "Unable to submit your wholesale order.",
        )
      }

      window.location.href =
        `/wholesale-order-success?order=${encodeURIComponent(
          result.orderNumber,
        )}`
    } catch (error) {
      console.error(
        "Wholesale order submission failed:",
        error,
      )

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your wholesale order.",
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
            <p>
              Loading your wholesale account...
            </p>
          </section>
        </main>
      </>
    )
  }

  if (loadError) {
    return (
      <>
        <SiteHeader />

        <main>
          <section className="wholesalePage">
            <p className="wholesaleOrderError">
              {loadError}
            </p>
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
                <span>
                  {t.wholesaleBadgeUnits}
                </span>

                <span>
                  {t.wholesaleBadgeMinimum}
                </span>

                <span>
                  {t.wholesaleBadgeFrozen}
                </span>
              </div>
            </div>

            <div className="wholesaleHeroSteps">
              <h2>
                {t.wholesaleProcessTitle}
              </h2>

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
                        <span className="wholesaleCardIcon">
                          €
                        </span>

                        {t.wholesalePricingTitle}
                      </h4>

                      <p>
                        <strong>
                          {t.wholesalePricingTier1}
                        </strong>

                        <span>
                          €79 {t.pricePerUnit}
                        </span>
                      </p>

                      <p>
                        <strong>
                          {t.wholesalePricingTier2}
                        </strong>

                        <span>
                          €75 {t.pricePerUnit}
                        </span>
                      </p>

                      <p>
                        <strong>
                          {t.wholesalePricingTier3}
                        </strong>

                        <span>
                          {t.wholesaleCustomQuote}
                        </span>
                      </p>
                    </div>

                    <div className="wholesaleCard">
                      <h4 className="wholesaleCardTitle">
                        <span className="wholesaleCardIcon">
                          →
                        </span>

                        {t.wholesaleDeliveryTitle}
                      </h4>

                      <p>
                        {t.wholesaleDeliveryMessage1}
                      </p>

                      <p>
                        {t.wholesaleDeliveryMessage2}
                      </p>
                    </div>
                  </div>

                  <div className="wholesaleCard wholesaleSummaryCard">
                    <div className="wholesaleSummaryHeader">
                      <h4>
                        {t.orderSummaryTitle}
                      </h4>

                      <select
                        id="wholesaleBoxes"
                        name="wholesaleBoxes"
                        value={boxes}
                        onChange={(event) =>
                          setBoxes(
                            Number(
                              event.target.value,
                            ),
                          )
                        }
                      >
                        {Array.from(
                          { length: 20 },
                          (_, index) =>
                            index + 5,
                        ).map((quantity) => (
                          <option
                            key={quantity}
                            value={quantity}
                          >
                            {quantity} {t.boxUnit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="wholesaleSummaryRows">
                      <p>
                        <span>
                          {t.orderSummaryBoxes}
                        </span>

                        <strong>
                          {boxes}
                        </strong>
                      </p>

                      <p>
                        <span>
                          {t.orderSummaryNatas}
                        </span>

                        <strong>
                          {totalNatas}
                        </strong>
                      </p>

                      <p>
                        <span>
                          {t.orderSummaryPricePerBox}
                        </span>

                        <strong>
                          €{pricePerBox}
                        </strong>
                      </p>
                    </div>

                    <div className="wholesaleTotal">
                      <span>
                        {t.orderSummaryTotal}
                      </span>

                      <strong>
                        €{orderTotal}
                      </strong>
                    </div>

                    <div className="wholesaleNotes">
                      <p>
                        {t.orderSummaryNote1}
                      </p>

                      <p>
                        {t.orderSummaryNote2}
                      </p>

                      <p>
                        {t.orderSummaryNote3}
                      </p>

                      <p>
                        {t.orderSummaryNote4}
                      </p>
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
                    <h3>
                      {t.wholesaleDetailsTitle}
                    </h3>

                    <p>
                      {t.wholesaleDetailsMessage}
                    </p>
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
                    onChange={(event) =>
                      setContactName(
                        event.target.value,
                      )
                    }
                    required
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder={t.emailAddress}
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    required
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder={t.phoneNumber}
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
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