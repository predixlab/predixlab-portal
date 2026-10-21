import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { azureRouteKey, createAzureConfig, retiredRedirects, validateAzureRouteKeys, validateRetiredRedirects } from "./azure-routes.mjs";

const publicPaths = ["/", "/us-stock-signals/"];
const baseConfig = {
  routes: [{ route: "/404.html", headers: { "X-Robots-Tag": "noindex, follow" } }],
  responseOverrides: { "404": { rewrite: "/404.html" } },
};

test("Azure deployment rules are unique after trailing-slash normalization", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  validateAzureRouteKeys(config.routes);
  assert.equal(config.routes.length, 5 + retiredRedirects.length);
});

test("canonical pages rewrite once and index aliases redirect without directory loops", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  for (const pathname of publicPaths) {
    const canonical = config.routes.find(({ route }) => azureRouteKey(route) === azureRouteKey(pathname));
    assert.equal(canonical.rewrite, `${pathname}index.html`);
    assert.equal(canonical.redirect, undefined);
    assert.deepEqual(config.routes.find(({ route }) => route === `${pathname}index.html`), {
      route: `${pathname}index.html`,
      redirect: pathname,
      statusCode: 301,
    });

  }
  assert.equal(config.routes.some(({ route }) => route === "/us-stock-signals"), false);
});

test("Docs routes use canonical rewrites while unpublished drafts have no rewrites or redirects", () => {
  const docsPaths = ["/docs/", "/docs/how-it-works/", "/docs/limitations/", "/docs/self-hosting/"];
  const config = createAzureConfig(baseConfig, [...publicPaths, ...docsPaths]);
  for (const path of docsPaths) {
    assert.deepEqual(config.routes.find(({ route }) => route === path), { route: path, rewrite: `${path}index.html` });
  }
  assert.ok(config.routes.every(({ route }) => !/^\/(?:methodology|open-source)(?:\/|$)/.test(route)));
  validateRetiredRedirects(config.routes);
});

test("generated deployment config applies immutable caching only to assets and fonts", async () => {
  const sourceConfig = JSON.parse(
    await readFile(new URL("../staticwebapp.config.json", import.meta.url), "utf8"),
  );
  const config = createAzureConfig(sourceConfig, publicPaths);
  const cacheRoutes = ["/assets/*", "/fonts/*"];
  assert.deepEqual(
    config.routes.filter(({ route }) => cacheRoutes.includes(route)),
    cacheRoutes.map((route) => ({
      route,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    })),
  );
  const otherRoutes = config.routes.filter(({ route }) => !cacheRoutes.includes(route));
  assert.deepEqual(
    otherRoutes.filter(({ route }) => route !== "/blog/rss.xml"),
    createAzureConfig(baseConfig, publicPaths).routes,
  );
  for (const rule of otherRoutes) {
    assert.equal(rule.headers?.["Cache-Control"], undefined, `Unexpected caching on ${rule.route}`);
  }
  assert.equal(config.globalHeaders?.["Cache-Control"], undefined, "No global caching override");
});

test("retired insights paths, including English-prefixed variants, permanently redirect to the blog", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  validateRetiredRedirects(config.routes);
  for (const prefix of ["", "/en"]) {
    for (const [suffix, destination] of [
      ["", "/blog/"],
      ["walk-forward-validation-stock-signals/", "/blog/walk-forward-validation/"],
    ]) {
      const pathname = `${prefix}/insights/${suffix}`;
      for (const variant of [pathname, pathname.replace(/\/$/, "")]) {
        const rule = config.routes.find(({ route }) => azureRouteKey(route) === azureRouteKey(variant));
        assert.deepEqual(rule, { route: pathname, redirect: destination, statusCode: 301 });
      }
    }
  }
  assert.throws(() => validateRetiredRedirects(config.routes.filter(({ route }) => route !== "/insights/")), /permanently redirect/);
  assert.throws(() => validateRetiredRedirects(config.routes.map((rule) =>
    rule.route === "/insights/" ? { ...rule, statusCode: 302 } : rule,
  )), /permanently redirect/);
});

test("RSS has an explicit application/rss+xml header and no rewrite or redirect", async () => {
  const sourceConfig = JSON.parse(await readFile(new URL("../staticwebapp.config.json", import.meta.url), "utf8"));
  const config = createAzureConfig(sourceConfig, publicPaths);
  assert.deepEqual(config.routes.filter(({ route }) => route === "/blog/rss.xml"), [{
    route: "/blog/rss.xml",
    headers: { "Content-Type": "application/rss+xml" },
  }]);
});

test("conflicting directory aliases are rejected rather than silently deduplicated", () => {
  assert.throws(
    () => validateAzureRouteKeys([{ route: "/pricing" }, { route: "/pricing/" }]),
    /Duplicate Azure routes/,
  );
  assert.throws(
    () => createAzureConfig({ routes: [{ route: "/us-stock-signals" }] }, publicPaths),
    /Duplicate Azure routes/,
  );
});

test("not-found behavior is preserved without a blanket navigation fallback", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  assert.deepEqual(config.responseOverrides, baseConfig.responseOverrides);
  assert.equal(config.navigationFallback, undefined);
  assert.deepEqual(config.routes.at(-1), baseConfig.routes[0]);
  assert.deepEqual(baseConfig.routes, [
    { route: "/404.html", headers: { "X-Robots-Tag": "noindex, follow" } },
  ]);
});
