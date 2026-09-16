import { useState } from "react";
import { C, S } from "./styles.js";
import { SECTIONS, SCALE, REFLECT, weekKey } from "./constants.js";

export default function CheckIn({ initial, onCancel, onSave, saving }) {
  const steps = [...SECTIONS.map((s) => s.key), "reflection"];
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => ({
    week: weekKey(),
    internal: { ...(initial?.internal || {}) },
    functional: { ...(initial?.functional || {}) },
    impact: { ...(initial?.impact || {}) },
    reflection: { ...(initial?.reflection || {}) },
    shared: new Set(initial?.shared_fields || []),
  }));

  const isReflection = steps[step] === "reflection";
  const section = SECTIONS.find((s) => s.key === steps[step]);

  const setRating = (sec, m, v) => setData((d) => ({ ...d, [sec]: { ...d[sec], [m]: v } }));
  const setField = (name, val) => setData((d) => ({ ...d, reflection: { ...d.reflection, [name]: val } }));
  const toggleShare = (name) => setData((d) => {
    const s = new Set(d.shared);
    s.has(name) ? s.delete(name) : s.add(name);
    return { ...d, shared: s };
  });

  function submit() {
    onSave({ ...data, shared_fields: [...data.shared] });
  }

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button style={S.ghostBtn} onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 0 ? "Close" : "Back"}
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {steps.map((_, i) => (<span key={i} style={{ width: 22, height: 3, borderRadius: 2, background: i <= step ? C.gold : C.line }} />))}
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
          <div style={{ fontSize: 12.5, color: C.lavDim, marginBottom: 4 }}>
            Tap “Share” on any answer to let your facilitator see it. Everything else stays private.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {REFLECT.map(([name, label, rows]) => {
              const shared = data.shared.has(name);
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, color: C.lav }}>{label}</label>
                    <button onClick={() => toggleShare(name)}
                      style={{
                        fontSize: 11, cursor: "pointer", borderRadius: 20, padding: "3px 10px",
                        border: `1px solid ${shared ? C.gold : C.line}`,
                        background: shared ? "rgba(228,184,76,.15)" : "transparent",
                        color: shared ? C.gold : C.lavDim,
                      }}>
                      {shared ? "✓ Shared" : "Share"}
                    </button>
                  </div>
                  <textarea rows={rows} value={data.reflection[name] || ""} onChange={(e) => setField(name, e.target.value)}
                    style={S.textarea} placeholder="Write as little or as much as you like." />
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 10, margin: "22px 0 4px" }}>
        {!isReflection ? (
          <button style={{ ...S.primaryBtn, flex: 1 }} onClick={() => setStep((s) => s + 1)}>Continue</button>
        ) : (
          <button style={{ ...S.primaryBtn, flex: 1, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={submit}>
            {saving ? "Saving…" : "Save this week"}
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
        <span style={{ fontSize: 12, color: chosen ? chosen.color : C.lavDim, minHeight: 14 }}>{chosen ? chosen.label : "Tap to rate"}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {SCALE.map((s) => {
          const active = value === s.v;
          return (
            <button key={s.v} onClick={() => onChange(s.v)} aria-label={`${label}: ${s.label}`}
              style={{
                flex: 1, height: 34, borderRadius: 9, cursor: "pointer",
                border: `1px solid ${active ? s.color : C.line}`, background: active ? s.color : "transparent",
                color: active ? C.ink : C.lavDim, fontWeight: 600, fontSize: 14, transition: "all .12s ease",
              }}>
              {s.v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
