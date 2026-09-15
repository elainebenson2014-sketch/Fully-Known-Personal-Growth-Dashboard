import { useEffect, useState } from "react";
import { supabase, configured } from "./supabaseClient.js";
import { C, S, FONTS } from "./lib/styles.js";
import { weekKey } from "./lib/constants.js";
import Home from "./components/Home.jsx";
import CheckIn from "./components/CheckIn.jsx";
import Admin from "./components/Admin.jsx";

export default function App() {
  return (
    <div style={S.root}>
      <style>{FONTS}</style>
      <div style={S.frame}>
        {configured ? <Authed /> : <NotConfigured />}
      </div>
    </div>
  );
}

function Authed() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready)
    return (
      <>
        <Header />
        <div style={{ padding: "60px 24px", textAlign: "center", color: C.lavDim }}>Loading…</div>
      </>
    );

  return session ? <Dashboard session={session} /> : (
    <>
      <Header />
      <SignIn />
      <Footer />
    </>
  );
}

function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("home");
  const [saving, setSaving] = useState(false);
  const uid = session.user.id;

  useEffect(() => {
    let live = true;
    (async () => {
      const [{ data: prof }, { data: rows }] = await Promise.all([
        supabase.from("profiles").select("full_name, role").eq("id", uid).maybeSingle(),
        supabase.from("checkins").select("week, ratings, reflection").eq("user_id", uid).order("week"),
      ]);
      if (!live) return;
      setProfile(prof || { role: "participant" });
      setEntries((rows || []).map(rowToEntry));
    })();
    return () => { live = false; };
  }, [uid]);

  async function save(entry) {
    setSaving(true);
    const { error } = await supabase.from("checkins").upsert(
      {
        user_id: uid,
        week: entry.week,
        ratings: { internal: entry.internal, functional: entry.functional, impact: entry.impact },
        reflection: entry.reflection,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week" }
    );
    setSaving(false);
    if (error) { alert("Could not save: " + error.message); return; }
    setEntries((prev) => [...prev.filter((e) => e.week !== entry.week), entry].sort((a, b) => a.week.localeCompare(b.week)));
    setView("home");
  }

  const current = entries.find((e) => e.week === weekKey());

  return (
    <>
      <Header profile={profile} onSignOut={() => supabase.auth.signOut()}
        onToggleAdmin={profile?.role === "admin" ? () => setView((v) => (v === "admin" ? "home" : "admin")) : null}
        adminActive={view === "admin"} />
      {view === "home" && <Home entries={entries} onStart={() => setView("checkin")} />}
      {view === "checkin" && (
        <CheckIn initial={current} saving={saving} onCancel={() => setView("home")} onSave={save} />
      )}
      {view === "admin" && <Admin />}
      <Footer />
    </>
  );
}

function rowToEntry(r) {
  const rt = r.ratings || {};
  return {
    week: r.week,
    internal: rt.internal || {},
    functional: rt.functional || {},
    impact: rt.impact || {},
    reflection: r.reflection || {},
  };
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) alert(error.message);
    else setSent(true);
  }

  return (
    <div style={{ padding: "26px 22px" }}>
      <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 24, color: C.cream, lineHeight: 1.25 }}>
        Welcome back.
      </div>
      <div style={{ fontSize: 14, color: C.lav, margin: "8px 0 20px" }}>
        Enter your email and we'll send a secure sign-in link. No password to remember.
      </div>
      {sent ? (
        <div style={{ ...S.card, marginTop: 0 }}>
          <div style={{ color: C.cream, fontSize: 15 }}>Check your email.</div>
          <div style={{ color: C.lav, fontSize: 13, marginTop: 6 }}>
            We sent a sign-in link to {email}. Open it on this device.
          </div>
        </div>
      ) : (
        <>
          <input style={S.input} type="email" inputMode="email" placeholder="you@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} />
          <button style={{ ...S.primaryBtn, width: "100%", marginTop: 12, opacity: busy ? 0.6 : 1 }}
            disabled={busy} onClick={send}>
            {busy ? "Sending…" : "Send sign-in link"}
          </button>
        </>
      )}
    </div>
  );
}

function Header({ profile, onSignOut, onToggleAdmin, adminActive }) {
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
      <div style={{ display: "flex", gap: 8 }}>
        {onToggleAdmin && (
          <button style={{ ...S.ghostBtn, borderColor: adminActive ? C.gold : C.line, color: adminActive ? C.gold : C.lav }}
            onClick={onToggleAdmin}>Leadership</button>
        )}
        {onSignOut && <button style={S.ghostBtn} onClick={onSignOut}>Sign out</button>}
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

function Footer() {
  return (
    <div style={S.footer}>
      <div style={{ color: C.lavDim, fontSize: 11, lineHeight: 1.6 }}>
        This dashboard is educational and pastoral — it is not clinical or emergency care.
        If you or someone you love is in immediate danger, contact local emergency services.
        In the U.S. you can call or text <span style={{ color: C.lav }}>988</span> anytime.
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <>
      <Header />
      <div style={{ padding: "26px 22px" }}>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 22, color: C.cream }}>Almost there</div>
        <div style={{ color: C.lav, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
          Add your Supabase keys as environment variables, then redeploy:
          <br /><br />
          <code style={{ color: C.gold }}>VITE_SUPABASE_URL</code><br />
          <code style={{ color: C.gold }}>VITE_SUPABASE_ANON_KEY</code>
          <br /><br />
          See the README for the full setup.
        </div>
      </div>
    </>
  );
}
