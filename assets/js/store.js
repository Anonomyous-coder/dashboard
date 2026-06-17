/* ============================================================
   Store — localStorage-backed data layer with seed data
   ============================================================ */
(function () {
  const KEY = "workspace_dashboard_v1";

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const daysAhead = (n) => new Date(Date.now() + n * 864e5).toISOString();

  function seed() {
    return {
      profile: {
        name: "Alex Morgan",
        title: "Operations Lead",
        email: "snow.saintx@gmail.com",
        phone: "+1 (555) 014-2280",
        location: "Austin, TX",
        role: "Admin",
        hourlyRate: 65,
        gmailClientId: "",
        gmailLastSync: null,
      },
      // ---- Personal ----
      applications: [
        { id: uid(), company: "Stripe", role: "Product Operations Manager", status: "interview", location: "Remote", salary: "$140k–$165k", source: "LinkedIn", applied: daysAgo(12), notes: "2nd round scheduled. Panel interview.", interviewDate: daysAhead(3) },
        { id: uid(), company: "Notion", role: "Operations Lead", status: "offer", location: "San Francisco, CA", salary: "$155k", source: "Referral", applied: daysAgo(26), notes: "Verbal offer received. Reviewing comp package.", interviewDate: null },
        { id: uid(), company: "Airbnb", role: "Program Manager", status: "rejected", location: "Remote", salary: "$130k–$150k", source: "Company site", applied: daysAgo(34), notes: "Position filled internally.", interviewDate: null },
        { id: uid(), company: "Linear", role: "Head of Ops", status: "applied", location: "Remote", salary: "$160k", source: "Indeed", applied: daysAgo(4), notes: "", interviewDate: null },
        { id: uid(), company: "Vercel", role: "Operations Manager", status: "interview", location: "Remote", salary: "$145k", source: "LinkedIn", applied: daysAgo(8), notes: "Recruiter screen done. Hiring manager next.", interviewDate: daysAhead(6) },
        { id: uid(), company: "Figma", role: "Senior Ops Analyst", status: "rejected", location: "New York, NY", salary: "$125k", source: "LinkedIn", applied: daysAgo(40), notes: "", interviewDate: null },
      ],
      timeEntries: [
        { id: uid(), project: "Client Onboarding", note: "Kickoff + setup", clockIn: daysAgo(1), clockOut: new Date(Date.now() - 864e5 + 6.5 * 36e5).toISOString() },
        { id: uid(), project: "Internal Ops", note: "Process docs", clockIn: daysAgo(2), clockOut: new Date(Date.now() - 2 * 864e5 + 7.2 * 36e5).toISOString() },
        { id: uid(), project: "Client Onboarding", note: "Weekly sync", clockIn: daysAgo(3), clockOut: new Date(Date.now() - 3 * 864e5 + 4 * 36e5).toISOString() },
        { id: uid(), project: "Recruiting", note: "Screening calls", clockIn: daysAgo(4), clockOut: new Date(Date.now() - 4 * 864e5 + 5.5 * 36e5).toISOString() },
      ],
      activeClock: null, // { project, note, clockIn }
      jobMarket: [
        { id: uid(), company: "OpenAI", role: "Operations Program Manager", location: "Remote", salary: "$150k–$180k", type: "Full-time", tags: ["Operations", "Remote"], posted: daysAgo(0) },
        { id: uid(), company: "Anthropic", role: "Business Operations Lead", location: "San Francisco, CA", salary: "$165k–$200k", type: "Full-time", tags: ["Operations", "Strategy"], posted: daysAgo(1) },
        { id: uid(), company: "Ramp", role: "Revenue Operations Manager", location: "New York, NY", salary: "$140k–$170k", type: "Full-time", tags: ["RevOps", "Finance"], posted: daysAgo(1) },
        { id: uid(), company: "Brex", role: "People Operations Partner", location: "Remote", salary: "$120k–$145k", type: "Full-time", tags: ["People", "Remote"], posted: daysAgo(2) },
        { id: uid(), company: "Plaid", role: "Strategy & Operations", location: "Remote", salary: "$135k–$160k", type: "Full-time", tags: ["Strategy", "Remote"], posted: daysAgo(2) },
        { id: uid(), company: "Webflow", role: "Operations Coordinator", location: "Austin, TX", salary: "$85k–$105k", type: "Full-time", tags: ["Operations"], posted: daysAgo(3) },
        { id: uid(), company: "Retool", role: "Sales Operations Analyst", location: "Remote", salary: "$110k–$130k", type: "Contract", tags: ["SalesOps", "Remote"], posted: daysAgo(4) },
        { id: uid(), company: "Mercury", role: "Head of Operations", location: "Remote", salary: "$180k–$220k", type: "Full-time", tags: ["Leadership", "Remote"], posted: daysAgo(5) },
      ],
      savedJobs: [],
      gmailSyncedIds: [],
      // ---- Workspace ----
      sops: [
        { id: uid(), title: "Employee Onboarding Checklist", category: "HR", version: "v2.1", fileName: "onboarding-checklist.pdf", size: 248320, uploadedBy: "Alex Morgan", uploaded: daysAgo(9) },
        { id: uid(), title: "Expense Reimbursement Policy", category: "Finance", version: "v1.4", fileName: "expense-policy.pdf", size: 192040, uploadedBy: "Jordan Lee", uploaded: daysAgo(21) },
        { id: uid(), title: "Incident Response Runbook", category: "Operations", version: "v3.0", fileName: "incident-runbook.docx", size: 410112, uploadedBy: "Alex Morgan", uploaded: daysAgo(3) },
        { id: uid(), title: "Brand Style Guide", category: "Marketing", version: "v1.0", fileName: "brand-guide.pdf", size: 1820400, uploadedBy: "Sam Rivera", uploaded: daysAgo(45) },
      ],
      contracts: [
        { id: uid(), title: "Master Services Agreement", party: "Acme Corp", value: 48000, status: "signed", sent: daysAgo(20), due: daysAgo(6) },
        { id: uid(), title: "NDA — Mutual", party: "BlueSky Labs", value: 0, status: "sent", sent: daysAgo(4), due: daysAhead(10) },
        { id: uid(), title: "Contractor Agreement", party: "Jamie Fox", value: 12000, status: "draft", sent: null, due: daysAhead(14) },
        { id: uid(), title: "SOW — Q3 Engagement", party: "Northwind Inc", value: 75000, status: "signed", sent: daysAgo(33), due: daysAgo(18) },
        { id: uid(), title: "Renewal Agreement", party: "Acme Corp", value: 52000, status: "expired", sent: daysAgo(120), due: daysAgo(30) },
      ],
      transactions: [
        { id: uid(), type: "payroll", desc: "Bi-weekly payroll run", category: "Salaries", amount: 28400, status: "paid", date: daysAgo(5) },
        { id: uid(), type: "expense", desc: "SaaS subscriptions", category: "Software", amount: 1240, status: "paid", date: daysAgo(7) },
        { id: uid(), type: "expense", desc: "Team offsite — travel", category: "Travel", amount: 3850, status: "pending", date: daysAgo(2) },
        { id: uid(), type: "expense", desc: "Office supplies", category: "Office", amount: 420, status: "approved", date: daysAgo(10) },
        { id: uid(), type: "payroll", desc: "Contractor payment — J. Fox", category: "Contractors", amount: 6000, status: "pending", date: daysAgo(1) },
        { id: uid(), type: "expense", desc: "Marketing — ad spend", category: "Marketing", amount: 2100, status: "approved", date: daysAgo(12) },
      ],
      applicants: [
        { id: uid(), name: "Taylor Brooks", role: "Operations Coordinator", stage: "interview", email: "taylor.b@email.com", rating: 4, applied: daysAgo(6) },
        { id: uid(), name: "Morgan Diaz", role: "Operations Coordinator", stage: "screening", email: "m.diaz@email.com", rating: 3, applied: daysAgo(3) },
        { id: uid(), name: "Casey Nguyen", role: "Finance Analyst", stage: "offer", email: "casey.n@email.com", rating: 5, applied: daysAgo(14) },
        { id: uid(), name: "Riley Park", role: "Finance Analyst", stage: "rejected", email: "riley.p@email.com", rating: 2, applied: daysAgo(20) },
        { id: uid(), name: "Jordan Kim", role: "Operations Coordinator", stage: "hired", email: "jordan.k@email.com", rating: 5, applied: daysAgo(40) },
        { id: uid(), name: "Drew Patel", role: "Marketing Specialist", stage: "review", email: "drew.p@email.com", rating: 4, applied: daysAgo(2) },
      ],
      team: [
        { id: uid(), name: "Alex Morgan", title: "Operations Lead", dept: "Operations", email: "snow.saintx@gmail.com", status: "active", joined: daysAgo(420) },
        { id: uid(), name: "Jordan Lee", title: "Finance Manager", dept: "Finance", email: "jordan.lee@email.com", status: "active", joined: daysAgo(300) },
        { id: uid(), name: "Sam Rivera", title: "Marketing Director", dept: "Marketing", email: "sam.rivera@email.com", status: "active", joined: daysAgo(210) },
        { id: uid(), name: "Jamie Fox", title: "Contractor — Design", dept: "Design", email: "jamie.fox@email.com", status: "active", joined: daysAgo(60) },
        { id: uid(), name: "Pat Quinn", title: "Support Specialist", dept: "Operations", email: "pat.quinn@email.com", status: "away", joined: daysAgo(150) },
      ],
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const s = seed();
    persist(s);
    return s;
  }
  function persist(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s || state)); } catch (e) {}
  }

  const Store = {
    uid,
    get: () => state,
    save: () => persist(state),
    reset() { state = seed(); persist(state); },

    // Generic collection helpers
    add(coll, item) {
      item.id = item.id || uid();
      state[coll].unshift(item);
      persist(state);
      return item;
    },
    update(coll, id, patch) {
      const list = state[coll];
      const i = list.findIndex((x) => x.id === id);
      if (i > -1) { list[i] = { ...list[i], ...patch }; persist(state); return list[i]; }
      return null;
    },
    remove(coll, id) {
      state[coll] = state[coll].filter((x) => x.id !== id);
      persist(state);
    },
    find(coll, id) { return (state[coll] || []).find((x) => x.id === id); },

    setProfile(patch) { state.profile = { ...state.profile, ...patch }; persist(state); },

    // Time clock
    clockIn(project, note) {
      state.activeClock = { project: project || "General", note: note || "", clockIn: new Date().toISOString() };
      persist(state);
    },
    clockOut() {
      if (!state.activeClock) return null;
      const entry = {
        id: uid(),
        project: state.activeClock.project,
        note: state.activeClock.note,
        clockIn: state.activeClock.clockIn,
        clockOut: new Date().toISOString(),
      };
      state.timeEntries.unshift(entry);
      state.activeClock = null;
      persist(state);
      return entry;
    },
  };

  window.Store = Store;
})();
