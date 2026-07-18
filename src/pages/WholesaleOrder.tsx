import { useState } from "react"
import "./WholesaleOrder.css"
import { useLanguage } from "../LanguageContext"

function WholesaleOrder() {
  const { t } = useLanguage()
  const [boxes, setBoxes] = useState(5)
  const pricePerBox = boxes >= 10 ? 75 : 79
  const orderTotal = boxes * pricePerBox
  const totalNatas = boxes * 72

  return (
    <main>
      <section className="wholesalePage">
      <a href="/" className="pageBack">
          {t.wholesaleBackHome}
    </a>

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
            action="https://formspree.io/f/mkoaqype"
            method="POST"
            className="wholesaleForm"
          >
            <input type="hidden" name="formType" value="Wholesale Order Request" />
            <input type="hidden" name="unitsPerBox" value="72" />
            <input type="hidden" name="source" value="Wholesale Order Page" />
            <input type="hidden" name="totalBoxes" value={boxes} />
            <input type="hidden" name="totalNatas" value={totalNatas} />
            <input type="hidden" name="pricePerBox" value={pricePerBox} />
            <input type="hidden" name="orderTotal" value={orderTotal} />

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

    <p>
      <strong>{t.wholesaleDeliveryTuesday}</strong>
      <span>{t.wholesaleOrderByMonday}</span>
    </p>

    <p>
      <strong>{t.wholesaleDeliveryFriday}</strong>
      <span>{t.wholesaleOrderByThursday}</span>
    </p>

    <p>
      <strong>{t.wholesaleDeliveryCost}</strong>
      <span>{t.wholesaleDeliveryCharged}</span>
    </p>
  </div>
</div>
                <div className="wholesaleCard wholesaleSummaryCard">
                  <div className="wholesaleSummaryHeader">
                  <h4>{t.orderSummaryTitle}</h4>

                    <select
                      id="wholesaleBoxes"
                      name="wholesaleBoxes"
                      value={boxes}
                      onChange={(e) => setBoxes(Number(e.target.value))}
                    >
                      {Array.from({ length: 46 }, (_, i) => i + 5).map((qty) => (
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

                  <button className="wholesaleSubmitButton" type="submit">
                  {t.submitOrderButton}
                  </button>
                </div>
              </div>

              <div className="wholesaleDetails">
              <input
  type="text"
  name="companyName"
  placeholder={t.companyName}
  required
/>

<input
  type="text"
  name="companyId"
  placeholder={t.companyId}
  required
/>

<input
  type="text"
  name="vatNumber"
  placeholder={t.vatNumber}
/>

<input
  type="text"
  name="contactName"
  placeholder={t.contactName}
  required
/>

<input
  type="email"
  name="email"
  placeholder={t.emailAddress}
  required
/>

<input
  type="tel"
  name="phone"
  placeholder={t.phoneNumber}
/>

<textarea
  name="deliveryAddress"
  placeholder={t.deliveryAddress}
  required
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
  )
}

export default WholesaleOrder