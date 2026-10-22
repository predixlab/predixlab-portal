export const stockSignalsUpdated = "2026-10-22";

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: { title: string; text: string }[] }
  | { kind: "table"; head: string[]; rows: string[][] };

interface Section {
  id: string;
  h2?: string;
  h3?: string;
  blocks: Block[];
}

export const stockSignalsPageEn: Section[] = [
  { id: "what-you-get", h2: "What you get with PredixLab's US stock signals", blocks: [
    { kind: "ul", items: [
      "**Coverage:** S&P 500 and Nasdaq-100 constituents.",
      "**Daily, end-of-day data.** The signal job starts after the US close, at about 10:30 pm ET (9:30 pm in winter), and takes up to 30 minutes. There are no intraday signals and no live quotes.",
      "**Two models.** AlphaRank and Pivot, with each signal shown on its price chart.",
      "**Signal history.** Past signals and what followed them, including the periods when they didn't work out.",
      "**Free or Premium.** Free shows signals with a 10-day delay. Premium ($20/month or $192/year) shows the latest published data. Both plans use the same models, so Premium doesn't make the signals more accurate.",
      "**Email, not a chat group.** Premium includes an opt-in daily signals email digest. PredixLab is a dashboard plus that email, not a Telegram or Discord group.",
      "**Open code.** The signal, backtest, API and dashboard code is open source (Apache-2.0).",
    ] },
  ] },
  { id: "signal-types", h2: "The two signal types", blocks: [
    { kind: "p", text: "AlphaRank and Pivot answer different questions, so they shouldn't be read the same way." },
  ] },
  { id: "alpharank", h3: "AlphaRank: which stocks score highest today", blocks: [
    { kind: "p", text: "AlphaRank ranks stocks against each other on the same day. It combines three submodels trained on the most recent 36, 60 and 96 months of data, and the dashboard shows the day's top-ranked names. A rank is relative: it means a stock scored higher than the others that day, not that it will rise." },
  ] },
  { id: "pivot", h3: "Pivot: possible turning points", blocks: [
    { kind: "p", text: "Pivot uses one shared set of LightGBM models trained across all eligible stocks, not one model per stock. Each day's score becomes a state, from Strong Buy to Strong Sell. These are model states, not personalized recommendations. Stricter rules on price location, confirmation and duplicates turn some states into sparse events:" },
    { kind: "table", head: ["Event", "What it marks"], rows: [
      ["BUY_TURN", "A confirmed reversal after a low setup"],
      ["SELL_TURN", "A confirmed reversal after a high setup"],
      ["TREND_BUY", "A breakout while the model state stays bullish; not a bottom reversal"],
      ["BASE_BREAKOUT", "A volume-backed breakout from a period of compressed volatility"],
    ] },
    { kind: "p", text: "Many days have no events at all, and that's expected." },
  ] },
  { id: "read-together", h3: "How to read them together", blocks: [
    { kind: "p", text: "AlphaRank compares stocks with each other on one day; Pivot looks at one stock's own price path. A high rank without a Pivot event, or an event on a stock outside the top ranks, isn't a contradiction. Treat each as one input, then check the chart." },
  ] },
  { id: "how-generated", h2: "How the signals are generated", blocks: [
    { kind: "p", text: "Here is what sits behind each signal. The full write-up is in [how the signals are built and tested](/docs/how-it-works/)." },
    { kind: "p", text: "**Data.** Daily US stock prices (open, high, low, close and volume) with history from January 1, 2015, plus dated S&P 500 and Nasdaq-100 membership. Prices update once per trading day." },
    { kind: "p", text: "**Inputs.** The models see only information available on or before each date:" },
    { kind: "ul", items: [
      "returns over several periods, momentum and moving-average trend;",
      "position in the recent range, breakouts and drawdowns;",
      "RSI and mean reversion;",
      "volatility and moves scaled by ATR (average true range);",
      "volume and money flow;",
      "return relative to the S&P 500, and beta.",
    ] },
    { kind: "p", text: "Features that need normalizing are scaled against each stock's own trailing 252 trading days, using at least 120 observations, and clipped to limit outliers. Statistics from the full sample are never used, because that would leak later information into earlier rows." },
    { kind: "p", text: "**What the models learn.** Training labels look forward from the next trading day over a fixed horizon, 10 trading days by default. The signal day itself is never part of the label." },
    { kind: "p", text: "**How they're tested.** PredixLab uses [walk-forward validation](/blog/walk-forward-validation/): training history, then a purge gap, a validation period, an embargo, and finally the test period. Each test period is predicted by a model that never saw it, and reports read those saved out-of-sample predictions. One partial exception: Pivot's event rules were designed while looking at the walk-forward history, so event results aren't fully independent out-of-sample evidence. The [look-ahead bias](/blog/look-ahead-bias/) guide covers why these steps matter." },
  ] },
  { id: "track-record", h2: "Signal history and track record: how to read past performance", blocks: [
    { kind: "p", text: "For any stock, the dashboard shows past signals on the chart and what happened next: gains, losses and drawdowns, including the periods when the signals didn't work out. Historical signal performance is not a portfolio return, and past performance doesn't predict future results." },
    { kind: "p", text: "The backtests behind the performance views follow these rules:" },
    { kind: "table", head: ["", "Pivot", "AlphaRank"], rows: [
      ["Signal timing", "Formed from day t's close", "Formed from day t's close"],
      ["Entry", "Day t+1 open", "Day t+1 close"],
      ["Costs", "10 bps per side", "10 bps per side, also when exposure changes; not charged when re-entering from all-cash"],
      ["Same-day target and stop", "Stop assumed hit first", "—"],
      ["Sizing", "Fixed equal-weight slots", "12 holdings, normally one replaced per session"],
    ] },
    { kind: "p", text: "Entries are never filled at the close that produced the signal." },
  ] },
  { id: "why-optimistic", h3: "Why these results probably look better than real trading", blocks: [
    { kind: "p", text: "Backtests flatter strategies, and ours are no exception. The documented [known limitations](/docs/limitations/) include:" },
    { kind: "ul", items: [
      "**Survivorship bias.** Delisted and acquired companies are largely missing, and delisting losses aren't modeled. See [survivorship bias](/blog/survivorship-bias-backtesting/).",
      "**Incomplete index membership history.** Many removed constituents are missing.",
      "**No dividends.** Most prices are price-only.",
      "**Optimistic fills.** Stops and targets fill exactly at their level, even through price gaps, and Pivot exits on an opposite signal fill at the close that produced that signal.",
      "**What's left out.** Market impact, capacity, borrow availability and taxes.",
    ] },
    { kind: "p", text: "For the general problem, read [why backtests flatter strategies](/blog/backtest-biases/). This page doesn't publish win rates, returns or hit rates." },
  ] },
  { id: "free-vs-premium", h2: "Free vs Premium: what the 10-day delay means", blocks: [
    { kind: "ul", items: [
      "**Free:** signals, signal performance and options activity appear with a 10-day delay. The delay counts calendar days, so a signal dated October 1 appears on the Free plan on October 11.",
      "**Premium:** the latest published data, for $20/month or $192/year. Same models, so no greater accuracy and no lower market risk.",
    ] },
    { kind: "p", text: "On either plan, check the data date shown in the dashboard. See [Free vs Premium](/pricing/) for the full comparison." },
  ] },
  { id: "open-source", h2: "Open source: check the method yourself", blocks: [
    { kind: "p", text: "The signal, backtest, API and dashboard code is open source (Apache-2.0). The signal features, training and backtests live in [predixlab-signals](https://github.com/predixlab/predixlab-signals), and its tests check the leakage rules directly:" },
    { kind: "ul", items: [
      "adding future data must not change past features or events;",
      "forward labels exclude the signal day;",
      "backtest entries happen on the next session, never the signal day.",
    ] },
    { kind: "p", text: "Data collection and options analysis run in the hosted service and aren't in the public repositories. The license covers source code only. It does not grant rights to any third-party market data or to trained models, and data providers keep their own terms. To read the code and [run the signal code yourself](/docs/self-hosting/) with your own data, start with the signal tests." },
  ] },
  { id: "routine", h2: "A simple routine for reviewing a signal", blocks: [
    { kind: "ol", items: [
      { title: "Check the data date", text: "See when the data was last updated and which dates your plan can access." },
      { title: "Open the chart and the market overview", text: "Look at recent price action, then at the broader market." },
      { title: "Review past outcomes", text: "Weigh earlier gains, losses and drawdowns against your own time horizon and risk tolerance." },
    ] },
  ] },
];

export const stockSignalsRelatedEn = [
  {
    product: "screener",
    description: "Filter S&P 500 and Nasdaq-100 stocks by volume, trend, momentum and risk, and save your criteria to use again.",
  },
  {
    product: "options",
    description: "Open the flagged contracts to compare expirations, strikes and changes in open interest, not just an activity label.",
  },
] as const;

export const stockSignalsClosingEn = {
  title: "Start with the free plan",
  primary: "Get started free",
  secondary: { label: "Compare plans", path: "/pricing/" },
  note: "Free signal data has a 10-day delay. For informational purposes only. Not investment advice.",
};
