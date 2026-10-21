---
title: "Survivorship Bias in Backtesting: What It Is, How to Check"
shortTitle: "Survivorship bias"
description: "How survivorship bias makes stock backtests look better, why delisted stocks matter, how to check your data, and where PredixLab's backtests fall short."
date: "2026-10-21"
updated: "2026-10-21"
lang: en
category: "Backtesting & validation"
translationKey: survivorship-bias-backtesting
h1: "Survivorship bias in backtesting: what it is and how to check for it"
---

# Survivorship bias in backtesting: what it is and how to check for it

Download a list of S&P 500 stocks, pull ten years of prices, and test a strategy. It's the most natural way to start a backtest, and it builds in one of the most common errors in stock research. The list you downloaded is a list of winners: companies that did well enough to still be in the index today.

This is survivorship bias. This guide explains how it gets into a backtest, why it's harder to remove than it looks, and how to check for it. We're also upfront about the fact that PredixLab's own backtests have it.

## What survivorship bias is

Survivorship bias happens when a dataset only includes things that survived some selection process, and you draw conclusions as if it included everything.

In stock backtests, the selection process is time. Over any long period, some companies are acquired, some go bankrupt, some shrink and get removed from the index, and some are delisted for other reasons. If your data only contains companies that are still around, your backtest never has to hold any of the ones that weren't.

## How it makes results look better

A simple illustration, with made-up numbers:

Imagine an index of 10 stocks in 2015. By 2025, two went bankrupt, one was removed after a long decline, and three new, fast-growing companies were added. If you backtest on the 2025 list, your 2015 portfolio:

- never holds the two stocks that went to zero;
- never holds the one that declined for years before removal;
- does hold three companies that, in 2015, weren't in the index, and that were only added later *because* they had grown.

None of this requires a clever strategy. Even buying everything on the list looks better than it should, because the list itself was chosen with hindsight. That's why survivorship bias is a form of look-ahead bias: the stock universe uses information from the future. We cover other forms in [Look-ahead bias in stock backtests](/blog/look-ahead-bias/).

The effect tends to be strongest for:

- **long-only strategies**, which benefit from never holding the failures;
- **strategies that buy beaten-down stocks**, such as mean reversion or "buy the dip", because the stocks that kept falling and were delisted are exactly the ones missing;
- **small-cap and lower-quality universes**, where failure and delisting are more common;
- **long test periods**, because more companies drop out the further back you go.

## Delisting bias: the missing last move

Even datasets that do include dead companies can miss the final, worst part of their history. When a stock is delisted after bad news, the last price recorded on the exchange may not reflect what holders actually received.

Tyler Shumway documented this in [The Delisting Bias in CRSP Data](https://doi.org/10.1111/j.1540-6261.1997.tb03818.x) (Journal of Finance, 1997). He found that correct delisting returns were missing for most stocks delisted for negative reasons in a widely used research database, and that those omitted returns were large and negative. His recommendation still applies: be explicit about how your backtest handles delisting returns.

If a stock simply disappears from your data and your backtest closes the position at the last price, or at a 0% return, the loss a real investor would have taken never shows up.

## Survivorship bias vs. backfill bias

The two are often confused because both make history look better than it was.

- **Survivorship bias**: entities that failed are **removed** from the data. The losers drop out.
- **Backfill bias**: entities are **added** to a database along with their past history, usually after they've done well. This is common in fund databases, where managers often start reporting only once they have a good track record. The winners are added with their good history.

In stock backtests, the closest equivalent to backfill is using today's index list for the past. Companies added later bring their pre-inclusion history with them, even though they weren't in the index then.

## How to check your own data

You don't need special tools to find out whether a backtest has survivorship bias. Ask these questions about your data:

1. **Where did the stock list come from?** If it's today's index constituents, the bias is almost certainly present.
2. **Are there any dead symbols?** Search your price data for tickers that stopped trading. Over a decade of US large caps there should be many: acquisitions, bankruptcies and index removals. If there are almost none, the data only covers survivors.
3. **Do you have membership dates?** To know which stocks were actually in the index on a given day, you need the date each stock was added and removed, including stocks that have since been delisted.
4. **What happens when a stock disappears?** Look at how your backtest handles a holding whose prices stop. Does it record a loss, close at the last price, or quietly treat it as flat?
5. **Do results change when you restrict the start date?** A strategy that looks much better over twenty years than over the last five can be a sign that survivorship is doing more work further back.

## How to reduce it

- **Use a survivorship-free data source.** Some commercial and academic datasets include delisted stocks and their delisting returns. Check exactly what's included before relying on that label.
- **Build the universe as of each date.** Only allow a stock to be selected while it was actually an index member. Earlier prices can still be used to warm up indicators.
- **Handle delistings explicitly.** Use recorded delisting returns where they exist. Where they don't, test the result with a punitive assumption for performance-related delistings and see how sensitive it is.
- **Be cautious with buy-the-dip results.** These are the strategies most flattered by missing failures.

## If you can't fully fix it

Complete histories of index membership and delisted prices aren't always available, especially in free data. If yours has gaps, the honest move is to say so:

- state that the universe isn't complete for past dates;
- treat historical results as an upper bound rather than an estimate;
- prefer comparisons that are less sensitive to the bias, such as ranking stocks against each other on the same day, over absolute return figures;
- test across sub-periods, and give more weight to recent ones, where fewer companies are missing.

## Where PredixLab stands

PredixLab's own backtests are affected by survivorship bias, and we'd rather you hear it from us:

- **Missing companies.** Acquired and delisted companies are largely missing from the price history used for training and backtests.
- **Incomplete membership history.** Membership dates are applied, but many removed constituents are missing, so the stock universe isn't complete for past dates.
- **Delisting losses aren't modeled.** A stock that collapses and is delisted doesn't produce the loss it would in a real portfolio. An AlphaRank holding that disappears from the data gets a 0% return.

As a result, historical results are likely more favorable than a complete, as-of-date stock universe would show. There are other limitations too: most prices aren't adjusted for dividends, and some fill assumptions are optimistic. They're covered in [Backtest bias: 7 ways a backtest flatters a strategy](/blog/backtest-biases/) and listed in full in [Known limitations](/docs/limitations/). The data sources and backtest rules are described in [How PredixLab works](/docs/how-it-works/), and the code is open source in [predixlab-signals](https://github.com/predixlab/predixlab-signals).

None of this means a backtest is useless. A backtest with known, stated gaps is still a useful way to test an idea, as long as you read the results with those gaps in mind. For the validation side, see [Walk-forward validation for stock signals](/blog/walk-forward-validation/).

## Further reading

- Shumway, [The Delisting Bias in CRSP Data](https://doi.org/10.1111/j.1540-6261.1997.tb03818.x), Journal of Finance, 1997.
- CFA Institute, [Backtesting and Simulation](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/backtesting-and-simulation): refresher reading covering survivorship and look-ahead bias.
- [Survivorship bias](https://en.wikipedia.org/wiki/Survivorship_bias) on Wikipedia: background and examples outside finance.
