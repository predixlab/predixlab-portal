# PredixLab Portal

[Contributing](CONTRIBUTING.md) | [Security](SECURITY.md) | [Apache-2.0](LICENSE)

PredixLab Portal is the bilingual public website for PredixLab's US stock analysis tools. It explains daily signals, quantitative screening, options activity, plans, and product limitations, then directs visitors to the Dashboard. It does not provide account, billing, market-data, or signal services.

## Role in PredixLab

```text
predixlab.com           -> Public product, pricing, about, terms, and privacy pages
dashboard.predixlab.com -> Authenticated analysis workspace
api.predixlab.com       -> Application API
```

The Portal and Dashboard URLs are source constants in [`src/config.ts`](src/config.ts). Dashboard links use that module's shared referral helper. The Portal does not call the application API.

The shared footer uses icon-only links to PredixLab's official GitHub and X profiles
from the same configuration, with localized accessible labels that announce opening a new tab.

## Site content

| Route | Purpose |
| --- | --- |
| `/` | Product overview and interactive chart walkthrough |
| `/us-stock-signals/` | Daily signals, historical context, access, and limitations |
| `/quantitative-stock-screener/` | No-code screening criteria and workflow |
| `/unusual-options-activity/` | Contract-level activity and interpretation boundaries |
| `/pricing/` | Self-hosted/Free/Premium comparison and hosted monthly/annual pricing |
| `/about/` | Product purpose, research process, and contact information |
| `/terms/`, `/privacy/` | Legal documents |
| `/docs/` | English documentation index |
| `/docs/how-it-works/`, `/docs/limitations/`, `/docs/self-hosting/` | Data and signal methods, known limitations, and running the source code |
| `/blog/`, `/blog/<slug>/` | English research guides, grouped by category |
| `/blog/rss.xml` | RSS 2.0 feed |
| `*` | Not-found page |

The public HTML pages default to English. The language button switches the original product, company, and legal pages between English and Chinese in place without changing the URL, query string, hash, browser history or page state. Docs and blog content remain English (with bilingual risk disclaimers on articles), even when the shared navigation is Chinese. The choice is stored under `predixlab-language` and restored after hydration, including on subsequent page visits; without a saved choice, the site uses English rather than the browser's language. If browser storage is unavailable, in-page switching still works for the current visit.

The flat header navigation is Tools / Pricing / Docs / Blog / About. Tools links to `/#tools` in both languages, including from other pages, with scroll clearance for the sticky header. Docs always links to `/docs/`. The desktop navigation becomes a mobile menu at 860px.

Language-prefixed routes such as `/en/...` and `/zh/...` are not supported and return 404, except for the explicit retired insights redirects below. There are no other legacy language redirects or query-parameter migrations. New links never contain a language prefix or parameter; language is controlled only by the in-page selection and saved preference.

The retired `/insights/` listing permanently redirects to `/blog/`, and `/insights/walk-forward-validation-stock-signals/` permanently redirects to `/blog/walk-forward-validation/`. Their `/en/insights/...` variants redirect to the same targets. These old URLs are not linked or included in the sitemap.

The $0 Self-hosted option is Apache-2.0 pipeline source code, not a hosted offer. Users deploy it with their own infrastructure, data licenses, and compute; it does not include PredixLab-hosted data, a dashboard, an account, or an SLA. Hosted Free and Premium prices and structured-data offers remain separate.

The homepage scene is an original workflow illustration, not a live chart or an actual security's history. It progresses through price/volume, technical context, and an example signal. Manual stage selection pauses autoplay. A pause control, reduced-motion preference, offscreen detection, and document visibility limit nonessential animation. All substantive English content remains available without JavaScript; switching to Chinese requires JavaScript.

## Content and design

- [`src/content/site.ts`](src/content/site.ts): homepage, chart walkthrough, general questions, and conversion copy.
- [`src/content/products.ts`](src/content/products.ts): bilingual tool descriptions, workflows, access notes, and related links.
- [`src/content/company.ts`](src/content/company.ts): pricing, plan terms, and product principles.
- [`src/i18n/locales/`](src/i18n/locales/): shared navigation, metadata, footer, and consent translations.
- [`src/content/legalDocuments.ts`](src/content/legalDocuments.ts): legal text; do not change contractual terms as part of marketing edits.
- [`src/content/docs/`](src/content/docs/): documentation Markdown, discovered automatically and sorted by `order`; `index.md` supplies the index heading and intro.
- [`src/content/blog/`](src/content/blog/): posts discovered automatically by a build-time glob; the filename is the lowercase, hyphen-separated slug.

