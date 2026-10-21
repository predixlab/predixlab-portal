---
lang: en
title: "Methodology: How PredixLab Builds and Tests Its Signals"
shortTitle: "Methodology"
description: "Data sources, nightly schedule, features, walk-forward validation, backtest assumptions and known limits behind PredixLab signals. Not investment advice."
h1: "How PredixLab builds and tests its signals"
datePublished: "2026-10-21"
dateModified: "2026-10-21"
---

# How PredixLab builds and tests its signals

PredixLab is a set of analysis tools for US stocks. This page explains where the data comes from, when it updates, how the models are trained and tested, and what the results can't tell you. The full code is open source, so every step described here can be checked in the repositories linked below.

## The short version

- **Daily data only.** Prices are daily bars. Signals and options data are produced by scheduled nightly jobs and labeled with a data date.
- **Coverage.** The platform tracks S&P 500 and Nasdaq-100 constituents. Some tools may cover a different set; each page shows what it includes.
- **Out-of-sample testing.** Models are evaluated with walk-forward validation: each test period is predicted by a model that never saw it.
- **Backtest fills.** Signals are never filled at the close that produced them, ambiguous bars assume the stop was hit first, and 10 bps is charged per side. The backtests also contain optimistic simplifications, listed under [Known limitations](#known-limitations).
- **No performance claims here.** This page explains method, not results. A model score is not a probability of profit.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Daily US stock prices (OHLCV) | Yahoo Finance, collected by `predixlab-collector` | History is built from 2015-01-01 and updated incrementally |
| Index membership | Constituent lists and history for the S&P 500 and Nasdaq-100 | Stored as dated membership intervals per symbol; the history is incomplete (see Known limitations) |
| Trading calendar | Derived from S&P 500 index (`^GSPC`) history | Used to decide which dates are trading sessions |
| Reference ETFs | SPY, QQQ, IWM, DIA | Kept separately for market context |
| Options chains | Cboe snapshots, collected by `predixlab-options` | Compared session to session, contract by contract |

Prices are cleaned before use: rows with missing dates or closes, or non-positive prices, are dropped, and duplicate dates keep the last row. Where the provider supplies adjustment factors they are applied; currently most symbols use split-only or unadjusted prices without dividends, so returns are price returns. On a scheduled run, if the target session's data is missing or widely repeated, the job stops before writing new results instead of silently reusing old numbers. Individual symbols with bad data are left out of that day's run.

## Update schedule

| Job | Schedule (UTC) | Beijing time | What it produces |
| --- | --- | --- | --- |
| Prices and signals | 02:30 daily | 10:30 | Updated daily prices, market overview and screener snapshot, AlphaRank rankings, Pivot events |
| Options | 11:30 daily | 19:30 | Unusual options activity, estimated gamma exposure, volatility and open-interest structure |

In US Eastern time, the signal job starts at 10:30 pm (9:30 pm in winter) on the evening after the session it processes. The options job starts at 7:30 am (6:30 am in winter) the next morning, before the market opens. A job can take up to 30 minutes (signals) or 60 minutes (options) to finish. Non-trading days produce no new session data, and a trading day with no qualifying events is normal.

Always check the data date shown in the dashboard. On the Free plan, signals, signal performance, and options activity appear with a 10-day delay. Premium shows the latest published data. It uses the same models, so it doesn't change model accuracy or reduce market risk.

## Indicators and features

The models look only at information available on or before each date. Feature groups include:

- returns over several periods, momentum, and moving-average trend;
- position within the recent range, breakouts, drawdowns, and rebounds;
- RSI and mean reversion;
- realized volatility and moves scaled by ATR (average true range);
- volume, money flow, candlestick shape, and gaps;
- return relative to the S&P 500, beta, correlation, and market context.

Features that need normalizing are scaled against each stock's own trailing 252 trading days, using at least 120 observations, and are clipped to limit outliers. Statistics from the full sample are never used, because that would leak future information into past rows.

## The two models

PredixLab publishes two kinds of output. They answer different questions and should be read differently.

**Pivot (turning points).** One shared set of LightGBM models is trained across all eligible stocks, not one model per stock. Its outputs estimate things like whether a recent low or high is likely to hold over the following window and how large the subsequent move may be. A continuous daily score becomes a state (Strong Buy to Strong Sell). Stricter rules about price location, confirmation, and duplicates then turn some states into sparse events: `BUY_TURN`, `SELL_TURN`, `TREND_BUY`, and `BASE_BREAKOUT`. Many days have no events, and that's expected.

**AlphaRank (relative ranking).** Three submodels trained on the most recent 36, 60, and 96 months rank stocks against one another on the same day. The dashboard shows the day's top-ranked names. A rank is relative: it says one stock scored higher than others that day, not that it will rise.

## Labels: what the models learn to predict

Training labels look forward from the next trading day (t+1) through a fixed horizon, 10 trading days by default. Labels that haven't finished by the end of the data stay empty instead of being counted as failures. Labels used only for evaluation, such as zigzag turning points, are never used as model inputs.

## Walk-forward validation

Testing a model on the data it learned from produces flattering results. PredixLab uses walk-forward validation instead:

```
training history → purge gap → validation period → embargo → test period
```

- Each fold trains only on data before its test period.
- A purge gap removes training rows whose forward labels overlap the validation or test period.
- An embargo leaves a buffer between periods.
- Model score thresholds are calibrated on validation data. Event rules were developed using the walk-forward history, so those results are not fully independent out-of-sample evidence.
- Evaluation, backtests, and reports all read the saved out-of-sample predictions. History is never re-scored with the final model and presented as out-of-sample.

Membership dates are applied, but the membership history is incomplete: many removed constituents are missing. Within the history that exists, a stock becomes a training row only while it was recorded as an index member; earlier prices are used only to warm up rolling indicators.

For a longer explanation, read [Walk-forward validation for stock signals](/blog/walk-forward-validation/).

## Backtest assumptions

| Assumption | Pivot backtests | AlphaRank portfolio |
| --- | --- | --- |
| Signal timing | Formed from day t's close | Formed from day t's close |
| Entry | Day t+1 **open** | Day t+1 **close** |
| Costs | 10 bps per side (each buy and each sell) | 10 bps per side, also charged when exposure changes; waived when re-entering from all-cash |
| Same-day target and stop | Treated as stop hit first | — |
| Position sizing | Fixed, equal-weighted slots; unused slots held as cash | 12 holdings, normally replacing one per session |

Daily bars can't show the order of intraday moves, so when a bar touches both the target and the stop, the backtest assumes the stop was hit first.

The backtests also contain simplifications that make results look better than real trading would:

- Stops and targets fill exactly at their level, even when the price gaps through it.
- Pivot exits on an opposite signal fill at the same close that generated that signal.
- In AlphaRank, a held name that disappears from the data is given a 0% return.
- Re-entering the AlphaRank portfolio from all-cash isn't charged a cost.

They also leave out market impact, capacity, borrow availability, taxes, and real order execution.

## Options activity method

For each stock, the options job compares today's chain with the previous session's, contract by contract. A contract becomes a candidate only if it passes all of these default gates:

- at least 5,000 contracts traded;
- open interest changed by at least 3,500 contracts;
- open interest changed by more than 30%;
- the change in open interest is worth more than $500,000 in notional value.

Candidates get a 0–100 activity score. A stock needs at least two qualifying contracts to appear. SPY, QQQ, IWM, and DIA use a higher threshold. The score describes how unusual the change is. It is not a probability, and it doesn't reveal whether a trade was bullish, bearish, a hedge, or part of a spread. Gamma exposure figures are estimates built on a simplifying assumption about who holds calls and puts, not observed dealer positions.

## Known limitations

- Daily bars can't show intraday paths or execution prices.
- **Survivorship bias:** companies that were acquired or delisted are largely missing from the price history used for training and backtests, so historical results are likely more favorable than a fully point-in-time universe would show.
- **Delisting losses aren't modeled.** A stock that collapses and is delisted doesn't produce the loss it would in a real portfolio.
- **No dividend or full corporate-action adjustment.** Most symbols use split-only or unadjusted prices without dividends, so returns are price returns, and other corporate actions can distort them.
- **Fill simplifications.** Stops and targets fill at their exact level even through price gaps, and Pivot opposite-signal exits fill at the same close that produced the exit signal. Both make backtests look better than live trading.
- **Event rules developed on the walk-forward history.** Pivot event rules were designed while looking at that history, so their results aren't fully independent out-of-sample evidence.
- Event rules and thresholds can stop working as market structure changes.
- Rankings are relative to the stocks available that day.
- Data from third-party sources can be delayed or wrong.
- Version 0.1.0: interfaces and storage formats may still change.

## Check it yourself

All of this is implemented in open-source repositories under the Apache-2.0 license: [predixlab-collector](https://github.com/predixlab/predixlab-collector), [predixlab-signals](https://github.com/predixlab/predixlab-signals), and [predixlab-options](https://github.com/predixlab/predixlab-options). The signals repository's tests check leakage rules directly: appending future data must not change past features or events, and Pivot backtest entries must occur on the next session, never the signal day. See [Open source](/open-source/) for how to run them.

---

*For information and independent analysis only — not investment advice. Data can be delayed or wrong, models can fail, and past performance doesn't predict future results.*

本页内容仅用于信息和研究参考，不构成投资建议。投资有风险，过往表现不代表未来结果。
