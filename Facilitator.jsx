import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import { C, S } from "./styles.js";
import { SECTIONS, REFLECT, weekLabel, avg, allRatings } from "./constants.js";
import Trend from "./Trend.jsx";

const LABEL = Object.fromEntries(REFLECT.map(([k, l]) => [k, l]));

export default function Facilitator() {
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    supabase.rpc("my_participants").then(({ data, error }) => {
      if (error) { setList([]); return; }
      setList(data || []);
    });
  }, []);

  if (selected) return <Detail person={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ padding: "20px 20px 8px" }}>
      <div style={S.cardEyebrow}>Facilitator</div>
      <h2 style={S.stepTitle}>Your participants</h2>
      {list === null && <div style={{ color: C.lavDim, fontSize: 13, marginTop: 12 }}>Loading…</div>}
      {list && list.length === 0 && (
        <div style={{ ...S.card, color: C.lav, fontSize: 14 }}>
          No one is assigned to you yet. A program administrator assigns participants.
        </div>
      )}
      {list && list.map((p) => (
        <button key={p.participant_id} onClick={() => p.consented && setSelected(p)}
          style={{ ...S.card, width: "100%", textAlign: "left", cursor: p.consented ? "pointer" : "default", border: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 17, color: C.cream }}>
                {p.full_name || p.email}
              </div>
              <div style={{ fontSize: 12, color: C.lav, marginTop: 4 }}>
                {p.consented
                  ? `${p.weeks_count || 0} check-in${p.weeks_count === 1 ? "" : "s"}${p.last_week ? " · last " + weekLabel(p.last_week).replace("Week of ", "") : ""}`
                  : "Waiting for them to turn on sharing."}
              </div>
            </div>
            {p.consented ? (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 26, color: C.gold }}>
                  {p.wellness != null ? Number(p.wellness).toFixed(1) : "—"}
                </div>
                <div style={{ fontSize: 10, color: C.lavDim }}>wellness</div>
              </div>
            ) : (
              <span style={{ fontSize: 11, color: C.lavDim, border: `1px solid ${C.line}`, borderRadius: 20, padding: "3px 10px" }}>private</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function Detail({ person, onBack }) {
  const [weeks, setWeeks] = useState(null);
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [uid, setUid] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id));
    supabase.rpc("participant_weeks", { participant: person.participant_id }).then(({ data, error }) => {
      if (error) { setErr(error.message); setWeeks([]); return; }
      setWeeks((data || []).map((r) => ({
        week: r.week,
        internal: r.ratings?.internal || {}, functional: r.ratings?.functional || {}, impact: r.ratings?.impact || {},
        reflection: r.reflection || {},
      })));
    });
    loadNotes();
  }, [person.participant_id]);

  function loadNotes() {
    supabase.from("care_notes").select("id, note, created_at").eq("participant_id", person.participant_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotes(data || []));
  }

  async function addNote() {
    if (!draft.trim() || !uid) return;
    const { error } = await supabase.from("care_notes")
      .insert({ facilitator_id: uid, participant_id: person.participant_id, note: draft.trim() });
    if (error) { alert("Could not save note: " + error.message); return; }
    setDraft(""); loadNotes();
  }

  const latest = weeks && weeks.length ? weeks[weeks.length - 1] : null;

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <button style={S.ghostBtn} onClick={onBack}>← All participants</button>
      <h2 style={{ ...S.stepTitle, marginTop: 12 }}>{person.full_name || person.email}</h2>

      {err && <div style={{ ...S.card, color: C.lav }}>{err}</div>}
      {weeks === null && <div style={{ color: C.lavDim, fontSize: 13 }}>Loading…</div>}

      {weeks && weeks.length > 0 && (
        <>
          <div style={{ marginTop: 8 }}><Trend entries={weeks} /></div>

          {latest && (
            <div style={S.card}>
              <div style={S.cardEyebrow}>Most recent — {weekLabel(latest.week).replace("Week of ", "")}</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {SECTIONS.map((s) => {
                  const val = avg(s.metrics.map((m) => latest[s.key]?.[m]));
                  return (
                    <div key={s.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.lav, marginBottom: 5 }}>
                        <span>{s.eyebrow}</span><span style={{ color: C.cream }}>{val ? val.toFixed(1) : "—"}</span>
                      </div>
                      <div style={S.barTrack}><div style={{ ...S.barFill, width: `${(val / 5) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared reflections across weeks */}
          {weeks.some((w) => Object.keys(w.reflection).length) && (
            <div style={S.card}>
              <div style={S.cardEyebrow}>Shared reflections</div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
                {[...weeks].reverse().filter((w) => Object.keys(w.reflection).length).map((w) => (
                  <div key={w.week}>
                    <div style={{ fontSize: 11, color: C.gold }}>{weekLabel(w.week).replace("Week of ", "")}</div>
                    {Object.entries(w.reflection).map(([k, v]) => (
                      <div key={k} style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 12, color: C.lavDim }}>{LABEL[k] || k}</div>
                        <div style={{ fontSize: 14, color: C.cream, lineHeight: 1.4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Care notes (private to you) */}
      <div style={S.card}>
        <div style={S.cardEyebrow}>Meeting notes — private to you</div>
        <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} style={{ ...S.textarea, marginTop: 10 }}
          placeholder="Notes from a one-on-one, a follow-up to remember…" />
        <button style={{ ...S.primaryBtn, marginTop: 10 }} onClick={addNote}>Add note</button>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.map((n) => (
            <div key={n.id} style={{ borderLeft: `2px solid ${C.line}`, paddingLeft: 10 }}>
              <div style={{ fontSize: 10, color: C.lavDim }}>{new Date(n.created_at).toLocaleDateString()}</div>
              <div style={{ fontSize: 14, color: C.cream, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{n.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
