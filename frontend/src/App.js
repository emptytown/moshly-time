import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
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

const SKINS = [
  { id: "moshly", label: "Moshly" },
  { id: "coder", label: "Coder" },
  { id: "8bit", label: "8Bit" },
  { id: "solari", label: "Solari" },
];

const LS = {
  skin: "bigclock.skin",
  mode: "bigclock.mode",
  timerSec: "bigclock.timer.sec",
  countdownTarget: "bigclock.countdown.target",
  nyeThreshold: "bigclock.nye.threshold",
  sound: "bigclock.sound",
};

function load(k, fallback) {
  try {
    const v = localStorage.getItem(k);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export default function App() {
  const [skin, setSkin] = useState(() => load(LS.skin, "moshly"));
  const [mode, setMode] = useState(() => load(LS.mode, "now"));
  const [sound, setSound] = useState(() => load(LS.sound, true));
  const [controlsVisible, setControlsVisible] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);

  // Timer state
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

  /* ---- persist ---- */
  useEffect(() => save(LS.skin, skin), [skin]);
  useEffect(() => save(LS.mode, mode), [mode]);
  useEffect(() => save(LS.sound, sound), [sound]);
  useEffect(() => save(LS.countdownTarget, countdownTarget), [countdownTarget]);
  useEffect(() => save(LS.nyeThreshold, nyeThreshold), [nyeThreshold]);

  /* ---- auto-hide controls in landscape after inactivity ---- */
  const hideTimer = useRef(null);
  useEffect(() => {
    const isLandscape = () =>
      window.matchMedia("(orientation: landscape)").matches &&
      window.innerHeight < 600;

    const armHide = () => {
      clearTimeout(hideTimer.current);
      if (isLandscape()) {
        hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
      }
    };
    const showAndArm = () => {
      setControlsVisible(true);
      armHide();
    };

    armHide();
    window.addEventListener("pointerdown", showAndArm);
    window.addEventListener("keydown", showAndArm);
    window.addEventListener("orientationchange", showAndArm);
    window.addEventListener("resize", armHide);

    return () => {
      clearTimeout(hideTimer.current);
      window.removeEventListener("pointerdown", showAndArm);
      window.removeEventListener("keydown", showAndArm);
      window.removeEventListener("orientationchange", showAndArm);
      window.removeEventListener("resize", armHide);
    };
  }, []);

  /* ---- timer finished beep ---- */
  const timerWasRunning = useRef(timer.running);
  useEffect(() => {
    if (timerWasRunning.current && !timer.running && timer.remainingMs <= 0) {
      if (sound) playBeep(880, 600);
    }
    timerWasRunning.current = timer.running;
  }, [timer.running, timer.remainingMs, sound]);

  /* ---- derive display text & label ---- */
  const { displayText, label } = useMemo(() => {
    switch (mode) {
      case "timer":
        return { displayText: timer.text, label: "Timer" };
      case "chrono":
        return { displayText: chrono.text, label: "Chronometer" };
      case "countdown":
        return {
          displayText: countdownActive
            ? countdown.text
            : "00:00:00:00",
          label: countdownActive
            ? `Countdown → ${countdownTarget}`
            : "Countdown — set target",
        };
      case "nye":
        return {
          displayText: nye.text,
          label: `NYE ${new Date().getFullYear() + 1}`,
        };
      case "now":
      default:
        return { displayText: now.text, label: "Now" };
    }
  }, [
    mode,
    timer.text,
    chrono.text,
    countdown.text,
    countdownActive,
    countdownTarget,
    nye.text,
    now.text,
  ]);

  /* ---- handlers ---- */
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

  const handleEnterFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  /* ---- NYE last-seconds fullscreen overlay ---- */
  const showLastSeconds = mode === "nye" && nye.isLastSeconds;

  return (
    <div className="app-root" data-skin={skin} data-testid="app-root">
      <div className="bg-vfx" />

      {/* MAIN STAGE */}
      <div className="stage" data-testid="clock-stage">
        <div className="clock-wrap">
          <div className="clock-label" data-testid="clock-label">
            {label}
          </div>
          <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
            <FitText text={displayText} />
          </div>
        </div>
      </div>

      {/* NYE LAST SECONDS FULLSCREEN OVERLAY */}
      {showLastSeconds && (
        <div
          className="lastsec-overlay"
          data-skin={skin}
          data-testid="nye-last-seconds-overlay"
        >
          <div className="bg-vfx" />
          <div className="clock-label">Last seconds — Happy New Year!</div>
          <div
            style={{
              width: "92vw",
              height: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FitText text={nye.secondsOnly} />
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div
        className={`controls ${controlsVisible ? "" : "hidden"}`}
        data-testid="controls-bar"
      >
        {/* SETUP DRAWER (timer/countdown/nye) */}
        {setupOpen && (
          <div className="setup-drawer" data-testid="setup-drawer">
            {mode === "timer" && (
              <>
                <div className="field">
                  <label>Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={timerInputH}
                    onChange={(e) => setTimerInputH(e.target.value)}
                    data-testid="timer-input-hours"
                  />
                </div>
                <div className="field">
                  <label>Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerInputM}
                    onChange={(e) => setTimerInputM(e.target.value)}
                    data-testid="timer-input-minutes"
                  />
                </div>
                <div className="field">
                  <label>Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
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
                  Start Timer
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
                  <label>Target time (HH:MM)</label>
                  <input
                    type="time"
                    value={countdownTarget}
                    onChange={(e) => setCountdownTarget(e.target.value)}
                    data-testid="countdown-target-input"
                  />
                </div>
                <button
                  className="action-btn"
                  onClick={() => {
                    setCountdownActive(true);
                    setSetupOpen(false);
                  }}
                  data-testid="countdown-start-btn"
                >
                  Start Countdown
                </button>
                <button
                  className="action-btn ghost"
                  onClick={() => {
                    setCountdownActive(false);
                  }}
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
                <div className="field">
                  <label>
                    Show fullscreen at last {nyeThreshold}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={nyeThreshold}
                    onChange={(e) =>
                      setNyeThreshold(Number(e.target.value))
                    }
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

            {(mode === "now" || mode === "chrono") && (
              <>
                <div className="field" style={{ minWidth: 0 }}>
                  <label>No setup needed</label>
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

        {/* MODE TABS */}
        <div className="mode-tabs" data-testid="mode-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode-tab ${mode === m.id ? "active" : ""}`}
              onClick={() => {
                setMode(m.id);
                setSetupOpen(false);
              }}
              data-testid={`mode-tab-${m.id}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* RIGHT-SIDE CONTROLS (mode-specific + skin + utility) */}
        <div className="right-controls" data-testid="right-controls">
          {/* Mode-specific transport */}
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

          {(mode === "timer" ||
            mode === "countdown" ||
            mode === "nye") && (
            <button
              className={`icon-btn ${setupOpen ? "active" : ""}`}
              onClick={() => setSetupOpen((v) => !v)}
              title="Setup"
              data-testid="setup-toggle-btn"
            >
              <SettingsIcon size={16} />
            </button>
          )}

          {/* Skin picker */}
          <div className="skin-row" data-testid="skin-picker">
            {SKINS.map((s) => (
              <button
                key={s.id}
                className={`skin-chip ${skin === s.id ? "active" : ""}`}
                onClick={() => setSkin(s.id)}
                data-testid={`skin-chip-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Sound */}
          <button
            className={`icon-btn ${sound ? "active" : ""}`}
            onClick={() => setSound((v) => !v)}
            title={sound ? "Sound on" : "Sound off"}
            data-testid="sound-toggle-btn"
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Hide controls */}
          <button
            className="icon-btn"
            onClick={() => setControlsVisible(false)}
            title="Hide UI"
            data-testid="hide-controls-btn"
          >
            <EyeOff size={16} />
          </button>

          {/* Fullscreen */}
          <button
            className="icon-btn"
            onClick={handleEnterFullscreen}
            title="Fullscreen"
            data-testid="fullscreen-btn"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Floating show-UI button (when controls hidden) */}
      {!controlsVisible && (
        <button
          onClick={() => setControlsVisible(true)}
          data-testid="show-controls-btn"
          style={{
            position: "fixed",
            bottom: 12,
            right: 12,
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            color: "var(--fg-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(12px)",
            zIndex: 60,
          }}
        >
          <Eye size={16} />
        </button>
      )}
    </div>
  );
}
