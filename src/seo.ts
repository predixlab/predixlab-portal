import { config } from "@/config";
import { planTerms, pricingContent } from "@/content/company";
import {
  productContent,
  productDashboardPaths,
  type ProductId,
} from "@/content/products";
import { faqContent, type Question } from "@/content/site";
import { blogContent, renderBlogRss } from "@/content/blog";
import { blogPosts, docs, getContentForPath } from "@/content/documents";
import { sourceRepositories } from "@/content/markdown";
import { stockSignalsUpdated } from "@/content/stockSignals";
import { DEFAULT_SITE_LANGUAGE } from "@/i18n/language";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import {
  getPageForPath,
  publicPath,
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
  openGraphType: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  openGraphLocale: string;
  structuredData: JsonLdObject | null;
  rssUrl?: string;
  lastmod?: string;
}

export const SEO_ATTRIBUTE = "data-predixlab-seo";

const translations = { zh, en };
const languageTags = { zh: "zh-CN", en: "en" } as const;
const openGraphLocales = { zh: "zh_CN", en: "en_US" };
const organizationId = `${config.siteUrl}/#organization`;
const websiteId = `${config.siteUrl}/#website`;
const defaultSocialImage = {
  path: "/social/predixlab-research.png",
  alt: {
    en: "PredixLab overview with a price-chart illustration and a highlighted daily signal",
    zh: "PredixLab 产品概览，配有价格图表示意图和高亮的每日信号",
  },
};
const socialImages: Partial<Record<PageKey, typeof defaultSocialImage>> = {
  stockSignals: {
    path: "/social/predixlab-us-stock-signals.png",
    alt: {
      en: "PredixLab daily stock signals illustration with a price chart and a highlighted historical signal marker",
      zh: "PredixLab 每日美股信号示意图，展示价格图表和高亮的历史信号标记",
    },
  },
  stockScreener: {
    path: "/social/quantitative-stock-screener.png",
    alt: {
      en: "PredixLab stock screener illustration with momentum, trend structure, and risk criteria",
      zh: "PredixLab 选股器示意图，展示动量、趋势结构和风险筛选条件",
    },
  },
  unusualOptions: {
    path: "/social/unusual-options-activity.png",
    alt: {
      en: "PredixLab options activity diagram linking an underlying stock to call and put contracts, expirations, strikes, and changes in open interest",
      zh: "PredixLab 期权异动示意图，将标的股票与看涨、看跌合约相连，列出到期日、行权价和持仓量变化",
    },
  },
};
const softwareProducts: Partial<Record<PageKey, ProductId>> = {
  stockSignals: "signals",
  stockScreener: "screener",
  unusualOptions: "options",
};

export const publicPaths = sitePages.map((page) => page.path);
export const renderRss = () => renderBlogRss(blogPosts);

const absoluteUrl = (path: string) => new URL(path, config.siteUrl).href;
const pageUrl = (path: string) => absoluteUrl(publicPath(path));

const createFaqSchema = (
  questions: Question[],
  seo: PageSeo,
  canonicalUrl: string,
): JsonLdObject => ({
  "@type": "FAQPage",
  "@id": `${canonicalUrl}#faq`,
  inLanguage: seo.htmlLanguage,
  isPartOf: { "@id": `${canonicalUrl}#webpage` },
  mainEntity: questions.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
});

