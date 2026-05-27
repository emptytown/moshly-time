import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * FitText — renders `text` as large as possible inside its parent box.
 * Uses a hidden measurer + binary-search style scale to fit width AND height.
 */
export default function FitText({ text, className = "", maxFontPx = 800 }) {
  const wrapRef = useRef(null);
  const measureRef = useRef(null);
  const [fontPx, setFontPx] = useState(64);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure) return;

    let raf;

    const fit = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;

      // Start with reasonable guess based on height, then scale down by width
      let size = Math.min(maxFontPx, h * 0.95);
      measure.style.fontSize = size + "px";
      let mw = measure.scrollWidth;
      let mh = measure.scrollHeight;

      if (mw > w * 0.96) {
        size = size * ((w * 0.96) / mw);
      }
      if (mh > h * 0.98) {
        size = size * ((h * 0.98) / mh);
      }
      // 2nd pass refine
      measure.style.fontSize = size + "px";
      mw = measure.scrollWidth;
      mh = measure.scrollHeight;
      if (mw > w * 0.96) size *= (w * 0.96) / mw;
      if (mh > h * 0.98) size *= (h * 0.98) / mh;

      setFontPx(Math.max(12, Math.floor(size)));
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("resize", schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [text, maxFontPx]);

  return (
    <div
      ref={wrapRef}
      className="fit-wrap"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* hidden measurer keeps same font/letter spacing as visible */}
      <span
        ref={measureRef}
        aria-hidden
        className={`clock-text ${className}`}
        style={{
          position: "absolute",
          visibility: "hidden",
          fontSize: 100,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <span
        className={`clock-text ${className}`}
        style={{ fontSize: fontPx + "px" }}
        data-testid="clock-display"
      >
        {text}
      </span>
    </div>
  );
}
