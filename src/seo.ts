import { config } from "@/config";
import { planTerms, pricingContent } from "@/content/company";
import {
  productContent,
  productDashboardPaths,
  type ProductId,
} from "@/content/products";
import { faqContent } from "@/content/site";
import { DEFAULT_SITE_LANGUAGE } from "@/i18n/language";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import {
  getPageForPath,
  publicPath,
  siteLanguages,
  sitePages,
  type PageKey,
  type SiteLanguage,
} from "@/routing";

type JsonLdValue = string | number | boolean | JsonLdObject | JsonLdValue[];
interface JsonLdObject {
  [key: string]: JsonLdValue;
}

export interface PageSeo {
  pageKey: PageKey | "notFound";
  language: SiteLanguage;
  htmlLanguage: "zh-CN" | "en";
  title: string;
  description: string;
  robots: string;
  canonicalUrl: string | null;
  alternates: { hreflang: string; href: string }[];
  imageUrl: string;
  imageAlt: string;
  openGraphType: "website";
  openGraphLocale: string;
  structuredData: JsonLdObject | null;
}

export const SEO_ATTRIBUTE = "data-predixlab-seo";

const translations = { zh, en };
const languageTags = { zh: "zh-CN", en: "en" } as const;
const openGraphLocales = { zh: "zh_CN", en: "en_US" };
const organizationId = `${config.siteUrl}/#organization`;
const websiteId = `${config.siteUrl}/#website`;
const socialImages: Partial<Record<PageKey, string>> = {
  stockSignals: "/social/predixlab-us-stock-signals.png",
  stockScreener: "/social/quantitative-stock-screener.png",
  unusualOptions: "/social/unusual-options-activity.png",
};
const softwareProducts: Partial<Record<PageKey, ProductId>> = {
  stockSignals: "signals",
  stockScreener: "screener",
  unusualOptions: "options",
};

export const publicPaths = sitePages.map((page) => page.path);

const absoluteUrl = (path: string) => new URL(path, config.siteUrl).href;
const pageUrl = (path: string) => absoluteUrl(publicPath(path));

const createSoftwareSchema = (
  key: PageKey,
  seo: PageSeo,
  canonicalUrl: string,
): JsonLdObject => {
  const copy = pricingContent[seo.language];
  const productId = softwareProducts[key];
  const product = productId ? productContent[seo.language][productId] : undefined;
  const pricingUrl = pageUrl("/pricing/");
  const offers: JsonLdObject[] = [
    {
      "@type": "Offer",
      name: copy.free,
      description: product?.access ?? copy.freeFeatures.join("; "),
      price: 0,
      priceCurrency: "USD",
      url: pricingUrl,
    },
  ];

  // Paid prices are marked up on the pricing page, where both billing terms are visible.
  if (key === "pricing") {
    for (const [label, price, billingDuration] of [
      [copy.monthly, planTerms.monthlyPrice, "P1M"],
      [copy.annual, planTerms.annualPrice, "P1Y"],
    ] as const) {
      offers.push({
        "@type": "Offer",
        name: `${copy.premium} - ${label}`,
        description: `${copy.premiumDescription} ${copy.footnote}`,
        price,
        priceCurrency: "USD",
        url: pricingUrl,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price,
          priceCurrency: "USD",
          billingDuration,
        },
      });
    }
  }

  return {
    "@type": "SoftwareApplication",
    "@id": `${canonicalUrl}#software`,
    name: product ? `PredixLab ${product.name}` : "PredixLab",
    url: new URL(
      productId ? productDashboardPaths[productId] : "/",
      config.dashboardUrl,
    ).href,
    description: product?.shortDescription ?? seo.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: seo.htmlLanguage,
    publisher: { "@id": organizationId },
    offers,
  };
};

