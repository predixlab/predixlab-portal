import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { GithubLogo, XLogo } from "@phosphor-icons/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { azureRouteKey, retiredRedirects, validateAzureRouteKeys, validateRetiredRedirects } from "./azure-routes.mjs";

const origin = "https://predixlab.com";
const productLinks = [
  { path: "/us-stock-signals/", label: "Daily signals", card: "Explore daily stock signals" },
  { path: "/quantitative-stock-screener/", label: "Stock screener", card: "Explore the stock screener" },
  { path: "/unusual-options-activity/", label: "Options activity", card: "Explore unusual options activity" },
];
const navigationLinks = [
  { path: "/#tools", label: "Tools" },
  { path: "/pricing/", label: "Pricing" },
  { path: "/docs/", label: "Docs" },
  { path: "/blog/", label: "Blog" },
  { path: "/about/", label: "About" },
];
const expectedRiskNote = "For information and independent analysis only — not investment advice. Data can be delayed or wrong, models can fail, and past performance doesn't predict future results.";
const officialProfiles = [
  { name: "GitHub", url: "https://github.com/predixlab", icon: GithubLogo },
  { name: "X", url: "https://x.com/predixlab", icon: XLogo },
];
const notFoundPaths = ["/404.html"];
const decodeHtml = (value) =>
  value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entity.startsWith("#")) {
      return String.fromCodePoint(
        entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)),
      );
    }
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity.toLowerCase()];
  });
const attributes = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), decodeHtml(value)]),
  );
const textContent = (html) =>
  decodeHtml(
    html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map(([tag]) => attributes(tag));
const assertVisibleLink = (html, href, label) => {
  assert.ok(
    [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].some(
      ([, attrs, content]) => attributes(attrs).href === href && textContent(content) === label,
    ),
    `Missing visible link: ${label} -> ${href}`,
  );
};
const only = (values, label) => {
  assert.equal(values.length, 1, `Expected one ${label}`);
  return values[0];
};
const fileForPath = (directory, pathname) =>
  join(directory, pathname.slice(1), pathname.endsWith("/") ? "index.html" : "");
const listHtmlFiles = async (directory, prefix = "") => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await listHtmlFiles(join(directory, entry.name), `${filename}/`));
    else if (filename.endsWith(".html")) files.push(`/${filename}`);
  }
  return files;
};

export const validateJsonLd = (html, pathname) => {
  const validateLanguages = (value) => {
    if (!value || typeof value !== "object") return;
    if ("inLanguage" in value) {
      assert.equal(value.inLanguage, "en", `${pathname} JSON-LD inLanguage must be en`);
    }
    Object.values(value).forEach(validateLanguages);
  };
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => attributes(attrs).type === "application/ld+json")
    .map(([, , content]) => {
      const schema = JSON.parse(content);
      validateLanguages(schema);
      return schema;
    });
};

export const validateInternalLinks = (html, canonicalUrl, publicPaths) => {
  for (const link of tags(html, "a")) {
    if (!link.href) continue;
    const destination = new URL(link.href, canonicalUrl);
    if (destination.origin === origin) {
      assert.ok(
        publicPaths.includes(destination.pathname) || destination.pathname === "/blog/rss.xml",
        `Noncanonical internal link: ${new URL(canonicalUrl).pathname} -> ${link.href}`,
      );
      assert.equal(destination.searchParams.has("lng"), false, canonicalUrl);
    }
  }
};

export const validateFaqMarkup = (main, graph, canonicalUrl) => {
  const pathname = new URL(canonicalUrl).pathname;
  const faqs = graph.filter((item) => item["@type"] === "FAQPage");
  if (pathname !== "/" && !productLinks.some(({ path }) => path === pathname)) {
    assert.equal(faqs.length, 0, `${pathname} must not emit FAQPage`);
    return;
  }
  const questions = [...main.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)]
    .filter(([, attrs]) => attributes(attrs).class?.split(/\s+/).includes("question"))
    .map(([, , content]) => ({
      "@type": "Question",
      name: textContent(only(
        [...content.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/g)],
        `${pathname} FAQ summary`,
      )[1]),
      acceptedAnswer: {
        "@type": "Answer",
        text: textContent(only(
          [...content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)],
          `${pathname} FAQ answer`,
        )[1]),
      },
    }));
  assert.ok(questions.length > 0, `${pathname} requires visible FAQs`);
  const faq = only(faqs, `${pathname} FAQPage`);
  const webpage = only(graph.filter((item) => item["@type"] === "WebPage"), `${pathname} WebPage`);
  assert.equal(faq["@id"], `${canonicalUrl}#faq`, pathname);
  assert.deepEqual(faq.isPartOf, { "@id": webpage["@id"] }, pathname);
  const parts = Array.isArray(webpage.hasPart) ? webpage.hasPart : [webpage.hasPart];
  assert.ok(parts.some((part) => part?.["@id"] === faq["@id"]), `${pathname} WebPage must link to FAQPage`);
  assert.deepEqual(faq.mainEntity, questions, `${pathname} JSON-LD must exactly match visible FAQ count and text`);
};

