import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { validateRobotsTxt } from "./validate-seo.mjs";

const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");

test("the public robots source allows general crawling and blocks the AI-training group", () => {
  validateRobotsTxt(robots);
});

test("the wildcard crawler group must explicitly allow the whole site", () => {
  assert.throws(() => validateRobotsTxt(robots.replace("Allow: /", "Disallow: /")));
  assert.throws(() => validateRobotsTxt(robots.replace("User-agent: *\nAllow: /\n", "")));
});

test("every AI-training crawler must remain in the single blocked group", () => {
  const crawlers = [
    "GPTBot", "CCBot", "Google-Extended", "ClaudeBot", "anthropic-ai", "Bytespider",
    "Applebot-Extended", "meta-externalagent", "Amazonbot", "cohere-training-data-crawler",
    "Diffbot", "omgili",
  ];
  for (const crawler of crawlers) {
    assert.throws(
      () => validateRobotsTxt(robots.replace(`User-agent: ${crawler}\n`, "")),
      /AI-training crawler list differs/,
      crawler,
    );
  }
  assert.throws(() => validateRobotsTxt(robots.replace("Disallow: /", "Allow: /")));
  assert.throws(() => validateRobotsTxt(robots.replace("User-agent: CCBot", "Disallow: /\n\nUser-agent: CCBot")));
  assert.throws(() => validateRobotsTxt(robots.replace("Disallow: /", "Disallow: /\nDisallow: /")));
});

test("search crawlers cannot be added to a Disallow group", () => {
  for (const crawler of [
    "Googlebot", "Bingbot", "Baiduspider", "PetalBot", "GoogleOther", "YandexBot", "Sogou", "360Spider", "PerplexityBot",
  ]) {
    assert.throws(
      () => validateRobotsTxt(robots.replace("Disallow: /", `User-agent: ${crawler}\nDisallow: /`)),
      /Search crawler must not be disallowed/,
      crawler,
    );
  }
});

test("PerplexityBot uses the allowed wildcard group without an explicit group", () => {
  assert.doesNotMatch(robots, /User-agent:\s*PerplexityBot/i);
  validateRobotsTxt(robots);
});

test("the production sitemap must remain a complete directive", () => {
  const sitemap = "Sitemap: https://predixlab.com/sitemap.xml";
  assert.throws(() => validateRobotsTxt(robots.replace(sitemap, "")), /Keep the production Sitemap line/);
  assert.throws(
    () => validateRobotsTxt(robots.replace(sitemap, `${sitemap}.other`)),
    /Keep the production Sitemap line/,
  );
});

test("comments, CRLF line endings, and case-insensitive directives preserve the policy", () => {
  validateRobotsTxt(`# Crawler policy\n${robots}`.replaceAll("\n", "\r\n"));
  validateRobotsTxt(robots.toLowerCase());
});
