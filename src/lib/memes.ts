// Curated reactions shown after a player decision.
// TONES:
// FREE: Polite + Neutral
// PRO: Snarky + Brutal
// Each pool rotates without repeats per session.

export type Reaction = { title: string; line: string; emoji: string };
export type ToneType = "polite" | "neutral" | "snarky" | "brutal";

// ===== POLITE (Free) =====
export const POLITE_BAD: Reaction[] = [
  { title: "Tough call", line: "That one cost a bit. Worth learning from.", emoji: "🤔" },
  { title: "Not ideal", line: "There was probably a better path here.", emoji: "📊" },
  { title: "Stumble", line: "It happens — adjust and keep moving.", emoji: "🌱" },
  { title: "Lesson learned", line: "Founders refine through choices like this.", emoji: "📘" },
  { title: "A small setback", line: "Don't let it shake your strategy.", emoji: "🧭" },
  { title: "Oops", line: "Next one could be the winner.", emoji: "🎯" },
];

export const POLITE_GOOD: Reaction[] = [
  { title: "Nicely done", line: "Thoughtful and well-judged.", emoji: "✨" },
  { title: "Solid move", line: "That kept your fundamentals strong.", emoji: "✅" },
  { title: "Great instincts", line: "You read the room well.", emoji: "💡" },
  { title: "Steady founder energy", line: "Calm calls compound over time.", emoji: "🌿" },
  { title: "Good judgment", line: "Your team would be proud.", emoji: "🤝" },
  { title: "On point", line: "That's how winners think.", emoji: "🏆" },
];

// ===== NEUTRAL (Free) =====
export const NEUTRAL_BAD: Reaction[] = [
  { title: "Hmm", line: "That wasn't the strongest choice.", emoji: "🤨" },
  { title: "Interesting", line: "Let's see how it plays out.", emoji: "🔍" },
  { title: "Bold move", line: "Risk has its consequences.", emoji: "⚠️" },
  { title: "Not ideal", line: "The numbers speak for themselves.", emoji: "📉" },
  { title: "Noted", line: "Moving forward with what we have.", emoji: "➡️" },
  { title: "Next time", line: "There's always another chance.", emoji: "🔄" },
];

export const NEUTRAL_GOOD: Reaction[] = [
  { title: "Nice", line: "That was a solid decision.", emoji: "👍" },
  { title: "Good", line: "You're making progress.", emoji: "✓" },
  { title: "Smart", line: "The market approves.", emoji: "📈" },
  { title: "Solid", line: "That's the way forward.", emoji: "🎯" },
  { title: "Effective", line: "Your metrics are improving.", emoji: "💹" },
  { title: "Calculated", line: "You knew what you were doing.", emoji: "🧮" },
];

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
  { title: "Plot twist", line: "This is giving unplanned pivot energy.", emoji: "🌪️" },
  { title: "Oops, all losses", line: "Your P&L sheet just started crying.", emoji: "📋" },
  { title: "The auditor is concerned", line: "Really concerned.", emoji: "🚨" },
];

export const HYPE_LINES: Reaction[] = [
  { title: "Founder mode unlocked!", line: "That was elite.", emoji: "🏆" },
  { title: "Big W", line: "Even Naval would tweet about you.", emoji: "🚀" },
  { title: "Cap table approves", line: "+respect from the board.", emoji: "💎" },
  { title: "MRR loves you", line: "That move printed money.", emoji: "💸" },
  { title: "Investor DM incoming", line: "Three angels just slid in.", emoji: "🪽" },
  { title: "Chef's kiss", line: "That decision will age like fine wine.", emoji: "🍷" },
  { title: "Growth hacker confirmed", line: "Your instincts are *chef's kiss*.", emoji: "👨‍🍳" },
  { title: "This is the way", line: "The path to profitability just lit up.", emoji: "💡" },
  { title: "Your future self thanks you", line: "This sets up the next 3 quarters.", emoji: "⏰" },
];

// ===== BRUTAL (Pro only) =====
export const BRUTAL_BAD: Reaction[] = [
  { title: "Catastrophic", line: "Your investors are updating their resumes.", emoji: "💀" },
  { title: "That was dumb", line: "Like, objectively bad.", emoji: "😤" },
  { title: "Press F", line: "Your burn rate just entered the chat.", emoji: "🔥" },
  { title: "CEO moment", line: "And not the good kind.", emoji: "❌" },
  { title: "Discord is roasting you", line: "47 messages, all disappointed.", emoji: "📱" },
  { title: "Unserious", line: "A real founder would never.", emoji: "🚫" },
  { title: "That's it", line: "Your Series A just got cancelled.", emoji: "💔" },
];

export const BRUTAL_GOOD: Reaction[] = [
  { title: "NOW WE'RE TALKING", line: "That's a real founder move right there.", emoji: "💪" },
  { title: "GENIUS", line: "Literally no one else would've thought of this.", emoji: "🧠" },
  { title: "RESPECT", line: "Your cap table is taking notes.", emoji: "📝" },
  { title: "ELITE", line: "You just separated yourself from the rest.", emoji: "👑" },
  { title: "UNSTOPPABLE", line: "The competition didn't see this coming.", emoji: "🚀" },
  { title: "LEGENDARY", line: "This move getting told in pitch meetings.", emoji: "🎤" },
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
const neutralBadRot = makeRotator(NEUTRAL_BAD);
const neutralGoodRot = makeRotator(NEUTRAL_GOOD);
const brutalBadRot = makeRotator(BRUTAL_BAD);
const brutalGoodRot = makeRotator(BRUTAL_GOOD);

// Tone-aware picker with 4 tones: 2 free (polite, neutral) + 2 pro (snarky, brutal)
export function nextReaction(good: boolean, tone: ToneType): Reaction {
  switch (tone) {
    case "polite":
      return good ? politeGoodRot() : politeBadRot();
    case "neutral":
      return good ? neutralGoodRot() : neutralBadRot();
    case "snarky":
      return good ? hypeRot() : memeRot();
    case "brutal":
      return good ? brutalGoodRot() : brutalBadRot();
    default:
      return good ? politeGoodRot() : politeBadRot();
  }
}
