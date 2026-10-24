import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { createServer } from "vite";
import { XMLParser } from "fast-xml-parser";
import { buildIndexNowPayload, parseSitemap } from "./indexnow.mjs";
import { validateFaqMarkup, validateInternalLinks } from "./validate-seo.mjs";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const [
  { blogPosts, blogUpdated, docs, docsIndex, docsUpdated },
  { getPageSeo, renderSitemap },
  { getPageForPath, sitePages },
  { renderBlogRss },
  { render },
] = await Promise.all([
  server.ssrLoadModule("/src/content/documents.ts"),
  server.ssrLoadModule("/src/seo.ts"),
  server.ssrLoadModule("/src/routing.ts"),
  server.ssrLoadModule("/src/content/blog.ts"),
  server.ssrLoadModule("/src/entry-server.tsx"),
]);

const postPath = "/blog/predixlab-mcp/";
const docPath = "/docs/mcp/";
const origin = "https://predixlab.com";
const post = blogPosts.find(({ path }) => path === postPath);
const doc = docs.find(({ path }) => path === docPath);
const hash = (value) => createHash("sha256").update(value).digest("hex");

test("MCP announcement preserves the entire approved source and all three approved images", async () => {
  for (const [path, expected] of [
    ["src/content/blog/predixlab-mcp.md", "fa77c1d60e700d3a573e121afd1c57272d01d353b86af57d93d12745af52673c"],
    ["public/images/blog/predixlab-mcp/architecture.png", "59be517558773e77f89c31c2d3cb09c5eef3c0993ffacede4f56d12db7b24173"],
    ["public/images/blog/predixlab-mcp/screening-illustration.png", "189931fac36ba2af0e30df60b5ef11fb5a5136c41fcf1b802dda7fa100d36dc8"],
    ["public/social/predixlab-mcp.png", "29d36f4cac1830887a006cea92d727a3d25315e53b8b622422c2f252a122ce72"],
  ]) assert.equal(hash(await readFile(new URL(`../${path}`, import.meta.url))), expected, path);
});

test("MCP announcement renders its route, dates, canonical, custom sharing artwork and approved inline images", async () => {
  assert.equal(blogPosts[0], post);
  assert.equal(post.slug, "predixlab-mcp");
  assert.equal(post.translationKey, "predixlab-mcp");
  assert.equal(post.category, "Product updates");
  const page = render(postPath);
  assert.equal(page.statusCode, 200);
  assert.equal(getPageForPath(postPath).key, "blogPost");
  assert.equal(page.seo.canonicalUrl, `${origin}${postPath}`);
  assert.ok(page.headHtml.includes(`rel="canonical" href="${origin}${postPath}"`));
  assert.equal(post.date, "2026-10-24");
  assert.equal(post.updated, "2026-10-24");
  assert.deepEqual([...page.appHtml.matchAll(/<time dateTime="([^"]+)"/g)].map(([, date]) => date), [
    "2026-10-24", "2026-10-24",
  ]);
  assert.equal(page.seo.imageUrl, `${origin}/social/predixlab-mcp.png`);
  assert.equal(page.seo.imageAlt, post.imageAlt);
  assert.ok(page.headHtml.includes(`property="og:image" content="${origin}/social/predixlab-mcp.png"`));
  const png = await readFile(new URL("../public/social/predixlab-mcp.png", import.meta.url));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(page.appHtml.includes(post.html));
  assert.equal([...post.html.matchAll(/<img\b/g)].length, 2);
  for (const name of ["architecture", "screening-illustration"]) {
    assert.match(post.html, new RegExp(`<img src="/images/blog/predixlab-mcp/${name}\\.png" alt="Illustrative example, not real data:`));
  }
  for (const href of [
    "https://dashboard.predixlab.com/profile",
    "https://github.com/predixlab/predixlab-api#mcp-agent-access",
  ]) assert.ok(post.html.includes(`href="${href}" target="_blank" rel="noopener noreferrer"`));
  const graph = page.seo.structuredData["@graph"];
  const article = graph.find((node) => node["@type"] === "BlogPosting");
  assert.equal(article.mainEntityOfPage, `${origin}${postPath}`);
  assert.equal(article.datePublished, "2026-10-24");
  assert.equal(article.dateModified, "2026-10-24");
  assert.deepEqual(article.image, {
    "@type": "ImageObject", url: `${origin}/social/predixlab-mcp.png`, width: 1200, height: 630,
  });
  assert.equal(post.questions.length, 6);
  validateFaqMarkup(page.appHtml, graph, page.seo.canonicalUrl);
});

