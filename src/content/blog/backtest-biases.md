---
title: "Backtest Bias: 7 Ways a Backtest Flatters a Strategy"
shortTitle: "Backtest biases"
description: "Seven backtest biases that make stock strategies look better than they are, how to spot each one, and which ones still affect PredixLab's own backtests."
date: "2026-10-21"
updated: "2026-10-21"
lang: en
category: "Backtesting & validation"
translationKey: backtest-biases
h1: "Backtest bias: 7 ways a backtest flatters a strategy"
---

# Backtest bias: 7 ways a backtest flatters a strategy

A backtest is a simulation, and simulations are easy to get subtly wrong. The mistakes rarely make a strategy look worse. They almost always make it look better, because every shortcut quietly removes some friction that real trading would have added.

This guide lists the seven biases we see most often in stock backtests. For each one: what it is, how it shows up, and a quick way to check for it. At the end of each section we say plainly whether PredixLab's own backtests are affected. Several of them are.

## Why biases nearly always point the same way

A backtest result is the output of three things: the data, the rules, and the way trades are simulated. Each of these can include information or conveniences that a real investor wouldn't have had: a cleaner stock list, a better price, a rule chosen after seeing the answer. Remove any of them and the result usually gets worse, rarely better.

So the useful question isn't "Is this backtest biased?" Almost every backtest is, a little. The useful question is "Which biases are present, which way do they push, and roughly how much?"

## 1. Look-ahead bias

**What it is:** the simulation uses information that wasn't available when the decision would have been made, such as trading at the closing price that produced the signal, or scaling a feature with statistics from the whole dataset.

**How to check:** append fake future data or change prices after some date, then rerun everything. Nothing dated before that point should change.

We cover five common leaks in detail in [Look-ahead bias in stock backtests](/blog/look-ahead-bias/).

**PredixLab:** signals use day t's close and are never filled at that close. Pivot backtests enter at the next open and AlphaRank at the next close. Some forms of look-ahead are still present through the stock universe and the way event rules were developed (see sections 2 and 3).

## 2. Survivorship bias

**What it is:** the backtest only includes companies that still exist, or that are in an index today. Stocks that were acquired, went bankrupt, or were removed from the index are missing, along with the losses that often came before.

**How it shows up:** a long-only strategy tested on today's S&P 500 list over the past ten years is, by construction, choosing from companies that did well enough to be in the index now.

**How to check:** count how many delisted or removed symbols are in your price data. If the answer is close to zero, the backtest has survivorship bias.

Read the full guide: [Survivorship bias in backtesting](/blog/survivorship-bias-backtesting/).

**PredixLab: affected.** Acquired and delisted companies are largely missing from the price history, the index membership history is incomplete, and delisting losses aren't modeled. Historical results are likely more favorable than a complete, as-of-date stock universe would show.

## 3. Overfitting and data snooping

**What it is:** trying many variations of a strategy, such as different lookbacks, thresholds or holding periods, and keeping the one that tested best. With enough attempts, something will look good by chance.

**How it shows up:** a result that depends on one exact parameter value, or that only works over the period used to design it.

