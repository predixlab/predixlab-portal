---
lang: en
title: "Known limitations of PredixLab data, signals and backtests"
shortTitle: "Known limitations"
description: "Known limits of PredixLab's daily data, stock universe, signal rules and backtest fills. Historical results can look better than real trading."
summary: "What the data, signals, and backtests can't tell you, and why historical results can look better than real trading."
h1: "Known limitations"
date: "2026-10-21"
updated: "2026-10-21"
order: "2"
translationKey: limitations
---

# Known limitations

PredixLab's data, signals, and backtests have limits that matter when interpreting results. Read these alongside [how PredixLab works](/docs/how-it-works/).

- Daily bars can't show intraday paths or execution prices.
- **Survivorship bias:** companies that were acquired or delisted are largely missing from the price history used for training and backtests, so historical results are likely more favorable than a fully point-in-time universe would show.
- **Incomplete index membership history.** Membership dates are applied, but many removed constituents are missing from the history, so the universe isn't fully point-in-time.
- **Delisting losses aren't modeled.** A stock that collapses and is delisted doesn't produce the loss it would in a real portfolio.
- **No dividend or full corporate-action adjustment.** Most symbols use split-only or unadjusted prices without dividends, so returns are price returns, and other corporate actions can distort them.
- **Fill and cost simplifications.** Stops and targets fill at their exact level even through price gaps, Pivot opposite-signal exits fill at the same close that produced the exit signal, an AlphaRank holding that disappears from the data gets a 0% return, and re-entering AlphaRank from all-cash isn't charged a cost. Market impact, capacity, borrow availability, and taxes aren't modeled. All of these make backtests look better than live trading.
- **Event rules developed on the walk-forward history.** Pivot event rules were designed while looking at that history, so their results aren't fully independent out-of-sample evidence.
- Event rules and thresholds can stop working as market structure changes.
- Rankings are relative to the stocks available that day.
- Data from third-party sources can be delayed or wrong.
- Version 0.1.0: interfaces and storage formats may still change.
