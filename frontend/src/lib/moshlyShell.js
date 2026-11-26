/**
 * MoshlyShell — talk to Browshly, the Moshly app frame (https://moshly.io/app?app=<slug>).
 * Plain-JavaScript copy of moshlyShell.ts for apps without TypeScript; keep both in sync.
 * Source of truth: emptytown/moshly-modules (modules/MoshlyShell). Copy, do not edit the copy.
 */
const TRANSPARENT = /^(transparent|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\))$/i;

function paintedBackground(el) {
  for (let node = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && !TRANSPARENT.test(bg)) return bg;
  }
  return "rgb(255, 255, 255)";
}

/** "light" when the colour is bright (relative luminance > 0.5), else "dark". */
function schemeOf(color) {
  const m = color.match(/[\d.]+/g);
  if (!m || m.length < 3) return "dark";
  const [r, g, b] = m.slice(0, 3).map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5 ? "light" : "dark";
}

export function createMoshlyShell(options) {
  const hubUrl = (options.hubUrl || "https://moshly.io").replace(/\/+$/, "");
  const hubOrigin = new URL(hubUrl).origin;

  let inShell = false;
  try {
    inShell = typeof window !== "undefined" && window.self !== window.top;
  } catch {
    inShell = true; // reading window.top threw: we are inside a cross-origin frame
  }

  const send = (type) => window.parent.postMessage({ type }, hubOrigin);

  return {
    inShell,
    goHome() {
      if (inShell) send("moshly:home");
      else window.location.href = `${hubUrl}/launcher`;
    },
    openSwitcher() {
      if (inShell) send("moshly:switcher");
      else window.location.href = `${hubUrl}/app?app=${encodeURIComponent(options.app)}&switcher=1`;
    },
    reauth(fallbackUrl) {
      if (inShell) send("moshly:reauth");
      else window.location.href = fallbackUrl;
    },
    quotaChanged() {
      if (inShell) send("moshly:quota-changed");
    },
    setTheme(theme) {
      if (inShell) window.parent.postMessage({ type: "moshly:theme", theme }, hubOrigin);
    },
    themeFromCss(el) {
      const target = el || document.body;
      const style = getComputedStyle(target);
      const background = paintedBackground(target);
      const border = style.borderBottomColor;
      return {
        background,
        text: style.color,
        border: border && !TRANSPARENT.test(border) && parseFloat(style.borderBottomWidth) > 0 ? border : undefined,
        scheme: schemeOf(background),
      };
    },
    hubLinkTarget: inShell ? "_top" : undefined,
  };
}
