import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { StaticRouter } from "react-router-dom";
import App from "@/App";
import { createSiteI18n } from "@/i18n";
import { getPageSeo, renderSeoHead } from "@/seo";

export { getPageSeo, publicPaths, renderSeoHead, renderSitemap } from "@/seo";

export const render = (pathname: string) => {
  const seo = getPageSeo(pathname);
  const i18n = createSiteI18n(seo.language);
  if (!i18n.isInitialized || i18n.resolvedLanguage !== seo.language) {
    throw new Error(`Synchronous translations are unavailable for ${pathname}`);
  }

  const appHtml = renderToString(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <StaticRouter location={pathname}>
          <App />
        </StaticRouter>
      </I18nextProvider>
    </StrictMode>,
  );

  return {
    appHtml,
    headHtml: renderSeoHead(seo),
    htmlLanguage: seo.htmlLanguage,
    statusCode: seo.canonicalUrl ? 200 : 404,
    seo,
  };
};
