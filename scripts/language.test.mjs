import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { transformWithEsbuild } from "vite";

const source = await readFile(new URL("../src/i18n/language.ts", import.meta.url), "utf8");
const { code } = await transformWithEsbuild(source, "language.ts", { format: "cjs" });

const loadLanguage = ({ storedLanguage = null, storageBlocked = false, search = "", withoutWindow = false } = {}) => {
  const storage = new Map(storedLanguage === null ? [] : [["predixlab-language", storedLanguage]]);
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    URLSearchParams,
  };
  if (!withoutWindow) {
    context.window = {
      location: { search },
      localStorage: {
        getItem: (key) => {
          if (storageBlocked) throw new Error("Storage blocked");
          return storage.get(key) ?? null;
        },
        setItem: (key, value) => {
          if (storageBlocked) throw new Error("Storage blocked");
          storage.set(key, value);
        },
      },
    };
  }
  runInNewContext(code, context);
  return { language: module.exports, storage };
};

for (const storedLanguage of [null, "invalid", "en"]) {
  test(`English is the default with stored language ${storedLanguage}`, () => {
    const { language } = loadLanguage({ storedLanguage });
    assert.equal(language.DEFAULT_SITE_LANGUAGE, "en");
    assert.equal(language.getPreferredLanguage(), "en");
  });
}

test("an explicit Chinese preference survives initialization", () => {
  const { language } = loadLanguage({ storedLanguage: "zh" });
  assert.equal(language.getPreferredLanguage(), "zh");
});

test("an explicit URL language overrides the stored preference at initialization", () => {
  assert.equal(loadLanguage({ storedLanguage: "zh", search: "?lng=en" }).language.getPreferredLanguage(), "en");
  assert.equal(loadLanguage({ storedLanguage: "en", search: "?lng=zh" }).language.getPreferredLanguage(), "zh");
});

test("missing or invalid URL languages retain the existing stored preference fallback", () => {
  assert.equal(loadLanguage({ storedLanguage: "zh" }).language.getPreferredLanguage(), "zh");
  assert.equal(loadLanguage({ storedLanguage: "zh", search: "?lng=fr" }).language.getPreferredLanguage(), "zh");
});

test("switching languages only updates the language preference", () => {
  const { language, storage } = loadLanguage();
  language.setPreferredLanguage("zh");
  assert.equal(language.getPreferredLanguage(), "zh");
  language.setPreferredLanguage("en");
  assert.equal(language.getPreferredLanguage(), "en");
  assert.deepEqual(Array.from(storage), [["predixlab-language", "en"]]);
});

test("unavailable storage defaults to English without blocking a language change", () => {
  const { language } = loadLanguage({ storageBlocked: true });
  assert.equal(language.getPreferredLanguage(), "en");
  assert.doesNotThrow(() => language.setPreferredLanguage("zh"));
});

test("an explicit URL language works when storage is unavailable", () => {
  const { language } = loadLanguage({ storageBlocked: true, search: "?lng=zh" });
  assert.equal(language.getPreferredLanguage(), "zh");
});

test("language initialization defaults to English without a browser window", () => {
  const { language } = loadLanguage({ withoutWindow: true });
  assert.equal(language.getPreferredLanguage(), "en");
});

const routingSource = await readFile(new URL("../src/routing.ts", import.meta.url), "utf8");
const routingCode = await transformWithEsbuild(routingSource, "routing.ts", { format: "cjs" });
const routingModule = { exports: {} };
runInNewContext(routingCode.code, { module: routingModule, exports: routingModule.exports, URL });
const routing = routingModule.exports;

test("public links never add a language prefix and preserve query strings and anchors", () => {
  assert.equal(routing.publicPath("/pricing/?plan=annual#plans"), "/pricing/?plan=annual#plans");
  assert.equal(routing.publicPath("/#research-tools"), "/#research-tools");
  assert.equal(routing.publicPath("/"), "/");
});

test("the public inventory contains one route per page and unknown paths stay unknown", () => {
  assert.equal(routing.sitePages.length, 8);
  assert.equal(new Set(routing.sitePages.map(page => page.path)).size, 8);
  assert.equal(routing.sitePages.some(page => page.path.startsWith("/en/")), false);
  assert.equal(routing.getPageForPath("/pricing/").key, "pricing");
  assert.equal(routing.getPageForPath("/en/pricing/"), undefined);
  assert.equal(routing.getPageForPath("/en/"), undefined);
  assert.equal(routing.getPageForPath("/missing/"), undefined);
  assert.equal(routing.getPageForPath("/en/missing/"), undefined);
});

test("language prefixes and parameters are not migrated", () => {
  assert.equal(routing.publicPath("/en/pricing/?lng=zh#plans"), "/en/pricing/?lng=zh#plans");
  assert.equal(routing.normalizePath("/en/"), "/en/");
});

test("the not-found dashboard CTA keeps shared referral attribution", async () => {
  const notFoundPage = await readFile(new URL("../src/pages/NotFoundPage.tsx", import.meta.url), "utf8");
  assert.match(notFoundPage, /import \{ dashboardLink \} from "@\/config"/);
  assert.match(notFoundPage, /href=\{dashboardLink\("\/", "not-found"\)\}/);
});