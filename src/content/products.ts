import type { SiteLanguage } from "@/routing";
import type { Question } from "./site";

export type ProductId = "signals" | "screener" | "options";

interface ProductContent {
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  shortDescription: string;
  linkLabel: string;
  action: string;
  secondaryAction?: { label: string; path: string };
  access: string;
  tags: string[];
  imageAlt?: string;
  detailTitle: string;
  details: { title: string; description: string }[];
  workflowTitle: string;
  workflow: { title: string; description: string }[];
  boundaryTitle: string;
  boundaries: string[];
  questions: Question[];
}

export const productPaths: Record<ProductId, string> = {
  signals: "/us-stock-signals/",
  screener: "/quantitative-stock-screener/",
  options: "/unusual-options-activity/",
};

export const productDashboardPaths: Record<ProductId, string> = {
  signals: "/",
  screener: "/screener",
  options: "/options/activity",
};

export const productContent: Record<SiteLanguage, Record<ProductId, ProductContent>> = {
  zh: {
    signals: {
      name: "每日美股信号",
      eyebrow: "每日美股信号",
      title: "看每日信号，也看历史表现。",
      description:
        "查看 AlphaRank 的股票排序和 Pivot 的转折信号，再结合股价图表、大盘表现和历史记录，判断哪些股票值得继续关注。",
      shortDescription: "先看哪些股票出现了信号，再结合走势和历史表现判断。",
      linkLabel: "了解每日信号",
      action: "查看每日信号",
      access: "免费版可查看延迟 10 天的信号与信号表现。",
      tags: ["AlphaRank / Pivot", "历史信号", "股价图表"],
      detailTitle: "排名、走势、历史表现，一起看。",
      details: [
        {
          title: "分清两种模型的用途",
          description: "AlphaRank 用于比较股票的相对排名，Pivot 用于提示可能的转折，两者不能用同一种方式解读。",
        },
        {
          title: "在图表上查看信号",
          description: "对照信号出现的位置、近期走势和历史记录，更直观地了解当时的情况。",
        },
        {
          title: "回看信号之后的走势",
          description: "了解历史信号之后股价的涨跌和回撤，既看表现好的时候，也看失效的时候。",
        },
      ],
      workflowTitle: "每天看信号，可以按这个顺序。",
      workflow: [
        { title: "确认数据日期", description: "先看数据更新到哪一天，以及当前账户能查看哪些日期。" },
        { title: "打开股票图表", description: "查看近期走势，再结合市场概览了解大盘情况。" },
        { title: "回看历史表现", description: "了解过去信号后的涨跌和回撤，再结合自己的持有周期和风险承受能力判断。" },
      ],
      boundaryTitle: "信号供你参考，买卖由你决定。",
      boundaries: [
        "模型评分不等于盈利概率，也不是针对个人的买卖建议。",
        "历史信号表现不等于实际投资组合收益，请留意各项统计的计算方法。",
        "Premium 可查看更新的数据，但不会改变模型准确率或降低市场风险。",
      ],
      questions: [
        { question: "这些信号是实时的吗？", answer: "不是。PredixLab 以日线行情和每日信号为主，适合日常看盘和复盘，不提供实时行情，也不代替用户执行交易。" },
        { question: "能查看以前的信号吗？", answer: "可以。你可以在平台已有的数据范围内查看历史信号、图表标记和后续表现。免费版的信号与信号表现延迟 10 天，具体以工作台显示的日期为准。" },
      ],
    },
    screener: {
      name: "量化选股器",
      eyebrow: "量化选股器",
      title: "按你的标准，筛选美股。",
      description:
        "不用写代码，就能按成交量、趋势、动量和风险指标筛选股票。可以直接使用预设条件，也可以搭配自己的筛选规则。",
      shortDescription: "按成交量、趋势、动量和风险指标筛选股票，保存常用条件，下次直接使用。",
      linkLabel: "了解选股器",
      action: "打开量化选股器",
      access: "免费版可用。主要覆盖平台已收录的标普 500 和纳斯达克 100 股票。",
      tags: ["无需编程", "自定义条件", "保存筛选"],
      detailTitle: "选好条件，再比较符合要求的股票。",
      details: [
        { title: "价格与成交量", description: "设定股价范围、日成交量、20 日平均成交量和相对成交量，先缩小候选范围。" },
        { title: "动量与趋势", description: "结合不同周期的涨跌幅、RSI、均线位置、MACD 方向或均线金叉筛选。" },
        { title: "波动率与回撤", description: "加入波动率和最大回撤条件，也可以查看价格距离 52 周高低点有多远。" },
      ],
      workflowTitle: "常用的选股条件，保存下来反复用。",
      workflow: [
        { title: "选择股票范围", description: "选择平台已收录的标普 500、纳斯达克 100 股票，或同时查看两者。" },
        { title: "设置筛选条件", description: "从动量、回调、超卖等预设开始，再按自己的选股思路调整。" },
        { title: "查看结果并保存", description: "排序和比较筛选结果，给这组条件起个名字，保存后下次继续用。" },
      ],
      boundaryTitle: "符合筛选条件，不等于买入建议。",
      boundaries: [
        "入选只表示股票符合你设置的条件，不代表未来一定上涨。",
        "筛选结果会受到数据日期、数据质量和股票覆盖范围的影响。",
        "当前股票名单与历史指数成分股可能不同，不能直接用来推断过去的策略收益。",
      ],
      questions: [
        { question: "需要会写代码吗？", answer: "不需要。在浏览器中选择预设条件，或自行组合筛选规则即可。常用的筛选方案可以保存到账户。" },
        { question: "筛出来的股票就适合买入吗？", answer: "不一定。选股器只负责找到符合条件的股票。是否适合你，还需要结合股价走势、其他相关信息和自身风险承受能力判断。" },
      ],
    },
    options: {
      name: "期权异动",
      eyebrow: "期权异动",
      title: "期权有异动，先看合约明细。",
      description:
        "按股票查看期权异动，再展开合约，比较到期日、行权价和持仓量变化。先看清数据，再判断异动可能意味着什么。",
      shortDescription: "展开异动合约，查看到期日、行权价和持仓量变化，不只看一个异动标签。",
      linkLabel: "了解期权异动",
      action: "查看期权异动",
      access: "免费版期权异动延迟 10 天。这里展示每日数据，不是实时逐笔成交。",
      tags: ["合约明细", "持仓量变化", "历史查询"],
      detailTitle: "哪些合约在变，具体怎么变？",
      details: [
        { title: "先看哪些股票有异动", description: "按日期查看股票分组和异常评分，找到值得进一步了解的合约。" },
        { title: "展开合约明细", description: "比较看涨或看跌类型、到期日、行权价、持仓量和每日变化，了解具体情况。" },
        { title: "区分异动类型", description: "查看新合约、新仓、平仓和成交活跃等分类，但不据此认定交易方向或交易者意图。" },
      ],
      workflowTitle: "先查合约，再结合股价走势判断。",
      workflow: [
        { title: "选择查看日期", description: "选择已有数据的日期，查看全部异动，或只看 Call、Put。" },
        { title: "比较合约数据", description: "展开股票下的合约，查看到期日、行权价和持仓量变化。" },
        { title: "结合股价走势", description: "再看标的股票的走势和大盘情况，不凭一条异动记录决定买卖。" },
      ],
      boundaryTitle: "有异动，不代表看涨或看跌。",
      boundaries: [
        "Call 不一定代表看涨交易，Put 也不一定代表看跌交易；合约可能用于对冲、平仓或组合策略。",
        "每日持仓量变化不能还原全部盘中成交，也不能说明交易者的真实目的。",
        "异常评分反映成交和持仓等数据的变化，不保证未来股价方向。",
      ],
      questions: [
        { question: "期权异动能说明资金看涨还是看跌吗？", answer: "不能仅凭异动判断。一个合约可能用于对冲、移仓、平仓，或属于组合策略的一部分。只看 Call 或 Put，无法确定交易者的意图。" },
        { question: "能看到实时逐笔期权成交吗？", answer: "不能。这里展示按日期整理的合约异动和持仓量变化，不是实时逐笔成交记录。请以页面标注的数据日期为准。" },
      ],
    },
  },
  en: {
    signals: {
      name: "US stock signals",
      eyebrow: "US STOCK SIGNALS",
      title: "US stock signals, with the history to check them",
      description:
        "PredixLab publishes daily US stock signals for S&P 500 and Nasdaq-100 stocks, built from end-of-day prices once per trading day. There are two kinds: AlphaRank ranks stocks against each other that day, and Pivot flags possible turning points. Every signal sits next to its price chart and its past outcomes, losses included. The Free plan shows signals with a 10-day delay, and Premium shows the latest published data. The signal, backtest, API and dashboard code is open source (Apache-2.0).",
      shortDescription: "Daily AlphaRank rankings and Pivot turning-point signals for S&P 500 and Nasdaq-100 stocks, shown with price charts and signal history.",
      linkLabel: "Explore US stock signals",
      action: "View daily signals",
      secondaryAction: { label: "How the signals are built", path: "/docs/how-it-works/" },
      access: "Signals are indicators, not instructions. The Free plan includes signals and signal performance with a 10-day delay.",
      tags: ["AlphaRank / Pivot", "Signal history", "Price charts"],
      imageAlt: "PredixLab US stock signals illustration: a daily price chart with one highlighted signal marker and the note “Signals are indicators, not instructions.” Example only, not market data.",
      detailTitle: "See how each signal fits the price action.",
      details: [
        { title: "Understand the two models", description: "AlphaRank ranks stocks relative to one another. Pivot flags potential turning points. The two models serve different purposes and shouldn't be interpreted in the same way." },
        { title: "Find the signal on the chart", description: "Compare the signal's location with recent price moves and earlier signals to see what was happening at the time." },
        { title: "Look at what happened next", description: "Review price moves and drawdowns after past signals, including the periods when they didn't work out." },
      ],
      workflowTitle: "A straightforward routine for reviewing signals.",
      workflow: [
        { title: "Check the data date", description: "See when the data was last updated and which dates your plan can access." },
        { title: "Open the stock chart", description: "Review recent price action, then check market overview for the broader context." },
        { title: "Review past performance", description: "Look at earlier gains, losses, and drawdowns alongside your own time horizon and risk tolerance." },
      ],
      boundaryTitle: "Signals to assess, not orders to follow.",
      boundaries: [
        "A model score is not a probability of profit or a personalized buy or sell recommendation.",
        "Historical signal performance is not the same as an actual portfolio return. Check how each metric is calculated.",
        "Premium provides more recent data, not greater model accuracy or lower market risk.",
      ],
      questions: [
        { question: "Are PredixLab's stock signals real-time?", answer: "No. PredixLab builds its signals from daily end-of-day prices once per trading day, after the US market closes. The signal job starts at about 10:30 pm ET (9:30 pm in winter). There are no intraday signals or live quotes, and PredixLab doesn't execute trades." },
        { question: "Do stock signals actually work?", answer: "Sometimes, and not reliably. The evidence on technical trading signals is mixed, and results tend to fade after costs and on data a model hasn't seen. That's why PredixLab shows each signal's history, losses included, tests its models out of sample, and documents its cost assumptions and known limitations. Past performance doesn't predict future results." },
        { question: "How are the signals generated?", answer: "The models read daily price, trend, momentum, volatility, volume and relative-strength features, using only data available on or before each date. Features that need normalizing are scaled against the stock's own trailing 252 trading days. LightGBM models are trained and tested with walk-forward validation, so each test period is predicted by a model that never saw it. The details are in how the signals are built and tested." },
        { question: "Are the signals free?", answer: "Yes, with a 10-day delay. The Free plan includes AlphaRank and Pivot signals and signal performance from 10 calendar days back. Premium costs $20 a month or $192 a year and shows the latest published data. Both plans use the same models, so upgrading changes how recent the data is, not how accurate it is." },
        { question: "Can I see past signals and how they performed?", answer: "Yes. You can review historical signals, chart markers and what happened afterwards, within the data the platform has. On the Free plan, signals and signal performance are delayed 10 days. Historical signal performance is not a portfolio return, and past performance doesn't predict future results." },
        { question: "Which stocks are covered?", answer: "The signals cover S&P 500 and Nasdaq-100 constituents, using daily prices with history from January 1, 2015, updated once per trading day. Index membership history is incomplete, so some former constituents are missing from the history. Each dashboard page shows which stocks it includes." },
        { question: "Are stock signals a buy or sell recommendation?", answer: "No. A model score isn't a probability of profit, and states such as Strong Buy or Strong Sell are model states, not personalized recommendations. PredixLab doesn't know your goals, holdings or risk tolerance. Use the signals as one input to your own analysis. For informational purposes only. Not investment advice." },
        { question: "Are trading signals legit or a scam? How do I judge a signal provider?", answer: "Look for timestamped history that includes losing signals, stated costs and fill assumptions, out-of-sample testing and disclosed limitations. Be wary of cherry-picked wins, deleted calls and return claims you can't check. PredixLab publishes its signal history, its testing method, its known limitations and the signal code, so you can check the work yourself." },
        { question: "Do you have a Telegram or Discord signal group?", answer: "No. PredixLab doesn't run a Telegram, Discord or other chat group. Signals live in the dashboard, next to their charts and history. Premium subscribers can also opt in to a daily signals email digest, and you can unsubscribe at any time." },
      ],
    },
    screener: {
      name: "Quantitative stock screener",
      eyebrow: "QUANTITATIVE STOCK SCREENER",
      title: "Screen US stocks on your terms.",
      description:
        "Filter stocks by volume, trend, momentum, and risk without writing code. Start with a preset or combine filters to match your own approach.",
      shortDescription: "Filter stocks by volume, trend, momentum, and risk. Save your criteria to use again next time.",
      linkLabel: "Explore the stock screener",
      action: "Open the stock screener",
      access: "Available on the Free plan. Covers the S&P 500 and NASDAQ-100 stocks tracked by the platform.",
      tags: ["No coding", "Custom filters", "Saved screens"],
      detailTitle: "Set your filters. Compare the stocks that match.",
      details: [
        { title: "Price and volume", description: "Narrow the list with price ranges, daily volume, 20-day average volume, and relative volume." },
        { title: "Momentum and trend", description: "Combine returns over different periods with RSI, moving averages, MACD direction, or golden-cross conditions." },
        { title: "Volatility and drawdown", description: "Set volatility and maximum-drawdown limits, or check how close a stock is to its 52-week high or low." },
      ],
      workflowTitle: "Build a screen once. Use it again tomorrow.",
      workflow: [
        { title: "Choose which stocks to screen", description: "Select the platform's tracked S&P 500 stocks, NASDAQ-100 stocks, or both." },
        { title: "Set your filters", description: "Try a momentum, pullback, or oversold preset, then adjust it to suit your approach." },
        { title: "Compare results and save", description: "Sort the matches, compare the stocks, and give your screen a name so you can use it again." },
      ],
      boundaryTitle: "A match isn't a buy recommendation.",
      boundaries: [
        "A stock appears because it meets your filters, not because it is guaranteed to rise.",
        "Results depend on the data date, data quality, and stocks currently covered.",
        "Today's stock list can differ from past index constituents. It cannot, on its own, establish historical strategy returns.",
      ],
      questions: [
        { question: "Do I need to know how to code?", answer: "No. Choose a preset or combine filters in your browser. You can save the screens you use regularly to your account." },
        { question: "Should I buy a stock because it appears in the results?", answer: "Not on that basis alone. The screener finds stocks that match your criteria. You still need to consider the chart, other relevant information, your goals, and your risk tolerance." },
      ],
    },
    options: {
      name: "Unusual options activity",
      eyebrow: "UNUSUAL OPTIONS ACTIVITY",
      title: "See the contracts behind unusual options activity.",
      description:
        "Browse activity by stock, then open the contracts to compare expirations, strikes, and changes in open interest. Look at the details before deciding what the activity might mean.",
      shortDescription: "Open the flagged contracts to compare expirations, strikes, and changes in open interest, not just an activity label.",
      linkLabel: "Explore unusual options activity",
      action: "View options activity",
      access: "Free options activity has a 10-day delay. This is daily data, not a live trade feed.",
      tags: ["Contract details", "Open interest", "Historical data"],
      detailTitle: "Which contracts changed, and how?",
      details: [
        { title: "Find stocks with unusual activity", description: "Review stocks and anomaly scores for a selected date to find contracts worth a closer look." },
        { title: "Open the contract details", description: "Compare calls and puts, expiration dates, strike prices, open interest, and daily changes." },
        { title: "Read the activity classifications", description: "Distinguish new contracts, new positions, closing positions, and high activity without treating a label as proof of a trade's direction or purpose." },
      ],
      workflowTitle: "Check the contracts. Then check the stock.",
      workflow: [
        { title: "Choose a date", description: "Select a date with available data and view calls, puts, or both." },
        { title: "Compare the contracts", description: "Expand a stock's contracts to check expirations, strikes, and changes in open interest." },
        { title: "Look at the stock chart", description: "Consider the underlying price action and broader market rather than making a decision from one activity record." },
      ],
      boundaryTitle: "Unusual activity doesn't tell you the direction.",
      boundaries: [
        "A call trade isn't necessarily bullish, and a put trade isn't necessarily bearish. Either may be a hedge, a closing trade, or part of a spread.",
        "Daily changes in open interest cannot reconstruct every intraday trade or reveal a trader's intentions.",
        "Anomaly scores describe changes in activity, not a guaranteed direction for the stock price.",
      ],
      questions: [
        { question: "Can unusual activity tell me whether traders are bullish or bearish?", answer: "Not by itself. A contract can be part of a hedge, roll, closing trade, or multi-leg strategy. Whether it's a call or a put doesn't reveal the trader's intent." },
        { question: "Can I see live options trades here?", answer: "No. The tool shows daily contract activity and changes in open interest, not a real-time trade feed. Check the date shown on the page." },
      ],
    },
  },
};

