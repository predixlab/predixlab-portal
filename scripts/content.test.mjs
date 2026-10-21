import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { StaticRouter } from "react-router-dom";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const [
  { loadBlogPosts, parseFrontmatter, parseMarkdownDocument, sourceRepositories },
  { blogPosts, contentPages },
  { groupBlogPosts, relatedBlogPosts, renderBlogRss, blogContent },
  { sitePages },
  { getPageSeo, renderSeoHead, renderSitemap },
  { render },
  { default: App },
  { createSiteI18n },
  { homeContent },
] = await Promise.all([
  server.ssrLoadModule("/src/content/markdown.ts"),
  server.ssrLoadModule("/src/content/documents.ts"),
  server.ssrLoadModule("/src/content/blog.ts"),
  server.ssrLoadModule("/src/routing.ts"),
  server.ssrLoadModule("/src/seo.ts"),
  server.ssrLoadModule("/src/entry-server.tsx"),
  server.ssrLoadModule("/src/App.tsx"),
  server.ssrLoadModule("/src/i18n/index.ts"),
  server.ssrLoadModule("/src/content/site.ts"),
]);

const fixture = `---
title: "An example & its limits"
shortTitle: "Example"
description: "Research <only> & \\"quoted\\" examples"
date: "2026-10-20"
updated: "2026-10-21"
lang: en
category: "Backtesting & validation"
translationKey: example
---

# Example

An example body.

---

*For information only, not investment advice.*

本页内容不构成投资建议。
`;
const loadFixture = (source = fixture) => loadBlogPosts({ "./blog/example.md": source })[0];

test("flat frontmatter preserves string values and rejects malformed or duplicate fields", () => {
  assert.equal(parseFrontmatter(fixture, "example.md").frontmatter.description, 'Research <only> & "quoted" examples');
  assert.equal(parseFrontmatter("---\ntitle: 'It''s quoted'\n---\nBody", "quoted.md").frontmatter.title, "It's quoted");
  for (const source of [
    "# No frontmatter",
    "---\ntitle: One\ntitle: Two\n---\n",
    "---\ntitle:\n---\n",
    "---\ntitle: [One, Two]\n---\n",
    "---\ntitle: true\n---\n",
    "---\ntitle: 123\n---\n",
    '---\ntitle: "unterminated\n---\n',
    "---\ntitle: 'unterminated\n---\n",
    "---\n  nested: no\n---\n",
  ]) assert.throws(() => parseFrontmatter(source, "invalid.md"), /invalid.md:/);
});

for (const field of ["title", "shortTitle", "description", "date", "updated", "lang", "category", "translationKey"]) {
  test(`blog frontmatter rejects a missing or empty ${field}`, () => {
    assert.throws(() => loadFixture(fixture.replace(new RegExp(`^${field}:.*\\n`, "m"), "")), new RegExp(`missing required field ${field}`));
    assert.throws(() => loadFixture(fixture.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: ""`)), /nonempty string/);
  });
}

test("blog frontmatter validates calendar dates, order, language, translation keys and slugs", () => {
  for (const value of ["2026-02-30", "2026-13-01", "21-10-2026", "2026-10-21T00:00:00Z"]) {
    for (const field of ["date", "updated"]) {
      assert.throws(() => loadFixture(fixture.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: "${value}"`)), new RegExp(`invalid ${field}`));
    }
  }
  assert.throws(() => loadFixture(fixture.replace('updated: "2026-10-21"', 'updated: "2026-10-19"')), /updated precedes date/);
  assert.throws(() => loadFixture(fixture.replace("lang: en", "lang: zh")), /lang must be en/);
  assert.throws(() => loadFixture(fixture.replace("translationKey: example", "translationKey: Bad Key")), /invalid translationKey/);
  assert.throws(() => loadBlogPosts({ "./Bad_Slug.md": fixture }), /invalid slug/);
  assert.throws(() => loadBlogPosts({ "./one/example.md": fixture, "./two/example.md": fixture }), /duplicate slug example/);
  assert.equal(loadFixture().path, "/blog/example/");
});

