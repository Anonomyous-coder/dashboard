// Vercel Cron — Friday timesheet reminder.
// For every employee who hasn't submitted a timesheet for the current week,
// inserts an in-app notification (always) and emails them (if Resend is set up).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required); RESEND_API_KEY, RESEND_FROM (optional).

export default async function handler(req, res) {
  const SUPA = process.env.SUPABASE_URL;
  const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPA || !SR) { res.status(500).json({ error: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env." }); return; }
  const h = { apikey: SR, Authorization: "Bearer " + SR, "Content-Type": "application/json" };

  // Monday (UTC) of the current week
  const now = new Date();
  const x = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  const wsISO = x.toISOString().slice(0, 10);

  try {
    const emps = await (await fetch(`${SUPA}/rest/v1/profiles?role=eq.employee&select=id,full_name,email`, { headers: h })).json();
    const subs = await (await fetch(`${SUPA}/rest/v1/timesheets?week_start=eq.${wsISO}&select=user_id`, { headers: h })).json();
    const done = new Set((Array.isArray(subs) ? subs : []).map((s) => s.user_id));
    const missing = (Array.isArray(emps) ? emps : []).filter((e) => !done.has(e.id));

    // in-app notifications (always works)
    for (const e of missing) {
      await fetch(`${SUPA}/rest/v1/notifications`, { method: "POST", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify({ user_id: e.id, type: "reminder", message: `Reminder: submit your timesheet for the week of ${wsISO}.` }) });
    }

    // optional email via Resend
    const RK = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM || "Workspace <onboarding@resend.dev>";
    let emailed = 0;
    if (RK) {
      for (const e of missing) {
        if (!e.email) continue;
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + RK, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM, to: e.email, subject: "Please submit your timesheet", html: `<p>Hi ${e.full_name || "there"},</p><p>This is a reminder to submit your timesheet for the week of <strong>${wsISO}</strong> in the Workspace dashboard.</p>` }),
        });
        if (r.ok) emailed++;
      }
    }

    res.status(200).json({ week: wsISO, employees: (Array.isArray(emps) ? emps.length : 0), missing: missing.length, notified: missing.length, emailed });
  } catch (e) {
    res.status(502).json({ error: String(e && e.message ? e.message : e) });
  }
}
