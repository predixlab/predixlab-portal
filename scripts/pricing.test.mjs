import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { StaticRouter } from "react-router-dom";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const [
  { default: PricingPage },
  { pricingContent },
  { createSiteI18n },
  { config, dashboardLink },
  { getPageSeo },
] = await Promise.all([
  server.ssrLoadModule("/src/pages/PricingPage.tsx"),
  server.ssrLoadModule("/src/content/company.ts"),
  server.ssrLoadModule("/src/i18n/index.ts"),
  server.ssrLoadModule("/src/config.ts"),
  server.ssrLoadModule("/src/seo.ts"),
]);

test("pricing translations have matching fields and feature counts", () => {
  assert.deepEqual(Object.keys(pricingContent.zh), Object.keys(pricingContent.en));
  assert.equal(pricingContent.zh.selfHostedFeatures.length, 5);
  assert.equal(pricingContent.en.selfHostedFeatures.length, 5);
  assert.equal(pricingContent.zh.questions.length, pricingContent.en.questions.length);
});

test("pricing intros distinguish running signal code from the hosted dashboard", () => {
  assert.equal(pricingContent.zh.eyebrow, "开源代码，或托管工作台。");
  assert.equal(
    pricingContent.en.description,
    "Run the signal and backtest code with your own data, or use the hosted dashboard. Free includes charts, the screener, and past signals. Choose Premium for the latest daily data, with the same features on monthly and annual billing.",
  );
  assert.equal(
    pricingContent.zh.description,
    "用自己的数据运行信号和回测代码，也可直接使用托管工作台。免费版可查看图表、选股器和历史信号；Premium 提供最新每日数据，月付和年付功能相同。",
  );
});

