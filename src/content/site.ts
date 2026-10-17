import type { SiteLanguage } from "@/routing";

export interface Question {
  question: string;
  answer: string;
}

export const faqContent: Record<SiteLanguage, Question[]> = {
  zh: [
    {
      question: "PredixLab 适合谁使用？",
      answer:
        "适合关注美股、想更方便地看行情和筛选股票的个人投资者。无需编程，但投资决策仍需结合自己的目标、持有周期和风险承受能力。",
    },
    {
      question: "免费版能用哪些功能？",
      answer:
        "免费版包含市场概览、股价图表和量化选股器，还可以查看延迟 10 天的每日信号、期权异动和信号表现。Premium 可查看这部分功能的最新已发布数据。",
    },
    {
      question: "数据是实时的吗？",
      answer:
        "不是。PredixLab 以日线行情和每日信号为主，不提供实时行情或盘中交易提醒。数据更新到哪一天，请以工作台显示的日期为准。",
    },
    {
      question: "信号是不是买卖建议？",
      answer:
        "不是。信号用于辅助分析，不是买卖指令。模型评分不等于盈利概率，历史表现也不保证未来收益，最终决定仍需由你自己做出。",
    },
    {
      question: "可以查看哪些股票？",
      answer:
        "选股器主要覆盖平台已收录的标普 500 和纳斯达克 100 股票。信号、期权等功能的覆盖范围可能不同，具体以各页面显示的股票和日期为准。",
    },
  ],
  en: [
    {
      question: "Who is PredixLab for?",
      answer:
        "PredixLab is for individual investors who follow US stocks and want an easier way to review the market and screen for ideas. No coding is required. Your investment goals, time horizon, and risk tolerance still guide your decisions.",
    },
    {
      question: "What's included in the Free plan?",
      answer:
        "Free includes market overview, price charts, and the stock screener, plus daily signals, options activity, and signal performance with a 10-day delay. Premium gives you access to the latest published data for those features.",
    },
    {
      question: "Is the data real-time?",
      answer:
        "No. PredixLab uses daily price data and daily signal updates, not live quotes or intraday trade alerts. Check the date shown in the dashboard to see how current each result is.",
    },
    {
      question: "Are the signals buy or sell recommendations?",
      answer:
        "No. Signals are inputs to your analysis, not instructions to trade. A model score is not a probability of profit, and past performance doesn't guarantee future results. The decision is yours.",
    },
    {
      question: "Which stocks are covered?",
      answer:
        "The screener focuses on the S&P 500 and NASDAQ-100 stocks tracked by the platform. Coverage can differ between signals, options, and other features. Check each tool for the available symbols and dates.",
    },
  ],
};

export const homeContent = {
  zh: {
    eyebrow: "每日美股信号、选股与期权分析",
    title: ["看清市场变化，", "选股更有依据。"],
    description:
      "每日信号、量化选股、期权异动，一站查看。结合股价走势、大盘表现和历史数据，判断哪些股票值得关注。",
    primary: "免费开始使用",
    secondary: "了解产品功能",
    note: "无需信用卡 · 免费版信号延迟 10 天",
    coverage: ["美股分析", "日线数据", "S&P 500 / NASDAQ-100", "无需编程"],
    toolsEyebrow: "01 / 产品功能",
    toolsTitle: ["看盘、选股、查异动，", "都在一个工作台。"],
    toolsDescription:
      "先看大盘，再筛选股票，或直接查看某只股票的期权异动。常用信息集中展示，少在多个页面之间来回查找。",
    toolsLink: "了解详情",
    methodEyebrow: "02 / 如何看待信号",
    methodTitle: ["信号只是参考，", "判断还要结合行情。"],
    methodDescription:
      "分数高低只是一个维度。结合近期走势、成交量和大盘表现，才能更全面地了解一只股票。",
    methodSteps: [
      {
        title: "先看大盘和板块",
        description: "查看涨跌家数、板块表现和涨跌分布，了解整体市场的强弱。",
      },
      {
        title: "再看个股走势",
        description: "在图表上查看信号位置，同时对照近期走势、成交量和历史信号。",
      },
      {
        title: "复盘后续涨跌和回撤",
        description: "既看历史信号后的上涨，也看下跌和回撤，避免只挑表现好的案例。",
      },
    ],
    methodLink: "了解 PredixLab",
    methodStamp: ["看行情", "看信号", "再判断"],
    faqEyebrow: "03 / 常见问题",
    faqTitle: "开始使用前，你可能想了解",
    faqDescription: "关于功能、数据更新和使用方式，这里有几个常见问题。",
  },
  en: {
    eyebrow: "Daily US stock signals, screening, and options analysis",
    title: ["Spot the signals.", "See the bigger picture."],
    description:
      "Daily signals, a flexible stock screener, and options activity in one dashboard. Compare price action, market trends, and past performance to find stocks worth a closer look.",
    primary: "Get started free",
    secondary: "Explore the tools",
    note: "No credit card required · Free signals have a 10-day delay",
    coverage: ["US STOCKS", "DAILY DATA", "S&P 500 / NASDAQ-100", "NO CODING"],
    toolsEyebrow: "01 / THE TOOLS",
    toolsTitle: ["Your daily market review.", "All in one place."],
    toolsDescription:
      "Start with the broader market, narrow your stock list, or look into options activity for a particular company. Spend less time switching between sources.",
    toolsLink: "Learn more",
    methodEyebrow: "02 / USING THE SIGNALS",
    methodTitle: ["A signal is a starting point.", "Put it in context."],
    methodDescription:
      "A model score is only part of the picture. Compare recent price action, the broader market, and what happened after past signals before drawing a conclusion.",
    methodSteps: [
      {
        title: "Start with the broader market",
        description: "Check market breadth, sector performance, and the distribution of gains and losses.",
      },
      {
        title: "Look at the individual stock",
        description: "Find the signal on the chart and compare it with recent price action, volume, and earlier signals.",
      },
      {
        title: "Review the gains and the setbacks",
        description: "Look at losses and drawdowns as well as favorable moves, rather than focusing on the best examples.",
      },
    ],
    methodLink: "About PredixLab",
    methodStamp: ["CONTEXT", "BEFORE", "CONVICTION."],
    faqEyebrow: "03 / COMMON QUESTIONS",
    faqTitle: "What to know before you start.",
    faqDescription: "A few straightforward answers about the tools, data, and getting started.",
  },
};