test("optional sharing images require a local PNG and descriptive alternative text together", () => {
  const withFields = (fields) => fixture.replace("lang: en", `lang: en\n${fields}`);
  for (const fields of [
    "image: /social/custom.png",
    "imageAlt: A custom illustration",
    "image: https://elsewhere.test/image.png\nimageAlt: Illustration",
    "image: /social/../custom.png\nimageAlt: Illustration",
    "image: /social/custom.svg\nimageAlt: Illustration",
  ]) assert.throws(() => loadFixture(withFields(fields)), /image/);
  const post = loadFixture(withFields("image: /social/custom.png\nimageAlt: A custom illustration"));
  assert.equal(post.image, "/social/custom.png");
  assert.equal(post.imageAlt, "A custom illustration");
});

test("Markdown emits semantic HTML, stable unique heading IDs, safe external links, tables and code", () => {
  const body = `# Example

## Known limitations

## Known limitations

[Limits](#known-limitations), [Methodology](/methodology/), [Source](https://example.com/?a=1&b=2).

| Header | Details |
| --- | --- |
| One | Two |

- A list item

\`\`\`js
const x = "<not-html>";
\`\`\`
`;
  const document = parseMarkdownDocument(fixture.replace("# Example\n\nAn example body.", body), "example.md");
  assert.match(document.html, /<h2 id="known-limitations">/);
  assert.match(document.html, /<h2 id="known-limitations-2">/);
  assert.match(document.html, /<table><thead><tr><th>Header<\/th>/);
  assert.match(document.html, /<ul>\n<li>A list item<\/li>/);
  assert.match(document.html, /<pre><code class="language-js">const x = &quot;&lt;not-html&gt;&quot;;/);
  assert.match(document.html, /href="https:\/\/example.com\/\?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"/);
  assert.match(document.disclaimerHtml, /not investment advice/);
  assert.match(document.disclaimerHtml, /不构成投资建议/);
  assert.doesNotMatch(document.html, /not investment advice/);
});

test("invalid Markdown and noncompliant draft content fail explicitly", () => {
  for (const body of [
    "# Example\n\n# Another H1",
    "# Example\n\n> # Nested H1",
    "## Missing H1",
    '# Example\n\n<div>Raw HTML</div>',
    "# Example\n\n[Unsafe](javascript:alert)",
    "# Example\n\n<!-- Reviewer note -->",
    "# Example\n\n[待核实]",
    "# Example\n\n[Legacy](/learn/look-ahead-bias/)",
    "# Example\n\nReal-time data",
  ]) assert.throws(() => loadFixture(fixture.replace("# Example\n\nAn example body.", body)), /example.md:/);
  assert.throws(() => loadFixture(fixture.replace("本页内容不构成投资建议。", "")), /risk disclaimers/);
});

test("blog index puts Backtesting & validation first and sorts every category newest first", () => {
  const base = loadFixture();
  const posts = [
    { ...base, slug: "older", date: "2026-10-19" },
    { ...base, slug: "other", category: "A different category", date: "2026-10-22" },
    { ...base, slug: "newer", date: "2026-10-21" },
    { ...base, slug: "last", category: "Z category" },
  ];
  const groups = groupBlogPosts(posts);
  assert.deepEqual(groups.map(({ category }) => category), ["Backtesting & validation", "A different category", "Z category"]);
  assert.deepEqual(groups[0].posts.map(({ slug }) => slug), ["newer", "older"]);
  assert.deepEqual(relatedBlogPosts(posts, posts[0]).map(({ slug }) => slug), ["newer", "other", "last"]);
  assert.deepEqual(groupBlogPosts([]), []);
});

