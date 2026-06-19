// Vercel serverless function — send email server-side via Resend (no user interaction).
// Admin-only: verifies the caller's Supabase token belongs to an admin.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (required); RESEND_FROM (optional).

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const SUPA = process.env.SUPABASE_URL;
  const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RK = process.env.RESEND_API_KEY;
  if (!SUPA || !SR) { res.status(500).json({ error: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env." }); return; }
  if (!RK) { res.status(500).json({ error: "RESEND_API_KEY not set — add it in Vercel to enable automatic email." }); return; }
  const FROM = process.env.RESEND_FROM || "Workspace <onboarding@resend.dev>";

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) { res.status(401).json({ error: "Not signed in" }); return; }
  const who = await fetch(SUPA + "/auth/v1/user", { headers: { apikey: SR, Authorization: "Bearer " + token } });
  if (!who.ok) { res.status(401).json({ error: "Invalid session" }); return; }
  const caller = await who.json();
  const pr = await fetch(`${SUPA}/rest/v1/profiles?id=eq.${caller.id}&select=role`, { headers: { apikey: SR, Authorization: "Bearer " + SR } });
  const prof = await pr.json().catch(() => []);
  if (!Array.isArray(prof) || !prof[0] || prof[0].role !== "admin") { res.status(403).json({ error: "Admins only" }); return; }

  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
  const { to, subject } = body;
  if (!to || !subject) { res.status(400).json({ error: "Missing recipient or subject" }); return; }
  const html = body.html || `<p>${(body.text || "").replace(/\n/g, "<br>")}</p>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RK, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { res.status(502).json({ error: j.message || j.error || ("Resend error " + r.status) }); return; }
    res.status(200).json({ ok: true, id: j.id });
  } catch (e) {
    res.status(502).json({ error: String(e && e.message ? e.message : e) });
  }
}
