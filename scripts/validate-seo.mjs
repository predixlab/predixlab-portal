import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { azureRouteKey, validateAzureRouteKeys } from "./azure-routes.mjs";

const origin = "https://predixlab.com";
const notFoundPaths = ["/404.html"];
export const retiredPagePaths = [
  "/insights/",
  "/insights/walk-forward-validation-stock-signals/",
  "/en/insights/",
  "/en/insights/walk-forward-validation-stock-signals/",
];
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
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decodeHtml(value)]),
  );
const textContent = (html) =>
  decodeHtml(
    html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map(([tag]) => attributes(tag));
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

export const validateRobotsTxt = (robots) => {
  const trainingCrawlers = [
    "GPTBot", "CCBot", "Google-Extended", "ClaudeBot", "anthropic-ai", "Bytespider",
    "Applebot-Extended", "meta-externalagent", "Amazonbot", "cohere-training-data-crawler",
    "PerplexityBot", "Diffbot", "omgili",
  ].map((agent) => agent.toLowerCase());
  const searchCrawlers = [
    "Googlebot", "Bingbot", "Baiduspider", "PetalBot", "GoogleOther", "YandexBot", "Sogou", "360Spider",
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
  assert.equal(config.navigationFallback, undefined, "No blanket SPA fallback");
  assert.deepEqual(config.responseOverrides?.["404"], { rewrite: "/404.html" }, "Preserve HTTP 404");
  const canonicalRules = config.routes.filter(
    (rule) => rule.route.endsWith("/") && rule.rewrite === `${rule.route}index.html`,
  );
  const publicPaths = canonicalRules.map((rule) => rule.route);
  assert.equal(publicPaths.length, 8, "One canonical route is required per public page");
  assert.ok(publicPaths.every((pathname) => !pathname.startsWith("/en/")), "Language-prefixed canonical route");
  assert.ok(config.routes.every((rule) => !/^\/en(?:\/|$)/.test(rule.route)), "No legacy language routes or redirects");
  assert.ok(
    config.routes.every((rule) => !/^\/(?:en\/)?insights(?:\/|$)/.test(rule.route)),
    "Retired pages must not remain in the deployed route inventory",
  );
  validateAzureRouteKeys(config.routes);
  assert.ok(config.routes.every((rule) => !rule.route.includes("*")), "Unknown paths must remain 404s");
  assert.ok(
    config.routes.every((rule) => azureRouteKey(rule.route) !== "/robots.txt"),
    "Serve /robots.txt directly from the public file",
  );

  const sitemap = await readFile(join(directory, "sitemap.xml"), "utf8");
  assert.doesNotMatch(sitemap, /xmlns:xhtml|xhtml:link|hreflang|<lastmod>|[?&]lng=|404\.html|\/insights(?:\/|<)|https:\/\/predixlab\.com\/en(?:\/|<)/);
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, xml]) => ({
    url: decodeHtml(only([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)], "sitemap location")[1]),
    alternates: tags(xml, "xhtml:link"),
  }));
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

  for (const pathname of [...publicPaths, ...notFoundPaths]) {
    const html = await readFile(fileForPath(directory, pathname), "utf8");
    const isNotFound = notFoundPaths.includes(pathname);
    const language = "en";
    assert.match(html, new RegExp(`<html lang="${language}">`), pathname);
    assert.doesNotMatch(html, /<!--(?:seo-head|app-html)-->|fonts\.(?:googleapis|gstatic)\.com|[?&]lng=/, pathname);
    assert.doesNotMatch(decodeHtml(html), /\u7814\u7a76/, `Outdated Chinese copy: ${pathname}`);
    assert.doesNotMatch(html, /\/(?:en\/)?insights(?:\/|["?#])/, `Retired page reference: ${pathname}`);
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
    const h1 = textContent(only([...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)], `${pathname} h1`)[1]);
    assert.ok(h1.length > 0 && textContent(main).length > (isNotFound ? 30 : 200), `Missing page copy: ${pathname}`);
    const title = textContent(only([...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/g)], `${pathname} title`)[1]);
    const metas = tags(head, "meta");
    const meta = (name) => only(metas.filter((tag) => (tag.name ?? tag.property) === name), `${pathname} ${name}`).content;
    const links = tags(head, "link");
    only(
      tags(head, "script").filter((script) => script.type === "module" && script.src?.startsWith("/assets/")),
      `${pathname} hydration entry`,
    );
    only(links.filter((link) => link.rel === "stylesheet"), `${pathname} stylesheet`);
    const canonical = links.filter((link) => link.rel === "canonical");
    const alternates = links.filter((link) => link.rel === "alternate");
    const description = meta("description");
    assert.ok(title.length > 0 && description.length > 0, pathname);
    assert.equal(meta("og:title"), title, pathname);
    assert.equal(meta("twitter:title"), title, pathname);
    assert.equal(meta("og:description"), description, pathname);
    assert.equal(meta("twitter:description"), description, pathname);
    assert.equal(meta("og:locale"), language === "en" ? "en_US" : "zh_CN", pathname);
    assert.equal(meta("og:type"), "website", pathname);
    assert.ok(metas.every((tag) => !tag.property?.startsWith("article:")), pathname);
    assert.ok(metas.every((tag) => tag.property !== "og:locale:alternate"), pathname);
    assert.equal(meta("twitter:card"), "summary_large_image", pathname);
    assert.equal(meta("twitter:image"), meta("og:image"), pathname);
    assert.equal(meta("twitter:image:alt"), meta("og:image:alt"), pathname);
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
      ...links.filter((link) => ["icon", "stylesheet", "preload", "modulepreload"].includes(link.rel)).map((link) => link.href),
      ...tags(main, "img").map((tag) => tag.src),
    ].filter((url) => url?.startsWith("/"))) {
      await access(fileForPath(directory, new URL(resource, origin).pathname));
    }

    const jsonScripts = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
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
      assert.equal(jsonScripts.length, 0, pathname);
      continue;
    }

    const canonicalUrl = `${origin}${pathname}`;
    for (const link of tags(html, "a")) {
      if (!link.href) continue;
      const destination = new URL(link.href, canonicalUrl);
      if (destination.origin === origin) {
        assert.ok(publicPaths.includes(destination.pathname), `Noncanonical internal link: ${pathname} -> ${link.href}`);
      }
    }
    assert.equal(only(canonical, `${pathname} canonical`).href, canonicalUrl, pathname);
    assert.equal(meta("og:url"), canonicalUrl, pathname);
    assert.match(meta("robots"), /^index, follow/, pathname);
    assert.deepEqual(alternates, [], `No separate language URLs: ${pathname}`);
    const entry = only(entries.filter(({ url }) => url === canonicalUrl), `${pathname} sitemap entry`);
    assert.deepEqual(entry.alternates, [], pathname);

    const schema = JSON.parse(only(jsonScripts, `${pathname} JSON-LD`)[1]);
    if (expected) assert.deepEqual(schema, expected.structuredData, pathname);
    assert.equal(schema["@context"], "https://schema.org", pathname);
    assert.doesNotMatch(JSON.stringify(schema), /"(?:aggregateRating|review|ratingValue)"/, pathname);
    const graph = schema["@graph"];
    assert.ok(graph.every((item) => item["@type"] !== "Article"), `Retired article schema: ${pathname}`);
    for (const type of ["Organization", "WebSite", "WebPage"]) {
      only(graph.filter((item) => item["@type"] === type), `${pathname} ${type}`);
    }
    const webpage = graph.find((item) => item["@type"] === "WebPage");
    assert.equal(webpage.url, canonicalUrl, pathname);
    assert.equal(webpage.inLanguage, language, pathname);
    const breadcrumbs = graph.filter((item) => item["@type"] === "BreadcrumbList");
    if (pathname === "/") assert.equal(breadcrumbs.length, 0, pathname);
    else {
      const items = only(breadcrumbs, `${pathname} breadcrumb`).itemListElement;
      assert.equal(items.at(-1).item, canonicalUrl, pathname);
      items.forEach((item, index) => {
        assert.equal(item.position, index + 1, pathname);
        assert.ok(entries.some(({ url }) => url === item.item), `Noncanonical breadcrumb: ${item.item}`);
      });
    }
    for (const faq of graph.filter((item) => item["@type"] === "FAQPage")) {
      assert.equal(pathname, "/", pathname);
      for (const question of faq.mainEntity) {
        assert.ok(textContent(main).includes(question.name), `Invisible FAQ question: ${pathname}`);
        assert.ok(textContent(main).includes(question.acceptedAnswer.text), `Invisible FAQ answer: ${pathname}`);
      }
    }
    for (const software of graph.filter((item) => item["@type"] === "SoftwareApplication")) {
      assert.ok(["/", "/pricing/", "/us-stock-signals/", "/quantitative-stock-screener/", "/unusual-options-activity/"].includes(pathname), pathname);
      assert.deepEqual(software.offers.map((offer) => offer.price), pathname === "/pricing/" ? [0, 20, 192] : [0], pathname);
      software.offers.forEach((offer) => assert.equal(offer.priceCurrency, "USD", pathname));
      if (pathname === "/pricing/") {
        assert.deepEqual(software.offers.slice(1).map((offer) => offer.priceSpecification.billingDuration), ["P1M", "P1Y"], pathname);
      }
    }
  }

  for (const pathname of publicPaths) {
    const match = (url) => config.routes.find((rule) =>
      azureRouteKey(rule.route) === azureRouteKey(url)
      || (rule.route.endsWith("/index.html") && rule.route.slice(0, -"index.html".length) === url),
    );
    assert.equal(match(pathname)?.rewrite, `${pathname}index.html`, `Canonical redirect loop: ${pathname}`);
    if (pathname !== "/") {
      assert.equal(match(pathname.slice(0, -1))?.rewrite, `${pathname}index.html`, pathname);
    }
    for (const alias of [`${pathname}index.html`]) {
      assert.equal(match(alias)?.redirect, pathname, alias);
      assert.equal(match(alias)?.statusCode, 301, alias);
    }
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
  await validateSeoOutput(fileURLToPath(new URL("../dist/", import.meta.url)));
}