Add a post by adding one `.md` file in `src/content/blog/`; no route or post registry needs editing. Frontmatter uses a deliberately small subset of YAML: flat, nonempty string fields only, with no nested values or multiline scalars. Quote values containing punctuation. Required fields are `title`, `shortTitle` (short breadcrumb name), `description`, `date`, `updated`, `lang: en`, `category`, and `translationKey` (lowercase hyphen-separated key). Dates must be valid `YYYY-MM-DD` strings and `updated` must not precede `date`. For example:

```yaml
---
title: "A Practical Guide to Validation"
shortTitle: "Validation"
description: "A guide to checking a research process and understanding its limits."
date: "2026-10-21"
updated: "2026-10-21"
lang: en
category: "Backtesting & validation"
translationKey: validation
---
```

Start the body with exactly one H1. End with a horizontal rule followed by separate English and Chinese risk-disclaimer paragraphs; preserve approved copy. Markdown supports tables, lists, fenced code and stable heading anchors, but not raw HTML. Draft markers, legacy learn links, invalid fields, and duplicate slugs fail the build. Optional `image` and `imageAlt` must be supplied together; `image` is a local 1200x630 PNG path, and `imageAlt` describes the actual image. Otherwise posts use the existing workflow-illustration sharing image. Blog groups place **Backtesting & validation** first and sort posts newest first; related posts prefer the same category.

Add documentation with one `.md` file in `src/content/docs/`. Required frontmatter is `title` (at most 60 characters), `shortTitle`, `description` (at most 155 characters), `updated` (`YYYY-MM-DD`), `order` (a quoted nonnegative integer, unique across docs), `translationKey` (a unique lowercase hyphen-separated key), and `lang: en`. Optional `h1` must match the body heading. Docs use the same Markdown rules and risk disclaimers as blog posts; only the short `index.md` omits the disclaimers. The filename supplies `/docs/<slug>/`, while `index.md` supplies `/docs/`. Routes, index cards, sidebar links, and sitemap entries are discovered automatically. The desktop sidebar becomes a simple list below 860px.

The visual system uses an off-white canvas, forest-green editorial sections, and a focused blue accent. Manrope and IBM Plex Mono are self-hosted in `public/fonts/` with their OFL licenses; Chinese uses system font fallbacks. Light and dark themes share the same structure. Original SVG sharing artwork and its 1200×630 PNG exports live in `public/social/`.

Write Chinese and English independently for native readers rather than translating sentence by sentence. Prefer familiar investing language for watching markets, screening stocks, analysis, and review over academic framing. Keep the core facts aligned: features, coverage, data dates, prices, access limits, and risk disclosures. Review headings, controls, accessibility labels, metadata, and image text together. Repository documentation is written in English; product localization remains bilingual.

Keep descriptions grounded in shipped tools. Never imply that daily data is real-time, that a score is a probability of profit, or that Premium improves model accuracy.

## Static rendering and SEO

[`src/routing.ts`](src/routing.ts) is the public route inventory. The production build renders every page in English to full HTML before hydration: headings, body copy, internal links, FAQs, and legal documents are not dependent on JavaScript for discovery. The client hydrates that same English content before restoring a stored language preference, avoiding mismatched server/client markup.

Build-time metadata and client navigation use the same SEO definitions. Each indexable page has one canonical trailing-slash URL, Open Graph/Twitter metadata, and relevant structured data. Switching languages updates page content, document language, metadata and structured data without changing the canonical URL. There are no language-specific URLs or hreflang alternates; English is the default indexed content, and Chinese is an in-page presentation choice rather than a separately indexable version. Organization, website, page, breadcrumb, software, and FAQ entities describe the actual visible content; do not add unverified ratings or performance claims.

Header and mobile navigation stay flat: Tools (`/#tools`), Pricing, Docs, Blog, About, plus GitHub and Dashboard links. Product pages remain linked from the homepage cards, pricing comparison table, and footer. Sharing images use image-specific localized alt text; English-only blog posts can override both the image and its alt text in frontmatter. Breadcrumbs use short localized page names, with English-only `Home > Docs > <shortTitle>` and `Home > Blog > <shortTitle>` hierarchies for articles.

The Organization entity uses those official profiles as `sameAs` and the existing
512×512 transparent PNG (`/icons/icon-transparent.png`) as its logo. Build validation
checks the footer links, open-source status, profile identities, and PNG logo dimensions.

