import assert from "node:assert/strict";

export const azureRouteKey = (route) => route.replace(/\/+$/, "") || "/";

export const retiredRedirects = [
  { route: "/insights/", redirect: "/blog/", statusCode: 301 },
  { route: "/insights/walk-forward-validation-stock-signals/", redirect: "/blog/walk-forward-validation/", statusCode: 301 },
  { route: "/en/insights/", redirect: "/blog/", statusCode: 301 },
  { route: "/en/insights/walk-forward-validation-stock-signals/", redirect: "/blog/walk-forward-validation/", statusCode: 301 },
];

export const createAzureConfig = (baseConfig, publicPaths) => {
  const canonicalRoutes = publicPaths.map((pathname) => ({
    route: pathname,
    rewrite: `${pathname}index.html`,
  }));
  // Azure treats /page and /page/ as the same route key.
  const redirects = publicPaths.map((pathname) => ({
    route: `${pathname}index.html`,
    redirect: pathname,
    statusCode: 301,
  }));
  const config = {
    ...baseConfig,
    routes: [...canonicalRoutes, ...redirects, ...retiredRedirects, ...(baseConfig.routes ?? [])],
  };
  validateAzureRouteKeys(config.routes);
  return config;
};

export const validateRetiredRedirects = (routes) => {
  assert.deepEqual(
    routes.filter(({ route }) => /^\/(?:en\/)?insights(?:\/|$)/.test(route)),
    retiredRedirects,
    "Retired insights URLs must permanently redirect to the blog",
  );
};

export const validateAzureRouteKeys = (routes) => {
  assert.equal(
    new Set(routes.map(({ route }) => azureRouteKey(route))).size,
    routes.length,
    "Duplicate Azure routes after trailing-slash normalization",
  );
};
