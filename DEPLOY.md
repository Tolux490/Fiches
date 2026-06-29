# Hosting Fiches (phone + PC, synced)

You'll wire up **Supabase** (accounts + database + AI key) and **GitHub Pages** (the website).
Free tier covers all of this. ~15 minutes.

Files in this folder:
- `index.html` — the whole app (this is what gets hosted)
- `supabase_setup.sql` — creates your database table
- `generate.ts` — the function that hides your Anthropic key and does the AI

---

## 1. Create a Supabase project
1. Go to **supabase.com** → sign in → **New project**. Pick a name and a database password (save it).
2. Wait ~2 min for it to spin up.

## 2. Create the database table
1. Left sidebar → **SQL Editor** → **New query**.
2. Paste all of `supabase_setup.sql` → **Run**. You should see "Success".

## 3. Turn off email confirmation (optional but easiest)
For a personal app, so you can log in instantly without clicking an email link:
- **Authentication** → **Providers** → **Email** → turn **Confirm email** OFF → Save.
(Leave it ON if you'd rather verify emails — you'll just confirm once per account.)

## 4. Add your Anthropic key as a secret + deploy the function
You need the **Supabase CLI** (you've used it for PitchPool). In a terminal:

```bash
# install once if needed:  npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF      # the ref is in your project URL

# put generate.ts at: supabase/functions/generate/index.ts
mkdir -p supabase/functions/generate
cp generate.ts supabase/functions/generate/index.ts

supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
supabase functions deploy generate --no-verify-jwt
```

Get an Anthropic key at **console.anthropic.com** → API Keys. (Generation costs a tiny
amount per batch — fractions of a cent on Sonnet.)

> No terminal? You can also paste `generate.ts` into **Edge Functions → Create function**
> in the dashboard, and set the secret under **Edge Functions → Secrets**.

## 5. Put your two keys into index.html
In Supabase: **Project Settings → API**. Copy:
- **Project URL** (e.g. `https://abcd1234.supabase.co`)
- **anon public** key

Open `index.html`, find the CONFIG block near the top, and replace:
```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
```
The anon key is safe to ship in a public site — that's what it's designed for. Your
Anthropic key is NOT here; it lives only in the Supabase secret from step 4.

## 6. Host it on GitHub Pages
1. Make a new repo, e.g. `fiches`. Add your edited `index.html` to it. Commit/push.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `/root` → Save.
3. After a minute it's live at `https://YOURNAME.github.io/fiches/`.

That URL is your app. Open it on your phone and your PC.

## 7. Use it
- First visit: **Create account** (email + password).
- On your other device: open the same URL, **Sign in** with the same email/password.
- Same deck, same progress, both places. Edits sync within a second (top bar shows "synced").

---

### Notes
- **Sync model:** last write wins. If you edit on two devices at the exact same second, the
  later save wins. Fine for one person on phone+PC.
- **CORS:** the function allows all origins (`*`) so it works from `github.io`. To lock it to
  just your site later, change `Access-Control-Allow-Origin` in `generate.ts` to your Pages URL.
- **If generation fails** with "AI function isn't reachable": the function isn't deployed, or
  `ANTHROPIC_API_KEY` isn't set, or it failed to deploy. Re-check step 4.
- **Custom domain / cleaner build:** if you later want a Vite/React build instead of this
  single file, the same Supabase backend works unchanged — only the frontend hosting changes.