test("RSS 2.0 includes channel metadata, self discovery, canonical GUIDs, RFC-822 dates and XML escaping", () => {
  const post = { ...loadFixture(), title: `Title & <tag> "double" 'single'`, description: `Description & <tag> "double" 'single'` };
  const rss = renderBlogRss([post]);
  assert.match(rss, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(rss, /<rss version="2.0" xmlns:atom="http:\/\/www.w3.org\/2005\/Atom">/);
  assert.ok(rss.includes(`<title>${blogContent.title.replaceAll("&", "&amp;")}</title>`));
  assert.ok(rss.includes(`<description>${blogContent.description}</description>`));
  assert.match(rss, /<link>https:\/\/predixlab.com\/blog\/<\/link>/);
  assert.match(rss, /<atom:link href="https:\/\/predixlab.com\/blog\/rss.xml" rel="self" type="application\/rss\+xml" \/>/);
  assert.match(rss, /<title>Title &amp; &lt;tag&gt; &quot;double&quot; &apos;single&apos;<\/title>/);
  assert.match(rss, /<description>Description &amp; &lt;tag&gt; &quot;double&quot; &apos;single&apos;<\/description>/);
  assert.match(rss, /<guid isPermaLink="true">https:\/\/predixlab.com\/blog\/example\/<\/guid>/);
  assert.match(rss, /<pubDate>Tue, 20 Oct 2026 00:00:00 GMT<\/pubDate>/);
  assert.equal([...renderBlogRss(blogPosts).matchAll(/<item>/g)].length, blogPosts.length);
  assert.doesNotMatch(renderBlogRss([]), /<item>/);
});

test("sitemap derives every URL and lastmod from sitePages, with no language or retired URLs", () => {
  const sitemap = renderSitemap();
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, xml]) => ({
    path: new URL(xml.match(/<loc>([^<]+)<\/loc>/)[1]).pathname,
    lastmod: xml.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
  }));
  assert.deepEqual(entries.map(({ path }) => path), sitePages.map(({ path }) => path));
  for (const post of blogPosts) {
    assert.equal(entries.find(({ path }) => path === post.path).lastmod, post.updated);
  }
  for (const path of ["/methodology/", "/open-source/"]) {
    assert.equal(entries.find((entry) => entry.path === path).lastmod, "2026-10-21");
  }
  assert.equal(entries.find(({ path }) => path === "/blog/").lastmod, blogPosts.map(({ updated }) => updated).sort().at(-1));
  assert.equal(entries.find(({ path }) => path === "/").lastmod, undefined);
  assert.doesNotMatch(sitemap, /hreflang|xhtml|\/(?:zh|en|insights)\/|[?&]lng=/);
});

test("adding one Markdown file discovers a post without editing a registry", async () => {
  const sources = Object.fromEntries(await Promise.all(blogPosts.map(async (post) => [
    `./blog/${post.slug}.md`, await readFile(new URL(`../src/content/blog/${post.slug}.md`, import.meta.url), "utf8"),
  ])));
  const posts = loadBlogPosts({ ...sources, "./blog/new-post.md": fixture });
  assert.equal(posts.length, blogPosts.length + 1);
  assert.equal(posts.find(({ slug }) => slug === "new-post").path, "/blog/new-post/");
});

const expectedHomeContent = {
  en: {
    title: ["Open-source US stock analysis:", "daily signals, screener, and options activity"],
    description: "Use the hosted dashboard for S&P 500 and Nasdaq-100 stocks, or run the Apache-2.0 code yourself. Built on daily data, with the method documented and every signal shown next to its history.",
    metaTitle: "Open-Source US Stock Analysis & Daily Signals | PredixLab",
    metaDescription: "Open-source analysis for S&P 500 and Nasdaq-100 stocks: daily signals, screener, options activity. Hosted or self-hosted. Free signals have a 10-day delay.",
  },
  zh: {
    title: ["美股选股器、每日信号和期权异动，", "代码全部开源"],
    description: "覆盖标普 500 和纳斯达克 100，基于日线数据。可以直接用托管版工作台，也可以按 Apache-2.0 协议自己部署。方法公开写明，每个信号都附带它过去的表现。",
    metaTitle: "PredixLab | 开源美股选股器、每日信号与期权异动",
    metaDescription: "美股选股器、每日信号和期权异动，代码全部开源。覆盖标普 500 和纳斯达克 100，基于日线数据，可用托管版或自己部署。免费版信号延迟 10 天。",
  },
};

