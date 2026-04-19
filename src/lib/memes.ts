// Curated reactions shown after a player decision.
// We have TWO tones: snarky (Pro) and polite (free).
// Each pool rotates without repeats per session.

export type Reaction = { title: string; line: string; emoji: string };

// ===== SNARKY (Pro only) =====
export const MEMES: Reaction[] = [
  { title: "Bro... 💀", line: "That choice aged like milk in a sauna.", emoji: "🥲" },
  { title: "Oof, not great", line: "Even your spreadsheet is judging you.", emoji: "📉" },
  { title: "It's giving... bankrupt", line: "Your cap table just gasped.", emoji: "😬" },
  { title: "VC red flag", line: "Sequoia just unfollowed you.", emoji: "🚩" },
  { title: "404 wisdom", line: "Try turning the founder off and on again.", emoji: "🧠" },
  { title: "Rookie founder energy", line: "Your CFO is updating LinkedIn rn.", emoji: "💼" },
  { title: "That's a Shark Tank no", line: "'For these reasons, I'm out.' — All five sharks.", emoji: "🦈" },
  { title: "Big yikes", line: "Your runway just took the stairs down.", emoji: "🪜" },
  { title: "Ouch, that one stung", line: "Your burn rate said: 'hold my latte.'", emoji: "☕" },
  { title: "Founders Discord meltdown", line: "There are now 47 unread messages about you.", emoji: "🔥" },
  { title: "Your seed round just yawned", line: "Even the angels lost interest.", emoji: "😇" },
  { title: "MBA pls", line: "An MBA student just wrote a case study on this.", emoji: "🎓" },
  { title: "Your mom is disappointed", line: "She told her friends you were 'doing AI'.", emoji: "📞" },
  { title: "Founder mode? More like... folder mode", line: "Filing for chapter 11 vibes.", emoji: "📁" },
  { title: "Your cofounder is silently typing", line: "...and stopped 3 times.", emoji: "🫥" },
];

export const HYPE_LINES: Reaction[] = [
  { title: "Founder mode unlocked!", line: "That was elite.", emoji: "🏆" },
  { title: "Big W", line: "Even Naval would tweet about you.", emoji: "🚀" },
  { title: "Cap table approves", line: "+respect from the board.", emoji: "💎" },
  { title: "MRR loves you", line: "That move printed money.", emoji: "💸" },
  { title: "Investor DM incoming", line: "Three angels just slid in.", emoji: "🪽" },
];

// ===== POLITE (free) =====
export const POLITE_BAD: Reaction[] = [
  { title: "Tough call", line: "That one cost a bit. Worth learning from.", emoji: "🤔" },
  { title: "Not ideal", line: "There was probably a better path here.", emoji: "📊" },
  { title: "Stumble", line: "It happens — adjust and keep moving.", emoji: "🌱" },
  { title: "Lesson learned", line: "Founders refine through choices like this.", emoji: "📘" },
  { title: "A small setback", line: "Don't let it shake your strategy.", emoji: "🧭" },
];

export const POLITE_GOOD: Reaction[] = [
  { title: "Nicely done", line: "Thoughtful and well-judged.", emoji: "✨" },
  { title: "Solid move", line: "That kept your fundamentals strong.", emoji: "✅" },
  { title: "Great instincts", line: "You read the room well.", emoji: "🎯" },
  { title: "Steady founder energy", line: "Calm calls compound over time.", emoji: "🌿" },
  { title: "Good judgment", line: "Your team would be proud.", emoji: "🤝" },
];

// ===== Rotation helpers =====
function makeRotator(pool: Reaction[]) {
  let q: Reaction[] = [];
  return () => {
    if (q.length === 0) q = [...pool].sort(() => Math.random() - 0.5);
    return q.shift()!;
  };
}

const memeRot = makeRotator(MEMES);
const hypeRot = makeRotator(HYPE_LINES);
const politeBadRot = makeRotator(POLITE_BAD);
const politeGoodRot = makeRotator(POLITE_GOOD);

export function nextMeme(): Reaction { return memeRot(); }
export function nextHype(): Reaction { return hypeRot(); }
export function nextPoliteBad(): Reaction { return politeBadRot(); }
export function nextPoliteGood(): Reaction { return politeGoodRot(); }

// Tone-aware picker
export function nextReaction(good: boolean, tone: "snarky" | "polite"): Reaction {
  if (tone === "snarky") return good ? hypeRot() : memeRot();
  return good ? politeGoodRot() : politeBadRot();
}