for (const language of ["zh", "en"]) {
  const copy = pricingContent[language];
  const html = renderToStaticMarkup(
    createElement(I18nextProvider, { i18n: createSiteI18n(language) },
      createElement(StaticRouter, { location: "/pricing/" }, createElement(PricingPage))),
  );

  test(`${language}: rendered pricing page has no real-time data wording`, () => {
    assert.doesNotMatch(html, /real[- ]?time|实时/i);
  });

  test(`${language}: Premium update FAQ retains its position and explains daily updates`, () => {
    const expected = language === "en" ? {
      question: "How often does Premium data update?",
      answer: "Once per trading day, after the US market closes. Signals and options data come from nightly jobs on daily data, not intraday quotes.",
    } : {
      question: "Premium 的数据多久更新一次？",
      answer: "每个交易日更新一次，在美股收盘后进行。信号和期权数据由每晚的任务基于日线数据生成，不是盘中行情。",
    };
    assert.deepEqual(copy.questions[2], expected);
    const faq = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)][2][0];
    assert.ok(faq.includes(renderToStaticMarkup(expected.question)));
    assert.ok(faq.includes(renderToStaticMarkup(expected.answer)));
  });

  test(`${language}: self-hosted copy states the license without implying intraday data`, () => {
    const strings = [
      ...Object.entries(copy)
        .filter(([key]) => key.startsWith("selfHosted"))
        .flatMap(([, value]) => value),
      copy.eyebrow,
      copy.description,
      copy.compareDescription,
      copy.externalLinkNote,
      copy.questions[0].question,
      copy.questions[0].answer,
    ];
    for (const text of strings) {
      assert.doesNotMatch(text, /\blive\b/i);
    }
    assert.match(strings.join("\n"), /Apache-2\.0/);
    assert.match(copy.selfHostedBilling, /Apache-2\.0/);
    assert.match(copy.questions[0].answer, /Apache-2\.0/);
  });

  test(`${language}: open-source tier is signal and backtest code with user-supplied data`, () => {
    const expected = language === "en" ? {
      selfHosted: "Open-source code",
      selfHostedDescription: "Read, test and run the signal and backtest code with your own input data (daily prices, index membership history and a trading calendar, plus the ^GSPC benchmark).",
      selfHostedAction: "View on GitHub",
      selfHostedGuide: "Signal code guide",
      selfHostedNote: "Run the signal and backtest code with your own data",
      included: "Signal, backtest, API and dashboard code (Apache-2.0)",
      excluded: "Market data, trained models and the hosted dashboard are not included",
      compareDescription: "Open-source signal and backtest code requires your own input data (daily prices, index membership history and a trading calendar, plus the ^GSPC benchmark); the hosted dashboard is not included. The hosted Free and Premium plans use the same models. Upgrading doesn't change signal accuracy or reduce investment risk.",
      question: "What do I need to use the open-source code?",
      answer: "The source code is free under Apache-2.0. Follow the signals README to read, test and run the signal and backtest code with your own input data (daily prices, index membership history and a trading calendar, plus the ^GSPC benchmark). Market data, trained models and the hosted dashboard are not included. The license does not grant rights to any third-party market data; data providers keep their own terms. The analysis is for information only, not investment advice.",
    } : {
      selfHosted: "开源代码",
      selfHostedDescription: "自备日线价格（含 ^GSPC 基准）、指数成分历史和交易日历，阅读、测试和运行信号与回测代码。",
      selfHostedAction: "查看 GitHub",
      selfHostedGuide: "信号代码指南",
      selfHostedNote: "用自己的数据运行信号和回测代码",
      included: "信号、回测、API 和前端代码（Apache-2.0）",
      excluded: "不含行情数据、训练好的模型和托管工作台",
      compareDescription: "开源信号和回测代码需自备日线价格（含 ^GSPC 基准）、指数成分历史和交易日历，不含托管工作台。托管的免费版和 Premium 使用相同的模型；升级不会改变信号准确率，也不代表更低的投资风险。",
      question: "使用开源代码需要准备什么？",
      answer: "源码免费，采用 Apache-2.0 协议。请按信号仓库的 README，自备日线价格（含 ^GSPC 基准）、指数成分历史和交易日历，阅读、测试和运行信号与回测代码。不含行情数据、训练好的模型和托管工作台。开源协议不包含任何第三方行情数据的权利，数据商有各自的条款。分析结果仅供参考，不构成投资建议。",
    };
    const { included, excluded, question, answer, ...fields } = expected;
    for (const [key, value] of Object.entries(fields)) {
      assert.equal(copy[key], value, key);
    }
    assert.equal(copy.selfHostedFeatures[0], included);
    assert.equal(copy.selfHostedFeatures[4], excluded);
    assert.deepEqual(copy.questions[0], { question, answer });
    const features = copy.selfHostedFeatures.join("\n");
    for (const term of ["Apache-2.0", "GitHub Issues", "SLA"]) {
      assert.ok(features.includes(term), term);
    }
    const tierCopy = [
      ...Object.entries(copy).filter(([key]) => key.startsWith("selfHosted")).flatMap(([, value]) => value),
      copy.eyebrow, copy.description, copy.compareDescription,
      ...copy.questions.flatMap(({ question, answer }) => [question, answer]),
    ].join("\n");
    assert.doesNotMatch(tierCopy, /deploy|maintain|pipeline|自行部署|自己部署|自托管|自己的电脑|服务器|运行流程/i);
  });

  test(`${language}: open-source code comes first without changing the hosted cards`, () => {
    const cards = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
    assert.equal(cards.length, 3);
    assert.deepEqual(
      cards.map(([card]) => card.match(/<h2>(.*?)<\/h2>/)[1]),
      [copy.selfHosted, copy.free, copy.premium],
    );
    const [selfHosted, free, premium] = cards.map(([card]) => card);
    assert.equal(copy.selfHosted, language === "en" ? "Open-source code" : "开源代码");
    assert.equal(copy.selfHostedBadge, language === "en" ? "Open source" : "开源");
    assert.match(selfHosted, /<strong>\$0<\/strong>/);
    assert.ok(selfHosted.includes(`<span class="plan-badge">${copy.selfHostedBadge}</span>`));
    for (const text of [
      copy.selfHostedDescription, copy.selfHostedPeriod, copy.selfHostedBilling,
      copy.selfHostedNote, ...copy.selfHostedFeatures,
    ]) {
      assert.ok(selfHosted.includes(renderToStaticMarkup(text)), text);
    }
    assert.equal([...selfHosted.matchAll(/<li>/g)].length, 5);
    const githubLink = selfHosted.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)[0];
    assert.equal(config.githubUrl, "https://github.com/predixlab");
    assert.ok(githubLink.includes(`href="${config.githubUrl}"`));
    assert.match(githubLink, /target="_blank" rel="noopener noreferrer"/);
    assert.match(githubLink, /class="button button-secondary"/);
    assert.ok(githubLink.includes(copy.selfHostedAction));
    assert.ok(githubLink.includes(`<span class="sr-only">${copy.externalLinkNote}</span>`));
    assert.match(githubLink, /<svg[^>]*aria-hidden="true"/);
    assert.match(selfHosted, new RegExp(`href="/docs/self-hosting/"[^>]*>${copy.selfHostedGuide}`));
    assert.match(free, /<strong>\$0<\/strong>/);
    assert.ok(free.includes(renderToStaticMarkup(dashboardLink("/", "pricing-free"))));
    assert.match(premium, /class="plan plan-premium"/);
    assert.match(premium, /<strong>\$20<\/strong>/);
    assert.ok(premium.includes(renderToStaticMarkup(dashboardLink("/profile", "pricing-monthly"))));
  });

  test(`${language}: comparison distinguishes source code from hosted access`, () => {
    const expectedAvailability = language === "en" ? {
      "Market overview": "Dashboard code only; no data",
      "Price charts": "Code only; bring your own data",
      "Stock screener": "Dashboard code only; no data",
      "Daily signals": "Code only; bring your own data",
      "Options activity": "Hosted only",
      "Signal performance": "Code only; bring your own data",
    } : {
      "市场概览": "仅前端代码，不含数据",
      "股价图表": "仅提供代码，需自备数据",
      "量化选股器": "仅前端代码，不含数据",
      "每日信号": "仅提供代码，需自备数据",
      "期权异动": "仅托管版提供",
      "信号表现": "仅提供代码，需自备数据",
    };
    assert.equal(copy.selfHostedAvailability.length, copy.rows.length);
    assert.deepEqual(
      Object.fromEntries(copy.rows.map((row, index) => [row, copy.selfHostedAvailability[index]])),
      expectedAvailability,
    );
    assert.match(html, /class="comparison-table-scroll" role="region" aria-labelledby="plan-comparison-title" tabindex="0"/);
    const table = html.match(/<table\b[^>]*>([\s\S]*?)<\/table>/)[0];
    assert.ok(table.includes(`<caption class="sr-only">${copy.compareTitle}</caption>`));
    assert.deepEqual(
      [...table.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(([, heading]) => heading),
      [copy.featureColumn, copy.selfHosted, copy.free, copy.premium],
    );
    const rows = [...table.matchAll(/<tr><th scope="row">(.*?)<\/th>(.*?)<\/tr>/g)];
    assert.equal(rows.length, 6);
    const productPaths = {
      2: "/quantitative-stock-screener/",
      3: "/us-stock-signals/",
      4: "/unusual-options-activity/",
    };
    rows.forEach(([, heading, cells], index) => {
      const path = productPaths[index];
      assert.equal(heading, path ? `<a href="${path}" data-discover="true">${copy.rows[index]}</a>` : copy.rows[index]);
      assert.deepEqual(
        [...cells.matchAll(/<td>(.*?)<\/td>/g)].map(([, value]) => value),
        [expectedAvailability[copy.rows[index]], index < 3 ? copy.included : copy.delayed, index < 3 ? copy.included : copy.latest],
      );
    });
  });

  test(`${language}: open-source code FAQ is rendered and is not a hosted structured-data offer`, () => {
    const faq = copy.questions[0];
    const firstFaq = html.match(/<details\b[^>]*>([\s\S]*?)<\/details>/)[0];
    assert.ok(firstFaq.includes(renderToStaticMarkup(faq.question)));
    assert.ok(firstFaq.includes(renderToStaticMarkup(faq.answer)));
    const schema = getPageSeo("/pricing/", language).structuredData;
    const software = schema["@graph"].find((item) => item["@type"] === "SoftwareApplication");
    assert.deepEqual(software.offers.map((offer) => offer.price), [0, 20, 192]);
    assert.equal(software.offers[0].name, copy.free);
  });
}