const createSoftwareSchema = (
  key: PageKey,
  seo: PageSeo,
  canonicalUrl: string,
): JsonLdObject => {
  const copy = pricingContent[seo.language];
  const productId = softwareProducts[key];
  const product = productId ? productContent[seo.language][productId] : undefined;
  const isEnglishSignals = key === "stockSignals" && seo.language === "en";
  const pricingUrl = pageUrl("/pricing/");
  const offers: JsonLdObject[] = [
    {
      "@type": "Offer",
      name: copy.free,
      description: isEnglishSignals
        ? "Signals and signal performance with a 10-day delay."
        : product?.access ?? copy.freeFeatures.join("; "),
      price: 0,
      priceCurrency: "USD",
      url: pricingUrl,
    },
  ];

  // Both billing terms must be visible on any page with paid offers.
  if (key === "pricing" || isEnglishSignals) {
    for (const [label, price, billingDuration] of [
      [copy.monthly, planTerms.monthlyPrice, "P1M"],
      [copy.annual, planTerms.annualPrice, "P1Y"],
    ] as const) {
      offers.push({
        "@type": "Offer",
        name: `${copy.premium} - ${label}`,
        description: isEnglishSignals
          ? "The latest published signals, options activity and signal performance. Same models as Free."
          : `${copy.premiumDescription} ${copy.footnote}`,
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
  const isEnglishSignals = key === "stockSignals" && seo.language === "en";
  const webpageId = `${canonicalUrl}#webpage`;
  const document = getContentForPath(new URL(canonicalUrl).pathname);
  const webpage: JsonLdObject = {
    "@type": key === "blog" || key === "docs" ? "CollectionPage" : "WebPage",
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
  if (isEnglishSignals) {
    webpage.dateModified = stockSignalsUpdated;
    webpage.mentions = [
      {
        "@type": "Thing",
        name: "AlphaRank",
        description: "PredixLab model that ranks S&P 500 and Nasdaq-100 stocks against each other each trading day.",
      },
      {
        "@type": "Thing",
        name: "Pivot",
        description: "PredixLab LightGBM model that maps each stock's daily score to a model state and flags sparse turning-point and breakout events.",
      },
    ];
  }
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
      inLanguage: "en",
      publisher: { "@id": organizationId },
    },
    webpage,
  ];

  if (key !== "home") {
    const names = {
      stockSignals: isEnglishSignals ? productContent.en.signals.name : copy.nav.stockSignals,
      stockScreener: copy.footer.stockScreener,
      unusualOptions: copy.footer.unusualOptions,
      pricing: copy.nav.pricing,
      about: copy.nav.about,
      terms: copy.nav.terms,
      privacy: copy.nav.privacy,
      docs: copy.nav.docs,
      doc: document?.shortTitle ?? seo.title,
      blog: copy.nav.blog,
      blogPost: document?.breadcrumbTitle ?? document?.shortTitle ?? seo.title,
    };
    const items = [{ name: copy.nav.home, item: pageUrl("/") }];
    if (key === "blogPost") items.push({ name: copy.nav.blog, item: pageUrl("/blog/") });
    if (key === "doc") items.push({ name: copy.nav.docs, item: pageUrl("/docs/") });
    items.push({ name: names[key], item: canonicalUrl });
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

  if (document && (key === "doc" || document.kind === "post")) {
    const isPost = document.kind === "post";
    const isArticle = isPost && document.schemaType === "Article";
    const articleId = `${canonicalUrl}#article`;
    webpage.mainEntity = { "@id": articleId };
    graph.push({
      "@type": isPost ? document.schemaType : "TechArticle",
      "@id": articleId,
      headline: isArticle ? document.h1 : document.title,
      ...(isArticle ? {
        name: document.title,
        url: canonicalUrl,
        isPartOf: { "@id": websiteId },
      } : {}),
      ...(isPost && document.about.length ? {
        about: document.about.map((name) => ({ "@type": "Thing", name })),
      } : {}),
      description: document.description,
      datePublished: document.date,
      dateModified: document.updated,
      author: { "@id": organizationId },
      publisher: { "@id": organizationId },
      mainEntityOfPage: canonicalUrl,
      inLanguage: "en",
      image: {
        "@type": "ImageObject",
        url: seo.imageUrl,
        width: 1200,
        height: 630,
      },
    });
  }

  if (key === "blog") {
    const listId = `${canonicalUrl}#posts`;
    webpage.mainEntity = { "@id": listId };
    graph.push({
      "@type": "ItemList",
      "@id": listId,
      itemListElement: blogPosts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: pageUrl(post.path),
      })),
    });
  }

  if (key === "docs") {
    const listId = `${canonicalUrl}#docs`;
    webpage.mainEntity = { "@id": listId };
    graph.push({
      "@type": "ItemList",
      "@id": listId,
      itemListElement: docs.map((doc, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: doc.title,
        description: doc.summary,
        url: pageUrl(doc.path),
      })),
    });
  }

  if (document?.kind === "doc" && document.slug === "self-hosting") {
    const repositories = sourceRepositories(document).map((repository) => ({
      "@type": "SoftwareSourceCode",
      "@id": `${repository.codeRepository}#source`,
      ...repository,
      license: "https://www.apache.org/licenses/LICENSE-2.0",
      author: { "@id": organizationId },
      publisher: { "@id": organizationId },
      isPartOf: { "@id": webpageId },
    }));
    webpage.hasPart = repositories.map((repository) => ({ "@id": repository["@id"] }));
    graph.push(...repositories);
  }

  if (key === "home" || key === "pricing" || softwareProducts[key]) {
    const software = createSoftwareSchema(key, seo, canonicalUrl);
    webpage.about = { "@id": software["@id"] };
    graph.push(software);
  }

  const productId = softwareProducts[key];
  const questions = key === "home"
    ? faqContent[seo.language]
    : productId ? productContent[seo.language][productId].questions
      : document?.kind === "post" ? document.questions : [];
  if (questions.length > 0) {
    const faq = createFaqSchema(questions, seo, canonicalUrl);
    const existingParts = webpage.hasPart;
    webpage.hasPart = [
      ...(existingParts ? Array.isArray(existingParts) ? existingParts : [existingParts] : []),
      { "@id": faq["@id"] },
    ];
    graph.push(faq);
  }

  return { "@context": "https://schema.org", "@graph": graph };
};

