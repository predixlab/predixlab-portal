import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { StaticRouter } from "react-router-dom";
import { createServer } from "vite";
import { XMLParser } from "fast-xml-parser";
import { validateFaqMarkup, validateInternalLinks } from "./validate-seo.mjs";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const [
  { render },
  { default: App },
  { createSiteI18n },
  { productContent, productDashboardPaths },
  { stockSignalsPageEn, stockSignalsClosingEn, stockSignalsRelatedEn, stockSignalsUpdated },
  { getPageSeo, renderSitemap },
  { sitePages, getPageForPath },
  { planTerms },
  { dashboardLink },
  { default: en },
] = await Promise.all([
  server.ssrLoadModule("/src/entry-server.tsx"),
  server.ssrLoadModule("/src/App.tsx"),
  server.ssrLoadModule("/src/i18n/index.ts"),
  server.ssrLoadModule("/src/content/products.ts"),
  server.ssrLoadModule("/src/content/stockSignals.ts"),
  server.ssrLoadModule("/src/seo.ts"),
  server.ssrLoadModule("/src/routing.ts"),
  server.ssrLoadModule("/src/content/company.ts"),
  server.ssrLoadModule("/src/config.ts"),
  server.ssrLoadModule("/src/i18n/locales/en.json"),
]);

const path = "/us-stock-signals/";
const canonical = `https://predixlab.com${path}`;
const page = render(path);
const main = page.appHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const graph = page.seo.structuredData["@graph"];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const hashJson = (value) => hash(JSON.stringify(value));
const text = (html) => html.replace(/<span class="sr-only">[\s\S]*?<\/span>/g, "").replace(/<[^>]+>/g, "")
  .replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(hex ? parseInt(hex, 16) : Number(decimal)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();
const plainCopy = (value) => value.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

test("English signals preserves the approved Growth product, sections, closing and metadata verbatim", () => {
  // Pin the approved sources without making tests depend on untracked Growth scratch files.
  const fields = [
    "name", "eyebrow", "title", "description", "shortDescription", "linkLabel",
    "action", "secondaryAction", "access", "tags", "imageAlt", "questions",
  ];
  assert.equal(hashJson(Object.fromEntries(fields.map((key) => [key, productContent.en.signals[key]]))),
    "daad76f7a259bfc009c5d477f2fb8163438922f01938842222fbc9b20b765c7e");
  assert.equal(hashJson(stockSignalsPageEn), "1a7e7dd87fd033b36e49dd4bd71e5cdaede4a7d5ad14e06c9f08fa00ca9eea27");
  assert.equal(hashJson(stockSignalsClosingEn), "9fe257ff59f2119f3e8bde8723b4463a865f8f6dc34c22ce1d2ea745b87a8b02");
  assert.equal(page.seo.title, "US Stock Signals for S&P 500 & Nasdaq-100 | PredixLab");
  assert.equal(page.seo.description, "Daily US stock signals for S&P 500 and Nasdaq-100 stocks: AlphaRank rankings and Pivot turning points, with signal history. Free with a 10-day delay.");
  assert.equal(page.seo.canonicalUrl, canonical);
  assert.equal(page.seo.robots, "index, follow, max-image-preview:large");
  assert.match(page.headHtml, /rel="canonical" href="https:\/\/predixlab.com\/us-stock-signals\/"/);
});

test("English signals prerenders every section, direct answer, FAQ, related description and closing", () => {
  assert.equal(page.statusCode, 200);
  assert.equal([...main.matchAll(/<h1\b/g)].length, 1);
  const copy = productContent.en.signals;
  for (const value of [copy.eyebrow, copy.title, copy.description, copy.action, copy.secondaryAction.label, copy.access, ...copy.tags]) {
    assert.ok(main.includes(renderToStaticMarkup(value)), value);
  }
  for (const section of stockSignalsPageEn) {
    const html = main.match(new RegExp(`<section id="${section.id}"[^>]*>([\\s\\S]*?)</section>`))?.[1];
    assert.ok(html, section.id);
    assert.match(html, new RegExp(`<${section.h2 ? "h2" : "h3"} id="${section.id}-heading">`));
    assert.ok(text(html).includes(section.h2 ?? section.h3));
    for (const block of section.blocks) {
      const values = block.kind === "p" ? [block.text]
        : block.kind === "ul" ? block.items
          : block.kind === "ol" ? block.items.map(({ title, text }) => `${title}. ${text}`) : [];
      for (const value of values) assert.ok(text(html).includes(plainCopy(value)), `${section.id}: ${value}`);
    }
  }
  assert.match(main, /<strong>Coverage:<\/strong>/);
  assert.match(main, /<h2>FAQ<\/h2>/);
  assert.match(main, /<h2>Related tools<\/h2>/);
  for (const { description } of stockSignalsRelatedEn) assert.ok(main.includes(renderToStaticMarkup(description)));
  assert.deepEqual(stockSignalsRelatedEn.map(({ description }) => description), [
    "Filter S&P 500 and Nasdaq-100 stocks by volume, trend, momentum and risk, and save your criteria to use again.",
    "Open the flagged contracts to compare expirations, strikes and changes in open interest, not just an activity label.",
  ]);
  for (const value of [
    stockSignalsClosingEn.title, stockSignalsClosingEn.primary,
    stockSignalsClosingEn.secondary.label, stockSignalsClosingEn.note,
  ]) assert.ok(main.includes(renderToStaticMarkup(value)));
  assert.match(main, /role="img" aria-label="Example of PredixLab US stock signals:/);
  assert.ok(main.includes(renderToStaticMarkup(copy.imageAlt)));
  assert.ok(main.includes("EXAMPLE ONLY · NOT MARKET DATA"));
  assert.doesNotMatch(main, /Common questions\.|Add another perspective\.|Look inside/);
});

test("English signals emits two semantic tables with unchanged cells and code-formatted events", () => {
  const tables = [...main.matchAll(/<table>([\s\S]*?)<\/table>/g)].map(([, html]) => html);
  const expected = stockSignalsPageEn.flatMap(({ blocks }) => blocks.filter(({ kind }) => kind === "table"));
  assert.equal(tables.length, 2);
  tables.forEach((html, index) => {
    const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, row]) =>
      [...row.matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(([, cell]) => text(cell)));
    assert.deepEqual(rows, [expected[index].head, ...expected[index].rows]);
    assert.equal([...html.matchAll(/<th scope="col">/g)].length, expected[index].head.length);
    assert.equal([...html.matchAll(/<th scope="row">/g)].length, expected[index].rows.length);
  });
  for (const code of ["BUY_TURN", "SELL_TURN", "TREND_BUY", "BASE_BREAKOUT"]) {
    assert.ok(tables[0].includes(`<code>${code}</code>`));
  }
});

