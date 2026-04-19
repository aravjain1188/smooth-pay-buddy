export type Mode = "easy" | "medium" | "hard";
export type Specialization = "generic" | "marketing" | "saas" | "ecommerce";

export type Choice = {
  label: string;
  hint: string; // shown when "remove wrong / suggest best" used
  cashDelta: number;
  usersDelta: number;
  risk?: "safe" | "bold";
  good?: boolean; // is this the "best" choice
  feedback: string;
};

export type Scenario = {
  id: string;
  category: "marketing" | "saas" | "ecommerce" | "generic";
  emoji: string;
  realWorld: string; // "Real-world: ~3 weeks of decisions"
  prompt: string;
  choices: Choice[];
};

const POOL: Scenario[] = [
  // ===== GENERIC =====
  { id: "g1", category: "generic", emoji: "💼", realWorld: "Real-world: 2 weeks", prompt: "Your cofounder wants to add a fancy office. Cash is tight.",
    choices: [
      { label: "Stay remote, save cash", hint: "Saves runway", cashDelta: 200, usersDelta: 0, risk: "safe", good: true, feedback: "Smart. Runway extended." },
      { label: "Lease the office", hint: "Burns cash, hurts runway", cashDelta: -800, usersDelta: 5, risk: "bold", feedback: "Vibes up, bank down." },
      { label: "Coworking space", hint: "Middle ground", cashDelta: -200, usersDelta: 2, feedback: "Balanced move." },
    ] },
  { id: "g2", category: "generic", emoji: "🤝", realWorld: "Real-world: 1 month", prompt: "An angel offers ₹5L for 25%. Aggressive dilution.",
    choices: [
      { label: "Accept the cheque", hint: "Gives runway, costs equity", cashDelta: 500, usersDelta: 0, risk: "bold", feedback: "Cash in, equity gone." },
      { label: "Counter at 12%", hint: "Bold negotiation", cashDelta: 500, usersDelta: 0, risk: "bold", good: true, feedback: "They blinked. Nice." },
      { label: "Walk away", hint: "Preserve equity", cashDelta: 0, usersDelta: -2, risk: "safe", feedback: "You kept the cap table clean." },
    ] },
  { id: "g3", category: "generic", emoji: "📰", realWorld: "Real-world: 3 days", prompt: "TechCrunch DM'd you. They want a feature in 48h.",
    choices: [
      { label: "Drop everything, do it", hint: "Big PR upside", cashDelta: 100, usersDelta: 80, risk: "bold", good: true, feedback: "Press boost incoming." },
      { label: "Schedule for later", hint: "Lose momentum", cashDelta: 0, usersDelta: 5, feedback: "They moved on." },
      { label: "Ignore", hint: "Bad call", cashDelta: 0, usersDelta: 0, feedback: "Wait, what?" },
    ] },
  { id: "g4", category: "generic", emoji: "👨‍💻", realWorld: "Real-world: 2 weeks", prompt: "Top engineer asks for a 40% raise.",
    choices: [
      { label: "Match it", hint: "Retains key talent", cashDelta: -400, usersDelta: 10, risk: "safe", good: true, feedback: "Talent stays. Velocity safe." },
      { label: "Counter with equity", hint: "Saves cash", cashDelta: -100, usersDelta: 5, risk: "bold", feedback: "Risky but smart." },
      { label: "Let them go", hint: "Loses talent", cashDelta: 0, usersDelta: -25, feedback: "Roadmap slows. Ouch." },
    ] },
  { id: "g5", category: "generic", emoji: "⚖️", realWorld: "Real-world: 6 weeks", prompt: "A competitor sends a cease & desist over your name.",
    choices: [
      { label: "Rebrand fast", hint: "Avoids fight", cashDelta: -300, usersDelta: -10, risk: "safe", good: true, feedback: "Painful but clean." },
      { label: "Lawyer up", hint: "Expensive", cashDelta: -700, usersDelta: 0, risk: "bold", feedback: "Months of distraction." },
      { label: "Ignore it", hint: "Reckless", cashDelta: 0, usersDelta: 0, feedback: "They will not forget." },
    ] },

  // ===== MARKETING =====
  { id: "m1", category: "marketing", emoji: "📣", realWorld: "Real-world: 2 weeks", prompt: "An influencer wants ₹2L for one Reel. CTR unknown.",
    choices: [
      { label: "Do a small test post first", hint: "Validates", cashDelta: -50, usersDelta: 30, risk: "safe", good: true, feedback: "Data first. CAC sane." },
      { label: "All-in on the big Reel", hint: "Risky", cashDelta: -800, usersDelta: 120, risk: "bold", feedback: "Spike then silence." },
      { label: "Skip and run ads", hint: "Boring but stable", cashDelta: -200, usersDelta: 25, feedback: "Slow & steady." },
    ] },
  { id: "m2", category: "marketing", emoji: "🎯", realWorld: "Real-world: 3 days", prompt: "Your meta ads CAC just doubled overnight.",
    choices: [
      { label: "Pause + audit creatives", hint: "Smart hygiene", cashDelta: -50, usersDelta: -5, risk: "safe", good: true, feedback: "You found the bad ad set." },
      { label: "Scale spend to push through", hint: "Burn", cashDelta: -500, usersDelta: 20, risk: "bold", feedback: "You set money on fire." },
      { label: "Switch to organic only", hint: "Slow growth", cashDelta: 100, usersDelta: -10, feedback: "Bills down, growth too." },
    ] },
  { id: "m3", category: "marketing", emoji: "🪄", realWorld: "Real-world: 4 weeks", prompt: "A PR firm pitches a ₹6L launch package.",
    choices: [
      { label: "DIY launch on Twitter/LinkedIn", hint: "Founder-led wins", cashDelta: -50, usersDelta: 45, risk: "safe", good: true, feedback: "Authenticity won." },
      { label: "Hire the firm", hint: "Pricey", cashDelta: -600, usersDelta: 80, risk: "bold", feedback: "Coverage came, conversion didn't." },
      { label: "Skip launch entirely", hint: "Lazy", cashDelta: 0, usersDelta: -5, feedback: "Crickets." },
    ] },
  { id: "m4", category: "marketing", emoji: "💌", realWorld: "Real-world: 1 week", prompt: "Email list is rotting. Open rate down to 6%.",
    choices: [
      { label: "Re-engagement series", hint: "Cleans list", cashDelta: -50, usersDelta: 15, risk: "safe", good: true, feedback: "List healthy again." },
      { label: "Buy a fresh leads list", hint: "Spammy", cashDelta: -300, usersDelta: -20, risk: "bold", feedback: "Spam complaints flooded in." },
    ] },
  { id: "m5", category: "marketing", emoji: "🎤", realWorld: "Real-world: 6 weeks", prompt: "A podcast wants you for 90 minutes. No fee.",
    choices: [
      { label: "Yes, prep hard", hint: "Brand boost", cashDelta: 0, usersDelta: 35, risk: "safe", good: true, feedback: "Long-tail leads inbound." },
      { label: "Decline, busy", hint: "Missed reach", cashDelta: 0, usersDelta: 0, feedback: "Forgettable week." },
    ] },

  // ===== SAAS =====
  { id: "s1", category: "saas", emoji: "🛠️", realWorld: "Real-world: 6 weeks", prompt: "A whale customer demands a custom feature.",
    choices: [
      { label: "Build it as opt-in, charge extra", hint: "Win-win", cashDelta: 500, usersDelta: 10, risk: "safe", good: true, feedback: "Revenue + roadmap intact." },
      { label: "Build it for free", hint: "Charity SaaS", cashDelta: 0, usersDelta: 5, feedback: "You set a precedent. Yikes." },
      { label: "Refuse", hint: "Lose the whale", cashDelta: -300, usersDelta: -10, feedback: "They churned." },
    ] },
  { id: "s2", category: "saas", emoji: "🐛", realWorld: "Real-world: 5 days", prompt: "Production is down. Stripe webhooks failing.",
    choices: [
      { label: "All hands incident, no excuses", hint: "Right call", cashDelta: -100, usersDelta: -10, risk: "safe", good: true, feedback: "Restored in 4h. Trust intact." },
      { label: "Wait for the next sprint", hint: "Disaster", cashDelta: -400, usersDelta: -60, feedback: "Customers are tweeting. Loud." },
      { label: "Blame the customer", hint: "Career suicide", cashDelta: 0, usersDelta: -80, feedback: "Front page of HN. Not ideal." },
    ] },
  { id: "s3", category: "saas", emoji: "💸", realWorld: "Real-world: 2 weeks", prompt: "Pricing test: should you raise prices 30%?",
    choices: [
      { label: "Grandfather existing, raise for new", hint: "Best of both", cashDelta: 600, usersDelta: -5, risk: "safe", good: true, feedback: "Revenue up, churn flat." },
      { label: "Raise across the board", hint: "Risky", cashDelta: 800, usersDelta: -40, risk: "bold", feedback: "Mass churn. Pain." },
      { label: "Don't raise", hint: "Underprice", cashDelta: 0, usersDelta: 5, feedback: "Left money on the table." },
    ] },
  { id: "s4", category: "saas", emoji: "🔁", realWorld: "Real-world: 4 weeks", prompt: "Annual churn is 32%. Investors will not like that.",
    choices: [
      { label: "Hire a CSM, ship onboarding flows", hint: "Fundamentals", cashDelta: -300, usersDelta: 30, risk: "safe", good: true, feedback: "Churn dropping in cohort 2." },
      { label: "Add a discount to renew", hint: "Bandaid", cashDelta: -200, usersDelta: 5, feedback: "Discount addiction." },
    ] },
  { id: "s5", category: "saas", emoji: "🤖", realWorld: "Real-world: 3 weeks", prompt: "Should you ship an AI feature on top of your SaaS?",
    choices: [
      { label: "Ship a focused AI workflow", hint: "Differentiator", cashDelta: -200, usersDelta: 70, risk: "bold", good: true, feedback: "Trial signups doubled." },
      { label: "Bolt on a chatbot", hint: "Generic", cashDelta: -100, usersDelta: 5, feedback: "Nobody used it." },
      { label: "Skip AI", hint: "Sleep on it", cashDelta: 0, usersDelta: -10, feedback: "Competitors raced past." },
    ] },

  // ===== E-COMMERCE =====
  { id: "e1", category: "ecommerce", emoji: "📦", realWorld: "Real-world: 3 weeks", prompt: "Inventory ran out 2 weeks before festive sale.",
    choices: [
      { label: "Air-freight emergency restock", hint: "Catches the wave", cashDelta: -400, usersDelta: 60, risk: "bold", good: true, feedback: "You caught the festive surge." },
      { label: "Wait for sea freight", hint: "Miss the wave", cashDelta: 0, usersDelta: -30, feedback: "You missed it. Bummer." },
      { label: "Pre-orders only", hint: "Friction", cashDelta: -50, usersDelta: -10, feedback: "Cart abandonment spiked." },
    ] },
  { id: "e2", category: "ecommerce", emoji: "🛒", realWorld: "Real-world: 1 week", prompt: "Cart abandonment is 78%. Shipping is the suspect.",
    choices: [
      { label: "Free shipping above ₹999", hint: "Classic AOV lift", cashDelta: 300, usersDelta: 25, risk: "safe", good: true, feedback: "AOV jumped, abandonment dropped." },
      { label: "Free shipping always", hint: "Margin killer", cashDelta: -300, usersDelta: 40, feedback: "Margin tanked." },
      { label: "Do nothing", hint: "Risky", cashDelta: 0, usersDelta: -5, feedback: "Same problem next month." },
    ] },
  { id: "e3", category: "ecommerce", emoji: "🌟", realWorld: "Real-world: 2 weeks", prompt: "A celeb DM asks for free product + tag.",
    choices: [
      { label: "Send it with a thank-you note", hint: "Smart PR", cashDelta: -50, usersDelta: 80, risk: "bold", good: true, feedback: "They posted. UGC explosion." },
      { label: "Ask them to pay", hint: "Tone-deaf", cashDelta: 0, usersDelta: -10, feedback: "Awkward." },
    ] },
  { id: "e4", category: "ecommerce", emoji: "📷", realWorld: "Real-world: 1 month", prompt: "Your product photos are mid. Conversion at 0.8%.",
    choices: [
      { label: "Hire a photographer for a day", hint: "Big lift", cashDelta: -200, usersDelta: 50, risk: "safe", good: true, feedback: "Conversion up to 1.6%." },
      { label: "Use AI to enhance", hint: "Lazy fix", cashDelta: -50, usersDelta: 10, feedback: "Marginal lift." },
    ] },
  { id: "e5", category: "ecommerce", emoji: "🚚", realWorld: "Real-world: 2 weeks", prompt: "Logistics partner raised rates 18%.",
    choices: [
      { label: "Negotiate with 2 backup vendors", hint: "Leverage", cashDelta: -50, usersDelta: 0, risk: "safe", good: true, feedback: "They walked it back to 7%." },
      { label: "Eat the cost", hint: "Margin pain", cashDelta: -300, usersDelta: 0, feedback: "Margin sliced." },
      { label: "Pass to customer", hint: "Lose buyers", cashDelta: 100, usersDelta: -25, feedback: "Customers angry." },
    ] },

  // ===== EXTRA POOL =====
  { id: "g6", category: "generic", emoji: "🧠", realWorld: "Real-world: 3 weeks", prompt: "You're burning out. Cofounder suggests a 1-week pause.",
    choices: [
      { label: "Take the week", hint: "Sanity wins", cashDelta: 0, usersDelta: 0, risk: "safe", good: true, feedback: "You came back sharper." },
      { label: "Push through", hint: "Burnout incoming", cashDelta: -100, usersDelta: -15, feedback: "Bad week of decisions." },
    ] },
  { id: "g7", category: "generic", emoji: "🧾", realWorld: "Real-world: 2 weeks", prompt: "GST notice for last quarter. ₹3L due.",
    choices: [
      { label: "Pay and hire a CA", hint: "Sleep at night", cashDelta: -350, usersDelta: 0, risk: "safe", good: true, feedback: "Compliance handled." },
      { label: "Argue it on your own", hint: "Risky", cashDelta: -100, usersDelta: 0, feedback: "Penalty added later." },
    ] },
  { id: "m6", category: "marketing", emoji: "📺", realWorld: "Real-world: 2 weeks", prompt: "A YouTube creator wants ₹3L for a sponsored review.",
    choices: [
      { label: "Negotiate to ₹1.5L + revshare", hint: "Aligned incentives", cashDelta: -200, usersDelta: 70, risk: "safe", good: true, feedback: "Conversion was real." },
      { label: "Pay full price", hint: "Overpay", cashDelta: -400, usersDelta: 80, feedback: "ROI under 1." },
    ] },
  { id: "s6", category: "saas", emoji: "🔐", realWorld: "Real-world: 8 weeks", prompt: "Enterprise lead wants SOC 2. Will take ~₹6L and 2 months.",
    choices: [
      { label: "Start the audit, stage roll-out", hint: "Unlocks enterprise", cashDelta: -500, usersDelta: 50, risk: "bold", good: true, feedback: "You unlocked enterprise pipeline." },
      { label: "Skip, lose the deal", hint: "Plays small", cashDelta: -200, usersDelta: -10, feedback: "Pipeline shrinks." },
    ] },
  { id: "e6", category: "ecommerce", emoji: "💳", realWorld: "Real-world: 1 week", prompt: "A flood of fraudulent COD orders hit you.",
    choices: [
      { label: "Switch high-risk pincodes to prepaid", hint: "Stops bleed", cashDelta: -50, usersDelta: -5, risk: "safe", good: true, feedback: "Returns dropped 60%." },
      { label: "Ignore + hope", hint: "Disaster", cashDelta: -500, usersDelta: 0, feedback: "Lost a fortune in returns." },
    ] },
];

