import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import { C, S } from "./styles.js";

const ROLES = ["participant", "facilitator", "admin"];

export default function Assign() {
  const [people, setPeople] = useState(null);
  const [links, setLinks] = useState([]);
  const [fac, setFac] = useState("");
  const [par, setPar] = useState("");
  const [msg, setMsg] = useState(null);

  async function load() {
    const [{ data: pl, error }, { data: as }] = await Promise.all([
      supabase.rpc("admin_list_people"),
      supabase.from("assignments").select("id, facilitator_id, participant_id"),
    ]);
    if (error) { setMsg(error.message); setPeople([]); return; }
    setPeople(pl || []);
    setLinks(as || []);
  }
  useEffect(() => { load(); }, []);

  const name = (id) => {
    const p = people?.find((x) => x.id === id);
    return p ? (p.full_name || p.email) : "—";
  };
  const facilitators = (people || []).filter((p) => p.role === "facilitator");

  async function setRole(id, role) {
    const { error } = await supabase.rpc("admin_set_role", { target: id, new_role: role });
    if (error) { setMsg(error.message); return; }
    load();
  }
  async function createLink() {
    if (!fac || !par) return;
    const { error } = await supabase.from("assignments").insert({ facilitator_id: fac, participant_id: par });
    if (error) { setMsg(error.message); return; }
    setFac(""); setPar(""); setMsg(null); load();
  }
  async function removeLink(id) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) { setMsg(error.message); return; }
    load();
  }

  return (
    <div style={{ padding: "20px 20px 8px" }}>
      <div style={S.cardEyebrow}>Administration</div>
      <h2 style={S.stepTitle}>Roles & assignments</h2>
      {msg && <div style={{ ...S.card, color: C.lav, fontSize: 13 }}>{msg}</div>}

      {/* New assignment */}
      <div style={S.card}>
        <div style={S.cardEyebrow}>Assign a participant to a facilitator</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <select style={sel} value={fac} onChange={(e) => setFac(e.target.value)}>
            <option value="">Choose facilitator…</option>
            {facilitators.map((p) => (<option key={p.id} value={p.id}>{p.full_name || p.email}</option>))}
          </select>
          <select style={sel} value={par} onChange={(e) => setPar(e.target.value)}>
            <option value="">Choose participant…</option>
            {(people || []).map((p) => (<option key={p.id} value={p.id}>{p.full_name || p.email}</option>))}
          </select>
          <button style={{ ...S.primaryBtn, opacity: fac && par ? 1 : 0.5 }} disabled={!fac || !par} onClick={createLink}>
            Assign
          </button>
          {facilitators.length === 0 && (
            <div style={{ fontSize: 12, color: C.lavDim }}>
              No facilitators yet — set someone's role to “facilitator” below first.
            </div>
          )}
        </div>
      </div>

      {/* Current assignments */}
      {links.length > 0 && (
        <div style={S.card}>
          <div style={S.cardEyebrow}>Current assignments</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span style={{ color: C.cream }}>
                  {name(l.participant_id)} <span style={{ color: C.lavDim }}>→</span> {name(l.facilitator_id)}
                </span>
                <button style={{ ...S.ghostBtn, padding: "4px 10px" }} onClick={() => removeLink(l.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People & roles */}
      <div style={S.card}>
        <div style={S.cardEyebrow}>People</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {people === null && <div style={{ color: C.lavDim, fontSize: 13 }}>Loading…</div>}
          {(people || []).map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: C.cream, overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.full_name || p.email}
              </span>
              <select style={{ ...sel, width: "auto", padding: "6px 8px" }} value={p.role} onChange={(e) => setRole(p.id, e.target.value)}>
                {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sel = {
  width: "100%", background: C.ink, color: C.cream, border: `1px solid ${C.line}`,
  borderRadius: 10, padding: "11px 12px", fontSize: 14,
};
