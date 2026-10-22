---
title: "What Is Unusual Options Activity? Evidence & Limits"
shortTitle: "Unusual options activity"
description: "Unusual options activity is a spike in volume or open interest vs a recent baseline. Research finds predictive power—with limits. See how to read it, free."
date: "2026-10-22"
updated: "2026-10-22"
lang: en
category: "Options basics"
translationKey: what-is-unusual-options-activity
h1: "What is unusual options activity, and does it predict stock moves?"
breadcrumbTitle: "What is unusual options activity"
schemaType: Article
about: "Unusual options activity | Options trading"
---

# What is unusual options activity, and does it predict stock moves?

Unusual options activity is a spike in volume or open interest on a contract relative to its recent baseline — a statistical flag, not proof of bullish or bearish intent. Research finds that some options-flow measures can predict short-horizon stock returns, especially around information events, but results vary by filter, fade after costs and crowding, and a call or put alone does not reveal purpose. PredixLab lists daily activity for S&P 500 and Nasdaq-100 names; Free data has a 10-day delay.

[Browse unusual options activity](https://predixlab.com/unusual-options-activity/) · [How PredixLab scores activity](https://predixlab.com/docs/how-it-works/#options-activity-method)

Activity scores describe how unusual a change is — not a trade recommendation.

## What "unusual options activity" means

Unusual options activity means a relative spike: today's volume or open interest on a given contract looks large compared with that contract's (or that symbol's) recent baseline. Most screens also require a minimum absolute size so that tiny, illiquid contracts don't dominate the list. The label is a statistical flag. It is not, by itself, a buy or sell signal, and it is not proof that "informed money is long" or short.

Vendors define the screen differently. Common industry ingredients include volume versus average daily volume, volume versus open interest, large block size, and sometimes sweep or aggression filters. Those rules are product-specific. PredixLab's published gates are listed below; other scanners use other thresholds.

PredixLab is daily session data compared end of day, not a live options-flow terminal. Always check the data date on the page before reading any flag.

### Volume vs open interest

**Volume** is how many contracts traded during the session. **Open interest** is how many contracts remain open after the prior settlement. A jump in open interest alongside volume is more consistent with new positions opening. Volume with flat or falling open interest can mean positions closed or risk transferred. Neither number, alone, tells you whether the trade was a hedge, a directional bet, a roll, or one leg of a spread. For a fuller walk-through, see what a change in open interest means.

## Does unusual options activity actually predict stock moves?

Sometimes, for some definitions of "unusual," over short horizons — and not reliably as a retail trading system.

Peer-reviewed work has long examined whether options markets carry information about future stock prices. Pan and Poteshman ([NBER Working Paper 10925](https://www.nber.org/papers/w10925); *Review of Financial Studies*, 2006) find that option volume and buyer-initiated put-call ratios historically contained information about near-term stock moves. Cremers, Fodor, Muravyev and Weinbaum (*Management Science*, 2023; [doi:10.1287/mnsc.2022.4543](https://doi.org/10.1287/mnsc.2022.4543)) show that which option-volume categories inform prices depends on trade type and on whether news is scheduled or unscheduled. Predictability is stronger around information events in some settings, and weaker in others.

Those findings do not translate into a ready-made personal edge:

- Public prints mix opening trades, closing trades, hedges, rolls and multi-leg strategies. A large call print can be bullish, a hedge against a short, or the long leg of a spread.
- Same-day reaction and crowding can shrink any post-event drift once a pattern is widely watched.
- Transaction costs, timing (you often see the print after the underlying has already moved), and delayed free data all eat into whatever edge a paper study reported.

Past academic predictability is not a personal trading system. PredixLab does not claim that its activity score predicts the direction of the stock. The score describes how unusual a change in activity is. Anomaly scores describe changes in activity, not a guaranteed direction for the stock price. Past research results don't predict future results.

## How to identify unusual options activity (a practical checklist)

You can follow this checklist on any decent options chain view, and on PredixLab's [unusual options activity](https://predixlab.com/unusual-options-activity/) tool:

1. **Note the data date.** Free access is delayed 10 calendar days; Premium shows the latest published daily data. Same detection rules either way.
2. **Look at the contract.** Expiration, strike, and call versus put. Labels without these details are hard to interpret.
3. **Compare volume and the change in open interest (Δ OI).** Don't stop at the activity label. Rising open interest with volume is more consistent with new positions; volume with flat or falling open interest can be closing or transferring risk.
4. **Ask whether the print could be a hedge, roll, close, or spread.** Unusual activity doesn't tell you the direction. A call isn't necessarily bullish, and a put isn't necessarily bearish.
5. **Check the underlying chart and market context** before drawing a conclusion from one activity record.

PredixLab classifies flagged activity as **new contracts**, **new positions**, **closing positions**, or **high activity**. Those labels describe the type of activity the scanner inferred — not direction, and not the trader's purpose.

## How PredixLab detects and scores activity

PredixLab's options job uses Cboe chain snapshots and compares today's chain with the previous session's, contract by contract. Full method notes live in [how PredixLab detects and scores options activity](https://predixlab.com/docs/how-it-works/#options-activity-method).

A contract becomes a candidate only if it passes **all** of these default gates:

| Gate | Default threshold |
|---|---|
| Contracts traded | at least 5,000 |
| Change in open interest | at least 3,500 contracts |
| Relative change in open interest | more than 30% |
| Δ OI notional | worth more than $500,000 |

Candidates receive a **0–100 activity score**. A stock needs at least two qualifying contracts to appear. SPY, QQQ, IWM and DIA use a higher threshold.

The score measures how unusual the change is. It is **not** a probability of profit, and it is **not** bullish or bearish proof. Estimated gamma exposure on the tool is a model estimate built from public open interest and simplifying assumptions about who holds calls and puts — not observed dealer holdings.

One honesty note on open source: the signal, backtest, API and dashboard code is open source (Apache-2.0). Options analysis runs in the hosted service and is **not** in the public repositories, so the UOA scorer itself is not something you can inspect under Apache-2.0.

## Free unusual options activity on PredixLab

Coverage focuses on S&P 500 and Nasdaq-100 names. Confirm available symbols and dates in the tool.

| Plan | What you see | Price |
|---|---|---|
| Free | Unusual options activity with a 10-calendar-day delay | $0 |
| Premium | Latest published daily data | $20/month or $192/year |

Detection rules are the same on both plans. Premium is more timely, not more accurate. This is daily data from an end-of-day chain comparison, not a live trade feed. The options job runs on a fixed schedule after the session (11:30 UTC / 19:30 Beijing time; about 7:30 am ET, or 6:30 am in winter, the morning after the session). A run can take up to 60 minutes. Always check the data date shown on the page.

[Open the unusual options activity tool](https://predixlab.com/unusual-options-activity/) · [Free vs Premium](https://predixlab.com/pricing/)

## FAQ

**What is unusual options activity?**
A spike in volume or open interest on a specific options contract relative to that contract's recent baseline, often with a minimum size filter so tiny contracts don't dominate. It flags statistical unusualness. It does not by itself prove that traders are bullish or bearish.

**Does unusual option activity work / predict stock moves?**
Sometimes, for some definitions, over short horizons — and not reliably as a retail system. Peer-reviewed work finds information in certain options-flow measures, but results depend on filters, fade with costs and crowding, and public prints mix hedges and multi-leg trades. Treat flags as a reason to look closer, not a trade.

**How do I find unusual options activity?**
Use a scanner or chain view that compares today's volume and open-interest changes to a recent baseline, then open the contract details (expiration, strike, Δ OI). PredixLab lists flagged S&P 500 and Nasdaq-100 names by data date; Free access is delayed 10 days.

**How do I identify whether activity is opening or closing?**
Rising open interest alongside volume is more consistent with new positions; volume with flat or falling open interest can be closing or transferring risk. PredixLab's classifications (new positions, closing positions, and related labels) describe activity type, not purpose. Intent is usually not visible from public data alone.

**Is unusual options activity free on PredixLab?**
Yes. The Free plan includes unusual options activity with a 10-calendar-day delay. Premium costs $20/month or $192/year and shows the latest published daily data. Detection rules are the same on both plans, so Premium is more timely, not more accurate.

**Can unusual activity tell me if traders are bullish or bearish?**
Not by itself. A call can be a hedge, a roll, a close, or one leg of a spread; the same is true for puts. Public end-of-day data rarely reveals intent. Unusual activity doesn't tell you the direction — treat it as a reason to inspect the contract, not a trade.

**Is this live options flow?**
No. PredixLab shows daily contract activity and open-interest changes from end-of-day chain comparisons, not a live trade feed. The options job runs on a fixed schedule after the session and can take up to an hour. Always check the data date shown on the page.

**Which stocks are covered?**
PredixLab's options activity view focuses on S&P 500 and Nasdaq-100 constituents tracked by the platform. Confirm symbols and dates in the tool, because coverage can differ across features, and some dates simply have no contracts that pass the published gates.

## Related reading and tools

- **[Unusual options activity tool](https://predixlab.com/unusual-options-activity/)** — Browse flagged stocks, then open the contracts to compare expirations, strikes and changes in open interest.
- **What a change in open interest means** — Volume vs open interest, and why daily OI changes are ambiguous.
- **[How PredixLab detects and scores options activity](https://predixlab.com/docs/how-it-works/#options-activity-method)** — Default gates, scoring and update schedule.
- **[Daily US stock signals](https://predixlab.com/us-stock-signals/)** — A separate end-of-day product (AlphaRank and Pivot). Don't conflate activity flags with those signals.
- **[Free vs Premium](https://predixlab.com/pricing/)** — Same models; Free is delayed 10 days, Premium shows the latest published daily data.

[Browse unusual options activity](https://predixlab.com/unusual-options-activity/)
