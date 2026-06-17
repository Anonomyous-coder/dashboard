/* ============================================================
   Views — one entry per route. Each: {title, subtitle, render(), mount(root)}
   ============================================================ */
(function () {
  const S = window.Store;
  const U = window.UI;
  const Views = {};

  // shared small builders -------------------------------------------------
  const stat = ({ label, value, icon, tone = "primary", trend }) => `
    <div class="stat">
      <div class="stat-top">
        <span class="stat-label">${U.esc(label)}</span>
        <span class="stat-ico bg-${tone}">${icon}</span>
      </div>
      <span class="stat-value">${value}</span>
      ${trend ? `<span class="stat-trend ${trend.dir === "down" ? "trend-down" : "trend-up"}">${trend.dir === "down" ? "▼" : "▲"} ${U.esc(trend.text)}</span>` : ""}
    </div>`;

  const rowActions = (id, edit = true) => `
    <div class="flex gap-8 nowrap">
      ${edit ? `<button class="btn sm ghost" data-act="edit" data-id="${id}">Edit</button>` : ""}
      <button class="btn sm ghost" data-act="del" data-id="${id}" style="color:var(--danger)">Delete</button>
    </div>`;

  const barChart = (data) => {
    const max = Math.max(1, ...data.map((d) => d.value));
    return `<div class="chart">${data
      .map(
        (d) => `<div class="bar-col">
          <span class="col-val">${d.value}</span>
          <div class="col-fill" style="height:${(d.value / max) * 100}%"></div>
          <span class="col-label">${U.esc(d.label)}</span>
        </div>`
      )
      .join("")}</div>`;
  };

  /* =========================================================
     1. MY DASHBOARD
  ========================================================= */
  Views.dashboard = {
    title: "My Dashboard",
    render() {
      const d = S.get();
      const offers = d.applications.filter((a) => a.status === "offer").length;
      const interviews = d.applications.filter((a) => a.status === "interview").length;
      const weekMs = d.timeEntries
        .filter((e) => Date.now() - new Date(e.clockIn) < 7 * 864e5)
        .reduce((s, e) => s + (new Date(e.clockOut) - new Date(e.clockIn)), 0);
      const pendingExp = d.transactions.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);

      // activity feed
      const feed = [];
      d.applications.slice(0, 3).forEach((a) =>
        feed.push({ icon: "💼", tone: "primary", title: `${a.role} @ ${a.company}`, sub: "Job application — " + U.cap(a.status), time: a.applied }));
      d.contracts.slice(0, 2).forEach((c) =>
        feed.push({ icon: "📄", tone: "info", title: c.title, sub: "Contract — " + U.cap(c.status), time: c.sent || c.due }));
      d.applicants.slice(0, 2).forEach((a) =>
        feed.push({ icon: "🧑‍💼", tone: "warn", title: a.name, sub: "Applicant — " + U.cap(a.stage), time: a.applied }));
      feed.sort((a, b) => new Date(b.time) - new Date(a.time));

      const upcoming = d.applications
        .filter((a) => a.interviewDate && new Date(a.interviewDate) > Date.now())
        .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));

      return `
      <div class="page-head">
        <div class="ph-text"><h1>Welcome back, ${U.esc(d.profile.name.split(" ")[0])} 👋</h1>
          <p>Here's what's happening across your workspace today.</p></div>
        <div class="ph-actions">
          <button class="btn" data-go="jobsearch">🔍 Find jobs</button>
          <button class="btn primary" data-go="timetracker">⏱ Time tracker</button>
        </div>
      </div>

      <div class="grid cols-4">
        ${stat({ label: "Active applications", value: d.applications.filter((a) => !["rejected"].includes(a.status)).length, icon: "💼", tone: "primary", trend: { dir: "up", text: interviews + " in interview" } })}
        ${stat({ label: "Offers", value: offers, icon: "🎉", tone: "success", trend: offers ? { dir: "up", text: "Congrats!" } : null })}
        ${stat({ label: "Hours this week", value: U.hours(weekMs), icon: "⏱", tone: "info" })}
        ${stat({ label: "Pending expenses", value: U.money(pendingExp), icon: "💳", tone: "warn", trend: { dir: "down", text: "Needs review" } })}
      </div>

      <div class="grid cols-2 mt-24">
        <div class="card">
          <div class="card-head"><h3>Recent activity</h3></div>
          <div class="card-pad">
            <div class="list">
              ${feed.slice(0, 6).map((f) => `
                <div class="list-item">
                  <div class="li-ico bg-${f.tone}">${f.icon}</div>
                  <div class="li-text"><div class="li-title">${U.esc(f.title)}</div><div class="li-sub">${U.esc(f.sub)}</div></div>
                  <div class="li-time">${U.ago(f.time)}</div>
                </div>`).join("")}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Upcoming interviews</h3><div class="ch-actions"><button class="btn sm ghost" data-go="applications">View all</button></div></div>
          <div class="card-pad">
            ${upcoming.length ? `<div class="list">${upcoming.map((a) => `
              <div class="list-item">
                <div class="li-ico bg-warn">📅</div>
                <div class="li-text"><div class="li-title">${U.esc(a.company)}</div><div class="li-sub">${U.esc(a.role)}</div></div>
                <div class="li-time">${U.until(a.interviewDate)}<br><span class="faint">${U.dateShort(a.interviewDate)}</span></div>
              </div>`).join("")}</div>`
              : U.empty("📅", "No interviews scheduled yet.")}
          </div>
        </div>
      </div>

      <div class="grid cols-3 mt-24">
        <div class="card card-pad">
          <div class="flex between center"><span class="muted">Team members</span><span class="li-ico bg-primary">👥</span></div>
          <div class="stat-value mt-8">${d.team.length}</div>
          <button class="btn sm ghost mt-8" data-go="team" style="align-self:flex-start">Manage team →</button>
        </div>
        <div class="card card-pad">
          <div class="flex between center"><span class="muted">Open applicants</span><span class="li-ico bg-warn">🧑‍💼</span></div>
          <div class="stat-value mt-8">${d.applicants.filter((a) => !["hired", "rejected"].includes(a.stage)).length}</div>
          <button class="btn sm ghost mt-8" data-go="applicants" style="align-self:flex-start">Review pipeline →</button>
        </div>
        <div class="card card-pad">
          <div class="flex between center"><span class="muted">Active contracts</span><span class="li-ico bg-info">📄</span></div>
          <div class="stat-value mt-8">${d.contracts.filter((c) => ["sent", "signed"].includes(c.status)).length}</div>
          <button class="btn sm ghost mt-8" data-go="contracts" style="align-self:flex-start">View contracts →</button>
        </div>
      </div>`;
    },
    mount(root) {
      root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => window.App.go(b.dataset.go)));
    },
  };

  /* =========================================================
     2. JOB APPLICATIONS
  ========================================================= */
  const APP_STATUSES = ["applied", "interview", "offer", "rejected"];
  let appFilter = "all";
  Views.applications = {
    title: "Job Applications",
    render() {
      const d = S.get();
      const counts = APP_STATUSES.reduce((m, s) => ((m[s] = d.applications.filter((a) => a.status === s).length), m), {});
      const list = appFilter === "all" ? d.applications : d.applications.filter((a) => a.status === appFilter);

      return `
      <div class="page-head">
        <div class="ph-text"><h1>Job Applications</h1><p>Track every application from applied to offer.</p></div>
        <div class="ph-actions"><button class="btn primary" id="addApp">＋ Add application</button></div>
      </div>

      <div class="grid cols-4">
        ${stat({ label: "Applied", value: counts.applied, icon: "📨", tone: "info" })}
        ${stat({ label: "Interviewing", value: counts.interview, icon: "🗣", tone: "warn" })}
        ${stat({ label: "Offers", value: counts.offer, icon: "🎉", tone: "success" })}
        ${stat({ label: "Rejected", value: counts.rejected, icon: "🚫", tone: "danger" })}
      </div>

      <div class="card mt-24">
        <div class="card-head">
          <div class="flex gap-8" id="filters">
            ${["all", ...APP_STATUSES].map((s) => `<button class="chip ${appFilter === s ? "" : ""}" data-filter="${s}" style="${appFilter === s ? "background:var(--primary);color:#fff;border-color:var(--primary)" : ""}">${s === "all" ? "All" : U.cap(s)}</button>`).join("")}
          </div>
        </div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Location</th><th>Salary</th><th>Applied</th><th></th></tr></thead>
            <tbody>
              ${list.length ? list.map((a) => `
                <tr>
                  <td><div class="row-main">${U.esc(a.company)}</div><div class="row-sub">${U.esc(a.source || "")}</div></td>
                  <td>${U.esc(a.role)}</td>
                  <td>${U.badge(a.status)}${a.interviewDate && new Date(a.interviewDate) > Date.now() ? `<div class="row-sub">📅 ${U.dateShort(a.interviewDate)}</div>` : ""}</td>
                  <td class="muted">${U.esc(a.location || "—")}</td>
                  <td class="muted">${U.esc(a.salary || "—")}</td>
                  <td class="muted nowrap">${U.ago(a.applied)}</td>
                  <td>${rowActions(a.id)}</td>
                </tr>`).join("")
                : `<tr><td colspan="7">${U.empty("💼", "No applications in this view.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    },
    mount(root) {
      const open = (app) => {
        U.formModal({
          title: app ? "Edit application" : "Add application",
          submitLabel: app ? "Save changes" : "Add application",
          values: app || {},
          fields: [
            { name: "company", label: "Company", required: true, half: true },
            { name: "role", label: "Role", required: true, half: true },
            { name: "status", label: "Status", type: "select", options: APP_STATUSES.map((s) => ({ value: s, label: U.cap(s) })), half: true },
            { name: "source", label: "Source", placeholder: "LinkedIn, Referral…", half: true },
            { name: "location", label: "Location", half: true },
            { name: "salary", label: "Salary", placeholder: "$140k", half: true },
            { name: "interviewDate", label: "Interview date", type: "date", half: true },
            { name: "applied", label: "Date applied", type: "date", value: new Date().toISOString().slice(0, 10), half: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ],
          onSubmit: (data) => {
            data.applied = data.applied ? new Date(data.applied).toISOString() : new Date().toISOString();
            data.interviewDate = data.interviewDate ? new Date(data.interviewDate).toISOString() : null;
            if (app) { S.update("applications", app.id, data); U.toast("Application updated", "success"); }
            else { S.add("applications", data); U.toast("Application added", "success"); }
            window.App.rerender();
          },
        });
      };
      root.querySelector("#addApp").onclick = () => open(null);
      root.querySelectorAll("#filters [data-filter]").forEach((b) => (b.onclick = () => { appFilter = b.dataset.filter; window.App.rerender(); }));
      root.querySelectorAll('[data-act="edit"]').forEach((b) => (b.onclick = () => open(S.find("applications", b.dataset.id))));
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Delete this application?", () => { S.remove("applications", b.dataset.id); U.toast("Deleted"); window.App.rerender(); })));
    },
  };

  /* =========================================================
     3. TIME TRACKER
  ========================================================= */
  Views.timetracker = {
    title: "Time Tracker",
    render() {
      const d = S.get();
      const active = d.activeClock;
      const todayMs = d.timeEntries
        .filter((e) => new Date(e.clockIn).toDateString() === new Date().toDateString())
        .reduce((s, e) => s + (new Date(e.clockOut) - new Date(e.clockIn)), 0);
      const weekMs = d.timeEntries
        .filter((e) => Date.now() - new Date(e.clockIn) < 7 * 864e5)
        .reduce((s, e) => s + (new Date(e.clockOut) - new Date(e.clockIn)), 0);
      const earnings = (weekMs / 36e5) * (d.profile.hourlyRate || 0);

      return `
      <div class="page-head">
        <div class="ph-text"><h1>Time Tracker</h1><p>Clock in and out, and review your logged hours.</p></div>
      </div>

      <div class="grid cols-2">
        <div class="card card-pad" style="display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center">
          <div class="clock-pill ${active ? "on" : ""}"><span class="dot"></span><span>${active ? "Clocked in" : "Clocked out"}</span></div>
          <div class="timer-display" id="liveTimer">${active ? U.dur(Date.now() - new Date(active.clockIn)) : "00:00:00"}</div>
          ${active ? `<div class="muted">Working on <strong>${U.esc(active.project)}</strong>${active.note ? " · " + U.esc(active.note) : ""}</div>
                      <div class="faint">Since ${U.time(active.clockIn)}</div>
                      <button class="btn danger" id="clockBtn" style="min-width:160px">⏹ Clock out</button>`
            : `<input class="search-input" id="ctProject" placeholder="What are you working on?" style="max-width:320px;text-align:center"/>
               <button class="btn primary" id="clockBtn" style="min-width:160px">▶ Clock in</button>`}
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr;align-content:start">
          ${stat({ label: "Today", value: U.hours(todayMs), icon: "📆", tone: "primary" })}
          ${stat({ label: "This week", value: U.hours(weekMs), icon: "📊", tone: "info" })}
          ${stat({ label: "Est. earnings (wk)", value: U.money(earnings), icon: "💵", tone: "success" })}
          ${stat({ label: "Entries", value: d.timeEntries.length, icon: "🧾", tone: "warn" })}
        </div>
      </div>

      <div class="card mt-24">
        <div class="card-head"><h3>Time entries</h3></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Project</th><th>Note</th><th>Date</th><th>Clock in</th><th>Clock out</th><th>Duration</th><th></th></tr></thead>
            <tbody>
              ${d.timeEntries.length ? d.timeEntries.map((e) => `
                <tr>
                  <td class="row-main">${U.esc(e.project)}</td>
                  <td class="muted">${U.esc(e.note || "—")}</td>
                  <td class="muted nowrap">${U.dateShort(e.clockIn)}</td>
                  <td class="muted">${U.time(e.clockIn)}</td>
                  <td class="muted">${U.time(e.clockOut)}</td>
                  <td class="row-main nowrap">${U.hours(new Date(e.clockOut) - new Date(e.clockIn))}</td>
                  <td><button class="btn sm ghost" data-act="del" data-id="${e.id}" style="color:var(--danger)">Delete</button></td>
                </tr>`).join("")
                : `<tr><td colspan="7">${U.empty("⏱", "No time logged yet. Clock in to get started.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    },
    mount(root) {
      const d = S.get();
      const btn = root.querySelector("#clockBtn");
      if (btn) btn.onclick = () => {
        if (d.activeClock) { S.clockOut(); U.toast("Clocked out", "success"); }
        else { const p = (root.querySelector("#ctProject")?.value || "").trim(); S.clockIn(p || "General"); U.toast("Clocked in", "success"); }
        window.App.rerender();
        window.App.refreshClockPill();
      };
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Delete this time entry?", () => { S.remove("timeEntries", b.dataset.id); U.toast("Deleted"); window.App.rerender(); })));

      // live timer
      const timer = root.querySelector("#liveTimer");
      if (timer && d.activeClock) {
        clearInterval(window.__ctTimer);
        window.__ctTimer = setInterval(() => {
          const a = S.get().activeClock;
          if (!a) { clearInterval(window.__ctTimer); return; }
          timer.textContent = U.dur(Date.now() - new Date(a.clockIn));
        }, 1000);
      }
    },
  };

  /* =========================================================
     4. INSIGHTS
  ========================================================= */
  Views.insights = {
    title: "Insights",
    render() {
      const d = S.get();
      const total = d.applications.length || 1;
      const counts = APP_STATUSES.reduce((m, s) => ((m[s] = d.applications.filter((a) => a.status === s).length), m), {});
      const offerRate = Math.round((counts.offer / total) * 100);
      const interviewRate = Math.round(((counts.interview + counts.offer) / total) * 100);

      // last 6 weeks of hours
      const weeks = [];
      for (let w = 5; w >= 0; w--) {
        const start = Date.now() - (w + 1) * 7 * 864e5;
        const end = Date.now() - w * 7 * 864e5;
        const ms = d.timeEntries
          .filter((e) => { const t = new Date(e.clockIn).getTime(); return t >= start && t < end; })
          .reduce((s, e) => s + (new Date(e.clockOut) - new Date(e.clockIn)), 0);
        weeks.push({ label: w === 0 ? "This wk" : w + "w ago", value: Math.round(ms / 36e5) });
      }

      const donut = [
        { label: "Applied", value: counts.applied, color: "var(--info)" },
        { label: "Interview", value: counts.interview, color: "var(--warn)" },
        { label: "Offer", value: counts.offer, color: "var(--success)" },
        { label: "Rejected", value: counts.rejected, color: "var(--danger)" },
      ];
      let acc = 0;
      const seg = donut.map((s) => { const start = acc / total * 360; acc += s.value; const end = acc / total * 360; return `${s.color} ${start}deg ${end}deg`; }).join(", ");

      // expense breakdown
      const expCats = {};
      d.transactions.filter((t) => t.type === "expense").forEach((t) => (expCats[t.category] = (expCats[t.category] || 0) + t.amount));
      const expData = Object.entries(expCats).map(([label, value]) => ({ label, value: Math.round(value) }));

      return `
      <div class="page-head"><div class="ph-text"><h1>Insights</h1><p>Analytics across your job search, time, and finances.</p></div></div>

      <div class="grid cols-4">
        ${stat({ label: "Offer rate", value: offerRate + "%", icon: "🎯", tone: "success" })}
        ${stat({ label: "Interview rate", value: interviewRate + "%", icon: "📈", tone: "primary" })}
        ${stat({ label: "Total applications", value: d.applications.length, icon: "💼", tone: "info" })}
        ${stat({ label: "Avg hrs / week", value: (weeks.reduce((s, w) => s + w.value, 0) / 6).toFixed(1), icon: "⏱", tone: "warn" })}
      </div>

      <div class="grid cols-2 mt-24">
        <div class="card">
          <div class="card-head"><h3>Hours logged — last 6 weeks</h3></div>
          <div class="card-pad">${barChart(weeks)}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Application funnel</h3></div>
          <div class="card-pad flex gap-16 center" style="flex-wrap:wrap">
            <div style="width:150px;height:150px;border-radius:50%;background:conic-gradient(${seg});position:relative;flex-shrink:0">
              <div style="position:absolute;inset:24px;border-radius:50%;background:var(--surface);display:grid;place-items:center;text-align:center">
                <div><div style="font-size:22px;font-weight:800">${total}</div><div class="faint" style="font-size:11px">total</div></div>
              </div>
            </div>
            <div class="legend" style="flex:1;min-width:140px">
              ${donut.map((s) => `<div class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}<span style="margin-left:auto;font-weight:700">${s.value}</span></div>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-24">
        <div class="card-head"><h3>Expenses by category</h3></div>
        <div class="card-pad">${expData.length ? barChart(expData) : U.empty("💳", "No expenses recorded.")}</div>
      </div>`;
    },
    mount() {},
  };

  /* =========================================================
     5. JOB SEARCH
  ========================================================= */
  let jobQuery = "", jobType = "all";
  Views.jobsearch = {
    title: "Job Search",
    render() {
      const d = S.get();
      const savedIds = new Set(d.savedJobs.map((j) => j.id));
      const q = jobQuery.toLowerCase();
      let list = d.jobMarket.filter((j) =>
        (jobType === "all" || j.type === jobType) &&
        (!q || (j.role + j.company + j.location + j.tags.join(" ")).toLowerCase().includes(q)));

      return `
      <div class="page-head"><div class="ph-text"><h1>Job Search</h1><p>Browse newly posted roles and save the ones you like.</p></div></div>

      <div class="card card-pad">
        <div class="flex gap-12 center" style="flex-wrap:wrap">
          <input class="search-input" id="jobSearch" placeholder="🔍 Search role, company, location, skill…" value="${U.esc(jobQuery)}"/>
          <select class="field" id="jobType" style="padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text)">
            ${["all", "Full-time", "Contract"].map((t) => `<option value="${t}" ${jobType === t ? "selected" : ""}>${t === "all" ? "All types" : t}</option>`).join("")}
          </select>
          <span class="chip">${list.length} results</span>
        </div>
      </div>

      <div class="grid cols-2 mt-24">
        ${list.length ? list.map((j) => `
          <div class="card card-pad">
            <div class="flex between center">
              <div class="flex gap-12 center">
                <div class="avatar" style="border-radius:11px">${U.esc(j.company[0])}</div>
                <div><div class="row-main" style="font-size:15px">${U.esc(j.role)}</div><div class="row-sub">${U.esc(j.company)} · ${U.esc(j.location)}</div></div>
              </div>
              ${new Date(j.posted).toDateString() === new Date().toDateString() ? `<span class="badge b-offer">New</span>` : ""}
            </div>
            <div class="flex gap-8 mt-16" style="flex-wrap:wrap">
              <span class="chip">${U.esc(j.type)}</span>
              <span class="chip">💰 ${U.esc(j.salary)}</span>
              ${j.tags.map((t) => `<span class="chip">${U.esc(t)}</span>`).join("")}
            </div>
            <div class="flex between center mt-16">
              <span class="faint" style="font-size:12px">Posted ${U.ago(j.posted)}</span>
              <button class="btn ${savedIds.has(j.id) ? "" : "primary"} sm" data-save="${j.id}" ${savedIds.has(j.id) ? "disabled" : ""}>
                ${savedIds.has(j.id) ? "✓ Saved to applications" : "＋ Save & apply"}
              </button>
            </div>
          </div>`).join("")
          : `<div style="grid-column:1/-1">${U.empty("🔍", "No jobs match your search.")}</div>`}
      </div>`;
    },
    mount(root) {
      const search = root.querySelector("#jobSearch");
      let t;
      search.oninput = () => { clearTimeout(t); t = setTimeout(() => { jobQuery = search.value; window.App.rerender(); const s = document.getElementById("jobSearch"); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 220); };
      root.querySelector("#jobType").onchange = (e) => { jobType = e.target.value; window.App.rerender(); };
      root.querySelectorAll("[data-save]").forEach((b) => (b.onclick = () => {
        const job = S.find("jobMarket", b.dataset.save);
        if (!job) return;
        S.get().savedJobs.push({ id: job.id });
        S.save();
        S.add("applications", {
          company: job.company, role: job.role, status: "applied", location: job.location,
          salary: job.salary, source: "Job Search", applied: new Date().toISOString(), notes: "Saved from Job Search", interviewDate: null,
        });
        U.toast("Saved to Job Applications", "success");
        window.App.rerender();
      }));
    },
  };

  /* =========================================================
     6. MY ACCOUNT
  ========================================================= */
  Views.account = {
    title: "My Account",
    render() {
      const p = S.get().profile;
      return `
      <div class="page-head"><div class="ph-text"><h1>My Account</h1><p>Manage your profile and preferences.</p></div></div>

      <div class="grid cols-2">
        <div class="card card-pad" style="text-align:center">
          <div class="avatar" style="width:84px;height:84px;font-size:30px;margin:0 auto 14px">${U.initials(p.name)}</div>
          <div class="row-main" style="font-size:18px">${U.esc(p.name)}</div>
          <div class="muted">${U.esc(p.title)}</div>
          <div class="flex gap-8 center mt-16" style="justify-content:center;flex-wrap:wrap">
            <span class="chip">📍 ${U.esc(p.location || "—")}</span>
            <span class="chip">${U.esc(p.role)}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Profile details</h3></div>
          <div class="card-pad">
            <form id="profileForm">
              <div class="field-row">
                <div class="field"><label>Full name</label><input name="name" value="${U.esc(p.name)}"/></div>
                <div class="field"><label>Job title</label><input name="title" value="${U.esc(p.title)}"/></div>
              </div>
              <div class="field-row">
                <div class="field"><label>Email</label><input type="email" name="email" value="${U.esc(p.email)}"/></div>
                <div class="field"><label>Phone</label><input name="phone" value="${U.esc(p.phone)}"/></div>
              </div>
              <div class="field-row">
                <div class="field"><label>Location</label><input name="location" value="${U.esc(p.location)}"/></div>
                <div class="field"><label>Hourly rate ($)</label><input type="number" name="hourlyRate" value="${U.esc(p.hourlyRate)}"/></div>
              </div>
              <button class="btn primary" type="submit">Save changes</button>
            </form>
          </div>
        </div>
      </div>

      <div class="card mt-24">
        <div class="card-head"><h3>Data & preferences</h3></div>
        <div class="card-pad flex between center" style="flex-wrap:wrap;gap:12px">
          <div><div class="row-main">Reset workspace data</div><div class="row-sub">Restore all sections to the original sample data.</div></div>
          <button class="btn danger" id="resetData">Reset all data</button>
        </div>
      </div>`;
    },
    mount(root) {
      root.querySelector("#profileForm").onsubmit = (e) => {
        e.preventDefault();
        const f = e.target;
        S.setProfile({
          name: f.name.value.trim(), title: f.title.value.trim(), email: f.email.value.trim(),
          phone: f.phone.value.trim(), location: f.location.value.trim(), hourlyRate: Number(f.hourlyRate.value) || 0,
        });
        U.toast("Profile saved", "success");
        window.App.refreshSidebarUser();
      };
      root.querySelector("#resetData").onclick = () =>
        U.confirm("This will erase your changes and restore sample data. Continue?", () => {
          S.reset(); U.toast("Workspace reset", "success"); window.App.rerender(); window.App.refreshSidebarUser(); window.App.refreshClockPill();
        }, { yes: "Reset" });
    },
  };

  /* =========================================================
     7. SOPs (document hosting)
  ========================================================= */
  Views.sops = {
    title: "SOPs",
    render() {
      const d = S.get();
      return `
      <div class="page-head">
        <div class="ph-text"><h1>SOPs & Documents</h1><p>Upload, host, and version your standard operating procedures.</p></div>
        <div class="ph-actions"><button class="btn primary" id="uploadDoc">⬆ Upload document</button></div>
      </div>

      <div class="dropzone mt-8" id="dropzone">
        <div class="dz-ico">📁</div>
        <div><strong>Drag & drop files here</strong> or click to browse</div>
        <div class="faint" style="font-size:12px;margin-top:4px">PDF, DOCX, XLSX — stored locally in this workspace</div>
        <input type="file" id="fileInput" multiple style="display:none"/>
      </div>

      <div class="card mt-24">
        <div class="card-head"><h3>Document library</h3><div class="ch-actions"><span class="chip">${d.sops.length} files</span></div></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Document</th><th>Category</th><th>Version</th><th>Size</th><th>Uploaded by</th><th>Date</th><th></th></tr></thead>
            <tbody>
              ${d.sops.length ? d.sops.map((s) => `
                <tr>
                  <td><div class="flex gap-12 center"><div class="li-ico bg-info">${fileIcon(s.fileName)}</div>
                    <div><div class="row-main">${U.esc(s.title)}</div><div class="row-sub">${U.esc(s.fileName)}</div></div></div></td>
                  <td><span class="chip">${U.esc(s.category)}</span></td>
                  <td class="muted">${U.esc(s.version)}</td>
                  <td class="muted nowrap">${U.fileSize(s.size)}</td>
                  <td class="muted">${U.esc(s.uploadedBy)}</td>
                  <td class="muted nowrap">${U.dateShort(s.uploaded)}</td>
                  <td>${rowActions(s.id, true)}</td>
                </tr>`).join("")
                : `<tr><td colspan="7">${U.empty("📄", "No documents yet. Upload your first SOP.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    },
    mount(root) {
      const fileInput = root.querySelector("#fileInput");
      const dz = root.querySelector("#dropzone");
      const addFiles = (files) => {
        [...files].forEach((f) =>
          S.add("sops", {
            title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            category: "Uncategorized", version: "v1.0", fileName: f.name, size: f.size,
            uploadedBy: S.get().profile.name, uploaded: new Date().toISOString(),
          }));
        if (files.length) { U.toast(files.length + " file(s) uploaded", "success"); window.App.rerender(); }
      };
      dz.onclick = () => fileInput.click();
      fileInput.onchange = (e) => addFiles(e.target.files);
      dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("drag"); };
      dz.ondragleave = () => dz.classList.remove("drag");
      dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("drag"); addFiles(e.dataTransfer.files); };

      root.querySelector("#uploadDoc").onclick = () => openDocForm(null);
      root.querySelectorAll('[data-act="edit"]').forEach((b) => (b.onclick = () => openDocForm(S.find("sops", b.dataset.id))));
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Delete this document?", () => { S.remove("sops", b.dataset.id); U.toast("Deleted"); window.App.rerender(); })));

      function openDocForm(doc) {
        U.formModal({
          title: doc ? "Edit document" : "Add document",
          submitLabel: doc ? "Save" : "Add",
          values: doc || {},
          fields: [
            { name: "title", label: "Title", required: true },
            { name: "category", label: "Category", type: "select", options: ["Operations", "HR", "Finance", "Marketing", "Legal", "Uncategorized"].map((c) => ({ value: c, label: c })), half: true },
            { name: "version", label: "Version", placeholder: "v1.0", half: true },
            { name: "fileName", label: "File name", placeholder: "document.pdf", required: true },
          ],
          onSubmit: (data) => {
            if (doc) { S.update("sops", doc.id, data); U.toast("Updated", "success"); }
            else { S.add("sops", { ...data, size: 102400, uploadedBy: S.get().profile.name, uploaded: new Date().toISOString() }); U.toast("Added", "success"); }
            window.App.rerender();
          },
        });
      }
    },
  };
  const fileIcon = (name = "") => {
    const e = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(e)) return "📕";
    if (["doc", "docx"].includes(e)) return "📘";
    if (["xls", "xlsx", "csv"].includes(e)) return "📗";
    if (["png", "jpg", "jpeg", "gif"].includes(e)) return "🖼";
    return "📄";
  };

  /* =========================================================
     8. CONTRACTS
  ========================================================= */
  const CONTRACT_STATUSES = ["draft", "sent", "signed", "declined", "expired"];
  Views.contracts = {
    title: "Contracts",
    render() {
      const d = S.get();
      const totalValue = d.contracts.filter((c) => c.status === "signed").reduce((s, c) => s + c.value, 0);
      return `
      <div class="page-head">
        <div class="ph-text"><h1>Contracts</h1><p>Draft, send out, and track the status of agreements.</p></div>
        <div class="ph-actions"><button class="btn primary" id="addContract">＋ New contract</button></div>
      </div>

      <div class="grid cols-4">
        ${stat({ label: "Total contracts", value: d.contracts.length, icon: "📄", tone: "primary" })}
        ${stat({ label: "Awaiting signature", value: d.contracts.filter((c) => c.status === "sent").length, icon: "✍️", tone: "info" })}
        ${stat({ label: "Signed", value: d.contracts.filter((c) => c.status === "signed").length, icon: "✅", tone: "success" })}
        ${stat({ label: "Signed value", value: U.money(totalValue), icon: "💰", tone: "warn" })}
      </div>

      <div class="card mt-24">
        <div class="card-head"><h3>All contracts</h3></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Contract</th><th>Counterparty</th><th>Value</th><th>Status</th><th>Sent</th><th>Due</th><th></th></tr></thead>
            <tbody>
              ${d.contracts.length ? d.contracts.map((c) => `
                <tr>
                  <td class="row-main">${U.esc(c.title)}</td>
                  <td class="muted">${U.esc(c.party)}</td>
                  <td class="muted">${c.value ? U.money(c.value) : "—"}</td>
                  <td>${U.badge(c.status)}</td>
                  <td class="muted nowrap">${c.sent ? U.dateShort(c.sent) : "—"}</td>
                  <td class="muted nowrap">${U.dateShort(c.due)}</td>
                  <td>
                    <div class="flex gap-8 nowrap">
                      ${c.status === "draft" ? `<button class="btn sm" data-send="${c.id}">Send</button>` : ""}
                      <button class="btn sm ghost" data-act="edit" data-id="${c.id}">Edit</button>
                      <button class="btn sm ghost" data-act="del" data-id="${c.id}" style="color:var(--danger)">Delete</button>
                    </div>
                  </td>
                </tr>`).join("")
                : `<tr><td colspan="7">${U.empty("📄", "No contracts yet.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    },
    mount(root) {
      const open = (c) => {
        U.formModal({
          title: c ? "Edit contract" : "New contract",
          submitLabel: c ? "Save" : "Create",
          values: c || {},
          fields: [
            { name: "title", label: "Contract title", required: true },
            { name: "party", label: "Counterparty", required: true, half: true },
            { name: "value", label: "Value ($)", type: "number", half: true },
            { name: "status", label: "Status", type: "select", options: CONTRACT_STATUSES.map((s) => ({ value: s, label: U.cap(s) })), half: true },
            { name: "due", label: "Due date", type: "date", half: true },
          ],
          onSubmit: (data) => {
            data.value = Number(data.value) || 0;
            data.due = data.due ? new Date(data.due).toISOString() : new Date().toISOString();
            if (c) { S.update("contracts", c.id, data); U.toast("Updated", "success"); }
            else { S.add("contracts", { ...data, sent: data.status === "draft" ? null : new Date().toISOString() }); U.toast("Created", "success"); }
            window.App.rerender();
          },
        });
      };
      root.querySelector("#addContract").onclick = () => open(null);
      root.querySelectorAll("[data-send]").forEach((b) => (b.onclick = () => {
        S.update("contracts", b.dataset.send, { status: "sent", sent: new Date().toISOString() });
        U.toast("Contract sent ✉️", "success"); window.App.rerender();
      }));
      root.querySelectorAll('[data-act="edit"]').forEach((b) => (b.onclick = () => open(S.find("contracts", b.dataset.id))));
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Delete this contract?", () => { S.remove("contracts", b.dataset.id); U.toast("Deleted"); window.App.rerender(); })));
    },
  };

  /* =========================================================
     9. PAYROLL & EXPENSES
  ========================================================= */
  let txFilter = "all";
  Views.payroll = {
    title: "Payroll & Expenses",
    render() {
      const d = S.get();
      const payroll = d.transactions.filter((t) => t.type === "payroll").reduce((s, t) => s + t.amount, 0);
      const expenses = d.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const pending = d.transactions.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);
      const list = txFilter === "all" ? d.transactions : d.transactions.filter((t) => t.type === txFilter);

      return `
      <div class="page-head">
        <div class="ph-text"><h1>Payroll & Expenses</h1><p>Run payroll and track every expense in one place.</p></div>
        <div class="ph-actions"><button class="btn primary" id="addTx">＋ Add transaction</button></div>
      </div>

      <div class="grid cols-3">
        ${stat({ label: "Payroll (total)", value: U.money(payroll), icon: "👛", tone: "primary" })}
        ${stat({ label: "Expenses (total)", value: U.money(expenses), icon: "🧾", tone: "info" })}
        ${stat({ label: "Pending approval", value: U.money(pending), icon: "⏳", tone: "warn" })}
      </div>

      <div class="card mt-24">
        <div class="card-head">
          <div class="flex gap-8">
            ${["all", "payroll", "expense"].map((t) => `<button class="chip" data-txf="${t}" style="${txFilter === t ? "background:var(--primary);color:#fff;border-color:var(--primary)" : ""}">${t === "all" ? "All" : U.cap(t)}</button>`).join("")}
          </div>
        </div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Description</th><th>Type</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              ${list.length ? list.map((t) => `
                <tr>
                  <td class="row-main">${U.esc(t.desc)}</td>
                  <td><span class="chip">${U.cap(t.type)}</span></td>
                  <td class="muted">${U.esc(t.category)}</td>
                  <td class="row-main nowrap">${U.money(t.amount)}</td>
                  <td>${U.badge(t.status)}</td>
                  <td class="muted nowrap">${U.dateShort(t.date)}</td>
                  <td>
                    <div class="flex gap-8 nowrap">
                      ${t.status === "pending" ? `<button class="btn sm" data-approve="${t.id}">Approve</button>` : ""}
                      <button class="btn sm ghost" data-act="del" data-id="${t.id}" style="color:var(--danger)">Delete</button>
                    </div>
                  </td>
                </tr>`).join("")
                : `<tr><td colspan="7">${U.empty("💳", "No transactions yet.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    },
    mount(root) {
      root.querySelectorAll("[data-txf]").forEach((b) => (b.onclick = () => { txFilter = b.dataset.txf; window.App.rerender(); }));
      root.querySelector("#addTx").onclick = () => {
        U.formModal({
          title: "Add transaction",
          submitLabel: "Add",
          fields: [
            { name: "desc", label: "Description", required: true },
            { name: "type", label: "Type", type: "select", options: [{ value: "expense", label: "Expense" }, { value: "payroll", label: "Payroll" }], half: true },
            { name: "amount", label: "Amount ($)", type: "number", required: true, half: true },
            { name: "category", label: "Category", placeholder: "Software, Travel…", half: true },
            { name: "status", label: "Status", type: "select", options: ["pending", "approved", "paid"].map((s) => ({ value: s, label: U.cap(s) })), half: true },
          ],
          onSubmit: (data) => {
            S.add("transactions", { ...data, amount: Number(data.amount) || 0, category: data.category || "General", date: new Date().toISOString() });
            U.toast("Transaction added", "success"); window.App.rerender();
          },
        });
      };
      root.querySelectorAll("[data-approve]").forEach((b) => (b.onclick = () => {
        S.update("transactions", b.dataset.approve, { status: "approved" }); U.toast("Approved", "success"); window.App.rerender();
      }));
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Delete this transaction?", () => { S.remove("transactions", b.dataset.id); U.toast("Deleted"); window.App.rerender(); })));
    },
  };

  /* =========================================================
     10. APPLICANTS (hiring pipeline)
  ========================================================= */
  const STAGES = ["review", "screening", "interview", "offer", "hired", "rejected"];
  Views.applicants = {
    title: "Applicants",
    render() {
      const d = S.get();
      const byStage = STAGES.reduce((m, s) => ((m[s] = d.applicants.filter((a) => a.stage === s)), m), {});
      return `
      <div class="page-head">
        <div class="ph-text"><h1>Applicants</h1><p>Track candidates through your hiring pipeline.</p></div>
        <div class="ph-actions"><button class="btn primary" id="addApplicant">＋ Add applicant</button></div>
      </div>

      <div class="grid cols-4">
        ${stat({ label: "Total applicants", value: d.applicants.length, icon: "🧑‍💼", tone: "primary" })}
        ${stat({ label: "In interview", value: byStage.interview.length, icon: "🗣", tone: "warn" })}
        ${stat({ label: "Offers out", value: byStage.offer.length, icon: "🤝", tone: "info" })}
        ${stat({ label: "Hired", value: byStage.hired.length, icon: "🎉", tone: "success" })}
      </div>

      <div class="card mt-24">
        <div class="card-head"><h3>Candidate pipeline</h3></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Candidate</th><th>Role</th><th>Stage</th><th>Rating</th><th>Applied</th><th></th></tr></thead>
            <tbody>
              ${d.applicants.length ? d.applicants.map((a) => `
                <tr>
                  <td><div class="flex gap-12 center"><div class="avatar" style="width:32px;height:32px;font-size:12px">${U.initials(a.name)}</div>
                    <div><div class="row-main">${U.esc(a.name)}</div><div class="row-sub">${U.esc(a.email)}</div></div></div></td>
                  <td class="muted">${U.esc(a.role)}</td>
                  <td>
                    <select class="badge b-${a.stage}" data-stage="${a.id}" style="border:none;cursor:pointer;padding:4px 8px;border-radius:30px;font-weight:600">
                      ${STAGES.map((s) => `<option value="${s}" ${a.stage === s ? "selected" : ""}>${U.cap(s)}</option>`).join("")}
                    </select>
                  </td>
                  <td style="color:var(--warn)">${"★".repeat(a.rating)}<span class="faint">${"★".repeat(5 - a.rating)}</span></td>
                  <td class="muted nowrap">${U.ago(a.applied)}</td>
                  <td><button class="btn sm ghost" data-act="del" data-id="${a.id}" style="color:var(--danger)">Delete</button></td>
                </tr>`).join("")
                : `<tr><td colspan="6">${U.empty("🧑‍💼", "No applicants yet.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    },
    mount(root) {
      root.querySelector("#addApplicant").onclick = () => {
        U.formModal({
          title: "Add applicant",
          submitLabel: "Add",
          fields: [
            { name: "name", label: "Full name", required: true, half: true },
            { name: "email", label: "Email", type: "email", half: true },
            { name: "role", label: "Role applying for", required: true, half: true },
            { name: "stage", label: "Stage", type: "select", options: STAGES.map((s) => ({ value: s, label: U.cap(s) })), half: true },
            { name: "rating", label: "Rating (1–5)", type: "number", value: 3 },
          ],
          onSubmit: (data) => {
            S.add("applicants", { ...data, rating: Math.max(1, Math.min(5, Number(data.rating) || 3)), applied: new Date().toISOString() });
            U.toast("Applicant added", "success"); window.App.rerender();
          },
        });
      };
      root.querySelectorAll("[data-stage]").forEach((sel) => (sel.onchange = () => {
        S.update("applicants", sel.dataset.stage, { stage: sel.value }); U.toast("Stage updated", "success"); window.App.rerender();
      }));
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Remove this applicant?", () => { S.remove("applicants", b.dataset.id); U.toast("Removed"); window.App.rerender(); })));
    },
  };

  /* =========================================================
     11. TEAM
  ========================================================= */
  Views.team = {
    title: "Team",
    render() {
      const d = S.get();
      const depts = [...new Set(d.team.map((t) => t.dept))];
      return `
      <div class="page-head">
        <div class="ph-text"><h1>Team</h1><p>Your people, departments, and contact info.</p></div>
        <div class="ph-actions"><button class="btn primary" id="addMember">＋ Add member</button></div>
      </div>

      <div class="grid cols-4">
        ${stat({ label: "Team size", value: d.team.length, icon: "👥", tone: "primary" })}
        ${stat({ label: "Departments", value: depts.length, icon: "🏢", tone: "info" })}
        ${stat({ label: "Active", value: d.team.filter((t) => t.status === "active").length, icon: "🟢", tone: "success" })}
        ${stat({ label: "Away", value: d.team.filter((t) => t.status === "away").length, icon: "🌙", tone: "warn" })}
      </div>

      <div class="grid cols-3 mt-24">
        ${d.team.map((m) => `
          <div class="card card-pad">
            <div class="flex between center">
              <div class="flex gap-12 center">
                <div class="avatar" style="width:46px;height:46px;font-size:16px">${U.initials(m.name)}</div>
                <div><div class="row-main">${U.esc(m.name)}</div><div class="row-sub">${U.esc(m.title)}</div></div>
              </div>
              <span class="badge b-${m.status === "active" ? "active" : "pending"}">${U.cap(m.status)}</span>
            </div>
            <div class="flex gap-8 mt-16" style="flex-wrap:wrap">
              <span class="chip">🏢 ${U.esc(m.dept)}</span>
              <span class="chip">✉️ ${U.esc(m.email)}</span>
            </div>
            <div class="flex between center mt-16">
              <span class="faint" style="font-size:12px">Joined ${U.date(m.joined)}</span>
              <div class="flex gap-8">
                <button class="btn sm ghost" data-act="edit" data-id="${m.id}">Edit</button>
                <button class="btn sm ghost" data-act="del" data-id="${m.id}" style="color:var(--danger)">Remove</button>
              </div>
            </div>
          </div>`).join("")}
      </div>`;
    },
    mount(root) {
      const open = (m) => {
        U.formModal({
          title: m ? "Edit member" : "Add team member",
          submitLabel: m ? "Save" : "Add",
          values: m || {},
          fields: [
            { name: "name", label: "Full name", required: true, half: true },
            { name: "title", label: "Title", half: true },
            { name: "dept", label: "Department", type: "select", options: ["Operations", "Finance", "Marketing", "Design", "Engineering", "Sales", "Support"].map((c) => ({ value: c, label: c })), half: true },
            { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "away", label: "Away" }], half: true },
            { name: "email", label: "Email", type: "email" },
          ],
          onSubmit: (data) => {
            if (m) { S.update("team", m.id, data); U.toast("Updated", "success"); }
            else { S.add("team", { ...data, joined: new Date().toISOString() }); U.toast("Member added", "success"); }
            window.App.rerender();
          },
        });
      };
      root.querySelector("#addMember").onclick = () => open(null);
      root.querySelectorAll('[data-act="edit"]').forEach((b) => (b.onclick = () => open(S.find("team", b.dataset.id))));
      root.querySelectorAll('[data-act="del"]').forEach((b) => (b.onclick = () =>
        U.confirm("Remove this team member?", () => { S.remove("team", b.dataset.id); U.toast("Removed"); window.App.rerender(); })));
    },
  };

  window.Views = Views;
})();
