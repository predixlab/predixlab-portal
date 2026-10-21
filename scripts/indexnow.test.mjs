import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { INDEXNOW_KEY, buildIndexNowPayload, main, parseSitemap } from "./indexnow.mjs";

const directory = await mkdtemp(join(tmpdir(), "predixlab-indexnow-"));
after(() => rm(directory, { recursive: true, force: true }));
const sitemapPath = join(directory, "sitemap.xml");
await writeFile(sitemapPath, '<urlset><url><loc>https://predixlab.com/</loc></url></urlset>');

const run = async (options = {}) => {
  const logs = [];
  const warnings = [];
  await main({
    sitemapPath,
    fetchImpl: () => { throw new Error("Unexpected network request"); },
    log: (message) => logs.push(message),
    warn: (message) => warnings.push(message),
    ...options,
  });
  return { logs, warnings };
};

test("the single deployed key file name and contents match the IndexNow constant", async () => {
  const publicDirectory = new URL("../public/", import.meta.url);
  const keyFiles = (await readdir(publicDirectory)).filter((name) => /^[a-f0-9]{32}\.txt$/.test(name));
  assert.deepEqual(keyFiles, [`${INDEXNOW_KEY}.txt`]);
  assert.equal((await readFile(new URL(keyFiles[0], publicDirectory), "utf8")).trim(), INDEXNOW_KEY);
});

test("sitemap parsing extracts locations, trims whitespace, and decodes XML entities", () => {
  assert.deepEqual(parseSitemap(`<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://predixlab.com/</loc></url>
      <url><loc>
        https://predixlab.com/pricing/?a=1&amp;b=2
      </loc><lastmod>2026-10-21</lastmod></url>
      <url><loc>https://predixlab.com/&#x61;&#98;out/</loc></url>
    </urlset>`), [
    "https://predixlab.com/",
    "https://predixlab.com/pricing/?a=1&b=2",
    "https://predixlab.com/about/",
  ]);
  assert.deepEqual(parseSitemap("<urlset/>"), []);
});

test("the payload only includes unique HTTPS production URLs", () => {
  assert.deepEqual(buildIndexNowPayload([
    "https://predixlab.com/", "https://predixlab.com/pricing/", "https://predixlab.com/",
    "https://predixlab.com:443/pricing/", "http://predixlab.com/about/",
    "https://www.predixlab.com/", "https://dashboard.predixlab.com/",
    "https://predixlab.com.evil.example/", "https://predixlab.com@other.example/",
    "https://user:pass@predixlab.com/", "https://predixlab.com:444/",
    "/about/", "not a URL",
  ]), {
    host: "predixlab.com",
    key: INDEXNOW_KEY,
    keyLocation: `https://predixlab.com/${INDEXNOW_KEY}.txt`,
    urlList: ["https://predixlab.com/", "https://predixlab.com/pricing/"],
  });
});

test("payloads contain at most 10,000 unique URLs", () => {
  const urls = Array.from({ length: 10_005 }, (_, index) => `https://predixlab.com/page-${index}/`);
  const payload = buildIndexNowPayload([urls[0], urls[0], ...urls]);
  assert.equal(payload.urlList.length, 10_000);
  assert.equal(new Set(payload.urlList).size, 10_000);
  assert.equal(payload.urlList.at(-1), urls[9999]);
  assert.ok(payload.urlList.every((url) => url.startsWith("https://predixlab.com/")));
});

test("dry run prints valid JSON without making a network request", async () => {
  const { logs, warnings } = await run({ dryRun: true });
  assert.deepEqual(JSON.parse(logs[0]), buildIndexNowPayload(["https://predixlab.com/"]));
  assert.deepEqual(warnings, []);
});

for (const status of [200, 202, 204, 400, 429, 500]) {
  test(`HTTP ${status} is logged and never fails the notification step`, async () => {
    const { logs, warnings } = await run({
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://api.indexnow.org/indexnow");
        assert.equal(options.method, "POST");
        assert.equal(options.headers["Content-Type"], "application/json; charset=utf-8");
        assert.deepEqual(JSON.parse(options.body), buildIndexNowPayload(["https://predixlab.com/"]));
        assert.ok(options.signal instanceof AbortSignal);
        return { status };
      },
    });
    assert.deepEqual(logs, [`IndexNow HTTP status: ${status}`]);
    assert.equal(warnings.length, [200, 202].includes(status) ? 0 : 1);
  });
}

test("network errors and missing local sitemaps only warn", async () => {
  const network = await run({ fetchImpl: async () => { throw new Error("Connection refused"); } });
  assert.match(network.warnings[0], /IndexNow warning: Connection refused/);
  const missing = await run({ sitemapPath: join(directory, "missing.xml") });
  assert.match(missing.warnings[0], /IndexNow warning:.*ENOENT/);
});

test("a sitemap with no production URLs warns without requesting", async () => {
  const emptyPath = join(directory, "empty.xml");
  await writeFile(emptyPath, "<urlset/>");
  const { warnings } = await run({ sitemapPath: emptyPath });
  assert.match(warnings[0], /no production URLs/);
});

test("a slow request is aborted and only warns", async () => {
  const { warnings } = await run({
    timeoutMs: 5,
    fetchImpl: (_, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("Request timed out")), { once: true });
    }),
  });
  assert.match(warnings[0], /IndexNow warning: Request timed out/);
});