for (const language of ["en", "zh"]) {
  test(`${language}: homepage keeps one two-line H1, exact subhead, metadata and derived schema descriptions`, () => {
    const expected = expectedHomeContent[language];
    assert.deepEqual(homeContent[language].title, expected.title);
    assert.equal(homeContent[language].description, expected.description);
    const html = language === "en" ? render("/").appHtml : renderToStaticMarkup(createElement(
      I18nextProvider, { i18n: createSiteI18n(language) },
      createElement(StaticRouter, { location: "/" }, createElement(App)),
    ));
    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(headings.length, 1);
    assert.equal(headings[0][1], `${renderToStaticMarkup(expected.title[0])}<br/><span>${renderToStaticMarkup(expected.title[1])}</span>`);
    assert.ok(html.includes(`<p class="hero-description">${renderToStaticMarkup(expected.description)}</p>`));

    const seo = getPageSeo("/", language);
    assert.equal(seo.title, expected.metaTitle);
    assert.equal(seo.description, expected.metaDescription);
    const head = language === "en" ? render("/").headHtml : renderSeoHead(seo);
    assert.ok(head.includes(`<title data-predixlab-seo>${renderToStaticMarkup(expected.metaTitle)}</title>`));
    for (const [attribute, name] of [
      ["name", "description"],
      ["property", "og:description"],
      ["name", "twitter:description"],
    ]) {
      assert.ok(head.includes(`${attribute}="${name}" content="${renderToStaticMarkup(expected.metaDescription)}"`));
    }
    for (const type of ["WebPage", "SoftwareApplication"]) {
      const nodes = seo.structuredData["@graph"].filter((node) => node["@type"] === type);
      assert.equal(nodes.length, 1);
      assert.equal(nodes[0].description, expected.metaDescription);
    }
  });

  test(`${language}: shared desktop/mobile navigation, footer, and all product bodies link to methodology and blog`, () => {
    for (const path of ["/us-stock-signals/", "/quantitative-stock-screener/", "/unusual-options-activity/"]) {
      const html = renderToStaticMarkup(createElement(
        I18nextProvider, { i18n: createSiteI18n(language) },
        createElement(StaticRouter, { location: path }, createElement(App)),
      ));
      const linkText = language === "en" ? "How the signals are built and tested" : "信号如何构建和检验";
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
      assert.match(main, new RegExp(`href="/methodology/"[^>]*>${linkText}</a>`));
      const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)[1];
      const desktop = html.match(/<div class="desktop-nav">([\s\S]*?)<\/div>/)[1];
      const mobile = html.match(/<nav class="mobile-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
      for (const section of [desktop, mobile, footer]) {
        for (const [href, label] of [
          ["/blog/", language === "en" ? "Blog" : "博客"],
          ["/methodology/", language === "en" ? "Methodology" : "方法论"],
        ]) {
          assert.match(section, new RegExp(`href="${href}"[^>]*>${label}`));
        }
      }
    }
  });
}

