// Web Audio API tiny synth — no asset loading, instant feedback
let ctx: AudioContext | null = null;
const KEY = "fg_sound_muted";

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function isMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function setMuted(m: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, m ? "1" : "0");
}

export function getMuted() { return isMuted(); }

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.15, when = 0) {
  if (isMuted()) return;
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0.06, "triangle", 0.08),
  good: () => { tone(660, 0.1, "triangle", 0.12); tone(990, 0.18, "triangle", 0.1, 0.08); },
  bad: () => { tone(220, 0.2, "sawtooth", 0.12); tone(160, 0.25, "sawtooth", 0.1, 0.08); },
  coin: () => { tone(880, 0.07, "square", 0.1); tone(1320, 0.1, "square", 0.08, 0.06); },
  levelUp: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.12, i * 0.08));
  },
  crisis: () => {
    [440, 330, 440, 330, 440].forEach((f, i) => tone(f, 0.18, "square", 0.18, i * 0.18));
  },
  victory: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, "triangle", 0.14, i * 0.1));
  },
};

export function vibrate(ms: number = 50) {
  if (isMuted()) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}
