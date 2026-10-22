---
lang: en
title: "Self-host PredixLab: run the open-source signal pipeline"
shortTitle: "Self-hosting"
description: "The signal, backtest, API and dashboard code is open source (Apache-2.0)."
summary: "The signal, backtest, API and dashboard code is open source (Apache-2.0). Learn how it fits together and run the signal tests."
h1: "Self-host PredixLab"
date: "2026-10-21"
updated: "2026-10-22"
order: "3"
translationKey: self-hosting
---

# Self-host PredixLab

The signal, backtest, API and dashboard code is open source (Apache-2.0).

We publish the code so you don't have to take our word for the method. Read it, run the tests, and tell us where it's wrong.

## Why open source

Most signal tools ask you to trust numbers without showing how they're made. We'd rather show the work. The signal features, labels, validation splits, and backtest assumptions described in the [How it works](/docs/how-it-works/) doc are in the public signals code. You can inspect the method and check it with data you supply.

## The repositories

These repositories are public and licensed under Apache-2.0:

| Repository | What it does | Stack |
| --- | --- | --- |
| [predixlab-signals](https://github.com/predixlab/predixlab-signals) | Builds datasets, runs walk-forward training of LightGBM models, evaluates and backtests them, and publishes daily Pivot events and AlphaRank rankings | Python 3.11+ |
| [predixlab-api](https://github.com/predixlab/predixlab-api) | FastAPI backend for accounts, market data, signals, screeners, watchlists, and subscriptions | Python 3.12+ |
| [predixlab-webapp](https://github.com/predixlab/predixlab-webapp) | The signed-in dashboard: signals with charts, market overview, screener, signal performance, options activity | React, TypeScript |
| [predixlab-portal](https://github.com/predixlab/predixlab-portal) | This website: bilingual product pages, pricing, and legal pages, pre-rendered to static HTML | React, TypeScript |
| [predixlab-campaign](https://github.com/predixlab/predixlab-campaign) | Opt-in email delivery, currently the Premium daily-signals digest, with unsubscribe handling | Python, Azure Functions |
| [predixlab-infra](https://github.com/predixlab/predixlab-infra) | Shared job schedules and workload definitions, Azure Bicep templates, and a local staging environment | Bicep, shell |

Data collection and options analysis run as part of the hosted service and aren't in the public repositories.

### How the pieces connect

```
hosted data jobs → daily prices, membership, calendar, snapshots
   ├─ signals → walk-forward research → approved model → daily Pivot events + AlphaRank
   └─ hosted options analysis → session-to-session chain comparison → unusual activity, GEX, structure
api → reads the published results → dashboard (webapp)
portal → public pages → links into the dashboard
```

## Run it or check it

You don't need an account to inspect the public code. The public repositories' READMEs describe their setup. Start with the signal tests.

**Run the signal tests** (Python 3.11+ and [uv](https://docs.astral.sh/uv/)):

```bash
git clone https://github.com/predixlab/predixlab-signals.git
cd predixlab-signals
uv sync --frozen --extra dev --extra job
uv run pytest -q
```

The tests cover leakage rules directly. Appending future data must not change past features or events. Forward labels must exclude the signal day. The purge gap must cover the label horizon. Pivot backtest entries must occur on the next session, never the signal day, and same-day target/stop touches are resolved stop-first. The tests don't remove the data limitations listed in the [Known limitations](/docs/limitations/) doc, such as missing delisted companies.

Full research runs (dataset → train → evaluate → backtest → report) need the complete historical data tree: daily OHLCV, dated index membership intervals, and a trading calendar, as described in [How it works](/docs/how-it-works/#data-sources). Data collection runs as part of the hosted service and isn't in the public repositories. This guide does not provide a data-preparation workflow. The signals README lists the research commands.

## What the license does and doesn't cover

The public source code is Apache-2.0. The license does not grant rights to any third-party market data; data providers keep their own terms. Trained model files and the hosted service are also outside the license. Model bundles are Python pickles: only load ones from a source you trust.

## Contribute

- **Report a bug or propose a change:** open an issue in the relevant repository. Discuss larger interface or data-contract changes before writing code.
- **Send a pull request:** work on a focused branch, add tests for any behavior change, and include the commands you ran. Changes to features, labels, or event rules need leakage tests and a reproducible evaluation, not hand-picked examples.
- **Security issues:** report them privately as described in each repository's `SECURITY.md`, not in a public issue.
- **Questions about the method:** an issue on [predixlab-signals](https://github.com/predixlab/predixlab-signals/issues) is the best place. Disagreement backed by evidence is welcome.

Contributions are accepted under Apache-2.0.

## Related

- [How it works](/docs/how-it-works/): data, schedule, validation, and backtest assumptions in plain language
- [Walk-forward validation for stock signals](/blog/walk-forward-validation/)
- Product pages: [daily signals](/us-stock-signals/), [stock screener](/quantitative-stock-screener/), [unusual options activity](/unusual-options-activity/)