export const getPageSeo = (pathname: string, language: SiteLanguage = DEFAULT_SITE_LANGUAGE): PageSeo => {
  const page = getPageForPath(pathname);
  const key = page?.key ?? "notFound";
  const document = getContentForPath(pathname);
  let meta: { title: string; description: string };
  if (key === "docs" || key === "doc" || key === "blogPost") {
    if (!document) throw new Error(`Missing content for public route ${pathname}`);
    meta = document;
    language = "en";
  } else if (key === "blog") {
    meta = blogContent;
    language = "en";
  } else {
    meta = translations[language].meta[key];
  }
  const image = (page && socialImages[page.key]) || defaultSocialImage;
  const post = document?.kind === "post" ? document : undefined;
  const article = key === "doc" || key === "blogPost" ? document : undefined;
  const seo: PageSeo = {
    pageKey: key,
    language,
    htmlLanguage: languageTags[language],
    title: meta.title,
    description: meta.description,
    robots: page ? "index, follow, max-image-preview:large" : "noindex, follow",
    canonicalUrl: page ? pageUrl(page.path) : null,
    alternates: [],
    imageUrl: absoluteUrl(post?.image ?? image.path),
    imageAlt: post?.imageAlt ?? (article ? meta.title : image.alt[language]),
    openGraphType: article ? "article" : "website",
    ...(article ? { publishedTime: article.date, modifiedTime: article.updated } : {}),
    openGraphLocale: openGraphLocales[language],
    structuredData: null,
    ...(page && "lastmod" in page && page.lastmod ? { lastmod: page.lastmod } : {}),
    ...(key === "blog" || key === "blogPost" ? { rssUrl: absoluteUrl("/blog/rss.xml") } : {}),
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
    meta("twitter:site", "@predixlab"),
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
  if (seo.openGraphType === "article") {
    if (!seo.publishedTime || !seo.modifiedTime) throw new Error("Article metadata requires publication and modification dates.");
    head.push(
      meta("article:published_time", seo.publishedTime, true),
      meta("article:modified_time", seo.modifiedTime, true),
    );
  }
  for (const alternate of seo.alternates) {
    head.push(
      `<link ${SEO_ATTRIBUTE} rel="alternate" hreflang="${alternate.hreflang}" href="${escapeHtml(alternate.href)}" />`,
    );
  }
  if (seo.rssUrl) {
    head.push(
      `<link ${SEO_ATTRIBUTE} rel="alternate" type="application/rss+xml" title="PredixLab Blog RSS" href="${escapeHtml(seo.rssUrl)}" />`,
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
  const urls = sitePages.map((page) => {
    const pathname = page.path;
    const seo = getPageSeo(pathname);
    if (!seo.canonicalUrl) throw new Error(`Non-public sitemap route: ${pathname}`);
    const alternates = seo.alternates.map(
      ({ hreflang, href }) =>
        `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />`,
    );
    return [
      "  <url>",
      `    <loc>${escapeHtml(seo.canonicalUrl)}</loc>`,
      ...("lastmod" in page && page.lastmod ? [`    <lastmod>${page.lastmod}</lastmod>`] : []),
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
