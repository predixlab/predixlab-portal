import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { azureRouteKey, createAzureConfig, retiredRedirects, validateAzureRouteKeys, validateRetiredRedirects } from "./azure-routes.mjs";

const publicPaths = ["/", "/pricing/", "/us-stock-signals/"];
const baseConfig = {
  routes: [{ route: "/404.html", headers: { "X-Robots-Tag": "noindex, follow" } }],
  responseOverrides: { "404": { rewrite: "/404.html" } },
};

test("Azure deployment rules are unique after trailing-slash normalization", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  validateAzureRouteKeys(config.routes);
  assert.equal(config.routes.length, publicPaths.length + retiredRedirects.length + baseConfig.routes.length);
});

test("native directory indexes have no rewrite routes and index aliases permanently redirect", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  assert.ok(config.routes.every(({ rewrite }) => rewrite === undefined), "Do not generate per-page rewrites");
  for (const pathname of publicPaths) {
    for (const variant of [pathname, pathname.replace(/\/$/, "") || "/"]) {
      assert.equal(
        config.routes.find(({ route }) => azureRouteKey(route) === azureRouteKey(variant)),
        undefined,
        `Do not intercept native directory serving or trailing-slash redirects: ${variant}`,
      );
    }
    assert.deepEqual(config.routes.find(({ route }) => route === `${pathname}index.html`), {
      route: `${pathname}index.html`,
      redirect: pathname,
      statusCode: 301,
    });
  }
});

test("Docs indexes permanently redirect without rewrites while unpublished drafts have no routes", () => {
  const docsPaths = ["/docs/", "/docs/how-it-works/", "/docs/limitations/", "/docs/self-hosting/", "/docs/mcp/"];
  const config = createAzureConfig(baseConfig, [...publicPaths, ...docsPaths]);
  for (const path of docsPaths) {
    assert.equal(config.routes.find(({ route }) => azureRouteKey(route) === azureRouteKey(path)), undefined);
    assert.deepEqual(config.routes.find(({ route }) => route === `${path}index.html`), {
      route: `${path}index.html`,
      redirect: path,
      statusCode: 301,
    });
  }
  assert.ok(config.routes.every(({ route }) => !/^\/(?:methodology|open-source)(?:\/|$)/.test(route)));
  validateRetiredRedirects(config.routes);
});

test("all base top-level settings and existing routes survive generation, including the web manifest MIME type", async () => {
  const base = JSON.parse(await readFile(new URL("../staticwebapp.config.json", import.meta.url), "utf8"));
  const config = createAzureConfig(base, publicPaths);
  const { routes: baseRoutes, ...baseSettings } = base;
  const { routes, ...settings } = config;
  assert.deepEqual(settings, baseSettings);
  assert.deepEqual(routes.slice(-baseRoutes.length), baseRoutes);
  assert.equal(config.trailingSlash, "auto");
  assert.equal(config.mimeTypes?.[".webmanifest"], "application/manifest+json");
  assert.equal(config.mimeTypes?.[".xml"], undefined);
});

test("generated deployment config applies immutable caching only to assets and fonts", async () => {
  const sourceConfig = JSON.parse(
    await readFile(new URL("../staticwebapp.config.json", import.meta.url), "utf8"),
  );
  const config = createAzureConfig(sourceConfig, publicPaths);
  assert.equal(config.trailingSlash, "auto", "Preserve directory redirects in the generated config");
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

test("RSS remains a static XML file without a rewrite, redirect or global XML MIME override", async () => {
  const sourceConfig = JSON.parse(await readFile(new URL("../staticwebapp.config.json", import.meta.url), "utf8"));
  const config = createAzureConfig(sourceConfig, publicPaths);
  const rule = config.routes.find(({ route }) => route === "/blog/rss.xml");
  assert.equal(rule?.rewrite, undefined);
  assert.equal(rule?.redirect, undefined);
  if (rule?.headers?.["Content-Type"]) {
    assert.ok(["application/rss+xml", "text/xml"].includes(rule.headers["Content-Type"]));
  }
  assert.equal(config.mimeTypes?.[".xml"], undefined);
});

test("conflicting directory aliases are rejected rather than silently deduplicated", () => {
  assert.throws(
    () => validateAzureRouteKeys([{ route: "/pricing" }, { route: "/pricing/" }]),
    /Duplicate Azure routes/,
  );
  assert.throws(
    () => createAzureConfig({ routes: [{ route: "/us-stock-signals/index.html/" }] }, publicPaths),
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
