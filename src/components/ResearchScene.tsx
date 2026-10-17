import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, ChartLine, Pause, Play } from "@phosphor-icons/react";
import { sceneContent } from "@/content/site";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

// Coordinates illustrate the workflow, not a security or a historical return.
const closes = [
  217, 205, 211, 192, 181, 190, 175, 161, 171, 150, 139, 150, 137,
  146, 163, 171, 158, 181, 197, 190, 207, 226, 236, 221, 215, 204,
  218, 197, 180, 169, 177, 155, 146, 154, 134, 125, 137, 117,
];
const candles = closes.map((close, index) => ({
  x: 48 + index * 18.7,
  open: index === 0 ? 229 : closes[index - 1],
  close,
  volume: 12 + ((index * 17 + 11) % 37),
}));
const pricePath = candles.map(({ x, close }, index) => `${index ? "L" : "M"}${x},${close}`).join(" ");

const ResearchScene = () => {
  const { language } = useSiteLanguage();
  const copy = sceneContent[language];
  const id = useId();
  const sceneRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const active = copy.steps[stage];
  const playing = !paused && !reducedMotion && inView && pageVisible;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (sceneRef.current) observer.observe(sceneRef.current);

    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStage((value) => (value + 1) % 3), 4200);
    return () => window.clearInterval(timer);
  }, [playing]);

  const selectStage = (next: number) => {
    setStage(next);
    setPaused(true);
  };

  return (
    <figure
      ref={sceneRef}
      className={`research-scene ${playing ? "is-playing" : "is-paused"}`}
      data-stage={stage}
      aria-label={copy.label}
    >
      <div className="scene-topline">
        <div className="scene-identity">
          <span className="scene-symbol" aria-hidden="true"><ChartLine weight="bold" /></span>
          <span>{copy.heading}</span>
          <span className="scene-edition">/ 001</span>
        </div>
        <span className="scene-disclosure">{copy.illustration}</span>
      </div>

      <div className="scene-body">
        <div className="scene-plot">
          <div className="plot-heading">
            <span>{copy.price}</span>
            <span className="plot-timeframe">{copy.daily}</span>
          </div>
          <svg
            className="market-chart"
            viewBox="0 0 800 352"
            role="img"
            aria-labelledby={`${id}-title ${id}-description`}
          >
            <title id={`${id}-title`}>{copy.chartTitle}</title>
            <desc id={`${id}-description`}>{copy.chartDescription}</desc>
            <defs>
              <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="chart-grid" aria-hidden="true">
              {[56, 112, 168, 224, 280].map((y) => <path key={y} d={`M24 ${y}H775`} />)}
              {[48, 198, 348, 498, 648, 773].map((x) => <path key={x} d={`M${x} 28V328`} />)}
            </g>
            <g className="chart-context" aria-hidden="true">
              <rect x="357" y="148" width="212" height="104" rx="6" />
              <path className="chart-support" d="M320 251H632" />
              <path className="chart-moving-average" d="M42 210C120 190 165 163 220 158S340 163 390 190S470 227 523 214S645 173 759 143" />
            </g>
            <path className="chart-area" d={`${pricePath}V281H48Z`} fill={`url(#${id}-area)`} aria-hidden="true" />
            <path className="chart-price-trace" d={pricePath} pathLength="1" aria-hidden="true" />
            <g aria-hidden="true">
              {candles.map(({ x, open, close, volume }, index) => (
                <g
                  key={x}
                  className={`chart-candle ${close < open ? "candle-up" : "candle-down"}`}
                  style={{ "--candle-delay": `${index * 18}ms` } as CSSProperties}
                >
                  <path d={`M${x} ${Math.min(open, close) - 8 - (index % 5)}V${Math.max(open, close) + 9 + (index % 7)}`} />
                  <rect x={x - 5} y={Math.min(open, close)} width="10" height={Math.max(4, Math.abs(open - close))} rx="1.5" />
                  <rect className="volume-bar" x={x - 5} y={336 - volume} width="10" height={volume} rx="1.5" />
                </g>
              ))}
            </g>
            <g className="chart-research-marker" aria-hidden="true">
              <path className="marker-guide" d="M553 65V286" />
              <circle className="marker-halo" cx="553" cy="197" r="24" />
              <circle className="marker-ring" cx="553" cy="197" r="13" />
              <circle className="marker-center" cx="553" cy="197" r="5" />
              <path className="marker-connector" d="M553 65H665" />
              <rect className="marker-label-bg" x="570" y="39" width="187" height="34" rx="6" />
              <text className="marker-label" x="584" y="61">{copy.event}</text>
            </g>
            <g className="chart-scan" aria-hidden="true">
              <rect x="0" y="30" width="2" height="304" />
              <rect className="scan-trail" x="-38" y="30" width="38" height="304" />
            </g>
          </svg>
          <div className="plot-legend" aria-hidden="true">
            <span><i className="legend-price" />{copy.price}</span>
            <span><i className="legend-volume" />{copy.volume}</span>
            <span className={stage > 0 ? "legend-active" : ""}><i className="legend-average" />{copy.average}</span>
          </div>
        </div>
        <div className="scene-inspector" aria-live={paused ? "polite" : "off"} aria-atomic="true">
          <div className="inspector-top">
            <span className="inspector-number">0{stage + 1}</span>
            <ArrowUpRight aria-hidden="true" />
          </div>
          <div className="inspector-copy" key={`${language}-${stage}`}>
            <span className="inspector-kicker">{active.label}</span>
            <h2>{active.title}</h2>
            <p>{active.description}</p>
          </div>
          <div className="inspector-detail"><span aria-hidden="true" />{active.detail}</div>
        </div>
      </div>

      <div className="scene-bottomline">
        <div className="scene-controls" role="group" aria-label={copy.controls}>
          {copy.steps.map((step, index) => (
            <button
              type="button"
              key={step.label}
              className="scene-step"
              aria-pressed={stage === index}
              onClick={() => selectStage(index)}
            >
              <span className="step-index">0{index + 1}</span>
              <span>{step.label}</span>
              <span className="step-progress" aria-hidden="true" />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="motion-control"
          onClick={() => setPaused((value) => !value)}
          disabled={reducedMotion}
          aria-label={reducedMotion ? copy.reduced : paused ? copy.play : copy.pause}
          title={reducedMotion ? copy.reduced : paused ? copy.play : copy.pause}
        >
          {paused || reducedMotion ? <Play aria-hidden="true" weight="fill" /> : <Pause aria-hidden="true" weight="fill" />}
        </button>
      </div>
      <figcaption className="scene-caption">{copy.caption}</figcaption>
    </figure>
  );
};

export default ResearchScene;
