---
lang: en
title: "PredixLab Is Open Source: Code From Data to Daily Signals"
shortTitle: "Open source"
description: "All PredixLab components are Apache-2.0 on GitHub: data collection, signal models, options analysis, API, dashboard. How to run, verify and contribute."
h1: "PredixLab is open source"
datePublished: "2026-10-21"
dateModified: "2026-10-21"
---

# PredixLab is open source

PredixLab's product, from price collection to the dashboard you sign in to, is built from open-source repositories on GitHub. Each one is licensed under Apache-2.0. We publish the code so you don't have to take our description of the method on trust: you can read it, run it, and tell us where it's wrong.

## Why open source

Signal tools ask you to rely on numbers you can't see being made. We would rather show the work. The data sources, features, labels, validation splits, and backtest assumptions described on the [Methodology](/methodology/) page all live in code. Anyone can reproduce or challenge them.

## The repositories

| Repository | What it does | Stack |
| --- | --- | --- |
| [predixlab-collector](https://github.com/predixlab/predixlab-collector) | Maintains index membership, trading calendars, and daily OHLCV for S&P 500 and Nasdaq-100 stocks; builds the market overview and screener snapshots | Python 3.12+ |
| [predixlab-signals](https://github.com/predixlab/predixlab-signals) | Builds datasets, runs walk-forward training of LightGBM models, evaluates and backtests them, and publishes daily Pivot events and AlphaRank rankings | Python 3.11+ |
| [predixlab-options](https://github.com/predixlab/predixlab-options) | Compares options chains session to session, flags unusual open-interest changes, and estimates gamma exposure and volatility structure | Python 3.10+ |
| [predixlab-api](https://github.com/predixlab/predixlab-api) | FastAPI backend for accounts, market data, signals, screeners, watchlists, and subscriptions | Python 3.12+ |
| [predixlab-webapp](https://github.com/predixlab/predixlab-webapp) | The signed-in dashboard: signals with charts, market overview, screener, signal performance, options activity | React, TypeScript |
| [predixlab-portal](https://github.com/predixlab/predixlab-portal) | This website: bilingual product pages, pricing, and legal pages, pre-rendered to static HTML | React, TypeScript |
| [predixlab-campaign](https://github.com/predixlab/predixlab-campaign) | Opt-in email delivery, currently the Premium daily-signals digest, with unsubscribe handling | Python, Azure Functions |
| [predixlab-infra](https://github.com/predixlab/predixlab-infra) | Shared job schedules and workload definitions, Azure Bicep templates, and a local staging environment | Bicep, shell |

### How the pieces connect

```
collector → daily prices, membership, calendar, snapshots
   ├─ signals → walk-forward research → approved model → daily Pivot events + AlphaRank
   └─ options → session-to-session chain comparison → unusual activity, GEX, structure
api → reads the published results → dashboard (webapp)
portal → public pages → links into the dashboard
```

## Run it or check it

You don't need an account to inspect the method. Each repository's README has a quick start. Here are three useful entry points.

**Run the signal tests** (Python 3.11+ and [uv](https://docs.astral.sh/uv/)):

```bash
git clone https://github.com/predixlab/predixlab-signals.git
cd predixlab-signals
uv sync --frozen --extra dev --extra job
uv run pytest -q
```

The tests cover leakage rules directly. Appending future data must not change past features or events. Forward labels must exclude the signal day. The purge gap must cover the label horizon. Pivot backtest entries must occur on the next session, never the signal day, and same-day target/stop touches are resolved stop-first. The tests don't remove the data limitations listed on the [Methodology](/methodology/#known-limitations) page, such as missing delisted companies.

**Collect a small sample of prices:**

```bash
git clone https://github.com/predixlab/predixlab-collector.git
cd predixlab-collector
cp .env.example .env
uv sync --frozen
uv run predixlab-collector collect_index --market=us
uv run predixlab-collector collect_calendar --market=us --start_date=2024-01-01
uv run predixlab-collector collect_data --market=us --provider=yahoo --symbols=AAPL,MSFT --start_date=2024-01-01
```

**Read the options gates:** the thresholds and scoring are documented in [`docs/anomaly-detection.md`](https://github.com/predixlab/predixlab-options/blob/main/docs/anomaly-detection.md) and implemented in `options_monitor/analyzer.py` and `options_monitor/config.py`.

Full research runs (dataset → train → evaluate → backtest → report) need the complete historical data tree. The signals README lists the exact commands.

## What the license does and doesn't cover

The source code is Apache-2.0. The license does not grant rights to third-party market data. Yahoo Finance, Cboe, and other providers keep their own terms, and the code shouldn't be used to bypass their access limits. Trained model files and the hosted service are also outside the license. Model bundles are Python pickles: only load ones from a source you trust.

## Contribute

- **Report a bug or propose a change:** open an issue in the relevant repository. Discuss larger interface or data-contract changes before writing code.
- **Send a pull request:** work on a focused branch, add tests for any behavior change, and include the commands you ran. Changes to features, labels, or event rules need leakage tests and a reproducible evaluation, not hand-picked examples.
- **Security issues:** report them privately as described in each repository's `SECURITY.md`, not in a public issue.
- **Questions about the method:** an issue on [predixlab-signals](https://github.com/predixlab/predixlab-signals/issues) is the best place. Disagreement backed by evidence is welcome.

Contributions are accepted under Apache-2.0.

## Related

- [Methodology](/methodology/): data, schedule, validation, and backtest assumptions in plain language
- [Walk-forward validation for stock signals](/blog/walk-forward-validation/)
- Product pages: [daily signals](/us-stock-signals/), [stock screener](/quantitative-stock-screener/), [unusual options activity](/unusual-options-activity/)

---

*For information and independent analysis only — not investment advice. Data can be delayed or wrong, models can fail, and past performance doesn't predict future results.*

本页内容仅用于信息和研究参考，不构成投资建议。投资有风险，过往表现不代表未来结果。