test("all Growth internal links exist and use localized router links; GitHub follows external conventions", () => {
  const expected = [
    "/docs/how-it-works/", "/docs/limitations/", "/docs/self-hosting/",
    "/blog/walk-forward-validation/", "/blog/backtest-biases/",
    "/blog/survivorship-bias-backtesting/", "/blog/look-ahead-bias/",
    "/pricing/", "/quantitative-stock-screener/", "/unusual-options-activity/",
  ];
  for (const target of expected) {
    assert.ok(getPageForPath(target), `Missing route: ${target}`);
    assert.match(main, new RegExp(`href="${target}" data-discover="true"`));
  }
  validateInternalLinks(main, canonical, sitePages.map(({ path }) => path));
  assert.match(main, /href="https:\/\/github.com\/predixlab\/predixlab-signals" target="_blank" rel="noopener noreferrer">predixlab-signals<span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/);
  const dashboard = renderToStaticMarkup(dashboardLink(productDashboardPaths.signals, "signals"));
  assert.equal(main.split(`href="${dashboard}"`).length - 1, 2);
});

test("English signals breadcrumb is separate from the unchanged Daily signals navigation label", () => {
  const breadcrumb = main.match(/<nav class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.equal(text(breadcrumb), "Home/US stock signals");
  assert.match(breadcrumb, /<span aria-current="page">US stock signals<\/span>/);
  assert.equal(en.nav.stockSignals, "Daily signals");
  assert.deepEqual(graph.find((node) => node["@type"] === "BreadcrumbList").itemListElement, [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://predixlab.com/" },
    { "@type": "ListItem", position: 2, name: "US stock signals", item: canonical },
  ]);
});

test("English signals has nine exact visible FAQ answers with a linked method phrase and plain-text JSON-LD", () => {
  const faq = graph.find((node) => node["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, 9);
  validateFaqMarkup(main, graph, canonical);
  const method = [...main.matchAll(/<details class="question">([\s\S]*?)<\/details>/g)]
    .find(([, html]) => html.includes("How are the signals generated?"))[1];
  assert.match(method, /<a href="\/docs\/how-it-works\/" data-discover="true">how the signals are built and tested<\/a>\.<\/p>/);
  assert.equal(faq.mainEntity[2].acceptedAnswer.text, productContent.en.signals.questions[2].answer);
  assert.doesNotMatch(faq.mainEntity[2].acceptedAnswer.text, /<a|\/docs\//);
});

test("English signals software offers match the visible prices and target names, descriptions and billing terms", () => {
  assert.equal(planTerms.monthlyPrice, 20);
  assert.equal(planTerms.annualPrice, 192);
  const software = graph.find((node) => node["@type"] === "SoftwareApplication");
  assert.equal(software.name, "PredixLab US stock signals");
  assert.equal(software.description, productContent.en.signals.shortDescription);
  assert.deepEqual(software.offers, [
    {
      "@type": "Offer", name: "Free",
      description: "Signals and signal performance with a 10-day delay.",
      price: 0, priceCurrency: "USD", url: "https://predixlab.com/pricing/",
    },
    ...[
      ["Monthly", planTerms.monthlyPrice, "P1M"],
      ["Annual", planTerms.annualPrice, "P1Y"],
    ].map(([term, price, billingDuration]) => ({
      "@type": "Offer", name: `Premium - ${term}`,
      description: "The latest published signals, options activity and signal performance. Same models as Free.",
      price, priceCurrency: "USD", url: "https://predixlab.com/pricing/",
      priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "USD", billingDuration },
    })),
  ]);
  assert.ok(text(main).includes(`$${planTerms.monthlyPrice}/month or $${planTerms.annualPrice}/year`));
  for (const path of ["/", "/quantitative-stock-screener/", "/unusual-options-activity/"]) {
    for (const language of ["en", "zh"]) {
      const software = getPageSeo(path, language).structuredData["@graph"].find((node) => node["@type"] === "SoftwareApplication");
      assert.deepEqual(software.offers.map(({ price }) => price), [0], `${language}: ${path}`);
    }
  }
});

test("English signals WebPage links its software, FAQ and image, with target mentions and a shared sitemap date", () => {
  const webpage = graph.find((node) => node["@type"] === "WebPage");
  assert.equal(stockSignalsUpdated, "2026-10-22");
  assert.equal(webpage.dateModified, stockSignalsUpdated);
  assert.deepEqual(webpage.about, { "@id": `${canonical}#software` });
  assert.deepEqual(webpage.hasPart, [{ "@id": `${canonical}#faq` }]);
  assert.deepEqual(webpage.primaryImageOfPage, {
    "@type": "ImageObject", url: "https://predixlab.com/social/predixlab-us-stock-signals.png",
    width: 1200, height: 630,
  });
  assert.deepEqual(webpage.mentions, [
    {
      "@type": "Thing", name: "AlphaRank",
      description: "PredixLab model that ranks S&P 500 and Nasdaq-100 stocks against each other each trading day.",
    },
    {
      "@type": "Thing", name: "Pivot",
      description: "PredixLab LightGBM model that maps each stock's daily score to a model state and flags sparse turning-point and breakout events.",
    },
  ]);
  assert.ok(graph.every((node) => !["Review", "AggregateRating", "HowTo"].includes(node["@type"])));
  const entries = new XMLParser().parse(renderSitemap()).urlset.url;
  const signals = entries.filter(({ loc }) => loc === canonical);
  assert.deepEqual(signals, [{ loc: canonical, lastmod: stockSignalsUpdated }]);
  assert.equal(getPageForPath(path).lastmod, stockSignalsUpdated);
  assert.ok(entries.every(({ loc }) => !/\/zh\/|[?&]lng=/.test(loc)));
});

test("Chinese signals preserves its exact pre-rewrite rendered HTML and JSON-LD, including two FAQs and no paid offer", () => {
  const html = renderToString(createElement(
    I18nextProvider, { i18n: createSiteI18n("zh") },
    createElement(StaticRouter, { location: path }, createElement(App)),
  ));
  const seo = getPageSeo(path, "zh");
  assert.equal(hash(html), "baa386947426b6d905b9dcdb221f4a9a39bd30171d7ba322869da91171a40a04");
  assert.equal(hashJson(seo.structuredData), "1c3b52474b64c92ca9d53ee323f99f4f9b1d93477ebf6f46836c4b0551cd4ab4");
  const graph = seo.structuredData["@graph"];
  assert.equal(graph.find((node) => node["@type"] === "FAQPage").mainEntity.length, 2);
  assert.deepEqual(graph.find((node) => node["@type"] === "SoftwareApplication").offers.map(({ price }) => price), [0]);
  const webpage = graph.find((node) => node["@type"] === "WebPage");
  assert.equal(webpage.dateModified, undefined);
  assert.equal(webpage.mentions, undefined);
  validateFaqMarkup(html, graph, canonical);
  assert.doesNotMatch(html, /class="signals-page"/);
});