const createStructuredData = (key: PageKey, seo: PageSeo): JsonLdObject => {
  const canonicalUrl = seo.canonicalUrl;
  if (!canonicalUrl) throw new Error("Structured data requires a public page URL.");
  const copy = translations[seo.language];
  const webpageId = `${canonicalUrl}#webpage`;
  const webpage: JsonLdObject = {
    "@type": "WebPage",
    "@id": webpageId,
    url: canonicalUrl,
    name: seo.title,
    description: seo.description,
    inLanguage: seo.htmlLanguage,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: seo.imageUrl,
      width: 1200,
      height: 630,
    },
  };
  const graph: JsonLdObject[] = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "PredixLab",
      url: absoluteUrl("/"),
      sameAs: [config.githubUrl, config.xUrl],
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icons/icon-transparent.png"),
        width: 512,
        height: 512,
      },
      email: "contact@predixlab.com",
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "PredixLab",
      url: absoluteUrl("/"),
      inLanguage: siteLanguages.map((language) => languageTags[language]),
      publisher: { "@id": organizationId },
    },
    webpage,
  ];

  if (key !== "home") {
    const items = [{ name: copy.nav.home, item: pageUrl("/") }];
    items.push({ name: seo.title, item: canonicalUrl });
    const breadcrumbId = `${canonicalUrl}#breadcrumb`;
    webpage.breadcrumb = { "@id": breadcrumbId };
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        ...item,
      })),
    });
  }

  if (key === "home" || key === "pricing" || softwareProducts[key]) {
    const software = createSoftwareSchema(key, seo, canonicalUrl);
    webpage.about = { "@id": software["@id"] };
    graph.push(software);
  }

  if (key === "home") {
    const faqId = `${canonicalUrl}#faq`;
    webpage.hasPart = { "@id": faqId };
    graph.push({
      "@type": "FAQPage",
      "@id": faqId,
      inLanguage: seo.htmlLanguage,
      isPartOf: { "@id": webpageId },
      mainEntity: faqContent[seo.language].map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
};

export const getPageSeo = (pathname: string, language: SiteLanguage = DEFAULT_SITE_LANGUAGE): PageSeo => {
  const page = getPageForPath(pathname);
  const key = page?.key ?? "notFound";
  const meta = translations[language].meta[key];
  const seo: PageSeo = {
    pageKey: key,
    language,
    htmlLanguage: languageTags[language],
    title: meta.title,
    description: meta.description,
    robots: page ? "index, follow, max-image-preview:large" : "noindex, follow",
    canonicalUrl: page ? pageUrl(page.path) : null,
    alternates: [],
    imageUrl: absoluteUrl(
      (page && socialImages[page.key]) || "/social/predixlab-research.png",
    ),
    imageAlt: meta.title,
    openGraphType: "website",
    openGraphLocale: openGraphLocales[language],
    structuredData: null,
  };
  if (page) seo.structuredData = createStructuredData(page.key, seo);
  return seo;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderSeoHead = (seo: PageSeo): string => {
  const meta = (name: string, content: string, property = false) =>
    `<meta ${SEO_ATTRIBUTE} ${property ? "property" : "name"}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
  const head = [
    `<title ${SEO_ATTRIBUTE}>${escapeHtml(seo.title)}</title>`,
    meta("description", seo.description),
    meta("robots", seo.robots),
    meta("og:type", seo.openGraphType, true),
    meta("og:site_name", "PredixLab", true),
    meta("og:locale", seo.openGraphLocale, true),
    meta("og:title", seo.title, true),
    meta("og:description", seo.description, true),
    meta("og:image", seo.imageUrl, true),
    meta("og:image:type", "image/png", true),
    meta("og:image:width", "1200", true),
    meta("og:image:height", "630", true),
    meta("og:image:alt", seo.imageAlt, true),
    meta("twitter:card", "summary_large_image"),
    meta("twitter:title", seo.title),
    meta("twitter:description", seo.description),
    meta("twitter:image", seo.imageUrl),
    meta("twitter:image:alt", seo.imageAlt),
  ];

  if (seo.canonicalUrl) {
    head.push(
      `<link ${SEO_ATTRIBUTE} rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`,
      meta("og:url", seo.canonicalUrl, true),
    );
  }
  for (const alternate of seo.alternates) {
    head.push(
      `<link ${SEO_ATTRIBUTE} rel="alternate" hreflang="${alternate.hreflang}" href="${escapeHtml(alternate.href)}" />`,
    );
  }
  if (seo.structuredData) {
    const json = JSON.stringify(seo.structuredData).replace(
      /[<>&\u2028\u2029]/g,
      (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
    head.push(`<script ${SEO_ATTRIBUTE} type="application/ld+json">${json}</script>`);
  }
  return head.join("\n    ");
};

export const renderSitemap = (): string => {
  const urls = publicPaths.map((pathname) => {
    const seo = getPageSeo(pathname);
    if (!seo.canonicalUrl) throw new Error(`Non-public sitemap route: ${pathname}`);
    const alternates = seo.alternates.map(
      ({ hreflang, href }) =>
        `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />`,
    );
    return [
      "  <url>",
      `    <loc>${escapeHtml(seo.canonicalUrl)}</loc>`,
      ...alternates,
      "  </url>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
};