export const optionsResearchContent = {
  zh: {
    eyebrow: "更多期权分析工具",
    title: "不只看异动，也看期权的整体分布。",
    description: "工作台还提供 Gamma 敞口估算和波动率结构分析，帮助你从不同角度了解期权市场。",
    links: [
      {
        path: "/options/gamma",
        label: "GAMMA EXPOSURE / GEX",
        title: "Gamma 敞口估算",
        description: "根据公开持仓量和模型假设，查看估算的敞口、行权价分布及每日变化。数据不代表真实做市商持仓。",
      },
      {
        path: "/options/structure",
        label: "VOLATILITY & POSITIONING",
        title: "波动率与持仓分布",
        description: "查看隐含波动率的期限结构、偏斜，以及持仓量在不同行权价和到期日之间的变化。",
      },
    ],
  },
  en: {
    eyebrow: "MORE OPTIONS TOOLS",
    title: "Two more ways to look at the options market.",
    description: "Explore estimated gamma exposure and volatility structure alongside unusual activity. Each view adds context without revealing a trader's intent.",
    links: [
      {
        path: "/options/gamma",
        label: "GAMMA EXPOSURE / GEX",
        title: "Estimated gamma exposure",
        description: "View estimated exposure, concentrations by strike, and daily changes based on public open interest and model assumptions, not actual dealer holdings.",
      },
      {
        path: "/options/structure",
        label: "VOLATILITY & POSITIONING",
        title: "Volatility and open interest",
        description: "Compare implied volatility across expirations, downside skew, and changes in the distribution of open interest.",
      },
    ],
  },
};
