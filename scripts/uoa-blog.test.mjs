import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  { blogPosts, blogUpdated },
  { loadBlogPosts },
  { getPageSeo, renderSitemap },
  { sitePages, getPageForPath },
  { render },
  { default: App },
  { createSiteI18n },
] = await Promise.all([
  server.ssrLoadModule("/src/content/documents.ts"),
  server.ssrLoadModule("/src/content/markdown.ts"),
  server.ssrLoadModule("/src/seo.ts"),
  server.ssrLoadModule("/src/routing.ts"),
  server.ssrLoadModule("/src/entry-server.tsx"),
  server.ssrLoadModule("/src/App.tsx"),
  server.ssrLoadModule("/src/i18n/index.ts"),
]);

const path = "/blog/what-is-unusual-options-activity/";
const canonical = `https://predixlab.com${path}`;
const post = blogPosts.find((post) => post.path === path);
const source = await readFile(new URL("../src/content/blog/what-is-unusual-options-activity.md", import.meta.url), "utf8");
const page = render(path);
const graph = page.seo.structuredData["@graph"];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const textContent = (html) => html.replace(/<[^>]+>/g, "")
  .replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(hex ? parseInt(hex, 16) : Number(decimal)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();
const localizedHtml = (path, language) => renderToStaticMarkup(createElement(
  I18nextProvider, { i18n: createSiteI18n(language) },
  createElement(StaticRouter, { location: path }, createElement(App)),
));
const answer = "Unusual options activity is a spike in volume or open interest on a contract relative to its recent baseline — a statistical flag, not proof of bullish or bearish intent. Research finds that some options-flow measures can predict short-horizon stock returns, especially around information events, but results vary by filter, fade after costs and crowding, and a call or put alone does not reveal purpose. PredixLab lists daily activity for S&P 500 and Nasdaq-100 names; Free data has a 10-day delay.";
const questions = [
  "What is unusual options activity?",
  "Does unusual option activity work / predict stock moves?",
  "How do I find unusual options activity?",
  "How do I identify whether activity is opening or closing?",
  "Is unusual options activity free on PredixLab?",
  "Can unusual activity tell me if traders are bullish or bearish?",
  "Is this live options flow?",
  "Which stocks are covered?",
];

test("UOA explainer pins approved copy independently of untracked Growth drafts", () => {
  assert.equal(hash(post.body), "9c0d290520734167b91969316ff056bc30815ea696add8de84b5508fe6321fa9");
  assert.equal(post.shortTitle, "Unusual options activity");
  assert.equal(post.category, "Options basics");
  assert.equal(post.date, "2026-10-22");
  assert.equal(post.updated, "2026-10-22");
  assert.equal(post.lang, "en");
  assert.equal(post.translationKey, "what-is-unusual-options-activity");
  assert.doesNotMatch(source, /<!--|real[- ]?time/i);
  assert.equal([...post.html.matchAll(/<table>/g)].length, 2);
  assert.ok(page.appHtml.includes(post.html));
  assert.ok(page.appHtml.includes(renderToStaticMarkup(answer)));
  for (const line of [
    "Activity scores describe how unusual a change is — not a trade recommendation.",
    "For information and independent analysis only — not investment advice. Data can be delayed or wrong, models can fail, and past performance doesn't predict future results.",
  ]) assert.equal(page.appHtml.split(renderToStaticMarkup(line)).length - 1, 1);
  assert.doesNotMatch(post.body, /For informational purposes only\. Not investment advice\./);
  for (const href of [
    "https://www.nber.org/papers/w10925",
    "https://doi.org/10.1287/mnsc.2022.4543",
  ]) assert.ok(page.appHtml.includes(`href="${href}" target="_blank" rel="noopener noreferrer"`));
  for (const label of ["Browse unusual options activity", "How PredixLab scores activity", "Open the unusual options activity tool", "Free vs Premium"]) {
    assert.ok(post.html.includes(`>${label}</a>`), label);
  }
});

test("UOA explainer has exact metadata, one H1, apex canonical and no language alternates", () => {
  assert.equal(page.statusCode, 200);
  assert.equal(page.seo.title, "What Is Unusual Options Activity? Evidence & Limits");
  assert.equal(page.seo.description, "Unusual options activity is a spike in volume or open interest vs a recent baseline. Research finds predictive power—with limits. See how to read it, free.");
  assert.equal(post.h1, "What is unusual options activity, and does it predict stock moves?");
  assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
  assert.ok(page.appHtml.includes(`>${post.h1}</h1>`));
  assert.equal(page.seo.canonicalUrl, canonical);
  assert.match(page.headHtml, /rel="canonical" href="https:\/\/predixlab.com\/blog\/what-is-unusual-options-activity\/"/);
  assert.match(page.seo.robots, /^index, follow(?:,|$)/);
  assert.deepEqual(page.seo.alternates, []);
  assert.doesNotMatch(page.headHtml, /hreflang/);
  assert.deepEqual(getPageSeo(path, "zh"), getPageSeo(path, "en"));
  assert.equal(getPageForPath(`/zh${path}`), undefined);
  assert.equal(getPageForPath(`/en${path}`), undefined);
});

test("UOA Article and breadcrumb use the approved separate headline, title and short label", () => {
  assert.deepEqual(graph.map((node) => node["@type"]), [
    "Organization", "WebSite", "WebPage", "BreadcrumbList", "Article", "FAQPage",
  ]);
  const article = graph.find((node) => node["@type"] === "Article");
  assert.equal(article["@id"], `${canonical}#article`);
  assert.equal(article.headline, post.h1);
  assert.equal(article.name, post.title);
  assert.equal(article.description, post.description);
  assert.equal(article.url, canonical);
  assert.equal(article.mainEntityOfPage, canonical);
  assert.equal(article.inLanguage, "en");
  assert.equal(article.datePublished, "2026-10-22");
  assert.equal(article.dateModified, "2026-10-22");
  assert.deepEqual(article.author, { "@id": "https://predixlab.com/#organization" });
  assert.deepEqual(article.publisher, article.author);
  assert.deepEqual(article.isPartOf, { "@id": "https://predixlab.com/#website" });
  assert.deepEqual(article.about, [
    { "@type": "Thing", name: "Unusual options activity" },
    { "@type": "Thing", name: "Options trading" },
  ]);
  assert.doesNotMatch(JSON.stringify(graph), /SoftwareApplication|Review|AggregateRating|HowTo/);
  const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");
  assert.deepEqual(breadcrumb.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://predixlab.com/" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://predixlab.com/blog/" },
    { "@type": "ListItem", position: 3, name: "What is unusual options activity", item: canonical },
  ]);
  assert.match(page.appHtml, /<span aria-current="page">What is unusual options activity<\/span>/);
});

