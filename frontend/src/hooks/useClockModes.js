import { useEffect, useRef, useState } from "react";

const pad = (n, w = 2) => String(Math.max(0, Math.floor(n))).padStart(w, "0");

/* ---------- NOW (current time) ---------- */
export function useNow() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 200);
    return () => clearInterval(id);
  }, []);
  const h = pad(t.getHours());
  const m = pad(t.getMinutes());
  const s = pad(t.getSeconds());
  return { text: `${h}:${m}:${s}`, date: t };
}

/* ---------- TIMER (countdown from a duration) ---------- */
export function useTimer(initialSec = 0) {
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(initialSec * 1000);
  const [totalSec, setTotalSec] = useState(initialSec);
  const endRef = useRef(null);
  const rafRef = useRef(null);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, endRef.current - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        setRunning(false);
        if (!finishedRef.current) {
          finishedRef.current = true;
          if (onFinishRef.current) onFinishRef.current();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const start = (sec, onFinish) => {
    const s = Number(sec) || 0;
    if (s <= 0) return;
    setTotalSec(s);
    setRemainingMs(s * 1000);
    endRef.current = Date.now() + s * 1000;
    finishedRef.current = false;
    onFinishRef.current = onFinish;
    setRunning(true);
  };
  const pause = () => {
    if (running) {
      setRunning(false);
      // freeze remaining
      setRemainingMs(Math.max(0, endRef.current - Date.now()));
    }
  };
  const resume = () => {
    if (!running && remainingMs > 0) {
      endRef.current = Date.now() + remainingMs;
      setRunning(true);
    }
  };
  const reset = () => {
    setRunning(false);
    setRemainingMs(totalSec * 1000);
    finishedRef.current = false;
  };

  const totalSecs = Math.ceil(remainingMs / 1000);
  const h = pad(totalSecs / 3600);
  const m = pad((totalSecs % 3600) / 60);
  const s = pad(totalSecs % 60);
  return {
    text: `${h}:${m}:${s}`,
    running,
    remainingMs,
    start,
    pause,
    resume,
    reset,
  };
}

/* ---------- CHRONO (stopwatch with ms) ---------- */
export function useChrono() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setElapsedMs(baseRef.current + (Date.now() - startRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const start = () => {
    if (running) return;
    startRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => {
    if (!running) return;
    baseRef.current = baseRef.current + (Date.now() - startRef.current);
    setRunning(false);
  };
  const reset = () => {
    baseRef.current = 0;
    setElapsedMs(0);
    setRunning(false);
  };

  const totalMs = elapsedMs;
  const h = pad(totalMs / 3_600_000);
  const m = pad((totalMs % 3_600_000) / 60_000);
  const s = pad((totalMs % 60_000) / 1000);
  const ms = pad(totalMs % 1000, 3);
  return {
    text: `${h}:${m}:${s}.${ms}`,
    running,
    elapsedMs,
    start,
    pause,
    reset,
  };
}

/* ---------- COUNTDOWN TO TIME ----------
   target = "HH:MM" — counts to next occurrence of that wall-clock time
*/
function nextOccurrenceOf(hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hh || 0, mm || 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}
export function useCountdownToTime(targetHHMM, enabled, onFinish) {
  const [now, setNow] = useState(Date.now());
  const targetRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !targetHHMM) return;
    targetRef.current = nextOccurrenceOf(targetHHMM);
    firedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [targetHHMM, enabled]);

  if (!enabled || !targetHHMM || !targetRef.current) {
    return { text: "00:00:00:00", target: null, remainingMs: 0 };
  }
  let remainingMs = targetRef.current.getTime() - now;
  if (remainingMs <= 0 && !firedRef.current) {
    firedRef.current = true;
    onFinish && onFinish();
    remainingMs = 0;
  }
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const dd = pad(totalSec / 86400);
  const hh = pad((totalSec % 86400) / 3600);
  const mm = pad((totalSec % 3600) / 60);
  const ss = pad(totalSec % 60);
  return {
    text: `${dd}:${hh}:${mm}:${ss}`,
    target: targetRef.current,
    remainingMs,
    secondsOnly: ss,
  };
}

/* ---------- NYE COUNTDOWN ----------
   counts to next Jan 1 00:00:00 of next year (local)
*/
function nextNYE() {
  const now = new Date();
  return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
}
export function useNYE(enabled, lastSecondsThreshold = 60, onFinish) {
  const [now, setNow] = useState(Date.now());
  const targetRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    targetRef.current = nextNYE();
    firedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled || !targetRef.current) {
    return { text: "00:00:00:00", remainingMs: 0, isLastSeconds: false };
  }
  let remainingMs = targetRef.current.getTime() - now;
  if (remainingMs <= 0 && !firedRef.current) {
    firedRef.current = true;
    onFinish && onFinish();
    remainingMs = 0;
  }
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const dd = pad(totalSec / 86400);
  const hh = pad((totalSec % 86400) / 3600);
  const mm = pad((totalSec % 3600) / 60);
  const ss = pad(totalSec % 60);
  const isLastSeconds =
    totalSec > 0 && totalSec <= lastSecondsThreshold;
  return {
    text: `${dd}:${hh}:${mm}:${ss}`,
    secondsOnly: ss,
    secondsRemaining: totalSec,
    remainingMs,
    isLastSeconds,
    target: targetRef.current,
  };
}

/* ---------- simple beep via WebAudio ---------- */
export function playBeep(freq = 880, durMs = 250) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.value = 0.001;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.05);
    setTimeout(() => ctx.close(), durMs + 200);
  } catch (_) {}
}
