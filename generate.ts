// Fiches — "generate" Edge Function
// Hides your Anthropic API key on the server. The browser never sees it.
//
// Deploy (Supabase CLI):
//   supabase functions deploy generate --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// (SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  try {
    // Require a signed-in Supabase user so the key can't be abused publicly.
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const check = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!check.ok) return json({ error: "unauthorized" }, 401);

    const { system, user } = await req.json();
    if (!system || !user) return json({ error: "bad request" }, 400);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const data = await r.json();
    if (!r.ok) return json({ error: data?.error?.message || "anthropic error" }, 502);

    const text = (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
