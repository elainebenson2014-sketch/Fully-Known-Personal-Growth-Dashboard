export const C = {
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

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
html, body, #root { height: 100%; }
* { box-sizing: border-box; }
input, textarea { font-family: Inter, system-ui, sans-serif; }
input:focus, textarea:focus, button:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

export const S = {
  root: {
    minHeight: "100%",
    background: `radial-gradient(1200px 600px at 50% -10%, #2a1d54 0%, ${C.ink} 55%)`,
    fontFamily: "Inter, system-ui, sans-serif",
    color: C.cream,
    padding: "16px 12px 40px",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    background: C.gold, color: C.ink, border: "none", borderRadius: 10,
    padding: "11px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
  },
  ghostBtn: {
    background: "transparent", color: C.lav, border: `1px solid ${C.line}`,
    borderRadius: 9, padding: "7px 14px", fontSize: 13, cursor: "pointer",
  },
  linkBtn: {
    background: "transparent", color: C.goldSoft, border: "none", padding: "10px 2px 0",
    fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
  },
  input: {
    width: "100%", background: C.ink, color: C.cream, border: `1px solid ${C.line}`,
    borderRadius: 10, padding: "12px 12px", fontSize: 14,
  },
  textarea: {
    width: "100%", background: C.ink, color: C.cream, border: `1px solid ${C.line}`,
    borderRadius: 10, padding: "10px 12px", fontSize: 14, resize: "vertical", lineHeight: 1.4,
  },
  footer: { padding: "18px 20px 22px", borderTop: `1px solid ${C.line}`, marginTop: 8 },
};
