import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { StaticRouter } from "react-router-dom";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null, ws: false },
});
after(() => server.close());

const [
  { default: Layout },
  { default: HomePage },
  { createSiteI18n },
  { getPageSeo, renderSeoHead },
  { sitePages },
  { getContentForPath },
] = await Promise.all([
  server.ssrLoadModule("/src/components/Layout.tsx"),
  server.ssrLoadModule("/src/pages/HomePage.tsx"),
  server.ssrLoadModule("/src/i18n/index.ts"),
  server.ssrLoadModule("/src/seo.ts"),
  server.ssrLoadModule("/src/routing.ts"),
  server.ssrLoadModule("/src/content/documents.ts"),
]);

const productPaths = ["/us-stock-signals/", "/quantitative-stock-screener/", "/unusual-options-activity/"];
const navigationPaths = ["/#tools", "/pricing/", "/docs/", "/blog/", "/about/"];
const navigationLabels = {
  en: ["Tools", "Pricing", "Docs", "Blog", "About"],
  zh: ["工具", "价格", "文档", "博客", "关于"],
};
const names = {
  en: {
    stockSignals: "Daily signals", stockScreener: "Stock screener", unusualOptions: "Options activity",
    pricing: "Pricing", about: "About", terms: "Terms", privacy: "Privacy", docs: "Docs", blog: "Blog",
  },
  zh: {
    stockSignals: "每日信号", stockScreener: "量化选股器", unusualOptions: "期权异动",
    pricing: "价格", about: "关于", terms: "服务条款", privacy: "隐私政策", docs: "Docs", blog: "Blog",
  },
};

for (const language of ["en", "zh"]) {
  test(`${language}: every page stays within SEO length limits and all emitted JSON-LD parses`, () => {
    for (const path of [...sitePages.map(({ path }) => path), "/not-a-public-page/"]) {
      const seo = getPageSeo(path, language);
      assert.ok(seo.title.length > 0 && seo.title.length <= 60, `${path} title: ${seo.title.length}`);
      assert.ok(seo.description.length > 0 && seo.description.length <= 155, `${path} description: ${seo.description.length}`);
      const scripts = [...renderSeoHead(seo).matchAll(/type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      if (seo.pageKey === "notFound") {
        assert.equal(scripts.length, 0);
      } else {
        assert.equal(scripts.length, 1, path);
        assert.deepEqual(JSON.parse(scripts[0][1]), seo.structuredData, path);
      }
    }
  });

  test(`${language}: every page has short breadcrumbs, with English-only Docs and Blog hierarchies`, () => {
    for (const page of sitePages.filter(({ key }) => key !== "home")) {
      const seo = getPageSeo(page.path, language);
      const englishOnly = ["docs", "doc", "blog", "blogPost"].includes(page.key);
      const isDocument = page.key === "doc" || page.key === "blogPost";
      const document = getContentForPath(page.path);
      const name = isDocument ? document.shortTitle : names[language][page.key];
      const expectedNames = [
        englishOnly || language === "en" ? "Home" : "首页",
        ...(isDocument ? [page.key === "doc" ? "Docs" : "Blog"] : []),
        name,
      ];
      assert.equal(typeof name, "string", `Missing short name: ${page.path}`);
      assert.equal(seo.language, englishOnly ? "en" : language);
      const breadcrumb = seo.structuredData["@graph"].find((item) => item["@type"] === "BreadcrumbList");
      assert.deepEqual(breadcrumb.itemListElement.map((item) => item.name), expectedNames, page.path);
      assert.deepEqual(breadcrumb.itemListElement.map((item) => item.item), [
        "https://predixlab.com/",
        ...(isDocument ? [`https://predixlab.com/${page.key === "doc" ? "docs" : "blog"}/`] : []),
        `https://predixlab.com${page.path}`,
      ], page.path);
      assert.deepEqual(breadcrumb.itemListElement.map((item) => item.position), expectedNames.map((_, index) => index + 1));
      assert.equal(breadcrumb.itemListElement.at(-1).item, `https://predixlab.com${page.path}`);
      assert.notEqual(breadcrumb.itemListElement.at(-1).name, seo.title);
      assert.doesNotThrow(() => JSON.parse(JSON.stringify(seo.structuredData)));
    }
  });

  test(`${language}: social metadata identifies the account and describes each illustration`, () => {
    const alts = new Set();
    for (const path of ["/", ...productPaths]) {
      const seo = getPageSeo(path, language);
      const head = renderSeoHead(seo);
      assert.match(head, /name="twitter:site" content="@predixlab"/);
      assert.notEqual(seo.imageAlt, seo.title);
      assert.match(seo.imageAlt, language === "en" ? /illustration|diagram/ : /示意图/);
      assert.ok(head.includes(`property="og:image:alt" content="${seo.imageAlt}"`));
      assert.ok(head.includes(`name="twitter:image:alt" content="${seo.imageAlt}"`));
      alts.add(seo.imageAlt);
    }
    assert.equal(alts.size, 4, "Each sharing image needs its own description");
    assert.equal(getPageSeo("/pricing/", language).imageAlt, getPageSeo("/", language).imageAlt);
  });

  test(`${language}: desktop and mobile keep the flat Docs navigation and homepage cards keep descriptive product links`, () => {
    const html = renderToString(
      createElement(I18nextProvider, { i18n: createSiteI18n(language) },
        createElement(StaticRouter, { location: "/" },
          createElement(Layout, null, createElement(HomePage)))),
    );
    const navs = [...html.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/g)];
    assert.equal(navs.length, 2);
    for (const [, nav] of navs) {
      const links = [...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter(([, attrs]) => /class="nav-link"/.test(attrs));
      assert.deepEqual(links.map(([, attrs]) => attrs.match(/href="([^"]+)"/)[1]), navigationPaths);
      assert.deepEqual(links.map(([, , content]) => content.replace(/<[^>]+>/g, "")), navigationLabels[language]);
      productPaths.forEach((path) => {
        assert.ok(!nav.includes(`href="${path}"`), "Products belong in cards and the footer, not the header");
      });
      assert.ok(nav.includes('href="https://github.com/predixlab"'));
      assert.ok(nav.includes('href="https://dashboard.predixlab.com/'));
    }
    const cards = [...html.matchAll(/<article class="product-story">([\s\S]*?)<\/article>/g)];
    const labels = language === "en" ? [
      "Explore daily stock signals", "Explore the stock screener", "Explore unusual options activity",
    ] : ["了解每日信号", "了解选股器", "了解期权异动"];
    assert.equal(cards.length, 3);
    cards.forEach(([, card], index) => {
      assert.ok(card.includes(`href="${productPaths[index]}"`));
      assert.ok(card.includes(`>${labels[index]}<svg`), "The descriptive label must be visible");
      assert.doesNotMatch(card, /aria-label=/);
    });
    assert.match(html, /class="research-scene is-paused"/, "Keep the scene in the server-rendered HTML");
    assert.doesNotMatch(html, /Switched to client rendering|did not finish this Suspense boundary/);
  });
}