test("MCP announcement is listed in the blog index and RSS; both MCP pages reach the sitemap and IndexNow", () => {
  const index = render("/blog/");
  assert.match(index.appHtml, /<h2 id="category-product-updates">Product updates<\/h2>/);
  assert.ok(index.appHtml.includes(`href="${postPath}"`));
  const list = index.seo.structuredData["@graph"].find((node) => node["@type"] === "ItemList");
  assert.equal(list.itemListElement[0].url, `${origin}${postPath}`);
  const feed = new XMLParser({ isArray: (_name, path) => path === "rss.channel.item" }).parse(renderBlogRss(blogPosts));
  assert.equal(feed.rss.channel.item[0].link, `${origin}${postPath}`);
  assert.equal(feed.rss.channel.item[0].pubDate, "Sat, 24 Oct 2026 00:00:00 GMT");
  assert.equal(feed.rss.channel.lastBuildDate, "Sat, 24 Oct 2026 00:00:00 GMT");
  assert.equal(blogUpdated, "2026-10-24");
  assert.equal(docsUpdated, "2026-10-24");
  const sitemapXml = renderSitemap();
  const sitemap = new XMLParser().parse(sitemapXml).urlset.url;
  const payload = buildIndexNowPayload(parseSitemap(sitemapXml));
  for (const path of [postPath, docPath, "/blog/", "/docs/"]) {
    const entries = sitemap.filter((entry) => entry.loc === `${origin}${path}`);
    assert.equal(entries.length, 1, path);
    assert.equal(entries[0].lastmod, "2026-10-24", path);
    assert.ok(payload.urlList.includes(`${origin}${path}`), path);
  }
});

test("MCP docs are English-only, dated and discoverable in the docs index, sidebar and structured data", () => {
  const page = render(docPath);
  assert.equal(page.statusCode, 200);
  assert.equal(getPageForPath(docPath).key, "doc");
  assert.equal(doc.slug, "mcp");
  assert.equal(doc.translationKey, "mcp");
  assert.equal(doc.order, 4);
  assert.equal(docs.at(-1), doc);
  assert.equal(doc.lang, "en");
  assert.equal(doc.date, "2026-10-24");
  assert.equal(doc.updated, "2026-10-24");
  assert.ok(doc.title.length <= 60);
  assert.ok(doc.description.length <= 155);
  assert.equal(page.seo.canonicalUrl, `${origin}${docPath}`);
  assert.deepEqual(page.seo.alternates, []);
  assert.doesNotMatch(page.headHtml, /hreflang/);
  assert.deepEqual(getPageSeo(docPath, "zh"), getPageSeo(docPath, "en"));
  assert.equal(getPageForPath(`/zh${docPath}`), undefined);
  assert.equal(getPageForPath(`/en${docPath}`), undefined);
  assert.ok(page.appHtml.includes(doc.html));
  assert.equal([...page.appHtml.matchAll(/<h1\b/g)].length, 1);
  assert.match(page.appHtml, /<time dateTime="2026-10-24">/);
  const article = page.seo.structuredData["@graph"].find((node) => node["@type"] === "TechArticle");
  assert.equal(article.datePublished, "2026-10-24");
  assert.equal(article.dateModified, "2026-10-24");
  const index = render("/docs/");
  assert.equal(docsIndex.updated, "2026-10-24");
  assert.match(index.appHtml, /<h2><a href="\/docs\/mcp\/"[^>]*>MCP integration<\/a><\/h2>/);
  assert.ok(index.appHtml.includes(doc.summary));
  const list = index.seo.structuredData["@graph"].find((node) => node["@type"] === "ItemList");
  assert.equal(list.itemListElement.at(-1).url, `${origin}${docPath}`);
  for (const entry of docs) {
    const html = render(entry.path).appHtml;
    const sidebar = html.match(/<nav class="docs-sidebar"[^>]*>([\s\S]*?)<\/nav>/)[1];
    const link = sidebar.match(/<a\b[^>]*href="\/docs\/mcp\/"[^>]*>/)[0];
    assert.equal(link.includes('aria-current="page"'), entry.path === docPath, entry.path);
  }
  validateInternalLinks(page.appHtml, page.seo.canonicalUrl, sitePages.map(({ path }) => path));
});

