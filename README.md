# Workspace Dashboard

A self-contained personal & workspace dashboard. No build step, no dependencies —
just open `index.html` (or serve the folder) and it runs. All data is persisted
in the browser via `localStorage`, seeded with realistic sample data on first load.

## Sections

### Personal
| Section | What it does |
| --- | --- |
| **My Dashboard** | Overview of KPIs and recent activity across every section. |
| **Job Applications** | Track applications through **Applied → Interview → Offer / Rejected**, with notes, salary, source and scheduled interview dates. |
| **Time Tracker** | **Clock in / out** with a live timer, logged entries, daily/weekly totals and estimated earnings. |
| **Insights** | Analytics — application funnel, offer/interview rates, hours logged over time, expenses by category. |
| **Job Search** | Browse newly-posted roles, filter/search, and **save a job straight into your applications**. |
| **My Account** | Edit your profile, hourly rate, and reset workspace data. |

### Workspace
| Section | What it does |
| --- | --- |
| **SOPs** | **Upload & host documents** (drag-and-drop), with categories, versions and a document library. |
| **Contracts** | Draft, **send out**, and track agreements (draft → sent → signed) with values. |
| **Payroll & Expenses** | Record payroll runs and expenses, approve pending items, and see totals. |
| **Applicants** | Hiring pipeline — move candidates through stages (review → screening → interview → offer → hired). |
| **Team** | Team directory by department with contact info and status. |

## Running it

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

Or simply open `index.html` directly in a browser.

## Tech

Plain HTML + CSS + vanilla JavaScript. Files:

```
index.html
assets/css/style.css     design system + layout (light & dark theme)
assets/js/store.js       localStorage data layer + seed data
assets/js/ui.js          formatting, modals, toasts, form builder
assets/js/views.js       the 11 section views
assets/js/app.js         router, navigation, app chrome
```

Use the **theme toggle** (top-right) for light/dark, and **Reset all data** in
*My Account* to restore the sample data.
