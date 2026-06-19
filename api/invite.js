// Vercel serverless function — send a team-member invite email via Resend.
// Env vars (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY  (required)  — from https://resend.com
//   RESEND_FROM     (optional)  — a verified sender, e.g. "Workspace <invites@yourdomain.com>".
//                                 Defaults to Resend's sandbox sender, which can only
//                                 deliver to your own Resend account email until you
//                                 verify a domain.

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }

  const key = process.env.RESEND_API_KEY;
  if (!key) { res.status(500).json({ error: "RESEND_API_KEY not set in Vercel → Settings → Environment Variables." }); return; }
  const from = process.env.RESEND_FROM || "Workspace <onboarding@resend.dev>";

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const to = (body.to || "").trim();
  const name = body.name || "there";
  const inviter = body.inviter || "your team";
  const appUrl = body.appUrl || "https://dashboard-noah25.vercel.app/";
  if (!to) { res.status(400).json({ error: "Missing recipient email" }); return; }

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1c2430">
      <h2 style="color:#2563eb">You're invited to the Workspace dashboard</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p><strong>${escapeHtml(inviter)}</strong> has added you to the team Workspace dashboard.</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(appUrl)}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">Open the dashboard</a>
      </p>
      <p style="color:#5a6675;font-size:13px">Or paste this link into your browser:<br>${escapeHtml(appUrl)}</p>
      <p style="color:#8a94a3;font-size:12px;margin-top:28px">Sent via the Workspace dashboard.</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `${inviter} invited you to the Workspace dashboard`, html }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { res.status(502).json({ error: data.message || ("Resend error " + r.status) }); return; }
    res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    res.status(502).json({ error: String(e && e.message ? e.message : e) });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
