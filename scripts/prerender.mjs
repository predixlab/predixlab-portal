import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { validateSeoOutput } from "./validate-seo.mjs";
import { createAzureConfig, validateRetiredRedirects } from "./azure-routes.mjs";

const rootDirectory = fileURLToPath(new URL("../", import.meta.url));
const outputDirectory = join(rootDirectory, "dist");
const serverDirectory = join(rootDirectory, ".prerender");
const notFoundPaths = ["/404.html"];

const replaceOnce = (html, marker, content) => {
  assert.equal(html.split(marker).length, 2, `Expected one template marker: ${marker}`);
  return html.replace(marker, () => content);
};

const outputPath = (pathname) =>
  join(outputDirectory, pathname.slice(1), pathname.endsWith("/") ? "index.html" : "");

const writeOutput = async (pathname, content) => {
  const filename = outputPath(pathname);
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, content, "utf8");
};

try {
  await build({ root: rootDirectory, build: { outDir: outputDirectory, emptyOutDir: true } });
  const template = await readFile(join(outputDirectory, "index.html"), "utf8");
  await build({
    root: rootDirectory,
    build: {
      ssr: "src/entry-server.tsx",
      outDir: serverDirectory,
      emptyOutDir: true,
      copyPublicDir: false,
    },
  });
  const { render, publicPaths, getPageSeo, renderSitemap, renderRss } = await import(
    pathToFileURL(join(serverDirectory, "entry-server.js")).href
  );
  assert.equal(new Set(publicPaths).size, publicPaths.length, "Duplicate public routes");
  const expectedPages = new Map();

  for (const pathname of [...publicPaths, ...notFoundPaths]) {
    assert.match(pathname, /^\/(?:[a-z0-9-]+\/)*(?:404\.html)?$/, `Unsafe output path: ${pathname}`);
    const result = render(pathname);
    assert.equal(result.statusCode, notFoundPaths.includes(pathname) ? 404 : 200, pathname);
    let html = replaceOnce(template, "<!--seo-head-->", result.headHtml);
    html = replaceOnce(
      html,
      '<!--app-html--><div id="root"></div>',
      `<div id="root">${result.appHtml}</div>`,
    );
    html = replaceOnce(html, '<html lang="en">', `<html lang="${result.htmlLanguage}">`);
    await writeOutput(pathname, html);
    expectedPages.set(pathname, result.seo);
  }

  for (const pathname of ["/__seo_missing__/", ...publicPaths.flatMap((path) => [`/en${path}`, `/zh${path}`])]) {
    const seo = getPageSeo(pathname);
    assert.match(seo.robots, /^noindex\b/, pathname);
    assert.equal(seo.canonicalUrl, null, pathname);
    assert.equal(seo.structuredData, null, pathname);
    assert.deepEqual(seo.alternates, [], pathname);
  }

  await writeOutput("/sitemap.xml", renderSitemap());
  await writeOutput("/blog/rss.xml", renderRss());
  const baseConfig = JSON.parse(
    await readFile(join(rootDirectory, "staticwebapp.config.json"), "utf8"),
  );
  assert.equal(baseConfig.navigationFallback, undefined, "A SPA fallback would create soft 404s");

  const azureConfig = createAzureConfig(baseConfig, publicPaths);
  validateRetiredRedirects(azureConfig.routes);
  await writeOutput("/staticwebapp.config.json", `${JSON.stringify(azureConfig, null, 2)}\n`);
  await validateSeoOutput(outputDirectory, expectedPages);
  console.log(`Prerendered ${publicPaths.length} public pages and ${notFoundPaths.length} not-found documents.`);
} finally {
  await rm(serverDirectory, { recursive: true, force: true });
}
