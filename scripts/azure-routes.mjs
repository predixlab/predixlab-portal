import assert from "node:assert/strict";

export const azureRouteKey = (route) => route.replace(/\/+$/, "") || "/";

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
    routes: [...canonicalRoutes, ...redirects, ...(baseConfig.routes ?? [])],
  };
  validateAzureRouteKeys(config.routes);
  return config;
};

export const validateAzureRouteKeys = (routes) => {
  assert.equal(
    new Set(routes.map(({ route }) => azureRouteKey(route))).size,
    routes.length,
    "Duplicate Azure routes after trailing-slash normalization",
  );
};
