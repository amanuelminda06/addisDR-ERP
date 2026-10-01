# BuildWell ERP — construction ERP demo shell

Phase 1 demonstration shell for a construction ERP. Next.js App Router, TypeScript, Tailwind CSS v4
and shadcn/ui (Base UI primitives). There is **no database and no backend**: all data is generated
in memory, persisted to `sessionStorage`, and cleared on tab close.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm start
```

`/` redirects to `/dashboard`.

## What works today

- **App shell** — role-filtered sidebar, top bar, mobile sheet, notifications menu, and a *Reset
  demo* action (Admin only) in `src/components/shell`.
- **Role switcher** — five roles; switching re-filters the menu, page access, and buttons, and writes
  an audit entry.
- **Live pages (8)** — Dashboard, Projects list, Project detail, Suppliers, Employees, Attendance,
  Clients, Audit log.
- **Planned pages (21)** — every remaining subsection renders a `Planned - Phase 2` banner, a
  disabled toolbar, and a realistic table built from sample data. No workflows, no writes.
- **Audit log** — every state change calls `logAction()` with actor, action, entity, field, old and
  new value.

## Roles

| Role | Sees |
| --- | --- |
| Site Engineer | Dashboard, Projects, Attendance, Clients, Audit |
| Procurement Officer | Dashboard, Procurement, Suppliers, Clients |
| Approver | Dashboard, Procurement, Projects, Finance, Clients |
| HR Manager | Dashboard, HR, Attendance, Clients |
| Admin | Everything |

Module and action access lives in `src/lib/rules/permissions.ts`; the sidebar, page guards and
buttons all read from the same matrix.

## Data and money

- Seed: 6 users, 8 employees, 2 clients, 3 projects with budget lines, 5 suppliers, 30 days of
  attendance, plus preview data for the planned modules (`src/lib/seed`).
- Money is a **string** (`Money`) and all arithmetic goes through `decimal.js` in
  `src/lib/money.ts`. Hours use the same pattern in `src/lib/units.ts`. No floats touch money.
- Business rules are pure functions in `src/lib/rules`: `permissions`, `budget`, `projects`,
  `attendance`, `procurement`, `finance`, `hr`, `audit`.
- Store: Zustand with `persist` + `createJSONStorage(() => sessionStorage)`, key
  `buildwell-erp-demo`, `skipHydration: true` and a hydration gate so server and client markup
  match.

## Deploying to Vercel

No environment variables and no server-side data are required, so the app deploys as-is:

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

Pushing to a Git repository connected to Vercel works the same way; the build command is
`npm run build` and there is nothing to configure.

## Phase 2 backlog

Purchase request → PO → three-way match, variation approvals, payroll posting to the chart of
accounts, retention and certification flows, and editing on the planned pages. The rules and money
helpers those features need are already in place.