**How to check:** keep a count of how many variants you tried. Judge the winner on data that played no part in choosing it, and check whether neighboring parameter values give similar results. [Walk-forward validation](/blog/walk-forward-validation/) helps by forcing every decision to be made on past data only. Bailey, Borwein, López de Prado and Zhu describe a formal way to estimate how likely a selected backtest is to be overfit in [The Probability of Backtest Overfitting](https://doi.org/10.21314/jcf.2016.322).

**PredixLab: partly affected.** Model score thresholds are calibrated on validation data. But Pivot's event rules were developed while looking at the walk-forward history, so those results aren't fully independent out-of-sample evidence.

## 4. Price data that doesn't match what investors earned

**What it is:** using prices that aren't adjusted for splits, dividends, or other corporate actions.

**How it shows up:**

- An unadjusted 2-for-1 split looks like a 50% overnight drop. That can trigger signals and stops that never happened in reality.
- Prices without dividends measure price return, not total return. Comparing a price-return backtest with a total-return benchmark isn't a like-for-like comparison.
- Spin-offs and special dividends can create jumps that look like real moves.

**How to check:** look for single-day moves of roughly −50%, −67% or −75% around known split dates. Check whether your benchmark includes dividends and whether your strategy does.

**PredixLab: affected.** Most symbols use split-only or unadjusted prices without dividends. Returns are price returns, and other corporate actions can distort them.

## 5. Fill and execution assumptions

**What it is:** assuming trades happen at prices you couldn't reliably get.

**How it shows up:**

- **Gaps.** A stop at $95 is assumed to fill at $95, even when the stock opens at $88.
- **Same-bar ordering.** Daily bars don't show whether the high or the low came first. Assuming the target was hit before the stop is a guess in your own favor.
- **Exits at the signal bar.** An exit decided from today's close is filled at today's close.
- **Size.** Market impact, capacity and borrow availability are ignored.

**How to check:** rerun with stops and targets filled at the worse of the level and the next open. Move every fill to the next bar and see how much the result changes.

**PredixLab: partly affected.** When a bar touches both target and stop, the stop is assumed to be hit first. But stops and targets fill at their exact level even through price gaps, and Pivot's opposite-signal exits fill at the same close that produced the exit signal. An AlphaRank holding that disappears from the data gets a 0% return. Market impact, capacity, borrow and taxes aren't modeled. All of these make the backtests look better than live trading would.

## 6. Missing or understated costs

**What it is:** ignoring commissions, spreads and slippage, or charging them only once per round trip.

**How it shows up:** high-turnover strategies are the most sensitive. A small edge per trade can disappear once realistic costs are applied to every buy and every sell.

**How to check:** report results at two or three cost levels. If the conclusion flips between them, the strategy depends on cheap execution.

**PredixLab:** 10 basis points are charged per side, on each buy and each sell. Re-entering AlphaRank from all-cash isn't charged a cost, and spreads on less liquid names can be wider than 10 basis points.

## 7. Period selection

**What it is:** choosing a start date, end date or market regime that happens to suit the strategy.

**How it shows up:** a strategy tested only during a long bull market, or one whose results change sharply when the start date moves by a year.

**How to check:** split the history into sub-periods and look at each one. Include at least one stressed period if the data allows it. Results that only hold in one window aren't telling you much.

**PredixLab:** the history is limited to the data the pipeline collects, and event rules and thresholds can stop working as market structure changes. Results from one period shouldn't be read as a forecast for the next.

## A checklist before you trust any backtest

- [ ] Signals are filled on the bar after the one that produced them.
- [ ] The stock universe includes companies that were later removed or delisted, as of each date.
- [ ] Delisting returns are handled explicitly, not dropped.
- [ ] Prices are adjusted for splits, and you know whether dividends are included.
- [ ] Stops and targets account for gaps, and same-bar ambiguity assumes the worse outcome.
- [ ] Costs are charged on both sides, and results are shown at more than one cost level.
- [ ] Rules and parameters were chosen without looking at the test period, and you know how many variants were tried.
- [ ] Results are shown per period, not only as one total.

PredixLab's own backtests don't pass every item on this list. Each gap is listed in [Known limitations](/docs/limitations/), and the full method is in [How PredixLab works](/docs/how-it-works/). The code is open source in [predixlab-signals](https://github.com/predixlab/predixlab-signals), so you can check how each rule is implemented.

## Further reading

- CFA Institute, [Backtesting and Simulation](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/backtesting-and-simulation): a refresher reading that covers common backtesting problems, including survivorship and look-ahead bias.
- Bailey, Borwein, López de Prado and Zhu, [The Probability of Backtest Overfitting](https://doi.org/10.21314/jcf.2016.322), Journal of Computational Finance.
- Shumway, [The Delisting Bias in CRSP Data](https://doi.org/10.1111/j.1540-6261.1997.tb03818.x), Journal of Finance, 1997.
