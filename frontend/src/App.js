import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  EyeOff,
  Settings as SettingsIcon,
  Sliders,
  X,
} from "lucide-react";
import FitText from "@/components/FitText";
import {
  useNow,
  useTimer,
  useChrono,
  useCountdownToTime,
  useNYE,
  playBeep,
} from "@/hooks/useClockModes";
import "@/App.css";

const MODES = [
  { id: "now", label: "Now" },
  { id: "timer", label: "Timer" },
  { id: "chrono", label: "Chrono" },
  { id: "countdown", label: "Countdown" },
  { id: "nye", label: "NYE" },
];

// Skin preview tokens used inside the settings sheet cards
const SKINS = [
  {
    id: "moshly",
    label: "Moshly",
    preview: {
      bg: "linear-gradient(135deg, #1a1230 0%, #0E0F14 100%)",
      fg: "#fff",
      font: '"Inter", system-ui, sans-serif',
      weight: 900,
      gradient:
        "linear-gradient(135deg, #E6E7EB 0%, #C026D3 60%, #00E5FF 120%)",
    },
  },
  {
    id: "coder",
    label: "Coder",
    preview: {
      bg: "#000",
      fg: "#00FF66",
      font: '"Share Tech Mono", monospace',
      weight: 400,
      shadow: "0 0 8px #00FF66",
    },
  },
  {
    id: "8bit",
    label: "8Bit",
    preview: {
      bg: "#000",
      fg: "#fff",
      font: '"Press Start 2P", monospace',
      weight: 400,
      size: 14,
    },
  },
  {
    id: "solari",
    label: "Solari",
    preview: {
      bg: "#15110D",
      fg: "#F4D58D",
      font: '"Anton", sans-serif',
      weight: 400,
      flap: true,
    },
  },
];

const LS = {
  skin: "bigclock.skin",
  mode: "bigclock.mode",
  timerSec: "bigclock.timer.sec",
  countdownTarget: "bigclock.countdown.target",
  nyeThreshold: "bigclock.nye.threshold",
  sound: "bigclock.sound",
};

