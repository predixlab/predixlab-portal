---
lang: en
title: "Known Limitations of PredixLab Data, Signals and Backtests"
shortTitle: "Known limitations"
description: "Known limits of PredixLab's daily data, stock universe, signal rules and backtest fills. Historical results can look better than real trading."
h1: "Known limitations"
updated: "2026-10-21"
order: "2"
translationKey: limitations
---

# Known limitations

PredixLab's data, signals, and backtests have limits that matter when interpreting results. Read these alongside [how PredixLab works](/docs/how-it-works/).

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

---

*For information and independent analysis only — not investment advice. Data can be delayed or wrong, models can fail, and past performance doesn't predict future results.*

本页内容仅用于信息和研究参考，不构成投资建议。投资有风险，过往表现不代表未来结果。
