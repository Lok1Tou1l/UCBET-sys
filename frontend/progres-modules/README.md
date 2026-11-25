# PROGRES 2.0 — Frontend (Ikram's modules)

Standalone React frontend for the PROGRES 2.0 university platform. It covers **only** the modules owned by Ikram:

| Module | Routes |
|---|---|
| **Home** | `/` (overview dashboard), `/settings`, `/help` |
| **2 · Admissions & Registration (registrar side)** | `/admissions`, `/admissions/applications`, `/admissions/applications/:id`, `/admissions/registrations`, `/admissions/decisions` |
| **3 · Student Records (LMD)** | `/records`, `/records/structure[/:tab]`, `/records/structure/programs/:id`, `/records/students`, `/records/students/:id`, `/records/files`, `/records/results` |
| **4 · Renovation & Contractors** | `/renovation`, `/renovation/projects[/new]`, `/renovation/projects/:id[/edit]`, `/renovation/contractors`, `/renovation/contractors/:id`, `/renovation/assignments`, `/renovation/progress`, `/renovation/documents` |

Out of scope (not implemented on purpose): Identity & Access, student-side admissions, backend/database, grades & transcripts (Module 5), AI/OCR/RAG, timetabling and room management.

## Stack
React 18 · Vite · TypeScript (strict) · Tailwind CSS 3 · React Router 7 · Lucide React · Recharts · Axios. Fonts are self-hosted (`@fontsource`), so the app works offline.

## Requirements
Node.js ≥ 18 (developed on Node 22) and npm ≥ 9. No backend, database or internet access is required in mock mode.

Runtime dependencies: `react`, `react-dom`, `react-router-dom`, `axios`, `recharts`, `lucide-react`, `@fontsource/plus-jakarta-sans`, `@fontsource/cairo`.
Dev dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss` 3, `postcss`, `autoprefixer`, `@types/*`. (Exact versions: `package.json` / `package-lock.json`.)

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # type-check + production build into dist/ (static files, serve with any web server)
npm run preview
```

## Configuration (`.env`, see `.env.example`)
| Variable | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `true`: an in-browser mock server answers every axios call. `false`: requests go to the real backend. |
| `VITE_API_BASE_URL` | `/api` | Backend base URL used when `VITE_USE_MOCK=false`. |

**Switching from mock to real backend:** set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL`. No page code changes: components only call `src/services/*.service.ts`, which perform normal axios requests.

Production hosting note: the app is a single-page app using client-side routing — configure the web server to fall back to `index.html` for unknown paths.

## Architecture
```
src/
  services/        axios instance + one service per module (each file documents its endpoint contract in its header)
  mocks/           mock server (axios adapter), seeded data and handlers — delete once the real API exists
  modules/         admissions/, records/, renovation/  → pages, components, types
  components/ui/   design-system kit (Button, DataTable, Modal, Fields, Charts, Toast, …)
  layout/          sidebar, topbar, app shell
  i18n/            FR + AR dictionaries (RTL handled via logical Tailwind properties)
  auth/            permission stub (roles + `Can` / `RequirePermission`) — replaced by the Identity module later
  hooks/, lib/     useAsync, useListQuery, validation helpers, utils
```

### Principles
- **No invented business rules.** LMD averages, validation, compensation and credits are computed by the (mock) backend and only *displayed*; the rules in use are returned by the API and shown, flagged "provisional" in the mock. Renovation `allowedStatuses` come from the API, so the UI offers only the transitions the backend accepts. Status changes and assignments append to a history; nothing is overwritten.
- Historical program versions are read-only.
- Every list is server-driven: `?q&page&pageSize&sort&dir&<filters>`.
- Loading, empty, error, validation and permission-denied states exist on every screen.
- French (LTR) and Arabic (RTL) with a persisted language switch; responsive down to phone width.

## API contracts the backend must provide
The exact endpoints, query params and payloads are listed at the top of:
- `src/services/admissions.service.ts`
- `src/services/records.service.ts`
- `src/services/renovation.service.ts`

Types for every payload/response live in `src/modules/*/types.ts`.

### Backend dependencies / open points
- **Auth:** the app uses a demo role switcher (Settings or user menu). Replace `src/auth/AuthContext.tsx` with the real identity provider and attach the token in `src/services/http.ts`.
- **Admissions:** document files must be served as URLs (`url`) readable by the browser; certificate PDF is generated client-side in the mock — the real backend should expose a certificate download endpoint.
- **Records:** the backend must return computed results (`rules`, averages, validation, credits). LMD rule details are not hard-coded in the UI.
- **Renovation:** `allowedStatuses` per project, multipart upload `POST /renovation/projects/:id/documents` (`file`, `category`), document `url` for preview/download.
- Dashboard widgets on `/` combine the three module dashboard endpoints (no extra endpoint required).
- User names (e.g. "responsible user") are taken from the authenticated user by the backend.

## Demo data
All names/IDs are synthetic. Mock state lives in memory and resets on page reload. Use Settings → *Rôle de démonstration* to check permission behaviour (e.g. `viewer` is read-only, `renovation` cannot open Admissions).

## Roles used by the demo permission stub
| Role | Permissions |
|---|---|
| admin | everything |
| registrar | admissions view+decide, records view |
| records | records view+manage, admissions view |
| renovation | renovation view+manage |
| viewer | read-only on all three modules |

Users without a permission get the "Accès refusé" screen on the route, and the corresponding action buttons are hidden.

## Verification performed (Playwright + tsc, against the mock server)
- `tsc --noEmit` and `npm run build`: clean.
- All routes load with no console/page errors in French and Arabic (RTL); a non-existent route shows the 404 page.
- No horizontal overflow at 390px width on 17 routes in both languages.
- Admissions: reject (comment mandatory), request correction, start review + accept, registrations and decisions lists.
- Records: domain create (validation), search, edit, delete; deletion of a domain that still has fields is refused by the backend rule; student file opens.
- Renovation: project create with validation, status change with confirmation, mandatory comment for pause/cancel, progress update, document upload, contractor form validation.
- Roles: access matrix above checked for all five roles; read-only role has no create/edit/delete buttons in Records.

## Known limitations
- Mock data is in memory and resets on reload; documents uploaded in mock mode live only in the browser session.
- Not individually exercised end to end: Records CRUD for fields/specialties/programs/semesters/UEs/subjects (they share the same generic CRUD component tested on domains), program-version switching, certificate PDF download, document preview in Admissions, edit of an existing Renovation project and contractor, assignment dialog, and the card/table view toggles.
- Stat cards do not show trend percentages (the backend does not provide them yet); the chart period selector from the mockup is not implemented.
- Notifications in the top bar are static demo items.
- Arabic text is a first translation and should be reviewed by a native speaker; LMD wording is placeholder until validated against official regulations.
- Initials avatars and generated building icons replace the photos shown in the mockup.
- Bundle: the charts chunk is ~425 kB (Recharts); it is lazy-loaded.
