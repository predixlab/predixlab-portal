import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { StaticRouter } from "react-router-dom";
import { createServer } from "vite";
import { XMLParser, XMLValidator } from "fast-xml-parser";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const [
  { loadBlogPosts, loadDocs, parseFrontmatter, parseMarkdownDocument, sourceRepositories },
  { blogPosts, docs, docsPages, docsIndex, docsUpdated },
  { groupBlogPosts, relatedBlogPosts, renderBlogRss, blogContent },
  { sitePages },
  { getPageSeo, renderSeoHead, renderSitemap },
  { render },
  { default: App },
  { createSiteI18n },
  { homeContent, faqContent },
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

const expectedRiskNote = "For information and independent analysis only — not investment advice. Data can be delayed or wrong, models can fail, and past performance doesn't predict future results.";

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
  for (const [field, limit] of [["title", 60], ["description", 155]]) {
    assert.doesNotThrow(() => loadFixture(fixture.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: "${"x".repeat(limit)}"`)));
    assert.throws(() => loadFixture(fixture.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: "${"x".repeat(limit + 1)}"`)), /exceeds/);
  }
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

[Limits](#known-limitations), [How it works](/docs/how-it-works/), [Source](https://example.com/?a=1&b=2).

| Header | Details |
| --- | --- |
| One | Two |

- A list item
- [ ] An unchecked task
- [x] A checked task

---

\`\`\`js
const x = "<not-html>";
\`\`\`
`;
  const document = parseMarkdownDocument(fixture.replace("# Example\n\nAn example body.", body), "example.md");
  assert.match(document.html, /<h2 id="known-limitations">/);
  assert.match(document.html, /<h2 id="known-limitations-2">/);
  assert.match(document.html, /<table><thead><tr><th>Header<\/th>/);
  assert.match(document.html, /<ul>\n<li>A list item<\/li>/);
  assert.match(document.html, /<li><input disabled="" type="checkbox"> An unchecked task<\/li>/);
  assert.match(document.html, /<li><input checked="" disabled="" type="checkbox"> A checked task<\/li>/);
  assert.match(document.html, /<hr>/);
  assert.match(document.html, /<pre><code class="language-js">const x = &quot;&lt;not-html&gt;&quot;;/);
  assert.match(document.html, /href="https:\/\/example.com\/\?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"/);
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
});

for (const [slug, shortTitle, otherSlug, taskCount] of [
  ["backtest-biases", "Backtest biases", "survivorship-bias-backtesting", 8],
  ["survivorship-bias-backtesting", "Survivorship bias", "backtest-biases", 0],
]) {
  test(`${slug}: discovers the English draft with publication metadata, cross-links and task lists intact`, () => {
    const post = blogPosts.find((post) => post.slug === slug);
    assert.ok(post, `Missing blog post: ${slug}`);
    assert.equal(post.path, `/blog/${slug}/`);
    assert.ok(sitePages.some(({ path, key }) => path === post.path && key === "blogPost"));
    assert.equal(post.shortTitle, shortTitle);
    assert.equal(post.lang, "en");
    assert.equal(post.date, "2026-10-21");
    assert.equal(post.updated, "2026-10-21");
    assert.equal(post.category, "Backtesting & validation");
    assert.equal(post.translationKey, slug);
    assert.equal(post.frontmatter.h1, post.h1);
    assert.equal(post.body.split("\n")[0], `# ${post.h1}`);
    assert.doesNotMatch(post.body, /<!--|For information and independent analysis only/);
    for (const path of [
      `/blog/${otherSlug}/`, "/blog/look-ahead-bias/", "/blog/walk-forward-validation/",
      "/docs/how-it-works/", "/docs/limitations/",
    ]) {
      assert.ok(post.body.includes(`](${path})`), `Missing Markdown link: ${path}`);
      assert.ok(post.html.includes(`href="${path}"`), `Missing rendered link: ${path}`);
    }
    assert.equal([...post.body.matchAll(/^- \[ \] /gm)].length, taskCount);
    assert.equal([...post.html.matchAll(/<input\b/g)].length, taskCount);
    assert.equal([...post.html.matchAll(/<li><input disabled="" type="checkbox"> /g)].length, taskCount);
  });
}