export const SCENARIOS = POOL;

export type WorldEvent = {
  id: string;
  title: string;
  emoji: string;
  cashMul?: number;
  usersMul?: number;
  message: string;
};

export const WORLD_EVENTS: WorldEvent[] = [
  { id: "boom", title: "Bull Market!", emoji: "📈", cashMul: 1.15, message: "Market is hot. Cash gains amplified." },
  { id: "infl", title: "Inflation Spike", emoji: "🔥", cashMul: 0.85, message: "Costs are up. Cash gains reduced." },
  { id: "viral", title: "Viral Moment", emoji: "🌈", usersMul: 1.4, message: "A meme tweet went viral. Users surged." },
  { id: "crash", title: "Funding Winter", emoji: "❄️", cashMul: 0.8, message: "Investors are spooked. Cash deals worse." },
  { id: "festive", title: "Festive Season", emoji: "🎉", usersMul: 1.25, cashMul: 1.1, message: "Festive demand surge!" },
  { id: "scandal", title: "Industry Scandal", emoji: "⚠️", usersMul: 0.85, message: "Trust dip across industry." },
];

export const SHOP_ITEMS = [
  { id: "hint", name: "Hint Boost", desc: "Reveals a tactical hint on each choice for the next scenario.", price: 60, max: 5 },
  { id: "cash", name: "Cash Injection", desc: "+₹500 instant cash boost.", price: 80, max: 5 },
  { id: "remove", name: "50/50 Remove", desc: "Removes one wrong answer for the next scenario.", price: 50, max: 5 },
  { id: "best", name: "Suggest Best", desc: "Highlights the recommended choice for the next scenario.", price: 100, max: 3 },
  { id: "shield", name: "Crisis Shield", desc: "Blocks the next negative world event.", price: 120, max: 2 },
  { id: "tone_unlock", name: "Unlock Snarky Reactions", desc: "Unlock snarky feedback tones for this run. (Pro users get this by default.)", price: 150, max: 1 },
];
