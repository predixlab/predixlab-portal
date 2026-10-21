import { ArrowDown, ArrowUpRight, CircleHalf, Crosshair, Waveform } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import CallToAction from "@/components/CallToAction";
import ProductIllustration from "@/components/ProductIllustration";
import Questions from "@/components/Questions";
import ResearchScene from "@/components/ResearchScene";
import { productContent, productPaths, type ProductId } from "@/content/products";
import { faqContent, homeContent } from "@/content/site";
import { dashboardLink } from "@/config";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const products: ProductId[] = ["signals", "screener", "options"];
const methodIcons = [CircleHalf, Crosshair, Waveform];

const HomePage = () => {
  const { language, localPath } = useSiteLanguage();
  const copy = homeContent[language];
  const [descriptionBefore, descriptionAfter] = copy.description.split(copy.descriptionLink);

  return (
    <>
      <section className="home-hero">
        <div className="site-container">
          <div className="hero-intro">
            <p className="eyebrow hero-eyebrow"><span className="label-mark" aria-hidden="true" />{copy.eyebrow}</p>
            <h1>{copy.title[0]}<br /><span>{copy.title[1]}</span></h1>
            <p className="hero-description">{descriptionBefore}<Link to="/docs/how-it-works/">{copy.descriptionLink}</Link>{descriptionAfter}</p>
            <div className="button-row hero-buttons">
              <a href={dashboardLink("/", "hero")} className="button button-primary">{copy.primary}<ArrowUpRight aria-hidden="true" /></a>
              <a href="#tools" className="button button-quiet">{copy.secondary}<ArrowDown aria-hidden="true" /></a>
            </div>
            <p className="hero-note">{copy.note}</p>
          </div>
          <ResearchScene />
          <div className="coverage-strip" aria-label={language === "en" ? "Markets and features" : "市场与功能"}>
            {copy.coverage.map((label) => <span key={label}><span aria-hidden="true">+</span>{label}</span>)}
          </div>
        </div>
      </section>

      <section className="section tools-section" id="tools">
        <div className="site-container">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">{copy.toolsEyebrow}</p><h2>{copy.toolsTitle[0]}<br /><span>{copy.toolsTitle[1]}</span></h2></div>
            <p>{copy.toolsDescription}</p>
          </div>
          <div className="product-stories">
            {products.map((product, index) => {
              const item = productContent[language][product];
              return (
                <article className="product-story" key={product}>
                  <div className="product-story-copy">
                    <span className="story-number">0{index + 1}</span>
                    <h3>{item.name}</h3>
                    <p>{item.shortDescription}</p>
                    <ul className="tag-list">{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                    <Link to={localPath(productPaths[product])} className="text-link">{item.linkLabel}<ArrowUpRight aria-hidden="true" /></Link>
                  </div>
                  <div className="product-story-visual">
                    <ProductIllustration product={product} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section method-section">
        <div className="site-container method-layout">
          <div className="method-intro">
            <p className="eyebrow">{copy.methodEyebrow}</p>
            <h2>{copy.methodTitle[0]}<br /><span>{copy.methodTitle[1]}</span></h2>
            <p>{copy.methodDescription}</p>
            <Link to={localPath("/about/")} className="text-link">{copy.methodLink}<ArrowUpRight aria-hidden="true" /></Link>
            <div className="method-stamp" aria-hidden="true"><span>{copy.methodStamp[0]}<br />{copy.methodStamp[1]}<br />{copy.methodStamp[2]}</span><Crosshair /></div>
          </div>
          <ol className="method-steps">
            {copy.methodSteps.map((step, index) => {
              const Icon = methodIcons[index];
              return <li key={step.title}><span className="method-icon"><Icon aria-hidden="true" /></span><div><span className="step-overline">0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></div></li>;
            })}
          </ol>
        </div>
      </section>

      <section className="section faq-section">
        <div className="site-container faq-layout">
          <div className="section-heading"><p className="eyebrow">{copy.faqEyebrow}</p><h2>{copy.faqTitle}</h2><p>{copy.faqDescription}</p></div>
          <Questions items={faqContent[language]} />
        </div>
      </section>
      <CallToAction />
    </>
  );
};

export default HomePage;
