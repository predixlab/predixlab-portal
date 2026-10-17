import { ArrowRight, Check, Funnel, Stack, TrendUp } from "@phosphor-icons/react";
import type { ProductId } from "@/content/products";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const ProductIllustration = ({ product }: { product: ProductId }) => {
  const { isEnglish } = useSiteLanguage();
  const headings = {
    signals: isEnglish ? "DAILY SIGNALS" : "每日信号",
    screener: isEnglish ? "STOCK SCREENER" : "量化选股",
    options: isEnglish ? "CONTRACT DETAILS" : "合约明细",
  };

  return (
    <div className={`product-illustration illustration-${product}`} aria-hidden="true">
      <div className="illustration-top">
        <span>{headings[product]}</span>
        {product === "signals" ? <TrendUp /> : product === "screener" ? <Funnel /> : <Stack />}
      </div>
      {product === "signals" ? (
        <div className="signal-illustration">
          <div className="mini-chart-caption"><span>{isEnglish ? "Price and past signals" : "股价走势与历史信号"}</span><b>D1</b></div>
          <svg viewBox="0 0 400 178" role="presentation">
            <path className="mini-grid" d="M0 30H400M0 85H400M0 140H400" />
            <path className="mini-price" d="M4 108L24 97 39 104 57 79 77 92 96 73 112 78 132 58 149 67 167 100 185 121 202 112 221 128 242 104 262 89 281 100 300 73 322 81 342 51 360 64 378 42 398 47" />
            <path className="mini-guide" d="M221 26V157" />
            <circle className="mini-marker-ring" cx="221" cy="128" r="15" />
            <circle className="mini-marker" cx="221" cy="128" r="5" />
            <rect className="mini-label" x="174" y="6" width="97" height="28" rx="6" />
            <text x="222" y="25" textAnchor="middle">{isEnglish ? "SIGNAL" : "示例信号"}</text>
          </svg>
          <div className="illustration-result"><Check /><span>{isEnglish ? "Signals are indicators, not instructions." : "信号供参考，买卖需自行判断。"}</span></div>
        </div>
      ) : product === "screener" ? (
        <div className="screen-illustration">
          <div className="screen-universe"><span>{isEnglish ? "UNIVERSE" : "股票范围"}</span><strong>S&P 500 + NASDAQ-100</strong></div>
          {[
            [isEnglish ? "Trend" : "趋势", isEnglish ? "Price above MA50" : "价格高于 50 日均线"],
            [isEnglish ? "Momentum" : "动量", "RSI 40–60"],
            [isEnglish ? "Liquidity" : "流动性", isEnglish ? "Average volume ≥ 1M" : "平均成交量 ≥ 100 万"],
          ].map(([label, value]) => (
            <div className="screen-rule" key={label}><span>{label}</span><strong>{value}</strong><Check /></div>
          ))}
          <div className="screen-output"><span>{isEnglish ? "Your filters" : "筛选条件"}</span><ArrowRight /><span>{isEnglish ? "Matching stocks" : "符合条件的股票"}</span></div>
        </div>
      ) : (
        <div className="options-illustration">
          <div className="contract-root"><Stack /><div><strong>{isEnglish ? "Underlying stock" : "标的股票"}</strong><span>{isEnglish ? "View flagged contracts" : "查看异动合约"}</span></div></div>
          <div className="contract-branches">
            <div className="contract-node"><span className="contract-type">CALL</span><span>{isEnglish ? "Expiration" : "到期日"}<strong>{isEnglish ? "Strike" : "行权价"}</strong></span><span className="contract-field">Δ OI</span></div>
            <div className="contract-node"><span className="contract-type put">PUT</span><span>{isEnglish ? "Expiration" : "到期日"}<strong>{isEnglish ? "Strike" : "行权价"}</strong></span><span className="contract-field">Δ OI</span></div>
          </div>
          <p>{isEnglish ? "Check the details before interpreting the activity." : "先看合约明细，不凭异动猜测交易意图。"}</p>
        </div>
      )}
      <span className="illustration-disclosure">{isEnglish ? "EXAMPLE ONLY · NOT MARKET DATA" : "功能示意 · 非实际行情或筛选结果"}</span>
    </div>
  );
};

export default ProductIllustration;
