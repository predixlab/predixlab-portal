---
title: "Look-Ahead Bias in Stock Backtests: 5 Common Leaks"
shortTitle: "Look-ahead bias"
description: "Five ways future data slips into stock backtests: same-bar fills, survivorship, full-sample scaling, overlapping labels and test-set tuning, with fixes."
date: "2026-10-21"
updated: "2026-10-21"
lang: en
category: "Backtesting & validation"
translationKey: look-ahead-bias
h1: "Look-ahead bias in stock backtests: 5 common leaks"
---

# Look-ahead bias in stock backtests: 5 common leaks

A backtest answers one question: "What would have happened if I had followed these rules, using only what I could have known at the time?" Look-ahead bias is any way the second half of that sentence gets broken. It's rarely deliberate. It usually comes from a convenient line of code, a default setting, or a dataset that looks complete but isn't.

The result is the same every time: a strategy that looks better on paper than it could ever be in practice. Here are five of the most common leaks and how to close them.

## What look-ahead bias is

Look-ahead bias happens when a simulated decision uses information that wasn't available when the decision would have been made. That information can be a price, a list of stocks, a statistic, or even the backtest's own result. Small leaks matter, because a strategy's edge is often small too.

## Leak 1: Trading at the bar that created the signal

**What happens:** you calculate a signal from Tuesday's close (say, RSI crosses below 30) and record a buy at Tuesday's close price.

**Why it's a leak:** you only know Tuesday's close after the market has closed, so you can't trade at it. The backtest gets the exact price that triggered the signal, which is often a local extreme.

**Fix:** fill at the next bar. With daily data, that usually means the next day's open (or the next close, if that's your rule). Long-window indicators also need a warm-up period: drop the early rows where the indicator isn't fully defined, instead of treating missing values as signals.

A related problem: daily bars don't show whether the high or the low came first. If a trade hits its target and its stop on the same day, a backtest that assumes the target came first is guessing in its own favor. Assume the stop came first.

## Leak 2: Using today's stock list for the past

**What happens:** you download the current S&P 500 list and backtest a strategy on those stocks over the last ten years.

**Why it's a leak:** today's list is made of companies that did well enough to be in the index now. Companies that were removed, acquired, or went bankrupt are missing. Some stocks in the list weren't even in the index for much of the period. This is **survivorship bias**, and it makes nearly any long-only strategy look better.

**Fix:** use index membership as of each date, keep delisted symbols in your price data, and only count a stock while it was actually a member. Earlier prices can still be used to warm up indicators.

This also affects screeners. A [stock screener](/quantitative-stock-screener/) shows which current stocks meet your criteria today. Running today's filter on today's list can't, on its own, tell you how the same rules would have done historically.

## Leak 3: Scaling with statistics from the whole dataset

**What happens:** you standardize a feature by subtracting its mean and dividing by its standard deviation, computed over the whole dataset. Or you rank a stock's volatility against its full history.

**Why it's a leak:** a value in 2017 is now scaled using data from 2024. If volatility was much higher later, early readings look calmer than they were at the time.

**Fix:** compute statistics on a trailing window only, such as the past 252 trading days, with a minimum number of observations before the value counts. Comparing stocks on the same day (a cross-sectional rank) is also fine, because everything in that comparison existed on that day.

Fundamental data has the same issue. Quarterly figures should be dated by when they were filed and became public, not by the end of the quarter they describe. Companies also restate numbers, so a database's "current" value may not be what investors saw at the time.

## Leak 4: Overlapping labels across train and test

**What happens:** your model predicts the 10-day forward return. You train on data through June 30 and test from July 1.

**Why it's a leak:** the label for June 25 includes returns from early July. The model has partly learned from the test period.

**Fix:** leave a purge gap between training and testing that is at least as long as the label horizon, and add a short embargo after each test window. This is a standard part of [walk-forward validation](/blog/walk-forward-validation/).

## Leak 5: Choosing settings after seeing test results

**What happens:** you try 40 combinations of lookback length, threshold, and holding period, then report the one with the best test result.

**Why it's a leak:** the test set has turned into a training set for your choices. With enough attempts, something will look good by chance.

**Fix:** make decisions on a separate validation period and touch the test period once. Keep a record of how many variants you tried, and judge the winner against that number. Check whether the result holds up across several periods instead of relying on one.

## A quick test you can run on any backtest

Take your data and add some future rows, or change prices after a given date, then rebuild everything. Features, signals, and trades dated **before** that point should not change at all. If they do, information is flowing backward somewhere. It's a simple test, and it catches a surprising number of leaks.

Two more habits help. Report results at more than one cost level, so you can see how sensitive an idea is to trading costs. And compare results period by period, not just as one total.

## How PredixLab handles these

PredixLab's [daily signals](/us-stock-signals/) are built in the open-source [predixlab-signals](https://github.com/predixlab/predixlab-signals) repository. The [How it works](/docs/how-it-works/) doc describes the assumptions:

What it does:

1. Signals use day t's close and are never filled at that close. Pivot backtests enter at the next open, AlphaRank at the next close. When a bar touches both target and stop, the stop is assumed to be hit first.
2. Features are normalized on each stock's trailing 252 trading days.
3. Folds use a purge gap and embargo, and model score thresholds are set on validation data.
4. Costs of 10 basis points are charged on each buy and each sell.

Where it falls short, by the standards in this article:

- **Leak 2 is not solved.** Membership dates are applied, but the membership history is incomplete, and acquired or delisted companies are largely missing from the price history. Historical results are likely more favorable than a point-in-time universe would show, and delisting losses aren't modeled.
- **Leak 5 is partly present.** Pivot's event rules were developed using the walk-forward history, so those results aren't fully independent out-of-sample evidence.
- **Prices aren't fully adjusted.** Most symbols use split-only or unadjusted prices without dividends, so returns are price returns.
- **Some fills are optimistic.** Stops and targets fill at their exact level even when price gaps through, and Pivot opposite-signal exits fill at the same close that produced the exit signal.

The repository's tests include the "append future data" check described above.

The full list is in the [Known limitations](/docs/limitations/) doc. None of these steps makes a strategy profitable. Closing the leaks makes a backtest a fairer test of an idea, which is the most a backtest can do.
