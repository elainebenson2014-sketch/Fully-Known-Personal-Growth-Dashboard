import { C, S } from "./styles.js";
import { weekLabel, avg, allRatings } from "./constants.js";

export default function Trend({ entries }) {
  const pts = entries.map((e) => ({
    label: weekLabel(e.week).replace("Week of ", ""),
    v: avg(allRatings(e)),
  }));

  if (pts.length === 0)
    return (
      <div style={{ ...S.trendBox, display: "flex", alignItems: "center", justifyContent: "center", color: C.lavDim, fontSize: 13, textAlign: "center", padding: "0 20px" }}>
        Your growth trend appears here as the weeks add up.
      </div>
    );

  const W = 380, H = 120, pad = 16, n = pts.length;
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
