import { C } from "./styles.js";

export const SCALE = [
  { v: 1, label: "Needs care", color: "#6b5b8a" },
  { v: 2, label: "Becoming aware", color: "#8a6fa0" },
  { v: 3, label: "Growing", color: "#b08bb0" },
  { v: 4, label: "Steady", color: "#d0a15e" },
  { v: 5, label: "Flourishing", color: C.gold },
];

export const SECTIONS = [
  {
    key: "internal", eyebrow: "Internal", title: "What is happening within me",
    metrics: ["Spiritual connection", "Identity security", "Thought life",
      "Emotional health", "Inner peace", "Stress recovery", "Physical well-being"],
  },
  {
    key: "functional", eyebrow: "Functional", title: "How I am managing my life",
    metrics: ["Daily responsibilities", "Communication", "Healthy boundaries",
      "Emotional regulation", "Time stewardship", "Self-care", "Progress toward goals"],
  },
  {
    key: "impact", eyebrow: "Impact", title: "What is changing because I am growing",
    metrics: ["Spiritual growth", "Healthier relationships", "Harmful patterns interrupted",
      "Resilience", "Purpose and productivity", "Positive influence on others",
      "Sustained transformation"],
  },
];

export const REFLECT = [
  ["strongest", "My strongest area this week", 1],
  ["attention", "The area asking for the most care", 1],
  ["pattern", "A trigger or pattern I noticed", 1],
  ["truth", "The truth I need to believe and practice", 2],
  ["evidence", "Evidence that I am growing", 2],
  ["action", "My primary action for next week", 1],
  ["support", "Support I need", 1],
  ["scripture", "Scripture for the week", 1],
  ["prayer", "Prayer", 2],
];

export const IDENTITY = [
  "You are fully known, and fully loved.",
  "You are not what happened to you.",
  "You are being remade, one week at a time.",
  "Your worth was settled before you did anything.",
  "Growth is quiet before it is visible.",
];

export function mondayOf(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function weekKey(d = new Date()) {
  return mondayOf(d).toISOString().slice(0, 10);
}
export function weekLabel(key) {
  const d = new Date(key + "T00:00:00");
  return "Week of " + d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export function avg(nums) {
  const a = nums.filter((n) => typeof n === "number");
  return a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0;
}
export function allRatings(entry) {
  return SECTIONS.flatMap((s) => s.metrics.map((m) => entry?.[s.key]?.[m]));
}
export function bandLabel(v) {
  if (v < 2) return "A tender season — you're not alone in it.";
  if (v < 3) return "Awareness is growing.";
  if (v < 4) return "Healthy movement is showing.";
  return "Strong and steady — keep tending it.";
}
