import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { transformWithEsbuild } from "vite";

const source = await readFile(new URL("../src/analytics.ts", import.meta.url), "utf8");
const storageKey = "predixlab-analytics-consent";

const loadAnalytics = async ({ measurementId = "G-TEST", consent = null, storageBlocked = false } = {}) => {
  const { code } = await transformWithEsbuild(source, "analytics.ts", {
    format: "cjs",
    define: { "import.meta.env.VITE_GA_MEASUREMENT_ID": JSON.stringify(measurementId) },
  });
  const scripts = [];
  const storage = new Map(consent === null ? [] : [[storageKey, consent]]);
  const window = {
    dataLayer: [],
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
  const document = {
    createElement: (tagName) => ({ tagName, dataset: {} }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, window, document });
  return {
    analytics: module.exports,
    commands: () => window.dataLayer.map((args) => JSON.parse(JSON.stringify(Array.from(args)))),
    scripts,
    storage,
    window,
  };
};

test("unconfigured analytics does not load a tag or send commands", async () => {
  const { analytics, commands, scripts } = await loadAnalytics({ measurementId: "  " });
  analytics.enableGoogleAnalytics();
  assert.equal(analytics.isAnalyticsConfigured(), false);
  assert.deepEqual(commands(), []);
  assert.equal(scripts.length, 0);
});

for (const consent of [null, "declined", "invalid"]) {
  test(`initial page view loads with denied storage for consent ${consent}`, async () => {
    const { analytics, commands, scripts, storage } = await loadAnalytics({ consent });
    analytics.enableGoogleAnalytics();
    assert.deepEqual(commands()[0], ["consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    }]);
    assert.equal(commands().some((command) => command[1] === "update"), false);
    assert.equal(commands().filter((command) => command[0] === "config").length, 1);
    assert.equal(commands().find((command) => command[0] === "config")[2].send_page_view, true);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-TEST");
    assert.equal(storage.get(storageKey) ?? null, consent);
  });
}

test("saved acceptance grants analytics storage before the initial page view", async () => {
  const { analytics, commands } = await loadAnalytics({ consent: "accepted" });
  analytics.enableGoogleAnalytics();
  assert.deepEqual(commands().map((command) => command.slice(0, 2)), [
    ["consent", "default"],
    ["consent", "update"],
    ["js", commands()[2][1]],
    ["config", "G-TEST"],
  ]);
  assert.deepEqual(commands()[1][2], { analytics_storage: "granted" });
  const config = commands()[3][2];
  assert.equal(config.send_page_view, true);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
});

test("acceptance, withdrawal and reacceptance only update storage consent", async () => {
  const { analytics, commands, scripts, storage, window } = await loadAnalytics();
  analytics.enableGoogleAnalytics();
  analytics.setAnalyticsConsent("accepted");
  analytics.setAnalyticsConsent("declined");
  assert.equal(analytics.getAnalyticsConsent(), "declined");
  assert.notEqual(window["ga-disable-G-TEST"], true);
  analytics.setAnalyticsConsent("accepted");
  assert.deepEqual(commands().filter((command) => command[1] === "update"), [
    ["consent", "update", { analytics_storage: "granted" }],
    ["consent", "update", { analytics_storage: "denied" }],
    ["consent", "update", { analytics_storage: "granted" }],
  ]);
  assert.equal(commands().filter((command) => command[0] === "config").length, 1);
  assert.equal(commands().some((command) => command[0] === "event"), false);
  assert.equal(scripts.length, 1);
  assert.equal(storage.get(storageKey), "accepted");
});

test("cross-tab changes update consent without writing storage or adding page views", async () => {
  const { analytics, commands, storage } = await loadAnalytics();
  analytics.enableGoogleAnalytics();
  analytics.syncAnalyticsConsent("accepted");
  assert.equal(analytics.getAnalyticsConsent(), "accepted");
  analytics.syncAnalyticsConsent("declined");
  assert.equal(analytics.getAnalyticsConsent(), "declined");
  assert.equal(storage.size, 0);
  assert.deepEqual(commands().slice(-2), [
    ["consent", "update", { analytics_storage: "granted" }],
    ["consent", "update", { analytics_storage: "denied" }],
  ]);
  assert.equal(commands().filter((command) => command[0] === "config").length, 1);
  assert.equal(commands().some((command) => command[0] === "event"), false);
});

test("repeated initialization loads one tag and one initial page view", async () => {
  const { analytics, commands, scripts } = await loadAnalytics();
  analytics.enableGoogleAnalytics();
  analytics.enableGoogleAnalytics();
  assert.equal(scripts.length, 1);
  assert.equal(commands().filter((command) => command[0] === "config").length, 1);
});

test("blocked local storage still permits cookieless measurement and in-memory choices", async () => {
  const { analytics, commands, scripts } = await loadAnalytics({ storageBlocked: true });
  analytics.enableGoogleAnalytics();
  assert.equal(analytics.getAnalyticsConsent(), null);
  assert.equal(commands().some((command) => command[1] === "update"), false);
  analytics.setAnalyticsConsent("accepted");
  assert.equal(analytics.getAnalyticsConsent(), "accepted");
  analytics.setAnalyticsConsent("declined");
  assert.equal(analytics.getAnalyticsConsent(), "declined");
  assert.deepEqual(commands().at(-1), ["consent", "update", { analytics_storage: "denied" }]);
  assert.equal(scripts.length, 1);
});