const load = (k, fb) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? fb : JSON.parse(v);
  } catch {
    return fb;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export default function App() {
  const [skin, setSkin] = useState(() => load(LS.skin, "moshly"));
  const [mode, setMode] = useState(() => load(LS.mode, "now"));
  const [sound, setSound] = useState(() => load(LS.sound, true));
  const [dockVisible, setDockVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  // Timer
  const [timerInputH, setTimerInputH] = useState("00");
  const [timerInputM, setTimerInputM] = useState("05");
  const [timerInputS, setTimerInputS] = useState("00");
  const timerInitialSec = load(LS.timerSec, 300);
  const timer = useTimer(timerInitialSec);

  // Chrono
  const chrono = useChrono();

  // Countdown to time
  const [countdownTarget, setCountdownTarget] = useState(() =>
    load(LS.countdownTarget, "23:30")
  );
  const [countdownActive, setCountdownActive] = useState(false);
  const countdown = useCountdownToTime(
    countdownTarget,
    countdownActive,
    () => sound && playBeep(660, 800)
  );

  // NYE
  const [nyeThreshold, setNyeThreshold] = useState(() =>
    load(LS.nyeThreshold, 60)
  );
  const nye = useNYE(mode === "nye", nyeThreshold, () => {
    if (sound) playBeep(523, 400);
  });

  // Now
  const now = useNow();

  /* persistence */
  useEffect(() => save(LS.skin, skin), [skin]);
  useEffect(() => save(LS.mode, mode), [mode]);
  useEffect(() => save(LS.sound, sound), [sound]);
  useEffect(() => save(LS.countdownTarget, countdownTarget), [countdownTarget]);
  useEffect(() => save(LS.nyeThreshold, nyeThreshold), [nyeThreshold]);

  /* auto-hide dock in landscape after inactivity */
  const hideTimer = useRef(null);
  useEffect(() => {
    const isLandscape = () =>
      window.matchMedia("(orientation: landscape)").matches &&
      window.innerHeight < 600;

    const armHide = () => {
      clearTimeout(hideTimer.current);
      if (isLandscape() && !settingsOpen && !setupOpen) {
        hideTimer.current = setTimeout(() => setDockVisible(false), 2500);
      }
    };
    const wake = () => {
      setDockVisible(true);
      armHide();
    };
    armHide();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("orientationchange", wake);
    window.addEventListener("resize", armHide);
    return () => {
      clearTimeout(hideTimer.current);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("orientationchange", wake);
      window.removeEventListener("resize", armHide);
    };
  }, [settingsOpen, setupOpen]);

  /* beep when timer finishes */
  const timerWasRunning = useRef(timer.running);
  useEffect(() => {
    if (timerWasRunning.current && !timer.running && timer.remainingMs <= 0) {
      if (sound) playBeep(880, 600);
    }
    timerWasRunning.current = timer.running;
  }, [timer.running, timer.remainingMs, sound]);

  /* display text + label */
  const { displayText, label } = useMemo(() => {
    switch (mode) {
      case "timer":
        return { displayText: timer.text, label: "Timer" };
      case "chrono":
        return { displayText: chrono.text, label: "Chronometer" };
      case "countdown":
        return {
          displayText: countdownActive ? countdown.text : "00:00:00:00",
          label: countdownActive
            ? `Countdown → ${countdownTarget}`
            : "Countdown — set target",
        };
      case "nye":
        return { displayText: nye.text, label: `NYE ${new Date().getFullYear() + 1}` };
      case "now":
      default:
        return { displayText: now.text, label: "Now" };
    }
  }, [
    mode, timer.text, chrono.text, countdown.text, countdownActive,
    countdownTarget, nye.text, now.text,
  ]);

  const handleStartTimer = () => {
    const sec =
      (Number(timerInputH) || 0) * 3600 +
      (Number(timerInputM) || 0) * 60 +
      (Number(timerInputS) || 0);
    if (sec <= 0) return;
    save(LS.timerSec, sec);
    timer.start(sec, () => sound && playBeep(880, 600));
    setSetupOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const showLastSeconds = mode === "nye" && nye.isLastSeconds;
  const modeHasSetup = mode === "timer" || mode === "countdown" || mode === "nye";
  const showTransport = mode === "timer" || mode === "chrono";

  return (
    <div className="app-root" data-skin={skin} data-testid="app-root">
      <div className="bg-vfx" />

      {/* Stage */}
      <div className="stage" data-testid="clock-stage">
        <div className="clock-wrap">
          <div className="clock-label" data-testid="clock-label">{label}</div>
          <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
            <FitText text={displayText} />
          </div>
        </div>
      </div>

      {/* NYE LAST-SECONDS overlay */}
      {showLastSeconds && (
        <div
          className="lastsec-overlay"
          data-skin={skin}
          data-testid="nye-last-seconds-overlay"
        >
          <div className="bg-vfx" />
          <div className="clock-label">Last seconds — Happy New Year!</div>
          <div style={{ width: "92vw", height: "70vh" }}>
            <FitText text={nye.secondsOnly} />
          </div>
        </div>
      )}

      {/* DOCK */}
      <div className={`dock ${dockVisible ? "" : "hidden"}`} data-testid="dock">
        {/* Setup drawer above dock */}
        {setupOpen && (
          <div className="setup-drawer" data-testid="setup-drawer">
            {mode === "timer" && (
              <>
                <div className="field">
                  <label>Hours</label>
                  <input
                    type="number" min="0" max="99"
                    value={timerInputH}
                    onChange={(e) => setTimerInputH(e.target.value)}
                    data-testid="timer-input-hours"
                  />
                </div>
                <div className="field">
                  <label>Minutes</label>
                  <input
                    type="number" min="0" max="59"
                    value={timerInputM}
                    onChange={(e) => setTimerInputM(e.target.value)}
                    data-testid="timer-input-minutes"
                  />
                </div>
                <div className="field">
                  <label>Seconds</label>
                  <input
                    type="number" min="0" max="59"
                    value={timerInputS}
                    onChange={(e) => setTimerInputS(e.target.value)}
                    data-testid="timer-input-seconds"
                  />
                </div>
                <button
                  className="action-btn"
                  onClick={handleStartTimer}
                  data-testid="timer-start-btn"
                >
                  Start
                </button>
                <button
                  className="action-btn ghost"
                  onClick={() => setSetupOpen(false)}
                  data-testid="setup-close-btn"
                >
                  Close
                </button>
              </>
            )}

            {mode === "countdown" && (
              <>
                <div className="field">
                  <label>Target time</label>
                  <input
                    type="time"
                    value={countdownTarget}
                    onChange={(e) => setCountdownTarget(e.target.value)}
                    data-testid="countdown-target-input"
                  />
                </div>
                <button
                  className="action-btn"
                  onClick={() => { setCountdownActive(true); setSetupOpen(false); }}
                  data-testid="countdown-start-btn"
                >
                  Start
                </button>
                <button
                  className="action-btn ghost"
                  onClick={() => setCountdownActive(false)}
                  data-testid="countdown-stop-btn"
                >
                  Stop
                </button>
                <button
                  className="action-btn ghost"
                  onClick={() => setSetupOpen(false)}
                  data-testid="setup-close-btn"
                >
                  Close
                </button>
              </>
            )}

            {mode === "nye" && (
              <>
                <div className="field" style={{ flex: 1, minWidth: 220 }}>
                  <label>
                    Last seconds fullscreen at {nyeThreshold}s
                  </label>
                  <input
                    type="range"
                    className="range"
                    min="10" max="60" step="1"
                    value={nyeThreshold}
                    onChange={(e) => setNyeThreshold(Number(e.target.value))}
                    data-testid="nye-threshold-slider"
                  />
                </div>
                <button
                  className="action-btn ghost"
                  onClick={() => setSetupOpen(false)}
                  data-testid="setup-close-btn"
                >
                  Close
                </button>
              </>
            )}
          </div>
        )}

        {/* LEFT — empty spacer (kept for grid balance) */}
        <div className="dock-left" />

        {/* CENTER — mode tabs */}
        <div className="dock-center">
          <div className="mode-tabs" data-testid="mode-tabs">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-tab ${mode === m.id ? "active" : ""}`}
                onClick={() => { setMode(m.id); setSetupOpen(false); }}
                data-testid={`mode-tab-${m.id}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — transport (mode-specific) + utility icons */}
        <div className="dock-right">
          {showTransport && (
            <div className="transport">
              {mode === "timer" && (
                <>
                  {!timer.running && timer.remainingMs > 0 && (
                    <button
                      className="icon-btn"
                      onClick={timer.resume}
                      title="Resume"
                      data-testid="timer-resume-btn"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  {timer.running && (
                    <button
                      className="icon-btn"
                      onClick={timer.pause}
                      title="Pause"
                      data-testid="timer-pause-btn"
                    >
                      <Pause size={16} />
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={timer.reset}
                    title="Reset"
                    data-testid="timer-reset-btn"
                  >
                    <RotateCcw size={16} />
                  </button>
                </>
              )}

              {mode === "chrono" && (
                <>
                  {!chrono.running ? (
                    <button
                      className="icon-btn"
                      onClick={chrono.start}
                      title="Start"
                      data-testid="chrono-start-btn"
                    >
                      <Play size={16} />
                    </button>
                  ) : (
                    <button
                      className="icon-btn"
                      onClick={chrono.pause}
                      title="Pause"
                      data-testid="chrono-pause-btn"
                    >
                      <Pause size={16} />
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={chrono.reset}
                    title="Reset"
                    data-testid="chrono-reset-btn"
                  >
                    <RotateCcw size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {modeHasSetup && (
            <button
              className={`icon-btn ${setupOpen ? "active" : ""}`}
              onClick={() => setSetupOpen((v) => !v)}
              title="Setup"
              data-testid="setup-toggle-btn"
            >
              <Sliders size={16} />
            </button>
          )}

          <button
            className="icon-btn"
            onClick={toggleFullscreen}
            title="Fullscreen"
            data-testid="fullscreen-btn"
          >
            <Maximize size={16} />
          </button>

          <button
            className="icon-btn"
            onClick={() => setDockVisible(false)}
            title="Hide UI"
            data-testid="hide-controls-btn"
          >
            <EyeOff size={16} />
          </button>

          <button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            data-testid="settings-btn"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>

      {/* SETTINGS SHEET */}
      {settingsOpen && (
        <>
          <div
            className="scrim"
            onClick={() => setSettingsOpen(false)}
            data-testid="settings-scrim"
          />
          <aside className="sheet" data-testid="settings-sheet">
            <div className="sheet-header">
              <div className="sheet-title">Settings</div>
              <button
                className="icon-btn"
                onClick={() => setSettingsOpen(false)}
                data-testid="settings-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Skin section */}
            <div className="section" data-testid="settings-skin-section">
              <div className="section-label">Skin</div>
              <div className="skin-grid">
                {SKINS.map((s) => (
                  <button
                    key={s.id}
                    className={`skin-card ${skin === s.id ? "active" : ""}`}
                    onClick={() => setSkin(s.id)}
                    data-testid={`skin-card-${s.id}`}
                    style={{
                      "--card-bg": s.preview.bg,
                      "--card-fg": s.preview.fg,
                      "--card-font": s.preview.font,
                      "--card-weight": s.preview.weight,
                    }}
                  >
                    <span className="skin-card-name">{s.label}</span>
                    <span
                      className="skin-card-preview"
                      style={{
                        fontSize: s.preview.size || 22,
                        textShadow: s.preview.shadow || "none",
                        position: "relative",
                        ...(s.preview.gradient
                          ? {
                              background: s.preview.gradient,
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                              WebkitTextFillColor: "transparent",
                            }
                          : {}),
                      }}
                    >
                      12:34
                      {s.preview.flap && (
                        <span
                          style={{
                            position: "absolute",
                            left: 8,
                            right: 8,
                            top: "50%",
                            height: 2,
                            background: "rgba(0,0,0,.55)",
                          }}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio */}
            <div className="section">
              <div className="section-label">Audio</div>
              <button
                className="toggle-row"
                onClick={() => setSound((v) => !v)}
                data-testid="settings-sound-toggle"
                style={{ background: "transparent", width: "100%" }}
              >
                <div style={{ textAlign: "left" }}>
                  <div className="toggle-label">
                    {sound ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Volume2 size={14} /> Sound effects
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <VolumeX size={14} /> Sound effects
                      </span>
                    )}
                  </div>
                  <div className="toggle-sub">
                    Beep when timer & countdowns hit zero
                  </div>
                </div>
                <div className={`toggle-switch ${sound ? "on" : ""}`} />
              </button>
            </div>

            {/* NYE quick setting (mirrors setup drawer) */}
            <div className="section">
              <div className="section-label">NYE last seconds</div>
              <div className="toggle-sub" style={{ marginBottom: 6 }}>
                Show big single-digit overlay when {nyeThreshold}s or less remain.
              </div>
              <input
                type="range"
                className="range"
                min="10" max="60" step="1"
                value={nyeThreshold}
                onChange={(e) => setNyeThreshold(Number(e.target.value))}
                data-testid="settings-nye-threshold"
              />
            </div>

            <div style={{ flex: 1 }} />
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-dim)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textAlign: "center",
                opacity: 0.6,
              }}
            >
              Moshly Time · v0.2
            </div>
          </aside>
        </>
      )}

      {/* FAB to bring back UI when hidden */}
      {!dockVisible && (
        <button
          className="show-ui-fab"
          onClick={() => setDockVisible(true)}
          data-testid="show-controls-btn"
          aria-label="Show controls"
        >
          <SettingsIcon size={16} />
        </button>
      )}
    </div>
  );
}
