import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, watch: null },
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

for (const language of ["zh", "en"]) {
  const copy = pricingContent[language];
  const html = renderToStaticMarkup(
    createElement(I18nextProvider, { i18n: createSiteI18n(language) }, createElement(PricingPage)),
  );

  test(`${language}: self-hosting comes first without changing the hosted cards`, () => {
    const cards = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
    assert.equal(cards.length, 3);
    assert.deepEqual(
      cards.map(([card]) => card.match(/<h2>(.*?)<\/h2>/)[1]),
      [copy.selfHosted, copy.free, copy.premium],
    );
    const [selfHosted, free, premium] = cards.map(([card]) => card);
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
    assert.ok(githubLink.includes(`href="${config.githubUrl}"`));
    assert.match(githubLink, /target="_blank" rel="noopener noreferrer"/);
    assert.match(githubLink, /class="button button-secondary"/);
    assert.ok(githubLink.includes(copy.selfHostedAction));
    assert.ok(githubLink.includes(`<span class="sr-only">${copy.externalLinkNote}</span>`));
    assert.match(githubLink, /<svg[^>]*aria-hidden="true"/);
    assert.match(free, /<strong>\$0<\/strong>/);
    assert.ok(free.includes(renderToStaticMarkup(dashboardLink("/", "pricing-free"))));
    assert.match(premium, /class="plan plan-premium"/);
    assert.match(premium, /<strong>\$20<\/strong>/);
    assert.ok(premium.includes(renderToStaticMarkup(dashboardLink("/profile", "pricing-monthly"))));
  });

  test(`${language}: comparison distinguishes source deployment from hosted access`, () => {
    assert.match(html, /class="comparison-table-scroll" role="region" aria-labelledby="plan-comparison-title" tabindex="0"/);
    const table = html.match(/<table\b[^>]*>([\s\S]*?)<\/table>/)[0];
    assert.ok(table.includes(`<caption class="sr-only">${copy.compareTitle}</caption>`));
    assert.deepEqual(
      [...table.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(([, heading]) => heading),
      [copy.featureColumn, copy.selfHosted, copy.free, copy.premium],
    );
    const rows = [...table.matchAll(/<tr><th scope="row">(.*?)<\/th>(.*?)<\/tr>/g)];
    assert.equal(rows.length, 6);
    rows.forEach(([, heading, cells], index) => {
      assert.equal(heading, copy.rows[index]);
      assert.deepEqual(
        [...cells.matchAll(/<td>(.*?)<\/td>/g)].map(([, value]) => value),
        [copy.selfHostedAvailability, index < 3 ? copy.included : copy.delayed, index < 3 ? copy.included : copy.latest],
      );
    });
  });

  test(`${language}: self-hosting FAQ is rendered and is not a hosted structured-data offer`, () => {
    const faq = copy.questions[0];
    assert.ok(html.includes(renderToStaticMarkup(faq.question)));
    assert.ok(html.includes(renderToStaticMarkup(faq.answer)));
    const schema = getPageSeo("/pricing/", language).structuredData;
    const software = schema["@graph"].find((item) => item["@type"] === "SoftwareApplication");
    assert.deepEqual(software.offers.map((offer) => offer.price), [0, 20, 192]);
    assert.equal(software.offers[0].name, copy.free);
  });
}
