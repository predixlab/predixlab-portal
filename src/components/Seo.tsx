import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { getPageSeo, renderSeoHead, SEO_ATTRIBUTE } from "@/seo";

const Seo = () => {
  const { pathname } = useLocation();
  const { language } = useSiteLanguage();

  useEffect(() => {
    const seo = getPageSeo(pathname, language);
    document.documentElement.lang = seo.htmlLanguage;

    const template = document.createElement("template");
    template.innerHTML = renderSeoHead(seo);
    document.head.querySelectorAll(`[${SEO_ATTRIBUTE}]`).forEach((node) => node.remove());
    document.head.append(template.content);
  }, [pathname, language]);

  return null;
};

export default Seo;