export const validateRobotsTxt = (robots) => {
  const trainingCrawlers = [
    "GPTBot", "CCBot", "Google-Extended", "ClaudeBot", "anthropic-ai", "Bytespider",
    "Applebot-Extended", "meta-externalagent", "Amazonbot", "cohere-training-data-crawler",
    "Diffbot", "omgili",
  ].map((agent) => agent.toLowerCase());
  const searchCrawlers = [
    "Googlebot", "Bingbot", "Baiduspider", "PetalBot", "GoogleOther", "YandexBot", "Sogou", "360Spider", "PerplexityBot",
  ].map((agent) => agent.toLowerCase());
  const groups = [];
  const sitemaps = [];
  for (const line of robots.split(/\r?\n/)) {
    const content = line.replace(/#.*$/, "").trim();
    if (!content) continue;
    const directive = content.match(/^([^:]+):\s*(.*)$/);
    assert.ok(directive, `Invalid robots.txt directive: ${content}`);
    const name = directive[1].trim().toLowerCase();
    const value = directive[2].trim();
    if (name === "sitemap") {
      sitemaps.push(value);
    } else if (name === "user-agent") {
      if (!groups.length || groups.at(-1).rules.length) {
        groups.push({ agents: [], rules: [] });
      }
      groups.at(-1).agents.push(value.toLowerCase());
    } else {
      assert.ok(["allow", "disallow"].includes(name), `Unexpected robots.txt directive: ${name}`);
      assert.ok(groups.length, "Crawler rules require a User-agent group");
      groups.at(-1).rules.push([name, value]);
    }
  }

  assert.equal(groups.length, 2, "Expected one public group and one AI-training group");
  const publicGroup = only(groups.filter(({ agents }) => agents.includes("*")), "wildcard crawler group");
  assert.deepEqual(publicGroup.agents, ["*"], "The wildcard crawler group must be separate");
  assert.deepEqual(publicGroup.rules, [["allow", "/"]], "Public crawling must remain allowed");
  for (const crawler of searchCrawlers) {
    assert.ok(
      groups.every(({ agents, rules }) =>
        !agents.includes(crawler) || rules.every(([name, value]) => name !== "disallow" || !value),
      ),
      `Search crawler must not be disallowed: ${crawler}`,
    );
  }
  const trainingGroup = only(groups.filter((group) => group !== publicGroup), "AI-training crawler group");
  assert.deepEqual([...trainingGroup.agents].sort(), trainingCrawlers.sort(), "AI-training crawler list differs");
  assert.deepEqual(trainingGroup.rules, [["disallow", "/"]], "AI-training crawlers must share one Disallow: /");
  assert.deepEqual(sitemaps, [`${origin}/sitemap.xml`], "Keep the production Sitemap line");
};

export const validateSeoOutput = async (directory, expectedPages) => {
  const config = JSON.parse(await readFile(join(directory, "staticwebapp.config.json"), "utf8"));
  assert.equal(config.trailingSlash, "auto", "Directory requests must redirect to trailing-slash URLs");
  assert.equal(config.mimeTypes?.[".webmanifest"], "application/manifest+json", "Serve the web manifest with its MIME type");
  assert.equal(config.navigationFallback, undefined, "No blanket SPA fallback");
  assert.deepEqual(config.responseOverrides?.["404"], { rewrite: "/404.html" }, "Preserve HTTP 404");
  assert.ok(
    config.routes.every((rule) => !rule.route.endsWith("/") || rule.rewrite === undefined),
    "Directory routes must not rewrite native indexes",
  );
  const publicPaths = config.routes
    .filter((rule) => rule.route.endsWith("/index.html"))
    .map((rule) => rule.route.slice(0, -"index.html".length));
  assert.ok(publicPaths.length > 0, "Public index-alias redirects are required");
  assert.ok(publicPaths.every((pathname) => !/^\/(?:en|zh)\//.test(pathname)), "Language-prefixed canonical route");
  const docsPaths = publicPaths.filter((pathname) => pathname.startsWith("/docs/"));
  for (const pathname of ["/docs/", "/docs/how-it-works/", "/docs/limitations/", "/docs/self-hosting/"]) {
    assert.ok(docsPaths.includes(pathname), `Missing Docs route: ${pathname}`);
  }
  assert.ok(config.routes.every(({ route }) => !/^\/(?:methodology|open-source)(?:\/|$)/.test(route)), "Unpublished drafts must have no deployment rules");
  for (const slug of ["methodology", "open-source"]) {
    await assert.rejects(access(join(directory, slug)), { code: "ENOENT" }, `Unpublished output directory: ${slug}`);
  }
  validateRetiredRedirects(config.routes);
  assert.ok(
    config.routes.every((rule) => !/^\/(?:en|zh)(?:\/|$)/.test(rule.route) || retiredRedirects.some(({ route }) => route === rule.route)),
    "No legacy language routes except the explicit retired insights redirects",
  );
  for (const rule of retiredRedirects) {
    assert.ok(publicPaths.includes(rule.redirect), `Missing redirect target: ${rule.redirect}`);
  }
  const rssRule = config.routes.find((rule) => rule.route === "/blog/rss.xml");
  assert.equal(rssRule?.rewrite, undefined, "Serve the feed as a static file");
  assert.equal(rssRule?.redirect, undefined, "Do not redirect the feed");
  if (rssRule?.headers?.["Content-Type"]) {
    assert.ok(["application/rss+xml", "text/xml"].includes(rssRule.headers["Content-Type"]), "RSS readers accept Azure's text/xml");
  }
  assert.equal(config.mimeTypes?.[".xml"], undefined, "Do not override the MIME type for all XML, including the sitemap");
  validateAzureRouteKeys(config.routes);
  assert.ok(
    config.routes.every((rule) => azureRouteKey(rule.route) !== "/robots.txt"),
    "Serve /robots.txt directly from the public file",
  );
  const cacheRoutes = ["/assets/*", "/fonts/*"];
  assert.deepEqual(
    config.routes.filter((rule) => cacheRoutes.includes(rule.route)),
    cacheRoutes.map((route) => ({
      route,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    })),
    "Assets and fonts require header-only immutable cache rules",
  );
  const otherRoutes = config.routes.filter((rule) => !cacheRoutes.includes(rule.route));
  assert.ok(otherRoutes.every((rule) => !rule.route.includes("*")), "Unknown paths must remain 404s");
  for (const rule of otherRoutes) {
    assert.equal(rule.headers?.["Cache-Control"], undefined, `Unexpected caching on ${rule.route}`);
  }
  assert.equal(config.globalHeaders?.["Cache-Control"], undefined, "No global caching override");

  const sitemap = await readFile(join(directory, "sitemap.xml"), "utf8");
  assert.doesNotMatch(sitemap, /\/(?:methodology|open-source)\//, "Unpublished drafts must not be in the sitemap");
  assert.doesNotMatch(sitemap, /xmlns:xhtml|xhtml:link|hreflang|[?&]lng=|404\.html|\/insights(?:\/|<)|https:\/\/predixlab\.com\/(?:en|zh)(?:\/|<)/);
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, xml]) => ({
    url: decodeHtml(only([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)], "sitemap location")[1]),
    alternates: tags(xml, "xhtml:link"),
    lastmods: [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(([, date]) => date),
  }));
  for (const entry of entries) {
    assert.ok(entry.lastmods.length <= 1, `Duplicate sitemap lastmod: ${entry.url}`);
    for (const date of entry.lastmods) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, entry.url);
      assert.equal(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), date, entry.url);
    }
  }
  assert.deepEqual(
    entries.map(({ url }) => url).sort(),
    publicPaths.map((pathname) => `${origin}${pathname}`).sort(),
    "Sitemap and deployed route inventories differ",
  );
  if (expectedPages) {
    assert.deepEqual(
      [...expectedPages.keys()].sort(),
      [...publicPaths, ...notFoundPaths].sort(),
      "Generated routes differ from the source inventory",
    );
  }

  const expectedHtml = [...publicPaths.map((pathname) => `${pathname}index.html`), ...notFoundPaths];
  assert.deepEqual((await listHtmlFiles(directory)).sort(), expectedHtml.sort(), "Unexpected or missing HTML pages");
  const checkedImages = new Set();
  const publishedPosts = [];
  const logoPath = "/icons/icon-transparent.png";
  const logoPng = await readFile(fileForPath(directory, logoPath));
  assert.equal(logoPng.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Organization logo must be a PNG");
  const logoWidth = logoPng.readUInt32BE(16);
  const logoHeight = logoPng.readUInt32BE(20);
  assert.ok(logoWidth >= 112 && logoHeight >= 112, "Organization logo must be at least 112x112");
  assert.deepEqual(
    await readFile(join(directory, "favicon.ico")),
    await readFile(join(directory, "icons/icon.ico")),
    "Root favicon must preserve the existing icon",
  );
  const appleIcon = await readFile(join(directory, "apple-touch-icon.png"));
  assert.equal(appleIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Apple touch icon must be a PNG");
  assert.equal(appleIcon.readUInt32BE(16), 180, "Apple touch icon width");
  assert.equal(appleIcon.readUInt32BE(20), 180, "Apple touch icon height");
  const manifest = JSON.parse(await readFile(join(directory, "site.webmanifest"), "utf8"));
  assert.equal(manifest.name, "PredixLab");
  assert.equal(manifest.short_name, "PredixLab");
  assert.equal(manifest.start_url, "/");
  assert.ok(["browser", "standalone"].includes(manifest.display));
  assert.equal(manifest.theme_color, "#f5f6f1");
  assert.equal(manifest.background_color, "#f5f6f1");
  assert.ok(manifest.icons.length > 0, "Manifest requires icons");
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("/"), "Manifest icons must be local");
    await access(fileForPath(directory, icon.src));
  }

  for (const pathname of [...publicPaths, ...notFoundPaths]) {
    const html = await readFile(fileForPath(directory, pathname), "utf8");
    const isNotFound = notFoundPaths.includes(pathname);
    const isBlog = pathname.startsWith("/blog/");
    const isPost = isBlog && pathname !== "/blog/";
    const isDocs = pathname.startsWith("/docs/");
    const isDoc = isDocs && pathname !== "/docs/";
    const isDocument = isPost || isDoc;
    const isNewPage = isBlog || isDocs;
    const language = "en";
    assert.match(html, new RegExp(`<html lang="${language}">`), pathname);
    assert.doesNotMatch(html, /<!--(?:seo-head|app-html)-->|fonts\.(?:googleapis|gstatic)\.com|[?&]lng=/, pathname);
    if (!isNewPage) assert.doesNotMatch(decodeHtml(html), /\u7814\u7a76/, `Outdated Chinese copy: ${pathname}`);
    assert.doesNotMatch(html, /\/(?:methodology|open-source)\//, `Unpublished draft reference: ${pathname}`);
    assert.doesNotMatch(html, /https?:\/\/github\.com\/predixlab\/predixlab-(?:collector|options)(?:[/"#?.\s]|$)/i, `Unavailable repository reference: ${pathname}`);
    assert.doesNotMatch(textContent(html), /fully open[ -]source|all code from data collection|the full code is open source|代码全部开源|全部开源/i, `Open-source overclaim: ${pathname}`);
    assert.match(html, /<div id="root">[\s\S]+<main\b/, `Empty application: ${pathname}`);
    const languageButton = only(
      tags(html, "button").filter((button) => button.class?.split(" ").includes("language-button")),
      `${pathname} in-page language button`,
    );
    assert.equal(languageButton.type, "button", pathname);
    assert.equal(languageButton.lang, "zh-CN", `The default English page must offer Chinese: ${pathname}`);
    assert.equal(languageButton.href, undefined, `Language changes must not navigate: ${pathname}`);
    const head = only([...html.matchAll(/<head>([\s\S]*?)<\/head>/g)], `${pathname} head`)[1];
    const main = only([...html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main>/g)], `${pathname} main`)[1];
    const header = only([...html.matchAll(/<header\b[^>]*>([\s\S]*?)<\/header>/g)], `${pathname} header`)[1];
    const footer = only([...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/g)], `${pathname} footer`)[1];
    assert.doesNotMatch(footer, /<h[1-6]\b/i, `${pathname} footer must not contain headings`);
    const navigation = [...header.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/g)];
    assert.equal(navigation.length, 2, `${pathname} desktop and mobile navigation`);
    for (const [, nav] of navigation) {
      const links = tags(nav, "a");
      assert.deepEqual(
        links.filter((link) => link.class?.split(" ").includes("nav-link")).map(({ href }) => href),
        navigationLinks.map(({ path }) => path),
        `${pathname} flat nav order`,
      );
      for (const { path, label } of navigationLinks) assertVisibleLink(nav, path, label);
      assert.ok(!links.some((link) => productLinks.some(({ path }) => link.href === path)), `${pathname} no product header links`);
      only(links.filter((link) => link.href === officialProfiles[0].url), `${pathname} GitHub navigation link`);
      only(links.filter((link) => link.href?.startsWith("https://dashboard.predixlab.com/")), `${pathname} Dashboard navigation link`);
    }
    if (pathname === "/") {
      for (const { path, card } of productLinks) assertVisibleLink(main, path, card);
    } else if (pathname === "/pricing/") {
      const table = only([...main.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)], "pricing comparison table")[1];
      for (const { path, label } of productLinks) assertVisibleLink(table, path, label);
    }
    assert.doesNotMatch(textContent(footer), /Open source \(Apache-2\.0\)|开源（Apache-2\.0）/, `Removed open-source status: ${pathname}`);
    assert.doesNotMatch(decodeHtml(footer), /contact@predixlab\.com/i, `Removed footer email: ${pathname}`);
    const footerLinks = [...footer.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    for (const profile of officialProfiles) {
      const link = only(
        footerLinks.filter(([, attrs]) => attributes(attrs).href === profile.url),
        `${pathname} ${profile.name} footer link`,
      );
      const attrs = attributes(link[1]);
      assert.equal(attrs.target, "_blank", pathname);
      assert.deepEqual(attrs.rel?.split(/\s+/).sort(), ["noopener", "noreferrer"], pathname);
      assert.ok(attrs["aria-label"]?.trim(), `Missing accessible profile label: ${pathname}`);
      assert.equal(attrs["aria-label"], `PredixLab on ${profile.name} (opens in a new tab)`, pathname);
      assert.equal(textContent(link[2]), "", `Profile links must not contain text: ${pathname}`);
      assert.equal(
        link[2].trim(),
        renderToStaticMarkup(createElement(profile.icon, { "aria-hidden": "true" })),
        `${pathname} ${profile.name} link must contain only its aria-hidden logo, without an external-link glyph`,
      );
    }
    const h1 = textContent(only([...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)], `${pathname} h1`)[1]);
    assert.ok(h1.length > 0 && textContent(main).length > (isNotFound ? 30 : 200), `Missing page copy: ${pathname}`);
    const title = textContent(only([...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/g)], `${pathname} title`)[1]);
    const metas = tags(head, "meta");
    const meta = (name) => only(metas.filter((tag) => (tag.name ?? tag.property) === name), `${pathname} ${name}`).content;
    const links = tags(head, "link");
    assert.equal(only(links.filter((link) => link.rel === "icon" && link.href === "/favicon.ico"), "root favicon").sizes, "48x48");
    only(links.filter((link) => link.rel === "icon" && link.href === "/icons/icon.svg"), "SVG favicon");
    assert.equal(only(links.filter((link) => link.rel === "apple-touch-icon"), "Apple touch icon").href, "/apple-touch-icon.png");
    assert.equal(only(links.filter((link) => link.rel === "manifest"), "web manifest").href, "/site.webmanifest");
    only(
      tags(head, "script").filter((script) => script.type === "module" && script.src?.startsWith("/assets/")),
      `${pathname} hydration entry`,
    );
    only(links.filter((link) => link.rel === "stylesheet"), `${pathname} stylesheet`);
    const canonical = links.filter((link) => link.rel === "canonical");
    const alternates = links.filter((link) => link.rel === "alternate");
    const description = meta("description");
    assert.ok(title.length > 0 && description.length > 0, pathname);
    assert.ok(title.length <= 60, `${pathname} title exceeds 60 characters (${title.length})`);
    const descriptionLimit = pathname === "/" && language === "en" ? 157 : 155;
    assert.ok(description.length <= descriptionLimit, `${pathname} description exceeds ${descriptionLimit} characters (${description.length})`);
    if (pathname === "/") {
      assert.equal(h1, "US stock analysis with open-source signal code: daily signals, screener, and options activity");
      const subhead = only(
        [...main.matchAll(/<p class="hero-description">([\s\S]*?)<\/p>/g)],
        "homepage hero subhead",
      )[1];
      assert.equal(textContent(subhead), "Use the hosted dashboard for S&P 500 and Nasdaq-100 stocks. Built on daily data, with the method documented and each signal shown alongside that stock's past signals.");
      assert.equal(title, "US Stock Analysis with Open-Source Signal Code | PredixLab");
      assert.equal(description, "US stock screener, daily signals and options activity built from daily data. The signal and backtest code is open source (Apache-2.0). Not investment advice.");
      only(tags(main, "section").filter(({ id }) => id === "tools"), "homepage Tools target");
      assert.match(subhead, /href="\/docs\/how-it-works\/"/, "Documented method link");
    }
    assert.equal(meta("og:title"), title, pathname);
    assert.equal(meta("twitter:title"), title, pathname);
    assert.equal(meta("og:description"), description, pathname);
    assert.equal(meta("twitter:description"), description, pathname);
    assert.equal(meta("og:locale"), language === "en" ? "en_US" : "zh_CN", pathname);
    assert.equal(meta("og:type"), isDocument ? "article" : "website", pathname);
    if (!isDocument) assert.ok(metas.every((tag) => !tag.property?.startsWith("article:")), pathname);
    assert.ok(metas.every((tag) => tag.property !== "og:locale:alternate"), pathname);
    assert.equal(meta("twitter:card"), "summary_large_image", pathname);
    assert.equal(meta("twitter:site"), "@predixlab", pathname);
    assert.equal(meta("twitter:image"), meta("og:image"), pathname);
    assert.equal(meta("twitter:image:alt"), meta("og:image:alt"), pathname);
    if (isDocument && meta("og:image") === `${origin}/social/predixlab-research.png`) {
      assert.equal(meta("og:image:alt"), title, `${pathname} temporary article image alt`);
    } else {
      assert.notEqual(meta("og:image:alt"), title, "Image alt must describe the artwork, not repeat the page title");
    }
    assert.ok(meta("og:image:alt").length > 30, "Descriptive sharing-image alt text");
    assert.equal(meta("og:image:width"), "1200", pathname);
    assert.equal(meta("og:image:height"), "630", pathname);
    assert.equal(meta("theme-color"), "#f5f6f1", pathname);

    const image = new URL(meta("og:image"));
    assert.equal(image.origin, origin, pathname);
    if (!checkedImages.has(image.pathname)) {
      const png = await readFile(fileForPath(directory, image.pathname));
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", image.pathname);
      assert.equal(png.readUInt32BE(16), 1200, image.pathname);
      assert.equal(png.readUInt32BE(20), 630, image.pathname);
      checkedImages.add(image.pathname);
    }
    for (const resource of [
      ...tags(head, "script").map((tag) => tag.src),
      ...links.filter((link) => ["icon", "apple-touch-icon", "manifest", "stylesheet", "preload", "modulepreload"].includes(link.rel)).map((link) => link.href),
      ...tags(main, "img").map((tag) => tag.src),
    ].filter((url) => url?.startsWith("/"))) {
      await access(fileForPath(directory, new URL(resource, origin).pathname));
    }

    const schemas = validateJsonLd(html, pathname);
    const expected = expectedPages?.get(pathname);
    if (expected) {
      assert.equal(title, expected.title, pathname);
      assert.equal(description, expected.description, pathname);
      assert.equal(meta("robots"), expected.robots, pathname);
    }
    if (isNotFound) {
      assert.match(meta("robots"), /^noindex\b/, pathname);
      assert.equal(canonical.length, 0, pathname);
      assert.equal(alternates.length, 0, pathname);
      assert.equal(schemas.length, 0, pathname);
      continue;
    }

    const canonicalUrl = `${origin}${pathname}`;
    validateInternalLinks(html, canonicalUrl, publicPaths);
    assert.equal(only(canonical, `${pathname} canonical`).href, canonicalUrl, pathname);
    assert.equal(meta("og:url"), canonicalUrl, pathname);
    assert.match(meta("robots"), /^index, follow/, pathname);
    assert.deepEqual(alternates, isBlog ? [{
      rel: "alternate",
      type: "application/rss+xml",
      title: "PredixLab Blog RSS",
      href: `${origin}/blog/rss.xml`,
    }] : [], `Only blog RSS discovery is allowed; no language alternates: ${pathname}`);
    const entry = only(entries.filter(({ url }) => url === canonicalUrl), `${pathname} sitemap entry`);
    assert.deepEqual(entry.alternates, [], pathname);
    if (expected) assert.deepEqual(entry.lastmods, expected.lastmod ? [expected.lastmod] : [], pathname);

    const schema = only(schemas, `${pathname} JSON-LD`);
    if (expected) assert.deepEqual(schema, expected.structuredData, pathname);
    assert.equal(schema["@context"], "https://schema.org", pathname);
    assert.doesNotMatch(JSON.stringify(schema), /"(?:aggregateRating|review|reviews|ratingValue|performance|accuracy|returns?)"/, pathname);
    const graph = schema["@graph"];
    assert.equal(graph.find((item) => item["@type"] === "WebSite")?.inLanguage, "en", pathname);
    assert.ok(graph.every((item) => item["@type"] !== "Article"), `Retired article schema: ${pathname}`);
    const pageType = pathname === "/blog/" || pathname === "/docs/" ? "CollectionPage" : "WebPage";
    for (const type of ["Organization", "WebSite", pageType]) {
      only(graph.filter((item) => item["@type"] === type), `${pathname} ${type}`);
    }
    const organization = graph.find((item) => item["@type"] === "Organization");
    assert.deepEqual(organization.sameAs, officialProfiles.map(({ url }) => url), `${pathname} official profiles`);
    assert.deepEqual(organization.logo, {
      "@type": "ImageObject",
      url: `${origin}${logoPath}`,
      width: logoWidth,
      height: logoHeight,
    }, `${pathname} PNG organization logo`);
    const webpage = graph.find((item) => item["@type"] === pageType);
    assert.equal(webpage.url, canonicalUrl, pathname);
    assert.equal(webpage.inLanguage, language, pathname);
    const breadcrumbs = graph.filter((item) => item["@type"] === "BreadcrumbList");
    if (pathname === "/") assert.equal(breadcrumbs.length, 0, pathname);
    else {
      const items = only(breadcrumbs, `${pathname} breadcrumb`).itemListElement;
      const visibleBreadcrumb = isNewPage ? only(
        [...main.matchAll(/<nav\b[^>]*class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/g)],
        `${pathname} visible breadcrumb`,
      )[1] : null;
      const name = isDocument ? textContent(only(
        [...visibleBreadcrumb.matchAll(/<span aria-current="page">([\s\S]*?)<\/span>/g)],
        `${pathname} document short title`,
      )[1]) : productLinks.find((link) => link.path === pathname)?.label ?? {
        "/pricing/": "Pricing", "/about/": "About", "/terms/": "Terms", "/privacy/": "Privacy",
        "/docs/": "Docs", "/blog/": "Blog",
      }[pathname];
      assert.equal(typeof name, "string", `${pathname} missing short breadcrumb name`);
      assert.deepEqual(items.map((item) => item.name), [
        "Home",
        ...(isDocument ? [isPost ? "Blog" : "Docs"] : []),
        name,
      ], `${pathname} short breadcrumbs`);
      assert.equal(items.at(-1).item, canonicalUrl, pathname);
      items.forEach((item, index) => {
        assert.equal(item.position, index + 1, pathname);
        assert.ok(entries.some(({ url }) => url === item.item), `Noncanonical breadcrumb: ${item.item}`);
      });
      if (isNewPage) {
        const visible = textContent(visibleBreadcrumb);
        for (const item of items) assert.ok(visible.includes(item.name), `${pathname} invisible breadcrumb`);
        assert.notEqual(items.at(-1).name, title, `${pathname} breadcrumb must use a short name`);
        assert.deepEqual(items.map(({ item }) => item), isPost || isDoc
          ? [`${origin}/`, `${origin}/${isPost ? "blog" : "docs"}/`, canonicalUrl]
          : [`${origin}/`, canonicalUrl], pathname);
        if (isDocs) assert.equal(items[1].name, "Docs", pathname);
      }
    }
    if (isNewPage) {
      assert.doesNotMatch(textContent(main), /real[- ]?time|实时/i, pathname);
      assert.ok(tags(main, "a").some(({ href }) => href === "/docs/how-it-works/"), `${pathname} how-it-works link`);
      const disclaimer = only(
        [...main.matchAll(/<div class="content-disclaimer markdown-content"[^>]*>([\s\S]*?)<\/div>/g)],
        `${pathname} risk disclaimer`,
      )[1];
      assert.equal(textContent(disclaimer), expectedRiskNote, `${pathname} exact English risk note`);
      assert.doesNotMatch(textContent(disclaimer), /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303f]/u, `${pathname} English-only disclaimer`);
      assert.equal(textContent(html).split(expectedRiskNote).length - 1, 1, `${pathname} risk note must appear exactly once`);
      assert.doesNotMatch(textContent(footer), /investment advice|投资建议/, `${pathname} duplicate footer disclaimer`);
    }
    if (isDocument) {
      for (const link of tags(main, "a").filter(({ href }) => href?.startsWith("https://"))) {
        if (new URL(link.href).origin === origin) continue;
        assert.equal(link.target, "_blank", `${pathname} external link`);
        assert.deepEqual(link.rel?.split(/\s+/).sort(), ["noopener", "noreferrer"], `${pathname} external link`);
      }
      const dates = tags(main, "time").map(({ datetime }) => datetime);
      if (isPost || isDoc) {
        const article = only(
          graph.filter((item) => item["@type"] === (isPost ? "BlogPosting" : "TechArticle")),
          `${pathname} article`,
        );
        assert.equal(article.headline, title, pathname);
        assert.equal(article.description, description, pathname);
        assert.equal(article.inLanguage, "en", pathname);
        assert.equal(article.mainEntityOfPage, canonicalUrl, pathname);
        assert.deepEqual(article.author, { "@id": organization["@id"] }, pathname);
        assert.deepEqual(article.publisher, { "@id": organization["@id"] }, pathname);
        for (const date of [article.datePublished, article.dateModified]) {
          assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `${pathname} article date`);
          assert.equal(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), date, pathname);
        }
        assert.ok(article.dateModified >= article.datePublished, `${pathname} modification precedes publication`);
        assert.equal(meta("article:published_time"), article.datePublished, pathname);
        assert.equal(meta("article:modified_time"), article.dateModified, pathname);
        assert.deepEqual(dates, isPost ? [article.datePublished, article.dateModified] : [article.dateModified], pathname);
        assert.deepEqual(entry.lastmods, [article.dateModified], pathname);
        assert.deepEqual(article.image, {
          "@type": "ImageObject", url: meta("og:image"), width: 1200, height: 630,
        }, pathname);
        if (!isPost) {
          const sidebar = only([...main.matchAll(/<nav class="docs-sidebar"[^>]*>([\s\S]*?)<\/nav>/g)], `${pathname} Docs sidebar`)[1];
          assert.deepEqual(tags(sidebar, "a").map(({ href }) => href), docsPaths, `${pathname} Docs sidebar inventory`);
          const currentDoc = only(tags(sidebar, "a").filter((link) => link["aria-current"] === "page"), `${pathname} current doc`);
          assert.equal(currentDoc.href, pathname, pathname);
        } else {
          publishedPosts.push({ ...article, url: canonicalUrl });
          assert.match(main, /<aside class="post-related"/, pathname);
          assert.ok(tags(main, "a").some(({ href }) =>
            href?.startsWith("/blog/") && href !== pathname), `${pathname} related post`);
        }
      }
    }
    if (pathname === "/blog/backtest-biases/") {
      const checkboxes = tags(main, "input");
      assert.equal(checkboxes.length, 8, `${pathname} checklist must retain all eight tasks`);
      for (const checkbox of checkboxes) {
        assert.equal(checkbox.type, "checkbox", `${pathname} checklist input`);
        assert.equal(checkbox.disabled, "", `${pathname} task checkboxes must be disabled`);
        assert.equal(checkbox.checked, undefined, `${pathname} tasks must remain unchecked`);
      }
      assert.doesNotMatch(main, /- \[ \]/, `${pathname} task syntax must render as checkboxes`);
    }
    if (pathname === "/docs/how-it-works/") {
      assert.match(main, /<li><strong>Daily data only, updated once per trading day after the US close\.<\/strong> Prices are daily bars\. Signals and options data are produced by scheduled nightly jobs and labeled with a data date\.<\/li>/, pathname);
      assert.doesNotMatch(main, /id="known-limitations"/, "Limitations must have their own page");
      assert.match(main, /id="check-it-yourself"/, pathname);
      assert.ok(tags(main, "a").some(({ href }) => href === "/docs/self-hosting/"), pathname);
    }
    if (pathname === "/docs/self-hosting/") {
      assert.equal(h1, "Run the open-source signal code", pathname);
      assert.equal(textContent(only(
        [...main.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/g)],
        `${pathname} intro`,
      )[1]), "The signal, backtest, API and dashboard code is open source (Apache-2.0).", pathname);
      assert.equal(description, "Run PredixLab's open-source signal and backtest code with your own daily price data.", pathname);
      assert.ok(textContent(main).includes("Data collection and options analysis run as part of the hosted service and aren't in the public repositories."), pathname);
      assert.ok(textContent(main).includes("The license does not grant rights to any third-party market data; data providers keep their own terms."), pathname);
      assert.doesNotMatch(textContent(html), /yahoo|cboe|bypass/i, pathname);
      const repositories = graph.filter((item) => item["@type"] === "SoftwareSourceCode");
      assert.deepEqual(repositories.map(({ name }) => name).sort(), [
        "predixlab-api", "predixlab-campaign", "predixlab-infra",
        "predixlab-portal", "predixlab-signals", "predixlab-webapp",
      ], pathname);
      for (const repository of repositories) {
        assert.equal(repository.license, "https://www.apache.org/licenses/LICENSE-2.0", pathname);
        assert.match(repository.codeRepository, /^https:\/\/github.com\/predixlab\/predixlab-[a-z]+$/, pathname);
        assert.ok(repository.programmingLanguage.length > 0, pathname);
        assert.deepEqual(repository.author, { "@id": organization["@id"] }, pathname);
        assert.deepEqual(repository.publisher, repository.author, pathname);
        assert.ok(tags(main, "a").some(({ href }) => href === repository.codeRepository), pathname);
      }
    }
    if (pathname === "/docs/") {
      assert.equal(h1, "How PredixLab works, where it falls short, and how to run the signal code", pathname);
      const cards = [...main.matchAll(/<h2><a href="([^"]+)"/g)].map(([, href]) => href);
      assert.deepEqual(cards, docsPaths.slice(1), "Docs index must list every doc in order");
      const list = only(graph.filter((item) => item["@type"] === "ItemList"), "Docs ItemList");
      assert.deepEqual(webpage.mainEntity, { "@id": list["@id"] }, "Docs collection lists its documents");
      assert.deepEqual(list.itemListElement.map(({ url }) => url), cards.map((path) => `${origin}${path}`), "Docs ItemList order matches the cards");
      list.itemListElement.forEach((item, index) => {
        assert.equal(item.position, index + 1, "Docs ItemList positions");
        assert.ok(item.description?.length > 0 && textContent(main).includes(item.description), "Docs summaries are visible");
      });
      assert.doesNotMatch(textContent(main), /All PredixLab components/, "Do not repeat the self-hosting overclaim");
      assert.equal(entry.lastmods[0], entries.filter(({ url }) =>
        new URL(url).pathname.startsWith("/docs/") && url !== canonicalUrl,
      ).flatMap(({ lastmods }) => lastmods).sort().at(-1), "Docs lastmod must be the newest doc update");
    }
    if (pathname === "/blog/") {
      assert.equal(h1, "Guides to backtesting and validating stock signals", pathname);
      const list = only(graph.filter((item) => item["@type"] === "ItemList"), "blog ItemList");
      assert.deepEqual(
        list.itemListElement.map(({ url }) => url).sort(),
        entries.filter(({ url }) => new URL(url).pathname.startsWith("/blog/") && url !== canonicalUrl).map(({ url }) => url).sort(),
        "Blog listing must contain every post",
      );
      assert.equal(entry.lastmods[0], entries.filter(({ url }) =>
        new URL(url).pathname.startsWith("/blog/") && url !== canonicalUrl,
      ).flatMap(({ lastmods }) => lastmods).sort().at(-1), "Blog lastmod must be the newest post update");
    }
    validateFaqMarkup(main, graph, canonicalUrl);
    for (const software of graph.filter((item) => item["@type"] === "SoftwareApplication")) {
      assert.ok(["/", "/pricing/", "/us-stock-signals/", "/quantitative-stock-screener/", "/unusual-options-activity/"].includes(pathname), pathname);
      assert.deepEqual(software.offers.map((offer) => offer.price), pathname === "/pricing/" ? [0, 20, 192] : [0], pathname);
      software.offers.forEach((offer) => assert.equal(offer.priceCurrency, "USD", pathname));
      if (pathname === "/pricing/") {
        assert.deepEqual(software.offers.slice(1).map((offer) => offer.priceSpecification.billingDuration), ["P1M", "P1Y"], pathname);
      }
    }
  }

  const rss = await readFile(join(directory, "blog/rss.xml"), "utf8");
  assert.equal(XMLValidator.validate(rss), true, "RSS must parse as XML");
  const feed = new XMLParser({
    ignoreAttributes: false,
    isArray: (_name, path) => path === "rss.channel.item",
  }).parse(rss);
  assert.equal(feed.rss["@_version"], "2.0", "RSS version");
  const channel = feed.rss.channel;
  assert.equal(channel.language, "en", "RSS language");
  assert.equal(channel.link, `${origin}/blog/`, "RSS channel URL");
  assert.deepEqual(channel["atom:link"], {
    "@_href": `${origin}/blog/rss.xml`,
    "@_rel": "self",
    "@_type": "application/rss+xml",
  }, "RSS self link uses the production host");
  const latestPostDate = publishedPosts.flatMap((post) => [post.datePublished, post.dateModified]).sort().at(-1);
  if (latestPostDate) {
    assert.equal(channel.lastBuildDate, new Date(`${latestPostDate}T00:00:00Z`).toUTCString(), "RSS build date follows the newest post, not the build clock");
  } else {
    assert.equal(channel.lastBuildDate, undefined, "An empty feed has no post-derived build date");
  }
  const items = channel.item ?? [];
  assert.equal(items.length, publishedPosts.length, "RSS includes every post");
  for (const post of publishedPosts) {
    const item = only(items.filter((item) => item.link === post.url), `RSS post: ${post.url}`);
    assert.equal(item.title, post.headline, post.url);
    assert.equal(item.description, post.description, post.url);
    assert.equal(item.guid["#text"], post.url, post.url);
    assert.equal(item.guid["@_isPermaLink"], "true", post.url);
    assert.equal(item.pubDate, new Date(`${post.datePublished}T00:00:00Z`).toUTCString(), post.url);
  }

  for (const pathname of publicPaths) {
    const match = (url) => config.routes.find((rule) => azureRouteKey(rule.route) === azureRouteKey(url));
    assert.equal(match(pathname), undefined, `Serve the directory index natively: ${pathname}`);
    if (pathname !== "/") {
      assert.equal(match(pathname.slice(0, -1)), undefined, `Do not intercept trailing-slash redirects: ${pathname}`);
    }
    const alias = `${pathname}index.html`;
    assert.deepEqual(match(alias), { route: alias, redirect: pathname, statusCode: 301 }, alias);
  }
  const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
  for (const name of await readdir(publicDirectory)) {
    if (name.endsWith(".txt")) {
      assert.deepEqual(await readFile(join(directory, name)), await readFile(join(publicDirectory, name)), `Changed public text: ${name}`);
    }
  }
  validateRobotsTxt(await readFile(join(directory, "robots.txt"), "utf8"));
  console.log(`SEO invariants passed for ${publicPaths.length} default-English canonical pages and the 404 document.`);
};

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const { createServer } = await import("vite");
  const server = await createServer({
    appType: "custom",
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { publicPaths, getPageSeo } = await server.ssrLoadModule("/src/seo.ts");
    const expectedPages = new Map([...publicPaths, ...notFoundPaths].map((path) => [path, getPageSeo(path)]));
    await validateSeoOutput(fileURLToPath(new URL("../dist/", import.meta.url)), expectedPages);
  } finally {
    await server.close();
  }
}