test("all eight visible Markdown FAQs exactly match FAQPage, including under Chinese navigation", () => {
  assert.deepEqual(post.questions.map(({ question }) => question), questions);
  const faq = graph.find((node) => node["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, 8);
  assert.deepEqual(faq.mainEntity, post.questions.map(({ question, answer }) => ({
    "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
  })));
  for (const language of ["en", "zh"]) {
    const html = localizedHtml(path, language);
    validateFaqMarkup(html, graph, canonical);
    for (const { question, answer } of post.questions) {
      assert.ok(html.includes(`<strong>${renderToStaticMarkup(question)}</strong>`));
      assert.ok(textContent(html).includes(answer), question);
    }
  }
  for (const change of [
    (faq) => { faq.mainEntity.pop(); },
    (faq) => { faq.mainEntity.push(faq.mainEntity[0]); },
    (faq) => { faq.mainEntity[0].name = "Wrong question"; },
    (faq) => { faq.mainEntity[0].acceptedAnswer.text = "Wrong answer"; },
  ]) {
    const changed = structuredClone(graph);
    change(changed.find((node) => node["@type"] === "FAQPage"));
    assert.throws(() => validateFaqMarkup(page.appHtml, changed, canonical), /FAQ count and text/);
  }
  assert.throws(() => validateFaqMarkup(page.appHtml, graph.filter((node) => node["@type"] !== "FAQPage"), canonical), /Expected one.*FAQPage/);
  assert.throws(() => validateFaqMarkup(page.appHtml.replace(/<h2 id="faq">FAQ<\/h2>[\s\S]*?(?=<h2\b)/, ""), graph, canonical), /must not emit FAQPage/);
});

test("blog FAQ and schema metadata reject malformed input without changing Markdown rendering", () => {
  const withFaq = (faq) => source.replace(post.body, `# ${post.h1}\n\n${faq}`);
  const load = (source) => loadBlogPosts({ "./blog/example.md": source })[0];
  for (const section of [
    "## FAQ",
    "## FAQ\n\nQuestion without bold\nAnswer.",
    "## FAQ\n\n**Question without an answer**",
    "## FAQ\n\n**Question?**\n\nSeparate paragraph.",
    "## FAQ\n\n**Question?**\nA [formatted answer](/pricing/).",
    "## FAQ\n\n**Question?**\nAnswer.\n\n## FAQ\n\n**Other?**\nOther answer.",
  ]) assert.throws(() => load(withFaq(section)), /FAQ/);
  const simple = load(withFaq("## FAQ\n\n**Question?**\nPlain answer.\n\n## Next section\n\nNot an FAQ."));
  assert.deepEqual(simple.questions, [{ question: "Question?", answer: "Plain answer." }]);
  assert.match(simple.html, /<p><strong>Question\?<\/strong>\nPlain answer\.<\/p>/);
  assert.deepEqual(load(withFaq("## No FAQ\n\nOrdinary body.")).questions, []);
  assert.equal(load(source.replace("schemaType: Article\n", "")).schemaType, "BlogPosting");
  assert.throws(() => load(source.replace("schemaType: Article", "schemaType: HowTo")), /schemaType/);
  for (const topics of ["Options | ", "Options | Options"]) {
    assert.throws(() => load(source.replace('about: "Unusual options activity | Options trading"', `about: "${topics}"`)), /about/);
  }
});

test("blog discovery adds the Options basics category and updates post and index sitemap lastmods", () => {
  assert.equal(getPageForPath(path).key, "blogPost");
  assert.equal(blogUpdated, "2026-10-22");
  const sitemap = new XMLParser().parse(renderSitemap()).urlset.url;
  for (const url of [canonical, "https://predixlab.com/blog/"]) {
    assert.equal(sitemap.filter((entry) => entry.loc === url).length, 1);
    assert.equal(sitemap.find((entry) => entry.loc === url).lastmod, "2026-10-22");
  }
  const index = render("/blog/").appHtml;
  assert.match(index, /<h2 id="category-options-basics">Options basics<\/h2>/);
  assert.ok(index.includes(`href="${path}"`));
});

test("UOA explainer pins Growth-approved detection and scoring copy directly after the gates table", () => {
  const openInterest = "Open-interest changes count in either direction, so large drops (closing positions) can qualify too.";
  const scoring = "Candidates receive a **0–100 activity score**. A stock needs at least two qualifying contracts to appear. A stock appears only if its activity score is at least 50 (70 for SPY, QQQ, IWM and DIA). Each day's list shows up to 20 stocks, with up to 6 contracts per stock.";
  assert.ok(source.includes(`| Δ OI notional | worth more than $500,000 |\n\n${openInterest}\n\n${scoring}\n\n`));
  assert.ok(post.html.includes(`<p>${openInterest}</p>`));
  assert.ok(textContent(page.appHtml).includes(scoring.replaceAll("**", "")));
  assert.doesNotMatch(source, /use a higher threshold/);
  assert.match(source, /or one leg of a spread\.\n\n## Does unusual options activity actually predict stock moves\?/);
});

test("all authored internal destinations exist, including the rendered method heading; OI pointers are removed", () => {
  const paths = sitePages.map(({ path }) => path);
  validateInternalLinks(page.appHtml, canonical, paths);
  for (const target of ["/unusual-options-activity/", "/docs/how-it-works/", "/us-stock-signals/", "/pricing/"]) {
    assert.ok(getPageForPath(target), target);
    assert.equal(render(target).statusCode, 200);
  }
  assert.match(render("/docs/how-it-works/").appHtml, /<h2 id="options-activity-method">Options activity method<\/h2>/);
  assert.ok(post.html.includes('href="https://predixlab.com/docs/how-it-works/#options-activity-method"'));
  for (const [, href] of post.html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(href, canonical);
    if (url.hostname.endsWith("predixlab.com")) {
      assert.equal(url.origin, "https://predixlab.com");
      assert.equal(url.search, "");
      assert.ok(url.pathname.endsWith("/"));
      assert.ok(paths.includes(url.pathname));
    }
  }
  assert.equal(getPageForPath("/blog/open-interest-change/"), undefined);
  assert.throws(() => validateInternalLinks('<a href="/blog/open-interest-change/">OI</a>', canonical, paths), /Noncanonical internal link/);
  assert.doesNotMatch(post.html, /href="[^"]*open-interest-change/);
  assert.doesNotMatch(source, /For a fuller walk-through|what a change in open interest means/i);
  assert.doesNotMatch(textContent(page.appHtml), /For a fuller walk-through|what a change in open interest means/i);
});

test("tool, homepage options blurb and signals related tools link to the explainer only in English", () => {
  for (const target of ["/unusual-options-activity/", "/", "/us-stock-signals/"]) {
    const english = localizedHtml(target, "en");
    assert.match(english, /href="\/blog\/what-is-unusual-options-activity\/"[^>]*>What is unusual options activity\?<\/a>/);
    assert.ok(!localizedHtml(target, "zh").includes(`href="${path}"`));
  }
});

test("the four existing post bodies and SEO remain byte-identical to the pre-change baseline", () => {
  for (const [slug, html, seo] of [
    ["backtest-biases", "84be597a4aa325186f2b6a187419e3cb79e8e0eb0c7c511f98fb2a25045bca19", "37f5f7e85f55d0f15e07718b235471b7fe0f9b9df7c2694467c962f00d74570f"],
    ["look-ahead-bias", "9f26384066fa8227b060e849cd763e9c2936c00d76cbd42157a3dfb4076a0fdf", "99ca2135e05a392bb8797a933c0423bde6494a7c9c6ecc18a25f82947cab0897"],
    ["survivorship-bias-backtesting", "2aa12c9126cd3a662d8e4417b801929a9ac5e82ff1a7597987079e7601dd3d7d", "efa480661dee096cf88a33b19e91d6c992ee7441490a674efe6628ebaaad492b"],
    ["walk-forward-validation", "7562a68af6b3ef783aecc5fa536dc6b4abf6a633eff0ae5abb3570ee4795697d", "ab1393bab479d4db94058110ba5a33970fc065415aa85c61b70564ab54d00d61"],
  ]) {
    const existing = blogPosts.find((post) => post.slug === slug);
    assert.equal(hash(existing.html), html, slug);
    assert.equal(hash(JSON.stringify(getPageSeo(existing.path))), seo, slug);
    assert.deepEqual(existing.questions, []);
    assert.equal(existing.schemaType, "BlogPosting");
  }
});

test("existing post pages retain their complete HTML in both navigation languages after adding a category", () => {
  const originals = [...blogPosts];
  const existingPosts = originals.filter((item) => item.path !== path);
  const current = new Map(existingPosts.map((post) => [
    post.path, ["en", "zh"].map((language) => localizedHtml(post.path, language)),
  ]));
  try {
    blogPosts.splice(0, blogPosts.length, ...existingPosts);
    for (const post of existingPosts) {
      assert.deepEqual(["en", "zh"].map((language) => localizedHtml(post.path, language)), current.get(post.path), post.path);
    }
  } finally {
    blogPosts.splice(0, blogPosts.length, ...originals);
  }
});

test("all existing Chinese product, company, legal and docs HTML remains byte-identical", () => {
  for (const [path, expected] of [
    ["/", "c216d9f598a9a149dac043a47349bad6e8051f0d1c9149a3c2221f6231153d94"],
    ["/us-stock-signals/", "e23e9e7d5750351e3c6efb942d944069bce359099c272233d435360c6b985269"],
    ["/quantitative-stock-screener/", "4ac1c88ee6bce3d8f8cdd80bf65fb8fe0cb6365220853f54d084a310c4b7ef3b"],
    ["/unusual-options-activity/", "12497779b8cff97db796faa26d6ae7c14736eb6973b061ea2e53dbd2902d3103"],
    ["/pricing/", "45133eb13144e2976ddd0229557c00945d30274a9d4b59ae2026bf84f4b7e523"],
    ["/about/", "7e27b3fe31bcb58b00d0cb8d8b8910123a84f1403c39250bda9ceb7ad4669d9a"],
    ["/terms/", "dbc194ecefbf829a4a968d04ce0929f53f5b90d024ab51767ada1ba43de25c47"],
    ["/privacy/", "019e29f372debcedcf2d98b02a98f39883cdb20941b5e4988fb218492cad3077"],
    ["/docs/", "104289f5c4d33911bd56a9754fa09babf4e422a589986960dd9d3955416e6fbf"],
    ["/docs/how-it-works/", "f32cc02a95d964b601807bee0731330da4e39ba89c838f1f8f2693704b845c42"],
    ["/docs/limitations/", "729e86841830c1c7114de90b987872476613abbb065c0ed64b8dee92839d146a"],
    ["/docs/self-hosting/", "9edc4c7f4fbe9f204061b823c35f8bf06a6fc97626b396920c1400a560068dfe"],
  ]) assert.equal(hash(localizedHtml(path, "zh")), expected, path);
});
