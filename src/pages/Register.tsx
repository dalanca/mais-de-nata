function Register() {
  return (
<main>
  <section className="registerPage">

    <a href="/" className="pageBack">
    ← Home
    </a>


        <div className="contactHero">
  
        <h1>
            Authentic Portuguese
            <br />
            Pastéis de Nata
        </h1>

                <p className="contactHeroText">
                Offer your customers the same authentic Pastel de Nata experience they enjoyed in Lisbon and throughout Portugal.
                 </p>
         </div>

         <div className="contactGrid">
         <div className="contactSteps">

         <h2>How It Works</h2>

         <div className="stepItem">
         <div className="stepIcon">📋</div>
         <span>Tell us about your business, expected volumes, or any questions you may have</span>
       
</div>
<div className="stepItem">
  <div className="stepIcon">📞</div>
  <span>We contact you personally and discuss your needs</span>
</div>

<div className="stepItem">
  <div className="stepIcon">🥮</div>
    <span>We arrange a tasting or product presentation</span>
</div>

<div className="stepItem">
  <div className="stepIcon">🚚</div>
    <span>We arrange delivery and supply</span>
</div>
 </div>
    <div className="contactFormBox">
      <h2>Contact Mais de Nata</h2>
      <form
        className="contactForm"
        action="https://formspree.io/f/mkoaqype"
        method="POST"
      >
        <input type="hidden" name="formType" value="Partner Enquiry" />

        <input name="name" type="text" placeholder="Your Name" required />
        <input name="company" type="text" placeholder="Company Name" required />
        <input name="email" type="email" placeholder="Email Address" required />

        <textarea
          name="message"
          placeholder="Tell us briefly about your business and what you would like to discuss"
          required
        />

        <button type="submit">Send Enquiry</button>

        <p className="formResponseNote">
        Response within 1 business day.
        </p>
      </form>
    </div>
  </div>
</section>
</main>
  )
}

export default Register