test("MCP docs enumerate the exact 18 tools and give a valid placeholder-only HTTP configuration", () => {
  const tools = [...doc.body.matchAll(/^\| `([^`]+)` \| ([^|\n]+) \|$/gm)];
  assert.deepEqual(tools.map(([, name]) => name), [
    "list_signal_dates", "get_signals", "get_pivot_signals", "get_alpharank_signals", "get_alpharank_history",
    "get_market_snapshot", "get_market_overview", "get_market_movers", "get_quotes", "get_technical_analysis",
    "run_screener", "list_screener_presets", "run_screener_preset",
    "list_option_activity_dates", "get_unusual_options", "get_option_activity", "get_gamma_exposure", "get_options_structure",
  ]);
  for (const [, name, description] of tools) {
    assert.match(description, /^[A-Z].+\.$/, name);
    assert.ok(doc.html.includes(`<code>${name}</code>`), name);
  }
  assert.deepEqual(JSON.parse(doc.body.match(/```json\n([\s\S]*?)\n```/)[1]), {
    mcpServers: {
      predixlab: {
        type: "http",
        url: "https://api.predixlab.com/mcp/",
        headers: { Authorization: "Bearer YOUR_API_KEY" },
      },
    },
  });
  assert.equal([...doc.body.matchAll(/^\d\. /gm)].length, 5);
  for (const phrase of [
    "Streamable HTTP MCP", "mcp:read", "Every request", "ordinary REST API",
    "**Profile**", "**Agent connections**", "**Create key**", "**Create MCP API key**",
    "**Key name**", "**Expires after**", "**Save your new key**", "**One-time API key**",
    "only once after creation or rotation", "Grok Bot", "custom remote HTTP MCP server",
    "OAuth is not supported for MCP", "no MCP OAuth discovery or dynamic client registration",
    "Clients that require OAuth cannot connect yet", "Adapt the outer structure",
    "YYYY-MM-DD", "omitting one selects the latest session visible to your account",
    "S&P 500 and Nasdaq-100 constituents", "once per trading day after the US close",
    "daily observations", "not live prices", "include that date in every answer",
    "Pivot picks, AlphaRank rankings and publication history, unusual options activity, gamma exposure, and options structure",
    "10 calendar days ago, not 10 trading sessions ago",
    "market snapshots, overviews, movers, quotes, technical analysis and screening do not have this 10-day gate",
    "latest published data without the Free delay", "](/pricing/)",
    "client-managed secret storage", "Never put it in URLs, shared files, source-controlled files or public chats",
    "**Revoke key**", "**Rotate key**", "old secret immediately",
    "The signal, backtest, API and dashboard code is open source (Apache-2.0). Market data is not included.",
    "For research and education only, not investment advice. Agents can make mistakes; check the data date and figures before relying on an answer.",
  ]) assert.ok(doc.body.includes(phrase), phrase);
  assert.doesNotMatch(doc.body, /real[- ]?time|live data streaming|intraday|实时|盘中|yahoo|cboe|predixlab-(?:collector|options)|fully open[ -]source|conservative|point-in-time/i);
  assert.doesNotMatch(doc.body, /plmcp_[\da-f]{32}_/);
});