for (const { path } of sitePages.filter(({ path }) => /^\/(?:docs|blog)\//.test(path))) {
  for (const language of ["en", "zh"]) {
    test(`${path} (${language} navigation): exactly one approved English risk note and no localized footer disclaimer`, () => {
      const i18n = createSiteI18n(language);
      const html = renderToStaticMarkup(createElement(
        I18nextProvider, { i18n },
        createElement(StaticRouter, { location: path }, createElement(App)),
      ));
      const disclaimers = [...html.matchAll(/<div class="content-disclaimer markdown-content"[^>]*>([\s\S]*?)<\/div>/g)];
      assert.equal(disclaimers.length, 1);
      const disclaimer = disclaimers[0][1];
      assert.equal(disclaimer.replace(/<[^>]+>/g, "").trim(), renderToStaticMarkup(expectedRiskNote));
      assert.doesNotMatch(disclaimer, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303f]/u);
      assert.equal(html.split(renderToStaticMarkup(expectedRiskNote)).length - 1, 1);
      assert.ok(!html.includes(renderToStaticMarkup(i18n.t("footer.disclaimer"))));
    });
  }
}

test("self-hosting uses the approved scope and distinguishes hosted features", () => {
  const document = docs.find(({ slug }) => slug === "self-hosting");
  assert.equal(document.path, "/docs/self-hosting/");
  assert.equal(document.title, "Run the open-source signal code");
  assert.equal(document.shortTitle, "Signal code");
  assert.equal(document.h1, "Run the open-source signal code");
  assert.equal(document.frontmatter.h1, "Run the open-source signal code");
  assert.equal(document.body.split("\n\n")[0], "# Run the open-source signal code");
  assert.equal(document.body.split("\n\n")[1], "The signal, backtest, API and dashboard code is open source (Apache-2.0).");
  assert.ok(document.body.includes("## Why open source"));
  assert.equal(document.description, "Run PredixLab's open-source signal and backtest code with your own input data (daily prices, index membership history and a trading calendar).");
  assert.equal(document.body.split("\n\n")[2], "We publish the code so you don't have to take our word for the method. Read it, run the tests, and tell us where it's wrong.");
  assert.ok(document.body.includes("Most signal tools ask you to trust numbers without showing how they're made. We'd rather show the work."));
  assert.ok(document.body.includes("You can inspect the method and check it with data you supply."));
  assert.doesNotMatch(document.body, /numbers you can't see being made|take our description of the method on trust/);
  assert.match(render(document.path).appHtml, /<h1\b[^>]*>Run the open-source signal code<\/h1>/);
  assert.ok(document.body.includes("Data collection and options analysis run as part of the hosted service and aren't in the public repositories."));
  assert.match(document.body, /\nhosted data jobs → daily prices, membership, calendar, snapshots/);
  assert.ok(document.body.includes("daily OHLCV, dated index membership intervals, and a trading calendar"));
  assert.ok(document.body.includes("This guide does not provide a data-preparation workflow"));
  assert.ok(document.body.includes("The license does not grant rights to any third-party market data; data providers keep their own terms."));
  assert.doesNotMatch(`${document.body}\n${document.description}\n${document.summary}`, /yahoo|cboe|bypass/i);
  assert.match(document.body, /git clone https:\/\/github\.com\/predixlab\/predixlab-signals\.git/);
  assert.match(document.body, /uv run pytest -q/);
  assert.doesNotMatch(document.body, /(?:git clone|uv run|cd) [^\n]*(?:predixlab-collector|predixlab-options)|options_monitor\/|anomaly-detection\.md/);
});

test("public pages and metadata do not link unavailable repositories or claim all code is open source", () => {
  for (const { path } of sitePages) {
    for (const language of ["en", "zh"]) {
      const html = renderToStaticMarkup(createElement(
        I18nextProvider, { i18n: createSiteI18n(language) },
        createElement(StaticRouter, { location: path }, createElement(App)),
      ));
      const content = `${html}\n${JSON.stringify(getPageSeo(path, language))}`;
      assert.doesNotMatch(content, /https?:\/\/github\.com\/predixlab\/predixlab-(?:collector|options)(?:[/"#?.\s]|$)/i, `${language}: ${path}`);
      assert.doesNotMatch(content, /fully open[ -]source|all code from data collection|the full code is open source|代码全部开源|全部开源/i, `${language}: ${path}`);
    }
  }
});

test("how-it-works retains the data source table and distinguishes hosted features", () => {
  const document = docs.find(({ slug }) => slug === "how-it-works");
  assert.equal(document.body.split("## Data sources\n\n")[1].split("\n\n")[0], [
    "| Data | Source | Notes |",
    "| --- | --- | --- |",
    "| Daily US stock prices (OHLCV) | Yahoo Finance, collected by PredixLab's nightly data job | History is built from 2015-01-01 and updated incrementally |",
    "| Index membership | Constituent lists and history for the S&P 500 and Nasdaq-100 | Stored as dated membership intervals per symbol; the history is incomplete (see [Known limitations](/docs/limitations/)) |",
    "| Trading calendar | Derived from S&P 500 index (`^GSPC`) history | Used to decide which dates are trading sessions |",
    "| Reference ETFs | SPY, QQQ, IWM, DIA | Kept separately for market context |",
    "| Options chains | Cboe snapshots, collected by PredixLab's options job | Compared session to session, contract by contract |",
  ].join("\n"));
  assert.ok(document.body.includes("The signal, backtest, API and dashboard code is open source (Apache-2.0)."));
  assert.ok(document.body.includes("Data collection and options analysis run as part of the hosted service and aren't in the public repositories."));
  assert.match(document.body, /signal features, training, and backtests are implemented in \[predixlab-signals\]/);
  assert.ok(document.body.includes("See [Signal code](/docs/self-hosting/) for the public repositories and how to run the signal tests."));
});

test("limitations covers incomplete membership, missing holdings, all-cash costs and omitted costs", () => {
  const document = docs.find(({ slug }) => slug === "limitations");
  const items = [
    "**Incomplete index membership history.** Membership dates are applied, but many removed constituents are missing from the history, so the universe isn't fully point-in-time.",
    "**Fill and cost simplifications.** Stops and targets fill at their exact level even through price gaps, Pivot opposite-signal exits fill at the same close that produced the exit signal, an AlphaRank holding that disappears from the data gets a 0% return, and re-entering AlphaRank from all-cash isn't charged a cost. Market impact, capacity, borrow availability, and taxes aren't modeled. All of these make backtests look better than live trading.",
  ];
  for (const item of items) assert.ok(document.body.includes(`- ${item}`));
});

test("the short version qualifies out-of-sample testing, Pivot fills and known limitations, and links membership caveats", () => {
  const document = docs.find(({ slug }) => slug === "how-it-works");
  const summary = document.body.split("## The short version")[1].split("## Data sources")[0];
  assert.ok(summary.includes("- **Out-of-sample testing.** Models are evaluated with walk-forward validation: each test period is predicted by a model that never saw it. Pivot's event rules are a partial exception (see below)."));
  assert.ok(summary.includes("ambiguous Pivot bars assume the stop was hit first"));
  assert.ok(summary.includes("- **Known limitations.** Delisted companies are largely missing, most prices exclude dividends, and some fills are optimistic, so historical results likely look better than real trading. See [Known limitations](/docs/limitations/)."));
  assert.ok(document.body.includes("the history is incomplete (see [Known limitations](/docs/limitations/))"));
});

test("walk-forward closing copy distinguishes fair testing from data limitations", () => {
  const post = blogPosts.find(({ slug }) => slug === "walk-forward-validation");
  assert.ok(post.body.includes("What it does is keep the test fair: each result comes from dates the model didn't see during training. It can't fix problems in the data itself, such as missing delisted stocks."));
  assert.doesNotMatch(post.body, /make the evidence honest/);
});

test("daily data summary specifies the update cadence without changing the real-time FAQ", () => {
  const document = docs.find(({ slug }) => slug === "how-it-works");
  assert.ok(document.body.includes("- **Daily data only, updated once per trading day after the US close.** Prices are daily bars. Signals and options data are produced by scheduled nightly jobs and labeled with a data date."));
  assert.deepEqual(faqContent.en.find(({ question }) => question === "Is the data real-time?"), {
    question: "Is the data real-time?",
    answer: "No. PredixLab uses daily price data and daily signal updates, not live quotes or intraday trade alerts. Check the date shown in the dashboard to see how current each result is.",
  });
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

test("blog index renders the English risk note once with zero, one or multiple categories", () => {
  const originalPosts = [...blogPosts];
  const base = loadFixture();
  try {
    for (const categories of [[], ["Backtesting & validation"], ["Backtesting & validation", "Other", "Third"]]) {
      blogPosts.splice(0, blogPosts.length, ...categories.map((category, index) => ({
        ...base, category, slug: `example-${index}`, path: `/blog/example-${index}/`,
      })));
      const { appHtml } = render("/blog/");
      assert.equal([...appHtml.matchAll(/<section class="blog-category"/g)].length, categories.length);
      assert.equal([...appHtml.matchAll(/class="content-disclaimer markdown-content"/g)].length, 1);
      assert.equal(appHtml.split(renderToStaticMarkup(expectedRiskNote)).length - 1, 1);
      assert.doesNotMatch(appHtml, /class="blog-post-list">(?:(?!<\/section>)[\s\S])*class="content-disclaimer/);
    }
  } finally {
    blogPosts.splice(0, blogPosts.length, ...originalPosts);
  }
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
  assert.equal(XMLValidator.validate(rss), true);
  const channel = new XMLParser({ ignoreAttributes: false }).parse(rss).rss.channel;
  assert.equal(channel.language, "en");
  assert.equal(channel.lastBuildDate, "Wed, 21 Oct 2026 00:00:00 GMT");
  assert.equal(channel.item.title, post.title);
  assert.equal(channel.item.description, post.description);
  assert.equal(channel.item.link, "https://predixlab.com/blog/example/");
  assert.equal([...renderBlogRss(blogPosts).matchAll(/<item>/g)].length, blogPosts.length);
  const publishedItems = new XMLParser({
    isArray: (_name, path) => path === "rss.channel.item",
  }).parse(renderBlogRss(blogPosts)).rss.channel.item;
  assert.deepEqual(publishedItems.map(({ title, description, link, pubDate }) => ({
    title, description, link, pubDate,
  })), blogPosts.map((post) => ({
    title: post.title,
    description: post.description,
    link: `https://predixlab.com${post.path}`,
    pubDate: new Date(`${post.date}T00:00:00Z`).toUTCString(),
  })));
  assert.doesNotMatch(renderBlogRss([]), /<item>/);
  assert.equal(XMLValidator.validate(renderBlogRss([])), true);
  assert.doesNotMatch(renderBlogRss([]), /<lastBuildDate>/);
});

test("RSS lastBuildDate derives deterministically from the newest publication or update, not item order", () => {
  const base = loadFixture();
  const posts = [
    { ...base, date: "2026-10-19", updated: "2026-10-24" },
    { ...base, slug: "newer", date: "2026-10-22", updated: "2026-10-23" },
  ];
  const lastBuildDate = (items) => {
    const rss = renderBlogRss(items);
    assert.equal(XMLValidator.validate(rss), true);
    return new XMLParser().parse(rss).rss.channel.lastBuildDate;
  };
  assert.equal(lastBuildDate(posts), "Sat, 24 Oct 2026 00:00:00 GMT");
  assert.equal(lastBuildDate([...posts].reverse()), lastBuildDate(posts));
  posts.push({ ...base, slug: "latest", date: "2026-10-25", updated: "2026-10-25" });
  assert.equal(lastBuildDate(posts), "Sun, 25 Oct 2026 00:00:00 GMT");
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
  for (const doc of docs) {
    assert.equal(entries.find((entry) => entry.path === doc.path).lastmod, doc.updated);
  }
  assert.equal(entries.find(({ path }) => path === "/docs/").lastmod, docsUpdated);
  assert.equal(docsUpdated, docs.map(({ updated }) => updated).sort().at(-1));
  assert.doesNotMatch(sitemap, /\/(?:methodology|open-source)\//);
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
    eyebrow: "Free to start · Open-source signal and backtest code",
    title: ["US stock analysis with open-source signal code:", "daily signals, screener, and options activity"],
    description: "Use the hosted dashboard for S&P 500 and Nasdaq-100 stocks. Built on daily data, with the method documented and each signal shown alongside that stock's past signals.",
    metaTitle: "US Stock Analysis with Open-Source Signal Code | PredixLab",
    metaDescription: "US stock screener, daily signals and options activity built from daily data. The signal and backtest code is open source (Apache-2.0). Not investment advice.",
  },
  zh: {
    eyebrow: "免费开始 · 信号和回测代码开源",
    title: ["美股选股器、每日信号和期权异动，", "信号和回测代码开源"],
    description: "覆盖标普 500 和纳斯达克 100，基于日线数据。可以直接用托管工作台；信号和回测代码以 Apache-2.0 协议开源，可以用自己的数据研究和测试。方法公开写明，每个信号都能对照这只股票过去的信号。",
    metaTitle: "PredixLab | 美股选股器、每日信号与期权异动，信号和回测代码开源",
    metaDescription: "美股选股器、每日信号和期权异动。覆盖标普 500 和纳斯达克 100，基于日线数据，信号和回测代码开源。免费版信号延迟 10 天。",
  },
};

for (const language of ["en", "zh"]) {
  test(`${language}: homepage keeps one two-line H1, exact subhead, metadata and derived schema descriptions`, () => {
    const expected = expectedHomeContent[language];
    assert.equal(homeContent[language].eyebrow, expected.eyebrow);
    assert.deepEqual(homeContent[language].title, expected.title);
    assert.equal(homeContent[language].description, expected.description);
    const html = language === "en" ? render("/").appHtml : renderToStaticMarkup(createElement(
      I18nextProvider, { i18n: createSiteI18n(language) },
      createElement(StaticRouter, { location: "/" }, createElement(App)),
    ));
    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    const eyebrow = html.match(/<p class="eyebrow hero-eyebrow">([\s\S]*?)<\/p>/)[1];
    assert.equal(eyebrow.replace(/<[^>]+>/g, ""), expected.eyebrow);
    assert.equal(headings.length, 1);
    assert.equal(headings[0][1], `${renderToStaticMarkup(expected.title[0])}<br/><span>${renderToStaticMarkup(expected.title[1])}</span>`);
    const subhead = html.match(/<p class="hero-description">([\s\S]*?)<\/p>/)[1];
    assert.equal(subhead.replace(/<[^>]+>/g, ""), renderToStaticMarkup(expected.description));
    assert.ok(subhead.includes(`<a href="/docs/how-it-works/" data-discover="true">${homeContent[language].descriptionLink}</a>`));
    assert.match(html, /<section class="section tools-section" id="tools">/);

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

  test(`${language}: flat desktop/mobile navigation and product/footer links point to Docs`, () => {
    const labels = language === "en" ? [
      "how the signals are built and tested",
      "Where the screener data comes from and when it updates",
      "How options activity is detected and scored",
    ] : ["信号如何构建和检验", "选股器数据来源与更新时间", "期权异动如何识别和评分"];
    for (const [index, path] of ["/us-stock-signals/", "/quantitative-stock-screener/", "/unusual-options-activity/"].entries()) {
      const html = renderToStaticMarkup(createElement(
        I18nextProvider, { i18n: createSiteI18n(language) },
        createElement(StaticRouter, { location: path }, createElement(App)),
      ));
      const linkText = labels[index];
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
      assert.match(main, new RegExp(`href="/docs/how-it-works/"[^>]*>${linkText}</a>`));
      const limitationsLabel = language === "en"
        ? index === 0 ? "known limitations" : "Known limitations"
        : "已知局限";
      assert.match(main, new RegExp(`href="/docs/limitations/"[^>]*>${limitationsLabel}</a>`));
      const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)[1];
      assert.ok(footer.includes(renderToStaticMarkup(createSiteI18n(language).t("footer.disclaimer"))));
      const desktop = html.match(/<div class="desktop-nav">([\s\S]*?)<\/div>/)[1];
      const mobile = html.match(/<nav class="mobile-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
      for (const section of [desktop, mobile, footer]) {
        for (const [href, label] of [
          ["/blog/", language === "en" ? "Blog" : "博客"],
          ["/docs/", language === "en" ? "Docs" : "文档"],
        ]) {
          assert.match(section, new RegExp(`href="${href}"[^>]*>${label}`));
        }
        for (const section of [desktop, mobile]) {
          const links = [...section.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
          assert.deepEqual(links.slice(0, 5).map(([, href]) => href), ["/#tools", "/pricing/", "/docs/", "/blog/", "/about/"]);
          assert.equal(links[0][2].replace(/<svg[\s\S]*?<\/svg>/g, ""), language === "en" ? "Tools" : "工具");
        }
      }
    }
  });
}

for (const [path, document] of [
  ...docs.map((doc) => [doc.path, doc]),
  ...blogPosts.map((post) => [post.path, post]),
]) {
  test(`${path}: raw HTML includes complete body, dates, short breadcrumbs, disclaimers and exact metadata`, () => {
    const page = render(path);
    assert.equal(page.statusCode, 200);
    assert.equal(page.seo.title, document.title);
    assert.equal(page.seo.description, document.description);
    assert.ok(document.title.length > 0 && document.title.length <= 60);
    assert.ok(document.description.length > 0 && document.description.length <= 155);
    assert.equal(page.seo.canonicalUrl, `https://predixlab.com${path}`);
    assert.ok(page.appHtml.includes(document.html));
    assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
    assert.ok(page.appHtml.includes(`>${renderToStaticMarkup(document.h1)}</h1>`));
    assert.equal(page.appHtml.split(renderToStaticMarkup(expectedRiskNote)).length - 1, 1);
    const dates = document.kind === "post" ? [document.date, document.updated]
      : [document.updated];
    assert.deepEqual([...page.appHtml.matchAll(/<time dateTime="([^"]+)"/g)].map(([, date]) => date), dates);
    assert.match(page.appHtml, /href="\/docs\/how-it-works\/"/);
    assert.ok(page.appHtml.includes(`<span aria-current="page">${document.shortTitle}</span>`));
    assert.doesNotMatch(page.appHtml, /real[- ]?time|实时|\/learn\/|\/zh\/|[?&]lng=|<!--\s*Reviewer note|\[待核实\]/i);
    const json = JSON.parse(page.headHtml.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const breadcrumb = json["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.deepEqual(breadcrumb.itemListElement.map(({ name }) => name), [
      "Home", document.kind === "doc" ? "Docs" : "Blog", document.shortTitle,
    ]);
    const articles = json["@graph"].filter((node) => node["@type"] === (
      document.kind === "post" ? "BlogPosting" : "TechArticle"
    ));
    assert.equal(articles.length, 1);
    const article = articles[0];
    assert.equal(article.headline, document.title);
    assert.equal(article.description, document.description);
    assert.equal(article.datePublished, document.date);
    assert.equal(article.dateModified, document.updated);
    assert.equal(article.mainEntityOfPage, page.seo.canonicalUrl);
    assert.deepEqual(article.author, { "@id": "https://predixlab.com/#organization" });
    assert.deepEqual(article.publisher, article.author);
    if (document.kind === "doc") {
      assert.match(page.appHtml, /class="docs-sidebar"/);
      const sidebar = page.appHtml.match(/<nav class="docs-sidebar"[^>]*>([\s\S]*?)<\/nav>/)[1];
      for (const doc of docs) {
        const link = [...sidebar.matchAll(/<a\b[^>]+>/g)].map(([tag]) => tag).find((tag) => tag.includes(`href="${doc.path}"`));
        assert.ok(link);
        assert.equal(link.includes('aria-current="page"'), doc.path === path);
      }
      assert.deepEqual(page.seo.alternates, []);
    }
    assert.deepEqual(getPageSeo(path, "zh"), getPageSeo(path, "en"));
  });
}

test("default sharing artwork limits its open-source claim to signal code", async () => {
  const svg = await readFile(new URL("../public/social/predixlab-research.svg", import.meta.url), "utf8");
  assert.ok(svg.includes(">OPEN-SOURCE SIGNAL CODE</text>"));
  assert.ok(svg.includes(">US stock analysis with</text>"));
  assert.ok(svg.includes(">open-source signal code</text>"));
  assert.doesNotMatch(svg, /Open-source US stock|Self-host|run the code yourself/i);
});

test("articles use article Open Graph dates, shared organization schemas and page-title alt text with the default image", async () => {
  const png = await readFile(new URL("../public/social/predixlab-research.png", import.meta.url));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  for (const document of [...docs, ...blogPosts]) {
    const seo = getPageSeo(document.path);
    const article = seo.structuredData["@graph"].find((item) => item["@type"] === (document.kind === "post" ? "BlogPosting" : "TechArticle"));
    assert.deepEqual(article.author, { "@id": "https://predixlab.com/#organization" });
    assert.deepEqual(article.publisher, article.author);
    assert.equal(article.datePublished, document.date);
    assert.equal(article.dateModified, document.updated);
    assert.deepEqual(article.image, { "@type": "ImageObject", url: seo.imageUrl, width: 1200, height: 630 });
    assert.equal(seo.imageUrl, getPageSeo("/").imageUrl);
    assert.equal(seo.imageAlt, document.title);
    assert.equal(seo.openGraphType, "article");
    const head = renderSeoHead(seo);
    for (const [name, value] of [
      ["og:type", "article"],
      ["article:published_time", document.date],
      ["article:modified_time", document.updated],
      ["og:image:alt", document.title],
      ["twitter:image:alt", document.title],
    ]) assert.ok(head.includes(`${name}" content="${renderToStaticMarkup(value)}"`));
    if (document.kind === "post") assert.equal(seo.rssUrl, "https://predixlab.com/blog/rss.xml");
  }
  for (const path of ["/docs/", "/blog/"]) {
    const seo = getPageSeo(path);
    assert.equal(seo.openGraphType, "website");
    assert.doesNotMatch(renderSeoHead(seo), /property="article:/);
  }
});

test("posts retain custom sharing images and alt text in English metadata and article schemas", () => {
  const post = blogPosts[0];
  const original = { image: post.image, imageAlt: post.imageAlt };
  try {
    post.image = "/social/predixlab-us-stock-signals.png";
    post.imageAlt = 'Custom chart illustration with a "daily signal" marker';
    const seo = getPageSeo(post.path, "zh");
    assert.equal(seo.language, "en");
    assert.equal(seo.title, post.title);
    assert.equal(seo.description, post.description);
    assert.equal(seo.imageUrl, `https://predixlab.com${post.image}`);
    assert.equal(seo.imageAlt, post.imageAlt);
    const head = renderSeoHead(seo);
    for (const name of ["og:image:alt", "twitter:image:alt"]) {
      assert.ok(head.includes(`${name}" content="${renderToStaticMarkup(post.imageAlt)}"`));
    }
    assert.equal(seo.structuredData["@graph"].find((node) => node["@type"] === "BlogPosting").image.url, seo.imageUrl);
  } finally {
    Object.assign(post, original);
  }
});

test("daily-data FAQs remain unchanged in both languages", () => {
  assert.equal(faqContent.en.find(({ question }) => question === "Is the data real-time?").answer,
    "No. PredixLab uses daily price data and daily signal updates, not live quotes or intraday trade alerts. Check the date shown in the dashboard to see how current each result is.");
  assert.equal(faqContent.zh.find(({ question }) => question === "数据是实时的吗？").answer,
    "不是。PredixLab 以日线行情和每日信号为主，不提供实时行情或盘中交易提醒。数据更新到哪一天，请以工作台显示的日期为准。");
});

test("self-hosting table and schema list only public Apache-2.0 repositories", () => {
  const repositories = sourceRepositories(docs.find(({ slug }) => slug === "self-hosting"));
  assert.deepEqual(repositories.map(({ name }) => name).sort(), [
    "predixlab-api", "predixlab-campaign", "predixlab-infra",
    "predixlab-portal", "predixlab-signals", "predixlab-webapp",
  ]);
  const schemas = getPageSeo("/docs/self-hosting/").structuredData["@graph"].filter((node) => node["@type"] === "SoftwareSourceCode");
  assert.equal(schemas.length, repositories.length);
  schemas.forEach((schema, index) => {
    assert.equal(schema.codeRepository, repositories[index].codeRepository);
    assert.deepEqual(schema.programmingLanguage, repositories[index].programmingLanguage);
    assert.equal(schema.license, "https://www.apache.org/licenses/LICENSE-2.0");
    assert.deepEqual(schema.author, { "@id": "https://predixlab.com/#organization" });
    assert.deepEqual(schema.publisher, schema.author);
  });
});

test("Docs index is Markdown-driven, lists every document in order and has English-only collection metadata", () => {
  const page = render("/docs/");
  assert.equal(page.statusCode, 200);
  assert.ok(page.appHtml.includes(docsIndex.html));
  assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
  assert.deepEqual([...page.appHtml.matchAll(/<h2><a href="([^"]+)"/g)].map(([, path]) => path), docs.map(({ path }) => path));
  assert.equal(docsIndex.h1, "How PredixLab works, where it falls short, and how to run the signal code");
  assert.equal(docsIndex.title, "PredixLab docs: how it works, limitations and signal code");
  assert.equal(docsIndex.description, "Understand PredixLab's data, signals and backtests, review known limitations, and run the signal tests.");
  const expectedSummaries = [
    "Data sources, update schedule, the two models, walk-forward validation, and backtest assumptions.",
    "What the data, signals, and backtests can't tell you, and why historical results can look better than real trading.",
    "The signal, backtest, API and dashboard code is open source (Apache-2.0). Learn how it fits together and run the signal tests.",
  ];
  assert.deepEqual(docs.map(({ summary }) => summary), expectedSummaries);
  for (const doc of docs) {
    assert.ok(page.appHtml.includes(`<p>${renderToStaticMarkup(doc.summary)}</p>`));
    assert.ok(!page.appHtml.includes(`<p>${renderToStaticMarkup(doc.description)}</p>`));
  }
  assert.doesNotMatch(page.appHtml, /All PredixLab components/);
  assert.equal(page.seo.title, docsIndex.title);
  for (const [attribute, name] of [["property", "og:title"], ["name", "twitter:title"]]) {
    assert.ok(page.headHtml.includes(`${attribute}="${name}" content="${docsIndex.title}"`));
  }
  assert.equal(page.seo.description, docsIndex.description);
  assert.equal(page.seo.canonicalUrl, "https://predixlab.com/docs/");
  assert.ok(docsIndex.title.length <= 60 && docsIndex.description.length <= 155);
  assert.equal(page.seo.structuredData["@graph"].filter((node) => node["@type"] === "CollectionPage").length, 1);
  const list = page.seo.structuredData["@graph"].find((node) => node["@type"] === "ItemList");
  assert.deepEqual(list.itemListElement, docs.map((doc, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: doc.title,
    description: doc.summary,
    url: `https://predixlab.com${doc.path}`,
  })));
  assert.deepEqual(page.seo.structuredData["@graph"].find((node) => node["@type"] === "CollectionPage").mainEntity, { "@id": list["@id"] });
  assert.deepEqual(page.seo.structuredData["@graph"].find((node) => node["@type"] === "BreadcrumbList").itemListElement.map(({ name }) => name), ["Home", "Docs"]);
  assert.deepEqual(getPageSeo("/docs/", "zh"), page.seo);
  assert.deepEqual(page.seo.alternates, []);
  assert.equal(docsPages.length, docs.length + 1);
});

test("unpublished draft routes are absent from the inventory and return genuine not-found responses", () => {
  for (const slug of ["methodology", "open-source"]) {
    const path = `/${slug}/`;
    assert.equal(sitePages.some((page) => page.path === path), false);
    const result = render(path);
    assert.equal(result.statusCode, 404);
    assert.equal(result.seo.canonicalUrl, null);
    assert.equal(result.seo.structuredData, null);
  }
});

const docsFixture = fixture.replace('category: "Backtesting & validation"', 'order: "1"\nsummary: "A short example summary."');
const loadDocFixture = (source = docsFixture) => loadDocs({ "./docs/example.md": source })[0];

test("Docs frontmatter validates required metadata, dates, ordering, language and SEO limits", () => {
  assert.equal(loadDocFixture().path, "/docs/example/");
  for (const field of ["title", "shortTitle", "description", "summary", "lang", "date", "updated", "order", "translationKey"]) {
    assert.throws(() => loadDocFixture(docsFixture.replace(new RegExp(`^${field}:.*\\n`, "m"), "")), new RegExp(`missing required field ${field}`));
  }
  for (const value of ["-1", "1.5", "invalid", "9007199254740992"]) {
    assert.throws(() => loadDocFixture(docsFixture.replace('order: "1"', `order: "${value}"`)), /order must be/);
  }
  assert.throws(() => loadDocFixture(docsFixture.replace('updated: "2026-10-21"', 'updated: "2026-02-30"')), /invalid updated/);
  assert.throws(() => loadDocFixture(docsFixture.replace('date: "2026-10-20"', 'date: "2026-02-30"')), /invalid date/);
  assert.throws(() => loadDocFixture(docsFixture.replace('updated: "2026-10-21"', 'updated: "2026-10-19"')), /updated precedes date/);
  assert.equal(loadDocFixture().summary, "A short example summary.");
  assert.equal(loadDocFixture().date, "2026-10-20");
  assert.throws(() => loadDocFixture(docsFixture.replace("lang: en", "lang: zh")), /lang must be en/);
  assert.throws(() => loadDocFixture(docsFixture.replace("translationKey: example", "translationKey: Bad Key")), /invalid translationKey/);
  for (const [field, limit] of [["title", 60], ["description", 155]]) {
    assert.doesNotThrow(() => loadDocFixture(docsFixture.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: "${"x".repeat(limit)}"`)));
    assert.throws(() => loadDocFixture(docsFixture.replace(new RegExp(`^${field}:.*$`, "m"), `${field}: "${"x".repeat(limit + 1)}"`)), /exceeds/);
  }
  assert.throws(() => loadDocs({ "./Bad_Slug.md": docsFixture }), /invalid slug/);
  assert.throws(() => loadDocs({ "./one/example.md": docsFixture, "./two/example.md": docsFixture }), /duplicate slug/);
  assert.throws(() => loadDocs({ "./one.md": docsFixture, "./two.md": docsFixture }), /duplicate order/);
  assert.throws(() => loadDocs({ "./one.md": docsFixture, "./two.md": docsFixture.replace('order: "1"', 'order: "2"') }), /duplicate translationKey/);
});

test("adding a doc discovers its path and order without editing a registry", () => {
  const discovered = loadDocs({
    "./docs/second.md": docsFixture.replace('order: "1"', 'order: "2"').replace("translationKey: example", "translationKey: second"),
    "./docs/example.md": docsFixture,
  });
  assert.deepEqual(discovered.map(({ path }) => path), ["/docs/example/", "/docs/second/"]);
});

test("blog index renders grouped posts, short breadcrumbs, CollectionPage and an ItemList", () => {
  const page = render("/blog/");
  assert.match(page.appHtml, /<h2 id="category-backtesting-validation">Backtesting &amp; validation<\/h2>/);
  assert.match(page.appHtml, /<span aria-current="page">Blog<\/span>/);
  assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
  assert.match(page.appHtml, /<h1>Guides to backtesting and validating stock signals<\/h1>/);
  assert.match(page.appHtml, /<p class="eyebrow">PREDIXLAB \/ BLOG<\/p>/);
  for (const post of blogPosts) {
    assert.ok(page.appHtml.includes(`href="${post.path}"`));
    assert.ok(page.appHtml.includes(renderToStaticMarkup(post.description)));
    assert.ok(page.appHtml.includes(`<time dateTime="${post.date}">`));
  }
  const graph = page.seo.structuredData["@graph"];
  assert.deepEqual(graph.find((node) => node["@type"] === "BreadcrumbList").itemListElement.map(({ name }) => name), ["Home", "Blog"]);
  assert.equal(graph.filter((node) => node["@type"] === "CollectionPage").length, 1);
  const list = graph.find((node) => node["@type"] === "ItemList");
  assert.deepEqual(list.itemListElement.map(({ url }) => url), blogPosts.map(({ path }) => `https://predixlab.com${path}`));
  assert.match(page.headHtml, /rel="alternate" type="application\/rss\+xml"/);
});