export const sceneContent = {
  zh: {
    heading: "看盘演示",
    label: "看盘步骤交互演示",
    illustration: "示例图表，非实时行情",
    chartTitle: "股价走势、成交量与示例信号",
    chartDescription:
      "示例日线图和成交量。三个步骤依次展示价格走势、趋势参考线和信号位置。图表不代表真实股票或实际收益。",
    daily: "日线 / D1",
    price: "股价走势",
    volume: "成交量",
    average: "趋势参考线",
    event: "示例信号",
    pause: "暂停动画",
    play: "播放动画",
    reduced: "已关闭动态效果",
    controls: "切换查看步骤",
    caption: "先看走势，再结合趋势和历史信号分析。图表仅作演示，不代表实际买卖信号。",
    steps: [
      {
        label: "看走势",
        title: "先看价格走势。",
        description: "观察日线走势和成交量，看看上涨或下跌时，量能有没有变化。",
        detail: "日线走势 / 成交量",
      },
      {
        label: "看趋势",
        title: "再看价格位置。",
        description: "结合趋势参考线和近期高低点判断，不只盯着某一根 K 线。",
        detail: "趋势 / 近期区间",
      },
      {
        label: "看信号",
        title: "回看后续表现。",
        description: "对照历史信号之后的涨跌和回撤，不只看信号出现时的分数。",
        detail: "历史信号 / 后续走势",
      },
    ],
  },
  en: {
    heading: "SIGNAL OVERVIEW",
    label: "Interactive chart walkthrough",
    illustration: "Example chart. Not live data.",
    chartTitle: "Price, volume, and an example signal",
    chartDescription:
      "An example daily candlestick chart with volume. Three steps show price action, a trend reference, and a signal marker. The chart does not represent an actual stock or return.",
    daily: "DAILY / D1",
    price: "PRICE ACTION",
    volume: "VOLUME",
    average: "TREND REFERENCE",
    event: "EXAMPLE SIGNAL",
    pause: "Pause animation",
    play: "Play animation",
    reduced: "Reduced motion enabled",
    controls: "Choose a step",
    caption: "Read the price action, add context, and review past signals. This is a walkthrough, not a trading signal.",
    steps: [
      {
        label: "Price action",
        title: "See how price is moving.",
        description: "Compare daily price moves with trading volume to see how the two change together.",
        detail: "DAILY PRICE / VOLUME",
      },
      {
        label: "Trend context",
        title: "See where the price stands.",
        description: "Use the trend reference and recent range instead of reading a single candle in isolation.",
        detail: "TREND / RECENT RANGE",
      },
      {
        label: "Signal review",
        title: "Look at what followed.",
        description: "Review gains, losses, and drawdowns after earlier signals, not just the score on the day.",
        detail: "PAST SIGNALS / PRICE MOVES",
      },
    ],
  },
};

export const ctaContent = {
  zh: {
    eyebrow: "看行情、筛股票，从免费版开始。",
    title: ["下次看盘，", "从这里开始。"],
    description: "先用免费版熟悉各项功能，需要最新信号时再升级。",
    button: "免费开始使用",
    pricing: "查看方案与价格",
    note: "免费版信号、期权异动和信号表现延迟 10 天。平台内容不构成投资建议。",
  },
  en: {
    eyebrow: "CHARTS, SCREENING, AND SIGNALS. FREE TO EXPLORE.",
    title: ["Your next market review", "starts here."],
    description: "Try the charts, screener, and historical signals for free. Upgrade if you need the latest daily data.",
    button: "Get started free",
    pricing: "Compare plans",
    note: "Free signals, options activity, and signal performance have a 10-day delay. Not investment advice.",
  },
};
