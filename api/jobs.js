// Vercel serverless function — daily SDR/BDR job search via the Adzuna API.
// Keys are kept server-side in environment variables (set in Vercel project settings):
//   ADZUNA_APP_ID, ADZUNA_APP_KEY
// Called by the dashboard's Job Search page and by the daily cron (see vercel.json).

export default async function handler(req, res) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    res.status(500).json({ error: "Adzuna keys not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY in Vercel → Settings → Environment Variables." });
    return;
  }

  const q = req.query || {};
  const country = (q.country || "us").toLowerCase();
  // Roles we care about (any of these), plus a remote requirement.
  const whatOr = q.what_or ||
    "SDR BDR \"sales development representative\" \"business development representative\" " +
    "\"medical coder\" \"medical coding\" \"medical billing\" \"coding specialist\" CPC";
  const pages = Math.min(parseInt(q.pages || "5", 10) || 5, 10); // up to ~250 results

  const jobs = [];
  try {
    for (let p = 1; p <= pages; p++) {
      const url =
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${p}` +
        `?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}` +
        `&results_per_page=50&what=remote&what_or=${encodeURIComponent(whatOr)}` +
        `&max_days_old=14&sort_by=date&content-type=application/json`;
      const r = await fetch(url);
      if (!r.ok) break;
      const data = await r.json();
      const results = data.results || [];
      for (const o of results) {
        const title = (o.title || "").toLowerCase();
        const loc = ((o.location && o.location.display_name) || "").toLowerCase();
        const desc = (o.description || "").toLowerCase();
        const text = title + " " + desc;
        const isRemote = /remote|work from home|wfh|anywhere/.test(title + " " + loc + " " + desc);
        const isSales = /\b(sdr|bdr|sales development|business development)\b/.test(text);
        const isCoding = /\b(medical cod|medical bill|coding specialist|cpc\b|ccs\b|icd-?10|inpatient coder|outpatient coder|risk adjustment)\b/.test(text);
        if (!isRemote || !(isSales || isCoding)) continue;
        const tag = isCoding ? "Medical Coding" : (/\b(bdr|business development)\b/.test(title) ? "BDR" : "SDR");
        jobs.push({
          id: String(o.id),
          company: (o.company && o.company.display_name) || "—",
          role: o.title || "Role",
          location: (o.location && o.location.display_name) || "Remote",
          salary: o.salary_min
            ? "$" + Math.round(o.salary_min / 1000) + "k" + (o.salary_max && o.salary_max !== o.salary_min ? "–$" + Math.round(o.salary_max / 1000) + "k" : "")
            : "—",
          type: o.contract_time === "part_time" ? "Part-time" : (o.contract_type === "contract" ? "Contract" : "Full-time"),
          tags: ["Remote", tag],
          posted: o.created,
          applyUrl: o.redirect_url || "",
        });
      }
      if (results.length < 50) break;
    }

    // de-dupe by id
    const seen = new Set();
    const unique = jobs.filter((j) => (seen.has(j.id) ? false : (seen.add(j.id), true)));

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
    res.status(200).json({ jobs: unique, count: unique.length, fetched: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ error: "Adzuna request failed: " + String(e && e.message ? e.message : e) });
  }
}
