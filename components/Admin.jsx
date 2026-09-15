import { useEffect, useState } from "react";
import { C, S } from "../lib/styles.js";
import { supabase } from "../supabaseClient.js";

// Leadership view: anonymous aggregates only, via the program_summary() RPC.
export default function Admin() {
  const [sum, setSum] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase.rpc("program_summary").then(({ data, error }) => {
      if (error) setErr(error.message);
      else setSum(data);
    });
  }, []);

  const cells = sum
    ? [
        ["Participants", sum.participants],
        ["Total check-ins", sum.checkins],
        ["Checked in this week", sum.this_week],
      ]
    : [];

  return (
    <div style={{ padding: "20px 20px 8px" }}>
      <div style={S.cardEyebrow}>Leadership</div>
      <h2 style={S.stepTitle}>Program at a glance</h2>
      <div style={{ fontSize: 13, color: C.lav, marginBottom: 4 }}>
        Group totals only. No individual scores or reflections are ever shown here.
      </div>
      {err && <div style={{ ...S.card, color: C.lav }}>Could not load summary: {err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
        {cells.map(([label, val]) => (
          <div key={label} style={S.card}>
            <div style={S.cardEyebrow}>{label}</div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 34, color: C.gold, marginTop: 6 }}>
              {val ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
