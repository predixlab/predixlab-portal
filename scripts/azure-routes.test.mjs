import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { azureRouteKey, createAzureConfig, validateAzureRouteKeys } from "./azure-routes.mjs";

const publicPaths = ["/", "/us-stock-signals/"];
const baseConfig = {
  routes: [{ route: "/404.html", headers: { "X-Robots-Tag": "noindex, follow" } }],
  responseOverrides: { "404": { rewrite: "/404.html" } },
};

test("Azure deployment rules are unique after trailing-slash normalization", () => {
  const config = createAzureConfig(baseConfig, publicPaths);
  validateAzureRouteKeys(config.routes);
  assert.equal(config.routes.length, 5);
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
  assert.deepEqual(otherRoutes, createAzureConfig(baseConfig, publicPaths).routes);
  for (const rule of otherRoutes) {
    assert.equal(rule.headers?.["Cache-Control"], undefined, `Unexpected caching on ${rule.route}`);
  }
  assert.equal(config.globalHeaders?.["Cache-Control"], undefined, "No global caching override");
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
