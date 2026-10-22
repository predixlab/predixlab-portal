import { ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import ProductIllustration from "@/components/ProductIllustration";
import ProductPage from "@/components/ProductPage";
import Questions from "@/components/Questions";
import { dashboardLink } from "@/config";
import { pricingContent } from "@/content/company";
import { productContent, productDashboardPaths, productPaths } from "@/content/products";
import { stockSignalsClosingEn, stockSignalsPageEn, stockSignalsRelatedEn } from "@/content/stockSignals";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const InlineCopy = ({ text }: { text: string }) => {
  const { localPath } = useSiteLanguage();
  return text.split(/(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}><InlineCopy text={part.slice(2, -2)} /></strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, path] = link;
      return path.startsWith("/")
        ? <Link key={index} to={localPath(path)}>{label}</Link>
        : <a key={index} href={path} target="_blank" rel="noopener noreferrer">{label}<span className="sr-only">{pricingContent.en.externalLinkNote}</span></a>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
};

const EnglishStockSignalsPage = () => {
  const { localPath } = useSiteLanguage();
  const copy = productContent.en.signals;
  const closing = stockSignalsClosingEn;
  const methodAnchor = "how the signals are built and tested";
  return (
    <div className="signals-page">
      <section className="product-hero product-hero-signals">
        <div className="site-container">
          <nav className="breadcrumb" aria-label="Breadcrumb"><Link to={localPath("/")}>Home</Link><span aria-hidden="true">/</span><span aria-current="page">{copy.name}</span></nav>
          <div className="product-hero-grid">
            <div className="product-intro">
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="page-description signals-direct-answer">{copy.description}</p>
              <div className="button-row">
                <a href={dashboardLink(productDashboardPaths.signals, "signals")} className="button button-primary">{copy.action}<ArrowUpRight aria-hidden="true" /></a>
                {copy.secondaryAction && <Link to={localPath(copy.secondaryAction.path)} className="button button-quiet">{copy.secondaryAction.label}<ArrowRight aria-hidden="true" /></Link>}
              </div>
              <p className="access-note">{copy.access}</p>
              <ul className="product-hero-tags signals-hero-tags">{copy.tags.map((tag) => <li key={tag}><Check aria-hidden="true" />{tag}</li>)}</ul>
            </div>
            <div className="product-hero-visual" role="img" aria-label={copy.imageAlt}><ProductIllustration product="signals" /></div>
          </div>
        </div>
      </section>
      <div className="section">
        <div className="site-container signals-prose markdown-content">
          {stockSignalsPageEn.map(({ id, h2, h3, blocks }) => (
            <section key={id} id={id} aria-labelledby={`${id}-heading`}>
              {h2 ? <h2 id={`${id}-heading`}>{h2}</h2> : <h3 id={`${id}-heading`}>{h3}</h3>}
              {blocks.map((block, index) => {
                switch (block.kind) {
                  case "p":
                    return <p key={index}><InlineCopy text={block.text} /></p>;
                  case "ul":
                    return <ul key={index}>{block.items.map((item) => <li key={item}><InlineCopy text={item} /></li>)}</ul>;
                  case "ol":
                    return <ol key={index}>{block.items.map(({ title, text }) => <li key={title}><strong>{title}.</strong>{" "}<InlineCopy text={text} /></li>)}</ol>;
                  case "table":
                    return (
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard access to the horizontally scrollable table.
                      <div key={index} className="markdown-table" role="region" aria-labelledby={`${id}-heading`} tabIndex={0}>
                        <table>
                          <caption className="sr-only">{h2 ?? h3}</caption>
                          <thead><tr>{block.head.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
                          <tbody>{block.rows.map(([label, ...cells]) => (
                            <tr key={label}>
                              <th scope="row">{block.head[0] === "Event" ? <code>{label}</code> : label}</th>
                              {cells.map((cell, cellIndex) => <td key={cellIndex}><InlineCopy text={cell} /></td>)}
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    );
                }
              })}
            </section>
          ))}
        </div>
      </div>
      <section className="section faq-section">
        <div className="site-container faq-layout">
          <div className="section-heading"><h2>FAQ</h2></div>
          <Questions items={copy.questions} renderAnswer={({ question, answer }) => question === "How are the signals generated?"
            ? <InlineCopy text={answer.replace(methodAnchor, `[${methodAnchor}](/docs/how-it-works/)`)} />
            : answer} />
        </div>
      </section>
      <section className="section related-section">
        <div className="site-container">
          <div className="section-heading"><h2>Related tools</h2></div>
          <div className="related-products">
            {stockSignalsRelatedEn.map(({ product, description }) => <Link key={product} to={localPath(productPaths[product])}><h3>{productContent.en[product].name}</h3><p>{description}</p><ArrowRight aria-hidden="true" /></Link>)}
          </div>
          <p><Link className="text-link" to="/blog/what-is-unusual-options-activity/">What is unusual options activity?</Link></p>
        </div>
      </section>
      <section className="closing-section">
        <div className="site-container closing-inner">
          <div className="closing-orbit" aria-hidden="true">
            <svg viewBox="0 0 260 180" role="presentation"><path d="M4 144L38 126 64 135 91 101 119 112 151 67 180 79 208 42 252 21" /><circle cx="151" cy="67" r="20" /><circle cx="151" cy="67" r="5" /></svg>
          </div>
          <h2>{closing.title}</h2>
          <div className="button-row">
            <a href={dashboardLink(productDashboardPaths.signals, "signals")} className="button button-primary">{closing.primary}<ArrowRight aria-hidden="true" /></a>
            <Link to={localPath(closing.secondary.path)} className="text-link">{closing.secondary.label}<ArrowRight aria-hidden="true" /></Link>
          </div>
          <p className="closing-note">{closing.note}</p>
        </div>
      </section>
    </div>
  );
};

const StockSignalsPage = () => {
  const { isEnglish } = useSiteLanguage();
  return isEnglish ? <EnglishStockSignalsPage /> : <ProductPage product="signals" />;
};

export default StockSignalsPage;
