import { useMemo } from "react";
import { C, S } from "./styles.js";
import { SECTIONS, SCALE, IDENTITY, weekKey, weekLabel, avg, allRatings, bandLabel } from "./constants.js";
import Trend from "./Trend.jsx";

export default function Home({ entries, onStart, consent, onConsent }) {
  const identity = IDENTITY[new Date().getDay() % IDENTITY.length];
  const current = entries.find((e) => e.week === weekKey());
  const latest = entries[entries.length - 1];
  const src = current || latest;
  const wellness = src ? avg(allRatings(src)) : 0;

  const focus = useMemo(() => {
    if (!src) return null;
    let low = null;
    for (const s of SECTIONS)
      for (const m of s.metrics) {
        const v = src[s.key]?.[m];
        if (typeof v === "number" && (!low || v < low.v)) low = { m, v, sec: s.eyebrow };
      }
    return low;
  }, [src]);

  return (
    <div style={{ padding: "20px 20px 8px" }}>
      <div style={S.hero}>
        <div style={{ fontSize: 11, color: C.gold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>This week</div>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 25, lineHeight: 1.25, color: C.cream, marginBottom: 18 }}>{identity}</div>
        <Trend entries={entries} />
      </div>

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
          <button style={S.primaryBtn} onClick={onStart}>{current ? "Review" : "Begin"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={S.card}>
          <div style={S.cardEyebrow}>Overall wellness</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 34, color: C.gold }}>{wellness ? wellness.toFixed(1) : "—"}</span>
            <span style={{ color: C.lavDim, fontSize: 14 }}>/ 5</span>
          </div>
          <div style={{ fontSize: 12, color: C.lav, marginTop: 4 }}>{wellness ? bandLabel(wellness) : "Complete a check-in to see this."}</div>
        </div>
        <div style={S.card}>
          <div style={S.cardEyebrow}>Asking for care</div>
          {focus ? (
            <>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 17, color: C.cream, marginTop: 6, lineHeight: 1.2 }}>{focus.m}</div>
              <div style={{ fontSize: 12, color: C.lav, marginTop: 6 }}>{focus.sec} · {SCALE[focus.v - 1].label}</div>
            </>
          ) : (<div style={{ fontSize: 13, color: C.lavDim, marginTop: 8 }}>Revealed after your first check-in.</div>)}
        </div>
      </div>

      {src && (
        <div style={S.card}>
          <div style={S.cardEyebrow}>Where you are, gently</div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {SECTIONS.map((s) => {
              const val = avg(s.metrics.map((m) => src[s.key]?.[m]));
              return (
                <div key={s.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.lav, marginBottom: 5 }}>
                    <span>{s.eyebrow}</span><span style={{ color: C.cream }}>{val.toFixed(1)}</span>
                  </div>
                  <div style={S.barTrack}><div style={{ ...S.barFill, width: `${(val / 5) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {src?.reflection?.truth && (
        <div style={{ ...S.card, borderLeft: `2px solid ${C.gold}` }}>
          <div style={S.cardEyebrow}>Truth I'm practicing</div>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 16, color: C.cream, marginTop: 6, fontStyle: "italic", lineHeight: 1.35 }}>
            “{src.reflection.truth}”
          </div>
        </div>
      )}

      {/* Facilitator sharing consent */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={S.cardEyebrow}>Sharing with your facilitator</div>
            <div style={{ fontSize: 13, color: C.lav, marginTop: 6, lineHeight: 1.45 }}>
              {consent
                ? "On. Your assigned facilitator can see your ratings and only the reflections you mark to share on each check-in."
                : "Off. Your check-ins stay completely private. Turn this on to let your assigned facilitator walk with you."}
            </div>
          </div>
          <Toggle on={consent} onChange={onConsent} />
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} aria-label="Sharing with facilitator"
      style={{
        width: 52, height: 30, borderRadius: 16, flexShrink: 0, cursor: "pointer",
        border: `1px solid ${on ? C.gold : C.line}`, background: on ? C.gold : C.ink,
        position: "relative", transition: "all .15s ease",
      }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 24 : 3, width: 22, height: 22, borderRadius: "50%",
        background: on ? C.ink : C.lavDim, transition: "all .15s ease",
      }} />
    </button>
  );
}
