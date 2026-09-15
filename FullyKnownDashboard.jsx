import { useState, useEffect, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Fully Known — Personal Growth Dashboard (Phase 1 prototype)        */
/*  Participant weekly self-assessment across Internal / Functional /  */
/*  Impact, with gentle 1–5 scale and a growth trend over time.        */
/* ------------------------------------------------------------------ */

const C = {
  ink: "#16122E",
  ink2: "#1b1638",
  plum: "#241A45",
  plumHi: "#33265f",
  line: "#3a2c66",
  gold: "#E4B84C",
  goldSoft: "#caa24a",
  cream: "#F3ECDE",
  lav: "#B7ADD6",
  lavDim: "#8579A8",
};

// gentle, non-judgmental scale
const SCALE = [
  { v: 1, label: "Needs care", color: "#6b5b8a" },
  { v: 2, label: "Becoming aware", color: "#8a6fa0" },
  { v: 3, label: "Growing", color: "#b08bb0" },
  { v: 4, label: "Steady", color: "#d0a15e" },
  { v: 5, label: "Flourishing", color: C.gold },
];

const SECTIONS = [
  {
    key: "internal",
    title: "What is happening within me",
    eyebrow: "Internal",
    metrics: [
      "Spiritual connection", "Identity security", "Thought life",
      "Emotional health", "Inner peace", "Stress recovery", "Physical well-being",
    ],
  },
  {
    key: "functional",
    title: "How I am managing my life",
    eyebrow: "Functional",
    metrics: [
      "Daily responsibilities", "Communication", "Healthy boundaries",
      "Emotional regulation", "Time stewardship", "Self-care", "Progress toward goals",
    ],
  },
  {
    key: "impact",
    title: "What is changing because I am growing",
    eyebrow: "Impact",
    metrics: [
      "Spiritual growth", "Healthier relationships", "Harmful patterns interrupted",
      "Resilience", "Purpose and productivity", "Positive influence on others",
      "Sustained transformation",
    ],
  },
];

const REFLECT = [
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

const IDENTITY = [
  "You are fully known, and fully loved.",
  "You are not what happened to you.",
  "You are being remade, one week at a time.",
  "Your worth was settled before you did anything.",
  "Growth is quiet before it is visible.",
];

const STORE_KEY = "fullyknown:checkins";

/* --------------------------- helpers ------------------------------ */
function mondayOf(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function weekKey(d = new Date()) {
  return mondayOf(d).toISOString().slice(0, 10);
}
function weekLabel(key) {
  const d = new Date(key + "T00:00:00");
  return "Week of " + d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function avg(nums) {
  const a = nums.filter((n) => typeof n === "number");
  return a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0;
}
function allRatings(entry) {
  return SECTIONS.flatMap((s) => s.metrics.map((m) => entry?.[s.key]?.[m]));
}

const SAMPLE = [-5, -4, -3, -2, -1].map((n, i) => {
  const key = weekKey(new Date(Date.now() + n * 7 * 864e5));
  const base = 2.3 + i * 0.35;
  const mk = (sec) =>
    Object.fromEntries(
      sec.metrics.map((m, j) => [m, Math.max(1, Math.min(5, Math.round(base + Math.sin(i + j) * 0.6)))])
    );
  return {
    week: key,
    internal: mk(SECTIONS[0]),
    functional: mk(SECTIONS[1]),
    impact: mk(SECTIONS[2]),
    reflection: {},
    sample: true,
  };
});

/* ============================ APP ================================= */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("home"); // home | checkin
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        if (live && r?.value) setEntries(JSON.parse(r.value));
      } catch (e) {
        /* first run: nothing stored yet */
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  async function persist(next) {
    setEntries(next);
    try { await window.storage.set(STORE_KEY, JSON.stringify(next), false); } catch (e) {}
  }

  const shown = preview && entries.length === 0 ? SAMPLE : entries;
  const thisWeek = weekKey();
  const current = shown.find((e) => e.week === thisWeek);

  return (
    <div style={S.root}>
      <style>{FONTS}</style>
      <div style={S.frame}>
        <Header view={view} />
        {loading ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: C.lavDim }}>
            Opening your dashboard…
          </div>
        ) : view === "home" ? (
          <Home
            entries={shown}
            current={current}
            onStart={() => setView("checkin")}
            preview={preview && entries.length === 0}
            onPreview={() => setPreview((p) => !p)}
          />
        ) : (
          <CheckIn
            initial={current}
            onCancel={() => setView("home")}
            onSave={(entry) => {
              const next = [...entries.filter((e) => e.week !== entry.week), entry]
                .sort((a, b) => a.week.localeCompare(b.week));
              persist(next);
              setPreview(false);
              setView("home");
            }}
          />
        )}
        <Footer />
      </div>
    </div>
  );
}

