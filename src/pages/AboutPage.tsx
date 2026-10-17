import { ArrowUpRight } from "@phosphor-icons/react";
import CallToAction from "@/components/CallToAction";
import { aboutContent } from "@/content/company";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const AboutPage = () => {
  const { language } = useSiteLanguage();
  const copy = aboutContent[language];

  return (
    <>
      <section className="page-hero about-intro">
        <div className="site-container">
          <div className="page-intro">
            <p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p>
          </div>
          <div className="about-hero-bottom"><span>{copy.descriptor}</span><span>{copy.motto}</span></div>
        </div>
      </section>
      <section className="section about-purpose">
        <div className="site-container about-editorial">
          <p className="eyebrow">{copy.purposeEyebrow}</p>
          <div className="about-prose"><p>{copy.purposeLead}</p><p>{copy.purposeDescription}</p></div>
        </div>
      </section>
      <section className="section">
        <div className="site-container">
          <div className="section-heading"><p className="eyebrow">{copy.principlesEyebrow}</p><h2>{copy.principlesTitle}</h2></div>
          <ol className="about-principles">
            {copy.principles.map((principle, index) => <li key={principle.title}><span>0{index + 1}</span><h3>{principle.title}</h3><p>{principle.description}</p></li>)}
          </ol>
        </div>
      </section>
      <section className="section workflow-section">
        <div className="site-container">
          <div className="section-heading">
            <p className="eyebrow">{copy.pipelineEyebrow}</p><h2>{copy.pipelineTitle}</h2><p>{copy.pipelineDescription}</p>
          </div>
          <ol className="pipeline">{copy.pipeline.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
        </div>
      </section>
      <section className="section about-contact">
        <div className="site-container about-contact-grid">
          <div><h2>{copy.boundaryTitle}</h2><p>{copy.boundaryDescription}</p></div>
          <div><h2>{copy.contactTitle}</h2><p>{copy.contactDescription}</p><a href="mailto:contact@predixlab.com" className="text-link">contact@predixlab.com<ArrowUpRight aria-hidden="true" /></a></div>
        </div>
      </section>
      <CallToAction />
    </>
  );
};

export default AboutPage;
