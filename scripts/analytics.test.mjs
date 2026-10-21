import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { transformWithEsbuild } from "vite";

const source = await readFile(new URL("../src/analytics.ts", import.meta.url), "utf8");
const storageKey = "predixlab-analytics-consent";

const loadAnalytics = async ({ measurementId = "G-TEST", consent = null, storageBlocked = false, idleAvailable = true, readyState = "complete" } = {}) => {
  const { code } = await transformWithEsbuild(source, "analytics.ts", {
    format: "cjs",
    define: { "import.meta.env.VITE_GA_MEASUREMENT_ID": JSON.stringify(measurementId) },
  });
  const scripts = [];
  const idleCallbacks = [];
  const loadCallbacks = [];
  const timers = [];
  const storage = new Map(consent === null ? [] : [[storageKey, consent]]);
  const window = {
    dataLayer: [],
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    addEventListener: (event, callback, options) => {
      assert.equal(event, "load");
      assert.equal(options.once, true);
      loadCallbacks.push(callback);
    },
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
  if (idleAvailable) {
    window.requestIdleCallback = (callback, options) => idleCallbacks.push({ callback, options });
  }
  const document = {
    readyState,
    createElement: (tagName) => ({ tagName, dataset: {} }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, window, document });
  return {
    analytics: module.exports,
    commands: () => window.dataLayer.map((args) => JSON.parse(JSON.stringify(Array.from(args)))),
    scripts,
    idleCallbacks,
    loadCallbacks,
    timers,
    runIdle: () => idleCallbacks.splice(0).forEach(({ callback }) => callback()),
    runLoad: () => loadCallbacks.splice(0).forEach((callback) => callback()),
    runTimers: () => timers.splice(0).forEach(({ callback }) => callback()),
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
    const { analytics, commands, scripts, storage, runIdle } = await loadAnalytics({ consent });
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
    assert.equal(scripts.length, 0);
    runIdle();
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
  const { analytics, commands, scripts, storage, window, runIdle } = await loadAnalytics();
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
  runIdle();
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
  const { analytics, commands, scripts, idleCallbacks, runIdle } = await loadAnalytics();
  analytics.enableGoogleAnalytics();
  analytics.enableGoogleAnalytics();
  assert.equal(scripts.length, 0);
  assert.equal(idleCallbacks.length, 1);
  runIdle();
  assert.equal(scripts.length, 1);
  assert.equal(commands().filter((command) => command[0] === "config").length, 1);
});

test("blocked local storage still permits cookieless measurement and in-memory choices", async () => {
  const { analytics, commands, scripts, runIdle } = await loadAnalytics({ storageBlocked: true });
  analytics.enableGoogleAnalytics();
  assert.equal(analytics.getAnalyticsConsent(), null);
  assert.equal(commands().some((command) => command[1] === "update"), false);
  analytics.setAnalyticsConsent("accepted");
  assert.equal(analytics.getAnalyticsConsent(), "accepted");
  analytics.setAnalyticsConsent("declined");
  assert.equal(analytics.getAnalyticsConsent(), "declined");
  assert.deepEqual(commands().at(-1), ["consent", "update", { analytics_storage: "denied" }]);
  runIdle();
  assert.equal(scripts.length, 1);
});

test("tag insertion waits for idle while consent and the initial page view queue synchronously", async () => {
  const { analytics, commands, scripts, idleCallbacks, runIdle } = await loadAnalytics();
  analytics.enableGoogleAnalytics();
  assert.equal(scripts.length, 0);
  assert.equal(commands()[0][1], "default");
  assert.equal(commands().at(-1)[0], "config");
  assert.equal(idleCallbacks[0].options.timeout, 2000);
  analytics.setAnalyticsConsent("accepted");
  assert.deepEqual(commands().at(-1), ["consent", "update", { analytics_storage: "granted" }]);
  runIdle();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].async, true);
  assert.equal(scripts[0].dataset.predixlabAnalytics, "true");
  assert.equal(commands().filter((command) => command[0] === "config").length, 1);
});

for (const readyState of ["loading", "complete"]) {
  test(`without idle callbacks the tag loads in a timer after window load (${readyState})`, async () => {
    const { analytics, commands, scripts, timers, loadCallbacks, runLoad, runTimers } =
      await loadAnalytics({ idleAvailable: false, readyState });
    analytics.enableGoogleAnalytics();
    analytics.enableGoogleAnalytics();
    assert.equal(scripts.length, 0);
    assert.equal(commands().filter((command) => command[0] === "config").length, 1);
    assert.equal(loadCallbacks.length, readyState === "loading" ? 1 : 0);
    assert.equal(timers.length, readyState === "loading" ? 0 : 1);
    runLoad();
    assert.equal(scripts.length, 0);
    assert.equal(timers.length, 1);
    assert.equal(timers[0].delay, 0);
    runTimers();
    assert.equal(scripts.length, 1);
  });
}