/* --------------------------- Header ------------------------------- */
function Header() {
  return (
    <div style={S.header}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Mark />
        <div>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 19, color: C.cream, letterSpacing: ".2px" }}>
            Fully Known
          </div>
          <div style={{ fontSize: 11, color: C.lavDim, letterSpacing: ".4px" }}>Personal Growth Dashboard</div>
        </div>
      </div>
    </div>
  );
}
function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="none" stroke={C.gold} strokeWidth="1.4" opacity=".85" />
      <path d="M20 8 C13 15 13 25 20 32 C27 25 27 15 20 8 Z" fill="none" stroke={C.gold} strokeWidth="1.4" />
      <circle cx="20" cy="20" r="2.4" fill={C.gold} />
    </svg>
  );
}

/* ---------------------------- Home -------------------------------- */
function Home({ entries, current, onStart, preview, onPreview }) {
  const identity = IDENTITY[new Date().getDay() % IDENTITY.length];
  const latest = entries[entries.length - 1];
  const wellness = current ? avg(allRatings(current)) : latest ? avg(allRatings(latest)) : 0;

  // lowest-scoring metric = the area "asking for care"
  const focus = useMemo(() => {
    const src = current || latest;
    if (!src) return null;
    let low = null;
    for (const s of SECTIONS)
      for (const m of s.metrics) {
        const v = src[s.key]?.[m];
        if (typeof v === "number" && (!low || v < low.v)) low = { m, v, sec: s.eyebrow };
      }
    return low;
  }, [current, latest]);

  return (
    <div style={{ padding: "20px 20px 8px" }}>
      {/* hero: identity + this week's reading */}
      <div style={S.hero}>
        <div style={{ fontSize: 11, color: C.gold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>
          This week
        </div>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 25, lineHeight: 1.25, color: C.cream, marginBottom: 18 }}>
          {identity}
        </div>
        <Trend entries={entries} />
        {entries.length === 0 && (
          <button style={S.linkBtn} onClick={onPreview}>
            {preview ? "Hide sample weeks" : "See how the trend looks with sample weeks"}
          </button>
        )}
      </div>

      {/* check-in status */}
      <div style={{ ...S.card, background: `linear-gradient(150deg, ${C.plumHi}, ${C.plum})` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={S.cardEyebrow}>{weekLabel(weekKey())}</div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 18, color: C.cream, marginTop: 4 }}>
              {current ? "Check-in complete" : "Your weekly check-in"}
            </div>
            <div style={{ fontSize: 13, color: C.lav, marginTop: 4 }}>
              {current ? "You can revisit and adjust it anytime." : "A few quiet minutes with yourself and God."}
            </div>
          </div>
          <button style={S.primaryBtn} onClick={onStart}>
            {current ? "Review" : "Begin"}
          </button>
        </div>
      </div>

      {/* wellness + focus */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={S.card}>
          <div style={S.cardEyebrow}>Overall wellness</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 34, color: C.gold }}>
              {wellness ? wellness.toFixed(1) : "—"}
            </span>
            <span style={{ color: C.lavDim, fontSize: 14 }}>/ 5</span>
          </div>
          <div style={{ fontSize: 12, color: C.lav, marginTop: 4 }}>
            {wellness ? bandLabel(wellness) : "Complete a check-in to see this."}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardEyebrow}>Asking for care</div>
          {focus ? (
            <>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 17, color: C.cream, marginTop: 6, lineHeight: 1.2 }}>
                {focus.m}
              </div>
              <div style={{ fontSize: 12, color: C.lav, marginTop: 6 }}>
                {focus.sec} · {SCALE[focus.v - 1].label}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.lavDim, marginTop: 8 }}>Revealed after your first check-in.</div>
          )}
        </div>
      </div>

      {/* section balance for latest entry */}
      {(current || latest) && (
        <div style={S.card}>
          <div style={S.cardEyebrow}>Where you are, gently</div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {SECTIONS.map((s) => {
              const val = avg(s.metrics.map((m) => (current || latest)[s.key]?.[m]));
              return (
                <div key={s.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.lav, marginBottom: 5 }}>
                    <span>{s.eyebrow}</span>
                    <span style={{ color: C.cream }}>{val.toFixed(1)}</span>
                  </div>
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width: `${(val / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* last reflection echo */}
      {(current?.reflection?.truth || latest?.reflection?.truth) && (
        <div style={{ ...S.card, borderLeft: `2px solid ${C.gold}` }}>
          <div style={S.cardEyebrow}>Truth I'm practicing</div>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 16, color: C.cream, marginTop: 6, fontStyle: "italic", lineHeight: 1.35 }}>
            “{(current || latest).reflection.truth}”
          </div>
        </div>
      )}
    </div>
  );
}

function bandLabel(v) {
  if (v < 2) return "A tender season — you're not alone in it.";
  if (v < 3) return "Awareness is growing.";
  if (v < 4) return "Healthy movement is showing.";
  return "Strong and steady — keep tending it.";
}

/* --------------------------- Trend chart -------------------------- */
function Trend({ entries }) {
  const pts = entries.map((e) => ({ label: weekLabel(e.week).replace("Week of ", ""), v: avg(allRatings(e)) }));
  if (pts.length === 0)
    return (
      <div style={{ ...S.trendBox, display: "flex", alignItems: "center", justifyContent: "center", color: C.lavDim, fontSize: 13, textAlign: "center", padding: "0 20px" }}>
        Your growth trend appears here as the weeks add up.
      </div>
    );

  const W = 380, H = 120, pad = 16;
  const n = pts.length;
  const x = (i) => (n === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1));
  const y = (v) => H - pad - ((v - 1) / 4) * (H - pad * 2);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.v)}`).join(" ");
  const area = `${line} L${x(n - 1)},${H - pad} L${x(0)},${H - pad} Z`;

  return (
    <div style={S.trendBox}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id="fk-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[1, 3, 5].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke={C.line} strokeWidth="1" />
        ))}
        {n > 1 && <path d={area} fill="url(#fk-fill)" />}
        {n > 1 && <path d={line} fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.v)} r="3.5" fill={C.ink} stroke={C.gold} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.lavDim, marginTop: 4 }}>
        <span>{pts[0].label}</span>
        <span>{pts[pts.length - 1].label}</span>
      </div>
    </div>
  );
}

