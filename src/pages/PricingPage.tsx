import { useState } from "react";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import Questions from "@/components/Questions";
import { planTerms, pricingContent } from "@/content/company";
import { dashboardLink } from "@/config";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const PricingPage = () => {
  const { language } = useSiteLanguage();
  const copy = pricingContent[language];
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <section className="page-hero">
        <div className="site-container page-intro centered-intro">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title[0]}<br />{copy.title[1]}</h1>
          <p>{copy.description}</p>
        </div>
      </section>
      <section className="pricing-section" aria-label={language === "en" ? "Plans and prices" : "方案与价格"}>
        <div className="site-container">
          <fieldset className="billing-switch">
            <legend className="sr-only">{copy.billingLabel}</legend>
            <div className="billing-switch-inner">
              <label>
                <input className="sr-only" type="radio" name="billing" value="monthly" checked={!annual} onChange={() => setAnnual(false)} />
                <span>{copy.monthly}</span>
              </label>
              <label>
                <input className="sr-only" type="radio" name="billing" value="annual" checked={annual} onChange={() => setAnnual(true)} />
                <span>{copy.annual}<small className="billing-saving">{copy.saving}</small></span>
              </label>
            </div>
          </fieldset>
          <div className="plan-grid">
            <article className="plan">
              <div className="plan-label"><h2>{copy.free}</h2></div>
              <p className="plan-description">{copy.freeDescription}</p>
              <div className="plan-price"><strong>$0</strong><span>{copy.freePeriod}</span></div>
              <p className="plan-billing-note">{copy.freeBilling}</p>
              <a href={dashboardLink("/", "pricing-free")} className="button button-secondary">
                {copy.freeAction}<ArrowUpRight aria-hidden="true" />
              </a>
              <p className="plan-trial">{copy.freeNote}</p>
              <ul className="plan-features">
                {copy.freeFeatures.map((feature) => <li key={feature}><Check aria-hidden="true" /><span>{feature}</span></li>)}
              </ul>
            </article>
            <article className="plan plan-premium">
              <div className="plan-label"><h2>{copy.premium}</h2><span className="plan-badge">{copy.premiumBadge}</span></div>
              <p className="plan-description">{copy.premiumDescription}</p>
              <div aria-live="polite" aria-atomic="true">
                <div className="plan-price"><strong>${annual ? planTerms.annualPrice / 12 : planTerms.monthlyPrice}</strong><span>{copy.monthUnit}</span></div>
                <p className="plan-billing-note">{annual ? copy.annualBilling : copy.monthlyBilling}</p>
              </div>
              <a href={dashboardLink("/profile", annual ? "pricing-annual" : "pricing-monthly")} className="button button-primary">
                {copy.premiumAction}<ArrowUpRight aria-hidden="true" />
              </a>
              <p className="plan-trial">{copy.premiumNote}</p>
              <ul className="plan-features">
                {copy.premiumFeatures.map((feature) => <li key={feature}><Check aria-hidden="true" /><span>{feature}</span></li>)}
              </ul>
            </article>
          </div>
          <p className="pricing-footnote">{copy.footnote}</p>
        </div>
      </section>
      <section className="section comparison-section">
        <div className="site-container">
          <div className="section-heading">
            <p className="eyebrow">{copy.compareEyebrow}</p>
            <h2>{copy.compareTitle}</h2>
            <p>{copy.compareDescription}</p>
          </div>
          <table className="comparison-table">
            <caption className="sr-only">{copy.compareTitle}</caption>
            <thead><tr><th scope="col">{copy.featureColumn}</th><th scope="col">{copy.free}</th><th scope="col">{copy.premium}</th></tr></thead>
            <tbody>
              {copy.rows.map((row, index) => <tr key={row}><th scope="row">{row}</th><td>{index < 3 ? copy.included : copy.delayed}</td><td>{index < 3 ? copy.included : copy.latest}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <div className="site-container pricing-faq">
          <div className="section-heading"><p className="eyebrow">FAQ</p><h2>{copy.faqTitle}</h2></div>
          <Questions items={copy.questions} />
        </div>
      </section>
    </>
  );
};

export default PricingPage;
