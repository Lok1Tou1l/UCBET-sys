# PROGRES 2.0 — Frontend (IAM + Student admissions)

Next.js 14 (App Router) · TypeScript · Tailwind CSS · AR (RTL) / FR (LTR). No mock data: every screen calls the backend.
Drop-in for the `frontend/` folder of the UCBET-sys repository (same `src/` layout as the backend-foundation skeleton).

```bash
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm install
npm run dev                     # http://localhost:3000
```

## Layout

```
src/app/(auth)/login · (dashboard)/{dashboard,profile,notifications,admin/*,student/*} · 403 · not-found
src/components/ui (kit) · components/shared (sidebar, topbar, shell)
src/features/{auth,admissions,admin,profile,notifications}   api modules + guards
src/lib/api/client.ts · lib/utils · providers/ · hooks/ · i18n/ · types/
```

## Alignment with the team

| Topic | Rule used |
|---|---|
| API base / prefix | `NEXT_PUBLIC_API_URL` = `http://localhost:8000/api/v1` (backend `API_PREFIX`) |
| Login | `POST /auth/login {login_id,password}` → `{access_token}`, then `GET /auth/me` → `{id,login_id,role}` |
| Errors | FastAPI `{detail}` (string or validation list) and `{message,errors}` are both parsed |
| Roles | lowercase ids; backend aliases mapped in `lib/utils/roles.ts` |
| Storage / headers | `progres_token`, `progres_lang`, `Accept-Language`, Bearer token (same as progres-modules) |
| Lists | `?page&pageSize&q`, response `{items,total,page,pageSize}` |
| Application | statuses `draft … needs_correction`, document statuses `pending/valid/invalid/incomplete/missing`, nested `student` / `academic` fields — same as the registrar UI |
| i18n | `useI18n()` → `lang,setLang,t,formatDate…`, dotted keys (`nav.*`, `action.*`, `adm.status.*`…) |
| Theme | navy/brand palette, Plus Jakarta Sans + Cairo, 270px sidebar, 76px topbar; tokens in `globals.css` |

## Endpoints still to be provided by the backend

Student side lives under `/admissions/me/*` (does not collide with the registrar contract):

`GET|PUT /admissions/me/application` (404 = none) · `POST …/application/submit` · `GET /admissions/programs` ·
`GET|POST /admissions/me/documents` · `PUT|DELETE …/documents/:id` · `GET …/documents/:id/file` ·
`GET /admissions/me/certificate` (PDF) · `GET …/re-enrollment/eligibility` · `POST …/re-enrollment` ·
`GET /notifications` · `POST /notifications/:id/read` · `GET|PUT /users/me` · `POST /users/me/password` ·
`GET /admin/users` · `PATCH /admin/users/:id` · `PUT /admin/users/:id/role` · `GET /admin/scopes` · `POST /admin/users/import`.

Only `/auth/login` and `/auth/me` exist in the backend today; the rest return errors until implemented (the UI shows retryable error states).
