/* ============================================================
   App — router, navigation, chrome
   ============================================================ */
(function () {
  const S = window.Store;
  const U = window.UI;

  const NAV = [
    { group: "Personal", items: [
      { id: "dashboard", label: "My Dashboard", icon: "🏠" },
      { id: "applications", label: "Job Applications", icon: "💼", badge: () => S.get().applications.filter((a) => a.status === "interview").length || "" },
      { id: "timetracker", label: "Time Tracker", icon: "⏱", badge: () => (S.get().activeClock ? "●" : "") },
      { id: "insights", label: "Insights", icon: "📈" },
      { id: "jobsearch", label: "Job Search", icon: "🔍", badge: () => S.get().jobMarket.filter((j) => new Date(j.posted).toDateString() === new Date().toDateString()).length || "" },
      { id: "account", label: "My Account", icon: "👤" },
    ]},
    { group: "Workspace", items: [
      { id: "sops", label: "SOPs", icon: "📄", badge: () => S.get().sops.length },
      { id: "contracts", label: "Contracts", icon: "✍️", badge: () => S.get().contracts.filter((c) => c.status === "sent").length || "" },
      { id: "payroll", label: "Payroll & Expenses", icon: "💳", badge: () => S.get().transactions.filter((t) => t.status === "pending").length || "" },
      { id: "applicants", label: "Applicants", icon: "🧑‍💼", badge: () => S.get().applicants.filter((a) => !["hired", "rejected"].includes(a.stage)).length || "" },
      { id: "team", label: "Team", icon: "👥", badge: () => S.get().team.length },
    ]},
  ];

  let current = location.hash.replace("#", "") || "dashboard";

  const App = {
    go(route) {
      if (!window.Views[route]) route = "dashboard";
      current = route;
      location.hash = route;
      this.render();
      if (window.innerWidth <= 900) this.closeSidebar();
      document.querySelector(".content").scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    },
    rerender() { this.render(); },
    render() {
      const view = window.Views[current] || window.Views.dashboard;
      document.getElementById("pageTitle").textContent = view.title;
      const content = document.getElementById("content");
      content.innerHTML = view.render();
      view.mount?.(content);
      this.renderNav();
    },
    renderNav() {
      const nav = document.getElementById("nav");
      nav.innerHTML = NAV.map((g) => `
        <div class="nav-group">
          <div class="nav-group-label">${g.group}</div>
          ${g.items.map((it) => {
            const badge = it.badge ? it.badge() : "";
            return `<button class="nav-item ${current === it.id ? "active" : ""}" data-route="${it.id}">
              <span class="ni-icon">${it.icon}</span><span>${it.label}</span>
              ${badge !== "" && badge !== 0 ? `<span class="ni-badge">${badge}</span>` : ""}
            </button>`;
          }).join("")}
        </div>`).join("");
      nav.querySelectorAll("[data-route]").forEach((b) => (b.onclick = () => this.go(b.dataset.route)));
    },
    refreshSidebarUser() {
      const p = S.get().profile;
      document.getElementById("sidebarAvatar").textContent = U.initials(p.name);
      document.getElementById("sidebarName").textContent = p.name;
      document.getElementById("sidebarRole").textContent = p.role || "Member";
    },
    refreshClockPill() {
      const a = S.get().activeClock;
      const pill = document.getElementById("clockPill");
      const text = document.getElementById("clockPillText");
      pill.classList.toggle("on", !!a);
      text.textContent = a ? "Clocked in" : "Clocked out";
      clearInterval(window.__pillTimer);
      if (a) {
        const upd = () => { const ac = S.get().activeClock; if (!ac) { clearInterval(window.__pillTimer); App.refreshClockPill(); return; } text.textContent = "On the clock · " + U.dur(Date.now() - new Date(ac.clockIn)); };
        upd();
        window.__pillTimer = setInterval(upd, 1000);
      }
      this.renderNav();
    },
    async runGmailSync() {
      const clientId = (S.get().profile.gmailClientId || "").trim();
      if (!clientId) {
        U.modal({
          title: "Connect Gmail",
          body: `<p class="muted">To sync, paste your Google OAuth Client ID (a one-time ~5 min setup). It's stored only in this browser.</p>
                 <div class="field" style="margin-top:14px"><label>Google OAuth Client ID</label><input id="gid" placeholder="xxxx.apps.googleusercontent.com"/></div>
                 <p class="faint" style="font-size:12px">Don't have one yet? Open <strong>My Account → Gmail sync</strong> for where to get it.</p>`,
          footer: `<button class="btn" data-modal-close>Cancel</button><button class="btn primary" id="saveGid">Save & continue</button>`,
          onMount: (card) => {
            card.querySelector("#saveGid").onclick = () => {
              const v = card.querySelector("#gid").value.trim();
              if (!v) { U.toast("Enter a Client ID", "error"); return; }
              S.setProfile({ gmailClientId: v });
              U.closeModal();
              App.runGmailSync();
            };
          },
        });
        return;
      }
      U.modal({
        title: "Syncing Gmail",
        body: `<div style="text-align:center;padding:8px">
                 <div id="gp" style="font-size:18px;font-weight:600">Starting…</div>
                 <p class="faint mt-16">A Google sign-in window may pop up — approve <strong>read-only</strong> access. If it's blocked, allow popups for this site.</p>
               </div>`,
        footer: `<button class="btn" data-modal-close>Run in background</button>`,
      });
      const prog = (m) => { const e = document.getElementById("gp"); if (e) e.textContent = m; };
      try {
        const res = await window.Gmail.sync({ onProgress: prog });
        U.closeModal();
        U.toast(`Gmail synced — ${res.added} added, ${res.updated} updated (${res.scanned} scanned)`, "success");
        this.render();
      } catch (e) {
        U.closeModal();
        if (e && e.message === "NO_CLIENT_ID") { this.runGmailSync(); return; }
        U.toast("Sync failed: " + (e && e.message ? e.message : e), "error");
      }
    },
    openSidebar() { document.getElementById("sidebar").classList.add("open"); document.getElementById("scrim").classList.add("show"); },
    closeSidebar() { document.getElementById("sidebar").classList.remove("open"); document.getElementById("scrim").classList.remove("show"); },
  };

  window.App = App;

  // ---- init ----
  function init() {
    // theme
    const savedTheme = localStorage.getItem("wd_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.getElementById("themeToggle").onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", cur);
      localStorage.setItem("wd_theme", cur);
    };

    // clock pill click → time tracker
    document.getElementById("clockPill").onclick = () => App.go("timetracker");

    // mobile menu
    document.getElementById("menuToggle").onclick = () => {
      const open = document.getElementById("sidebar").classList.contains("open");
      open ? App.closeSidebar() : App.openSidebar();
    };
    document.getElementById("scrim").onclick = () => App.closeSidebar();

    // sidebar user chip → account
    document.querySelector(".user-chip").onclick = () => App.go("account");

    window.addEventListener("hashchange", () => {
      const r = location.hash.replace("#", "");
      if (r && r !== current) App.go(r);
    });

    App.refreshSidebarUser();
    App.refreshClockPill();
    App.go(current);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