The sitemap is generated from `sitePages`, including automatically discovered blog posts and docs. It contains only unprefixed canonical HTML-page URLs. Blog posts and docs use `updated` as `lastmod`; each index uses the newest article update in its section. Existing product, company, and legal pages omit `lastmod`. Do not maintain a separate list of URLs or language alternates. The not-found document is excluded from indexing. The Azure configuration serves actual 404 responses rather than rewriting arbitrary URLs to the homepage. Its global error override serves the default-English `/404.html`, which supports the same in-page language choice. Unknown and unsupported language-prefixed paths remain 404s; only the explicit retired insights paths redirect.

Posts emit `BlogPosting`, docs emit `TechArticle` with `dateModified` from `updated`, and self-hosting emits one Apache-2.0 `SoftwareSourceCode` per repository-table row. Articles reference the shared Organization node and include dates, language, canonical URL and sharing image. Both indexes emit `CollectionPage`; the blog index also emits `ItemList`. Docs and blog pages have visible breadcrumbs and matching `BreadcrumbList` data. Blog pages advertise `/blog/rss.xml` in their head; the generated RSS feed uses post frontmatter and Azure serves it with `Content-Type: application/rss+xml`.

[`public/robots.txt`](public/robots.txt) is the single source of truth for crawler rules on predixlab.com and is meant to replace Cloudflare's managed robots.txt. Vite copies it unchanged to `dist/robots.txt`; build validation checks that general crawling stays allowed, the listed AI-training crawlers are blocked, search crawlers are not blocked, and the sitemap directive is preserved.

## Run locally

Use Node.js 22.12+ and npm:

```bash
git clone https://github.com/predixlab/predixlab-portal.git
cd predixlab-portal
npm ci
npm run dev
```

The development server runs at <http://localhost:3000>. Vite's `/api` proxy is present for local development configuration, but current Portal pages make no API requests.

Google Analytics is optional at deployment time. Copy `.env.example` and set a GA4 Measurement ID to enable Advanced Consent Mode, the analytics-cookie prompt and SPA page-view tracking:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Without this value, no analytics script or consent prompt is loaded. Production deployment reads the same value from the `VITE_GA_MEASUREMENT_ID` GitHub Actions secret.

With this value, consent defaults and page-view commands are queued synchronously on every page. The Google tag loads when the browser is idle (with a two-second timeout), or in a timer after window load if idle callbacks are unavailable; it does not wait for a cookie choice. Analytics storage defaults to `denied`, so GA4 can send cookieless measurement requests. A saved or new acceptance grants analytics storage; declining or withdrawing consent restores `denied` without disabling cookieless measurement. Consent changes do not manually resend page views. Advertising storage, advertising user data and ad personalization always remain denied, and Google signals are disabled. Cookieless requests still transmit data to Google: this configuration does not itself establish a consent exemption. Confirm the applicable legal basis before deploying it.

For page-view-focused measurement, configure the GA4 property as follows:

- Keep Enhanced Measurement page views enabled, including browser-history page changes. Portal relies on that setting for React Router navigation and does not emit a second manual page-view event.
- Disable the other Enhanced Measurement categories (scrolls, outbound clicks, site search, video engagement, file downloads and form interactions). Keep Google signals, user-provided data collection and advertising integrations disabled. GA4 may still emit automatic lifecycle events; selecting PV/UV reports does not restrict collection to just those two metrics.
- Use the Blended reporting identity to include behavioral modeling when the property is eligible. Check the property's modeling status rather than assuming that a successful collection request is visible in standard reports.

Unconsented page views have no persistent analytics identifier, so they do not provide reliable observed unique-user counts. Google's [behavioral modeling requirements](https://support.google.com/analytics/answer/11161109) currently include at least 1,000 `analytics_storage='denied'` events per day for 7 days and at least 1,000 daily users with `analytics_storage='granted'` on 7 of the previous 28 days. Meeting those thresholds does not guarantee eligibility. Without sufficient consented traffic and modeling eligibility, unconsented events may remain absent from standard reports even though requests are sent. This implementation fixes collection being completely blocked before consent; it cannot guarantee complete GA4 PV/UV reports for a low-traffic site.

Validate in a fresh browser profile: before making a choice, the tag and measurement requests should load without `_ga` cookies. Choosing to allow analytics cookies permits cookie-based measurement; declining keeps cookieless measurement. Verify one initial page view and one per history navigation in both states, and verify that changing the cookie choice does not add a manual page view. Use a test property or intercept collection requests during automated checks to avoid polluting production reports.

## Common commands

```bash
npm test
npm run lint
npm run build
npm run preview
```

