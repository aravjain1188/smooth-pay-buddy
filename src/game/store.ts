import { useEffect, useState } from "react";
import type { Mode, Specialization, Scenario, WorldEvent } from "./scenarios";
import { SCENARIOS, WORLD_EVENTS } from "./scenarios";

export type ChoiceLog = { scenario: string; choice: string; cashAfter: number };
export type ToneType = "polite" | "neutral" | "snarky" | "brutal";

export type Run = {
  mode: Mode;
  specialization: Specialization;
  selectedTone?: ToneType;
  endDateMonths: number;
  cash: number;
  users: number;
  month: number;
  score: number;
  history: ChoiceLog[];
  lastScenarioId?: string;
  bankrupt: boolean;
  ended: boolean;
  worldEvent?: WorldEvent | null;
  inventory: Record<string, number>;
  shieldActive: boolean;
  scenarioStartTime?: number;
  feedbackToneUnlocked: boolean;
};

const KEY = "fg_run_v1";

function load(): Run | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function save(r: Run | null) {
  if (typeof window === "undefined") return;
  if (!r) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(r));
}

export function newRun(mode: Mode, specialization: Specialization, endDateMonths: number, selectedTone?: ToneType): Run {
  return {
    mode, specialization, selectedTone, endDateMonths,
    cash: 1000, users: 50, month: 1, score: 0,
    history: [], bankrupt: false, ended: false,
    inventory: {}, shieldActive: false,
    feedbackToneUnlocked: false,
  };
}

export function pickScenario(run: Run): Scenario {
  const pool = SCENARIOS.filter((s) => {
    if (s.id === run.lastScenarioId) return false;
    if (run.specialization === "generic") return true;
    return s.category === run.specialization || s.category === "generic";
  });
  // Per-specialization weighting: favor own category when not generic
  const weighted = run.specialization === "generic" ? pool :
    pool.flatMap((s) => s.category === run.specialization ? [s, s, s] : [s]);
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function maybeWorldEvent(run: Run): WorldEvent | null {
  if (run.month % 3 !== 0) return null;
  const ev = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)];
  if (run.shieldActive && ((ev.cashMul ?? 1) < 1 || (ev.usersMul ?? 1) < 1)) {
    return null; // shield blocks negatives
  }
  return ev;
}

export function useRun() {
  const [run, setRun] = useState<Run | null>(() => load());
  const update = (next: Run | null) => { setRun(next); save(next); };
  return [run, update] as const;
}

export function applyChoice(run: Run, scenario: Scenario, choiceIdx: number, mul = { cashMul: 1, usersMul: 1 }) {
  const c = scenario.choices[choiceIdx];
  const cashChange = Math.round(c.cashDelta * (c.cashDelta > 0 ? mul.cashMul : 1));
  const usersChange = Math.round(c.usersDelta * (c.usersDelta > 0 ? mul.usersMul : 1));
  const newCash = Math.max(0, run.cash + cashChange);
  const newUsers = Math.max(0, run.users + usersChange);
  const score = run.score + Math.max(0, cashChange) + Math.max(0, usersChange) * 5 + (c.good ? 50 : 0);
  return { ...run, cash: newCash, users: newUsers, score, lastScenarioId: scenario.id, shieldActive: false };
}