/* --------------------------- Check-in ----------------------------- */
function CheckIn({ initial, onCancel, onSave }) {
  const steps = [...SECTIONS.map((s) => s.key), "reflection"];
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => ({
    week: weekKey(),
    internal: { ...(initial?.internal || {}) },
    functional: { ...(initial?.functional || {}) },
    impact: { ...(initial?.impact || {}) },
    reflection: { ...(initial?.reflection || {}) },
  }));

  const isReflection = steps[step] === "reflection";
  const section = SECTIONS.find((s) => s.key === steps[step]);

  function setRating(sec, metric, v) {
    setData((d) => ({ ...d, [sec]: { ...d[sec], [metric]: v } }));
  }
  function setField(name, val) {
    setData((d) => ({ ...d, reflection: { ...d.reflection, [name]: val } }));
  }

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button style={S.ghostBtn} onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 0 ? "Close" : "Back"}
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {steps.map((_, i) => (
            <span key={i} style={{ width: 22, height: 3, borderRadius: 2, background: i <= step ? C.gold : C.line }} />
          ))}
        </div>
      </div>

      {!isReflection ? (
        <>
          <div style={S.cardEyebrow}>{section.eyebrow}</div>
          <h2 style={S.stepTitle}>{section.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 8 }}>
            {section.metrics.map((m) => (
              <RatingRow key={m} label={m} value={data[section.key][m]} onChange={(v) => setRating(section.key, m, v)} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={S.cardEyebrow}>Reflection</div>
          <h2 style={S.stepTitle}>A few honest words</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {REFLECT.map(([name, label, rows]) => (
              <div key={name}>
                <label style={{ fontSize: 13, color: C.lav, display: "block", marginBottom: 6 }}>{label}</label>
                <textarea
                  rows={rows}
                  value={data.reflection[name] || ""}
                  onChange={(e) => setField(name, e.target.value)}
                  style={S.textarea}
                  placeholder="Write as little or as much as you like."
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 10, margin: "22px 0 4px" }}>
        {!isReflection ? (
          <button style={{ ...S.primaryBtn, flex: 1 }} onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button style={{ ...S.primaryBtn, flex: 1 }} onClick={() => onSave(data)}>
            Save this week
          </button>
        )}
      </div>
    </div>
  );
}

function RatingRow({ label, value, onChange }) {
  const chosen = SCALE.find((s) => s.v === value);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 15, color: C.cream }}>{label}</span>
        <span style={{ fontSize: 12, color: chosen ? chosen.color : C.lavDim, minHeight: 14 }}>
          {chosen ? chosen.label : "Tap to rate"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {SCALE.map((s) => {
          const active = value === s.v;
          return (
            <button
              key={s.v}
              onClick={() => onChange(s.v)}
              aria-label={`${label}: ${s.label}`}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 9,
                cursor: "pointer",
                border: `1px solid ${active ? s.color : C.line}`,
                background: active ? s.color : "transparent",
                color: active ? C.ink : C.lavDim,
                fontWeight: 600,
                fontSize: 14,
                transition: "all .12s ease",
              }}
            >
              {s.v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- Footer ------------------------------- */
function Footer() {
  return (
    <div style={S.footer}>
      <div style={{ color: C.lavDim, fontSize: 11, lineHeight: 1.6 }}>
        This dashboard is educational and pastoral — it is not clinical or emergency care.
        If you or someone you love is in immediate danger, contact local emergency services.
        In the U.S. you can call or text <span style={{ color: C.lav }}>988</span> anytime.
      </div>
      <div style={{ color: "#5b5080", fontSize: 10, marginTop: 8 }}>
        Prototype — entries are stored privately on this device only.
      </div>
    </div>
  );
}

/* ----------------------------- fonts ------------------------------ */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
textarea { font-family: Inter, system-ui, sans-serif; }
textarea:focus, button:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
`;

/* ----------------------------- styles ----------------------------- */
const S = {
  root: {
    minHeight: "100%",
    background: `radial-gradient(1200px 600px at 50% -10%, #2a1d54 0%, ${C.ink} 55%)`,
    fontFamily: "Inter, system-ui, sans-serif",
    color: C.cream,
    padding: "16px 0 32px",
  },
  frame: {
    maxWidth: 460,
    margin: "0 auto",
    background: C.ink2,
    borderRadius: 22,
    border: `1px solid ${C.line}`,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,.45)",
  },
  header: {
    padding: "18px 20px",
    borderBottom: `1px solid ${C.line}`,
    background: `linear-gradient(180deg, rgba(228,184,76,.06), transparent)`,
  },
  hero: { marginBottom: 16 },
  trendBox: {
    background: C.plum,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    padding: "14px 12px 8px",
    height: 150,
  },
  card: {
    background: C.plum,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  cardEyebrow: { fontSize: 11, color: C.gold, letterSpacing: "1.2px", textTransform: "uppercase" },
  stepTitle: {
    fontFamily: "Fraunces, Georgia, serif",
    fontSize: 23,
    fontWeight: 500,
    color: C.cream,
    margin: "6px 0 4px",
    lineHeight: 1.2,
  },
  barTrack: { height: 7, borderRadius: 5, background: C.ink, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${C.goldSoft}, ${C.gold})` },
  primaryBtn: {
    background: C.gold,
    color: C.ink,
    border: "none",
    borderRadius: 10,
    padding: "11px 18px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  ghostBtn: {
    background: "transparent",
    color: C.lav,
    border: `1px solid ${C.line}`,
    borderRadius: 9,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  linkBtn: {
    background: "transparent",
    color: C.goldSoft,
    border: "none",
    padding: "10px 2px 0",
    fontSize: 12.5,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  textarea: {
    width: "100%",
    background: C.ink,
    color: C.cream,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    resize: "vertical",
    lineHeight: 1.4,
  },
  footer: { padding: "18px 20px 22px", borderTop: `1px solid ${C.line}`, marginTop: 8 },
};