`test` runs isolated language-preference, canonical-routing, crawler-policy, bilingual homepage-copy and pricing-rendering, analytics consent-mode, Markdown/frontmatter, blog grouping, RSS, sitemap date, and Azure redirect/header regression checks without contacting Google. Homepage checks preserve the approved two-line H1, subhead, localized metadata, and derived schema descriptions; build validation requires exactly one H1 with the approved copy in the prerendered HTML.

`build` type-checks, bundles, and prerenders the deployable static site into `dist/`. It also verifies full English page bodies, canonical URLs, in-page language buttons, internal links, structured data, sharing images, and routing invariants. Regression checks require the retired insights 301s, forbid links to those URLs, reject language-specific sitemap entries and unapproved language redirects, and check article dates, short breadcrumbs, risk disclaimers, RSS discovery and its content-type rule. Rerun that artifact check independently with `node scripts/validate-seo.mjs`.

Build-time rendering must fail if a page cannot render; do not replace failures with an empty SPA shell. The temporary `.prerender/` server bundle is removed in a `finally` block. Inspect both generated HTML and hydrated interactions when changing rendering or routing. `preview` uses multi-page mode so unknown routes return 404 rather than falling back to the homepage.

## Deployment

CI uses Node.js 24 and the committed npm lockfile, runs `npm test`, and builds
and prerenders before uploading. `VITE_GA_MEASUREMENT_ID` is supplied to the
explicit build step. The deployment action uploads prebuilt `dist/` with its
app build disabled; it does not run a second build with an implicit Node version.

The Azure Static Web Apps workflow builds and deploys `dist/` from the repository root. [`staticwebapp.config.json`](staticwebapp.config.json) holds the base not-found and asset-caching configuration; the build adds canonical route rewrites and redirects to `dist/staticwebapp.config.json`. Deploy the generated configuration, not just the base file. Deployment needs the Azure token referenced by the workflow. Other hosts must serve generated directory indexes, preserve canonical redirects, and return HTTP 404 for unknown paths; do not add a blanket successful SPA fallback.

Only `/assets/*` (Vite content-hashed build files) and `/fonts/*` receive
`Cache-Control: public, max-age=31536000, immutable`: one year of immutable
caching. Fonts in `public/fonts/` are not content-hashed, so every changed font
must have a new filename and its CSS references must use that new name; do not
overwrite an existing font file in place. HTML pages, the sitemap, `robots.txt`,
icons, social images, and other files outside those directories keep their
existing caching, with no global long-lived cache header.

Azure normalizes a directory route with and without its trailing slash to the
same configuration key. The generated configuration therefore has one rewrite
per public page, not a second slashless redirect rule that Azure would reject.
Top-level `trailingSlash: "auto"` makes slashless directory requests 301 to the
trailing-slash URL; explicit `index.html` aliases also redirect to that URL.
File requests such as `/robots.txt`, `/sitemap.xml`, verification text files,
scripts, and images are served without a trailing-slash redirect.
Build validation checks route uniqueness after Azure-style slash normalization,
as well as not-found responses and index-alias redirect behavior.

After a successful production deployment from `main` (push or manual dispatch),
the workflow notifies IndexNow of the canonical URLs in `dist/sitemap.xml` using
the existing public verification key file. Pull-request previews never notify
IndexNow. Notifications are best-effort, time out after 15 seconds, and only warn
on request or local-file errors; they cannot fail deployment.
Preview the payload with `npm run build && npm run indexnow -- --dry-run`.
To submit it manually after deployment, run `npm run indexnow` without `--dry-run`.

## Operating boundaries

- Plan information, feature availability, and coverage may change. The published Portal and Dashboard are the user-facing source of current availability.
- PredixLab is not a broker, investment adviser, or trading venue. Historical data and model output do not guarantee future results.
- The Portal does not implement authentication, subscription processing, or market-data access.

## Documentation

- [PredixLab Dashboard](https://github.com/predixlab/predixlab-webapp)
- [PredixLab API](https://github.com/predixlab/predixlab-api)
- [Portal configuration](src/config.ts)

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md) for tests, build validation, accessibility,
and content requirements. Use
[GitHub Issues](https://github.com/predixlab/predixlab-portal/issues) for bugs and
proposals, and [SECURITY.md](SECURITY.md) for private vulnerability reports.

## License

Copyright 2026 PredixLab contributors.

Project source is licensed under the [Apache License 2.0](LICENSE).
Self-hosted fonts retain their [Manrope](public/fonts/manrope-LICENSE.txt) and
[IBM Plex Mono](public/fonts/ibm-plex-mono-LICENSE.txt) licenses.
Third-party services and product legal documents have separate purposes and terms.