for (const [path, document] of [
  ["/methodology/", contentPages.methodology],
  ["/open-source/", contentPages.openSource],
  ...blogPosts.map((post) => [post.path, post]),
]) {
  test(`${path}: raw HTML includes complete body, dates, short breadcrumbs, disclaimers and exact metadata`, () => {
    const page = render(path);
    assert.equal(page.statusCode, 200);
    assert.equal(page.seo.title, document.title);
    assert.equal(page.seo.description, document.description);
    assert.equal(page.seo.canonicalUrl, `https://predixlab.com${path}`);
    assert.ok(page.appHtml.includes(document.html));
    assert.ok(page.appHtml.includes(document.disclaimerHtml));
    assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
    const dates = document.kind === "post" ? [document.date, document.updated]
      : [document.frontmatter.datePublished, document.frontmatter.dateModified];
    assert.deepEqual([...page.appHtml.matchAll(/<time dateTime="([^"]+)"/g)].map(([, date]) => date), dates);
    assert.match(page.appHtml, /href="\/methodology\/"/);
    assert.ok(page.appHtml.includes(`<span aria-current="page">${document.shortTitle}</span>`));
    assert.doesNotMatch(page.appHtml, /real[- ]?time|实时|\/learn\/|\/zh\/|[?&]lng=|<!--\s*Reviewer note|\[待核实\]/i);
    const json = JSON.parse(page.headHtml.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const breadcrumb = json["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.equal(breadcrumb.itemListElement.at(-1).name, document.shortTitle);
    assert.deepEqual(getPageSeo(path, "zh"), getPageSeo(path, "en"));
  });
}

test("article schemas reference the shared organization and use the existing 1200x630 image with accurate alt text", async () => {
  const png = await readFile(new URL("../public/social/predixlab-research.png", import.meta.url));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  for (const post of blogPosts) {
    const seo = getPageSeo(post.path);
    const article = seo.structuredData["@graph"].find((item) => item["@type"] === "BlogPosting");
    assert.deepEqual(article.author, { "@id": "https://predixlab.com/#organization" });
    assert.deepEqual(article.publisher, article.author);
    assert.equal(article.datePublished, post.date);
    assert.equal(article.dateModified, post.updated);
    assert.deepEqual(article.image, { "@type": "ImageObject", url: seo.imageUrl, width: 1200, height: 630 });
    assert.match(seo.imageAlt, /workflow illustration with a line chart and highlighted signal/);
    assert.equal(seo.rssUrl, "https://predixlab.com/blog/rss.xml");
  }
});

test("open-source schema has one Apache-2.0 SoftwareSourceCode per repository table row", () => {
  const repositories = sourceRepositories(contentPages.openSource);
  const schemas = getPageSeo("/open-source/").structuredData["@graph"].filter((node) => node["@type"] === "SoftwareSourceCode");
  assert.equal(schemas.length, repositories.length);
  assert.equal(schemas.length, 8);
  schemas.forEach((schema, index) => {
    assert.equal(schema.codeRepository, repositories[index].codeRepository);
    assert.deepEqual(schema.programmingLanguage, repositories[index].programmingLanguage);
    assert.equal(schema.license, "https://www.apache.org/licenses/LICENSE-2.0");
  });
});

test("blog index renders grouped posts, short breadcrumbs, CollectionPage and an ItemList", () => {
  const page = render("/blog/");
  assert.match(page.appHtml, /<h2 id="category-backtesting-validation">Backtesting &amp; validation<\/h2>/);
  assert.match(page.appHtml, /<span aria-current="page">Blog<\/span>/);
  assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
  for (const post of blogPosts) {
    assert.ok(page.appHtml.includes(`href="${post.path}"`));
    assert.ok(page.appHtml.includes(post.description));
    assert.ok(page.appHtml.includes(`<time dateTime="${post.date}">`));
  }
  const graph = page.seo.structuredData["@graph"];
  assert.equal(graph.filter((node) => node["@type"] === "CollectionPage").length, 1);
  const list = graph.find((node) => node["@type"] === "ItemList");
  assert.deepEqual(list.itemListElement.map(({ url }) => url), blogPosts.map(({ path }) => `https://predixlab.com${path}`));
  assert.match(page.headHtml, /rel="alternate" type="application\/rss\+xml"/);
});
