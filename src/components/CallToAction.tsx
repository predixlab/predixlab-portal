import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ctaContent } from "@/content/site";
import { dashboardLink } from "@/config";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const CallToAction = () => {
  const { language, localPath } = useSiteLanguage();
  const copy = ctaContent[language];
  return (
    <section className="closing-section">
      <div className="site-container closing-inner">
        <div className="closing-orbit" aria-hidden="true">
          <svg viewBox="0 0 260 180" role="presentation"><path d="M4 144L38 126 64 135 91 101 119 112 151 67 180 79 208 42 252 21" /><circle cx="151" cy="67" r="20" /><circle cx="151" cy="67" r="5" /></svg>
        </div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title[0]}<br />{copy.title[1]}</h2>
        <p className="closing-description">{copy.description}</p>
        <div className="button-row">
          <a href={dashboardLink("/", "closing")} className="button button-primary">{copy.button}<ArrowRight aria-hidden="true" /></a>
          <Link to={localPath("/pricing/")} className="text-link">{copy.pricing}<ArrowRight aria-hidden="true" /></Link>
        </div>
        <p className="closing-note">{copy.note}</p>
      </div>
    </section>
  );
};

export default CallToAction;
