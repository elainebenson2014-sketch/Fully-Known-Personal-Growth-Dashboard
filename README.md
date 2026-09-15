[README (5).md](https://github.com/user-attachments/files/32258258/README.5.md)
# Fully Known — Personal Growth Dashboard

A private weekly self-assessment for participants in the Fully Known program.
Each person rates 21 areas across three levels — Internal, Functional, Impact —
on a gentle 1–5 scale, adds a short reflection, and watches a growth trend build
over the weeks. Stands alone: it does not connect to YonaLearn or any other app.

Stack: React + Vite (frontend) · Supabase (accounts + database).

> **All files sit at the top level — there are no folders.** When you upload to
> GitHub, keep them flat. Don't put anything inside `src/`, `components/`, or
> `lib/`. The imports are written for a flat layout.

---

## Phase 1 — what's built

- Passwordless sign-in (Supabase magic link — no passwords to manage)
- Weekly check-in across all 21 areas with the "Needs care → Flourishing" scale
- Reflection fields (truth, evidence, action, prayer, scripture, and more)
- Home dashboard: identity truth, overall wellness, the area "asking for care,"
  section balance, and a growth-trend chart
- Every check-in is **private to the person** — row-level security enforces this
- Optional leadership view showing **anonymous group totals only**

Facilitator portals, participant→facilitator sharing/consent, certificates,
and Kids/Teens dashboards are Phase 2. The database already carries a `role`
column so they can be added without a rebuild.

---

## Setup (about 15 minutes, no coding)

### 1. Create the database
1. Go to supabase.com, create a free project.
2. Open **SQL Editor → New query**.
3. Paste everything from `schema.sql`, click **Run**.
4. Open **Project Settings → API** and copy two values:
   - **Project URL**
   - **anon public** key

### 2. Put the code on GitHub
Upload **all the files** into the repository so they land at the top level
(not inside any folder). Do **not** upload a `.env` file — keys go in Vercel.

### 3. Deploy on Vercel
1. In Vercel, **Add New → Project**, import the GitHub repo.
2. Framework preset: **Vite** (auto-detected).
3. Under **Environment Variables**, add both (Production *and* Preview):
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. Deploy. Copy the live URL Vercel gives you.

### 4. Tell Supabase the site address
In Supabase, **Authentication → URL Configuration**, set **Site URL** to your
Vercel URL (and add it under **Redirect URLs**). This makes the email sign-in
link return people to the app.

### 5. Make yourself a leader (optional)
Sign in once so your account exists, then in Supabase **SQL Editor** run:

```sql
update public.profiles set role = 'admin' where id = auth.uid();
```

Sign out and back in — a **Leadership** button appears in the header.

---

## Run it locally (optional)
```bash
npm install
cp .env.example .env      # then paste your real keys into .env
npm run dev
```

---

## Privacy notes
- Check-ins and reflections are readable only by the person who wrote them,
  enforced at the database level (Row Level Security), not just in the app.
- The leadership summary returns counts only — never any individual's ratings
  or written reflections.
- The app states plainly that it is educational and pastoral, not clinical or
  emergency care, and points to crisis help.

## File map (all at top level)
```
schema.sql        run this in Supabase — tables, security rules, functions
index.html        page shell
main.jsx          app entry
App.jsx           auth, routing, data loading + saving
Home.jsx          participant dashboard
CheckIn.jsx       weekly assessment flow
Trend.jsx         growth-trend chart
Admin.jsx         leadership (anonymous totals)
constants.js      the 21 areas, scale, reflection prompts, helpers
styles.js         brand palette + styles
supabaseClient.js Supabase connection
package.json, vite.config.js, .env.example
```
