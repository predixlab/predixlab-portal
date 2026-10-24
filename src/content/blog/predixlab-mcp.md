---
title: "New: Connect Your AI Agent to PredixLab's Daily Stock Data"
shortTitle: "PredixLab MCP"
description: "PredixLab now works with Grok Bot and other MCP-capable agents: ask about stocks and get answers from our daily signals and screener, with a data date."
date: "2026-10-24"
updated: "2026-10-24"
lang: en
category: "Product updates"
translationKey: predixlab-mcp
h1: "New: connect your AI agent to PredixLab’s daily stock data"
breadcrumbTitle: "PredixLab MCP"
schemaType: BlogPosting
about: "AI agents | Stock screener"
image: "/social/predixlab-mcp.png"
imageAlt: "Illustrative example, not real data: a person asks their AI agent how the market did after the close, and the agent answers with counts of stocks that rose and fell, the share above their 200-day average and the number of new PredixLab signals, marked with a data date"
---

# New: connect your AI agent to PredixLab’s daily stock data

Starting today, PredixLab works with your AI agent. Connect Grok Bot, or another agent that lets you add a custom MCP server, and it can use PredixLab's daily US stock signals, screener and market data for S&P 500 and Nasdaq-100 stocks.

[Create an agent key](https://dashboard.predixlab.com/profile) · [How PredixLab signals work](https://predixlab.com/docs/how-it-works/)

![Illustrative example, not real data: a person asks their AI agent how the market did after the close, and the agent answers with counts of stocks that rose and fell, the share above their 200-day average and the number of new PredixLab signals, marked with a data date](/images/blog/predixlab-mcp/architecture.png)

## Why we think you'll like it

If you've asked a general AI assistant about the market, you know how it tends to go. You get a recap of headlines, a few familiar names, and no real way to tell where any of it came from. Ask which stocks fit your own rules, and it has to guess.

With PredixLab connected, your agent can work from our daily data. It answers from that data instead of guessing, and each result carries a data date, so you can check what it used.

## A few things to try

**A quick look back after the close.** Ask something like "How did the market do in the latest session, and what's new in PredixLab's signals?" Your agent can tell you how many stocks rose and fell, how many are above their longer-term averages, and which new signals came out, all tied to one dated session.

**Screening in your own words.** Instead of clicking through filters, just say what you're looking for. For example, ask for the top-ranked stocks that are also above their 200-day average with decent volume. You get a short list, plus which rule each of the others missed. If you want to tighten a rule or drop one, say so and run it again.

![Illustrative example, not real data: a person asks their agent for top-ranked stocks above their 200-day average with decent volume, and the agent lists two anonymised stocks that meet all three rules and three that each missed at least one rule, with the rule each one missed](/images/blog/predixlab-mcp/screening-illustration.png)

The example above is an illustration, not real data. Results come from the rules you choose on one day's data, not recommendations. Different rules, or a different day, give a different result.

**Both sides of a stock you follow.** Ask about a stock on your watchlist and ask for what doesn't fit, too. Your agent can share the trend, where the price sits against its moving averages, and nearby support and resistance. It can also flag warning signs, such as momentum turning down or a weak trend. You can look at its PredixLab signal history as well, losses included.

**A vague question, made concrete.** "What's worth a closer look?" is hard to answer well. Your agent can help you turn it into something specific: a starting list, a few rules, and a clear reason why each stock is in or out.

## Getting started

Sign in to your [PredixLab dashboard](https://dashboard.predixlab.com/profile), open **Agent connections** on your Profile page and create a key. Then add PredixLab to your agent with that key and start a new conversation. If you'd like step-by-step setup details, they're in the [README](https://github.com/predixlab/predixlab-api#mcp-agent-access).

## Good to know

- **Your plan applies.** On the Free plan, signals and options activity have a 10-day delay. Premium shows the latest published data.
- **Daily data.** PredixLab publishes end-of-day data once per trading day, after the US close. These aren't live prices.
- **Read-only.** Your agent can look up data. It can't place trades or change your account.
- **Keep your key private.** Treat it like a password. Don't paste it into shared documents or public chats. If it leaks, revoke it in Agent connections.
- **Agents make mistakes.** An agent can misread a number or sound more certain than the data allows. Check the data date and the figures it shows before you rely on an answer.

## FAQ

**What is MCP?**
A standard way for AI agents to use outside tools. PredixLab's MCP server lets your agent look up PredixLab data.

**Which agents can connect?**
Grok Bot, and other agents that let you add a custom MCP server with an API key. PredixLab MCP uses an API key and doesn't offer OAuth yet; some clients, including ChatGPT custom connectors at the time of writing, may not support that.

**Is it free?**
Yes, you can create a key on the Free plan. Signals and options activity have a 10-day delay on Free. Premium shows the latest published data.

**Is this live market data?**
No. It's daily end-of-day data. Always check the data date in the agent's answer.

**Does PredixLab tell me what to buy?**
No. PredixLab provides data and signals for research. Whatever you decide is your own decision.

**Is it open source?**
The signal, backtest, API and dashboard code is open source. Market data is not included.

## Important information

For informational and research purposes only. Not investment advice. Past signal outcomes don't predict future results.
