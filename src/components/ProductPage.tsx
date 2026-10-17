import { ArrowRight, ArrowUpRight, Check, ArrowDown } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import CallToAction from "@/components/CallToAction";
import ProductIllustration from "@/components/ProductIllustration";
import Questions from "@/components/Questions";
import { optionsResearchContent, productContent, productDashboardPaths, productPaths, type ProductId } from "@/content/products";
import { dashboardLink } from "@/config";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const productIds: ProductId[] = ["signals", "screener", "options"];

const ProductPage = ({ product }: { product: ProductId }) => {
  const { language, isEnglish, localPath } = useSiteLanguage();
  const copy = productContent[language][product];
  const optionsCopy = optionsResearchContent[language];
  return (
    <>
      <section className={`product-hero product-hero-${product}`}>
        <div className="site-container">
          <nav className="breadcrumb" aria-label={isEnglish ? "Breadcrumb" : "面包屑导航"}><Link to={localPath("/")}>{isEnglish ? "Home" : "首页"}</Link><span aria-hidden="true">/</span><span>{copy.name}</span></nav>
          <div className="product-hero-grid">
            <div className="product-intro">
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="page-description">{copy.description}</p>
              <div className="button-row">
                <a href={dashboardLink(productDashboardPaths[product], product)} className="button button-primary">{copy.action}<ArrowUpRight aria-hidden="true" /></a>
                <a href="#tool-details" className="button button-quiet">{isEnglish ? "Look inside" : "了解工具"}<ArrowDown aria-hidden="true" /></a>
              </div>
              <p className="access-note">{copy.access}</p>
            </div>
            <div className="product-hero-visual"><ProductIllustration product={product} /></div>
          </div>
          <ul className="product-hero-tags">{copy.tags.map((tag) => <li key={tag}><Check aria-hidden="true" />{tag}</li>)}</ul>
        </div>
      </section>
      <section className="section" id="tool-details">
        <div className="site-container">
          <div className="section-heading"><p className="eyebrow">{isEnglish ? "01 / FEATURES" : "01 / 功能介绍"}</p><h2>{copy.detailTitle}</h2></div>
          <div className="feature-columns">{copy.details.map((item, index) => <article key={item.title}><span className="feature-index">0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        </div>
      </section>
      <section className="section workflow-section">
        <div className="site-container workflow-layout">
          <div className="section-heading"><p className="eyebrow">{isEnglish ? "02 / HOW TO USE IT" : "02 / 使用步骤"}</p><h2>{copy.workflowTitle}</h2></div>
          <ol className="workflow-steps">{copy.workflow.map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
        </div>
      </section>
      {product === "options" && (
        <section className="section">
          <div className="site-container">
            <div className="section-heading">
              <p className="eyebrow">{optionsCopy.eyebrow}</p>
              <h2>{optionsCopy.title}</h2>
              <p>{optionsCopy.description}</p>
            </div>
            <div className="related-products">
              {optionsCopy.links.map((item) => (
                <a key={item.path} href={dashboardLink(item.path, "options-research")}>
                  <span>{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="section">
        <div className="site-container boundaries-layout">
          <div className="section-heading"><p className="eyebrow">{isEnglish ? "03 / KEEP IN MIND" : "03 / 使用前请注意"}</p><h2>{copy.boundaryTitle}</h2></div>
          <ul className="boundary-list">{copy.boundaries.map((item) => <li key={item}><span aria-hidden="true">↗</span>{item}</li>)}</ul>
        </div>
      </section>
      <section className="section faq-section">
        <div className="site-container faq-layout"><div className="section-heading"><p className="eyebrow">FAQ</p><h2>{isEnglish ? "Common questions." : "常见问题"}</h2></div><Questions items={copy.questions} /></div>
      </section>
      <section className="section related-section">
        <div className="site-container">
          <div className="section-heading"><p className="eyebrow">{isEnglish ? "RELATED TOOLS" : "其他功能"}</p><h2>{isEnglish ? "Add another perspective." : "搭配其他功能一起看。"}</h2></div>
          <div className="related-products">
            {productIds.filter((id) => id !== product).map((id) => <Link key={id} to={localPath(productPaths[id])}><span>{productContent[language][id].eyebrow}</span><h3>{productContent[language][id].name}</h3><p>{productContent[language][id].shortDescription}</p><ArrowRight aria-hidden="true" /></Link>)}
          </div>
        </div>
      </section>
      <CallToAction />
    </>
  );
};

export default ProductPage;
