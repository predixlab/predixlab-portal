import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const INDEXNOW_KEY = "7e6f50e71b2d4b9fa6272c14c0c58b98";
const origin = "https://predixlab.com";

export const parseSitemap = (xml) =>
  [...xml.matchAll(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc>/g)].map(([, location]) =>
    location.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
      if (entity.startsWith("#")) {
        return String.fromCodePoint(
          entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)),
        );
      }
      return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity.toLowerCase()];
    }),
  );

export const buildIndexNowPayload = (urls) => {
  const urlList = new Set();
  for (const value of urls) {
    if (!URL.canParse(value)) continue;
    const url = new URL(value);
    if (url.origin !== origin || url.username || url.password) continue;
    urlList.add(url.href);
    if (urlList.size === 10_000) break;
  }
  return {
    host: "predixlab.com",
    key: INDEXNOW_KEY,
    keyLocation: `${origin}/${INDEXNOW_KEY}.txt`,
    urlList: [...urlList],
  };
};

export const main = async ({
  dryRun = false,
  sitemapPath = fileURLToPath(new URL("../dist/sitemap.xml", import.meta.url)),
  fetchImpl = fetch,
  timeoutMs = 15_000,
  log = console.log,
  warn = console.warn,
} = {}) => {
  let timer;
  try {
    const payload = buildIndexNowPayload(parseSitemap(await readFile(sitemapPath, "utf8")));
    if (!payload.urlList.length) {
      warn("IndexNow warning: sitemap contains no production URLs; skipping notification.");
      return;
    }
    if (dryRun) {
      log(JSON.stringify(payload, null, 2));
      return;
    }
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetchImpl("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    log(`IndexNow HTTP status: ${response.status}`);
    if (response.status !== 200 && response.status !== 202) {
      warn(`IndexNow warning: notification was not accepted (HTTP ${response.status}).`);
    }
  } catch (error) {
    warn(`IndexNow warning: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timer);
  }
};

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main({ dryRun: process.argv.includes("--dry-run") });
}
