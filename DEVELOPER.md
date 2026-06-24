# Developer Guide — Bichar Bebostha Legal App

A standalone law-firm SaaS. Clients book lawyers, generate legal documents, and chat with an AI assistant. Lawyers submit credentials and get approved by an admin. Admins manage users, documents, videos, and audit logs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI |
| Routing | Wouter (client-side) + custom `pushState` + `popstate` pattern |
| Server state | TanStack Query v5 |
| Backend | Express 5, TypeScript, tsx |
| Database | PostgreSQL 14+ via Drizzle ORM |
| Auth | Passport.js (local strategy), bcryptjs, express-session, connect-pg-simple |
| AI | OpenAI (streaming via Server-Sent Events) |
| Build | Vite (client), esbuild (server) |

---

## Project Structure

```
├── client/                  # React frontend (Vite)
│   ├── index.html
│   └── src/
│       ├── App.tsx          # Root component — routing logic lives here
│       ├── main.tsx
│       ├── index.css        # Tailwind + CSS variables
│       ├── components/
│       │   ├── app-sidebar.tsx      # Main navigation sidebar
│       │   ├── verification-lock.tsx # Shown to pending lawyers on locked routes
│       │   ├── tenant-link.tsx      # SPA-aware <a> wrapper
│       │   ├── theme-provider.tsx
│       │   ├── theme-toggle.tsx
│       │   └── ui/                  # Shadcn UI primitives (don't edit)
│       ├── hooks/
│       │   ├── use-auth.ts          # Auth state + logout mutation
│       │   └── use-upload.ts        # File upload hook
│       ├── lib/
│       │   ├── app-config.ts        # Law firm branding / feature flags
│       │   ├── queryClient.ts       # TanStack Query client + apiRequest helper
│       │   └── utils.ts
│       └── pages/
│           ├── landing.tsx          # Public home page
│           ├── login.tsx            # Client login → POST /api/auth/login
│           ├── register.tsx         # Registration with role selection (client/lawyer)
│           ├── admin-login.tsx      # Admin-only login → POST /api/auth/admin-login
│           ├── role-selection.tsx   # Post-register onboarding wizard
│           ├── dashboard.tsx
│           ├── lawyers.tsx          # Browse verified lawyers
│           ├── lawyer-profile.tsx   # Single lawyer detail
│           ├── bookings.tsx         # Client's appointments
│           ├── documents.tsx        # Client's legal documents
│           ├── ai-chat.tsx          # Streaming AI assistant
│           ├── videos.tsx           # Legal video library
│           ├── edit-profile.tsx
│           ├── register-lawyer.tsx  # Standalone lawyer profile form
│           ├── lawyer-appointments.tsx
│           ├── lawyer-review.tsx    # Lawyer reviews assigned documents
│           ├── admin.tsx            # Admin panel (lawyer approvals)
│           ├── admin-users.tsx      # User management
│           ├── analytics.tsx        # Charts and stats
│           └── audit-logs.tsx       # Admin audit log viewer
│
├── server/
│   ├── index.ts             # Entry point — wires up Express, auth, routes
│   ├── auth/
│   │   └── index.ts         # Passport setup, session, all /api/auth/* routes
│   ├── routes.ts            # All other API routes
│   ├── storage.ts           # IStorage interface + DatabaseStorage implementation
│   ├── db.ts                # Drizzle + pg Pool setup
│   ├── seed.ts              # Database seed (lawyers, document types, videos, admins)
│   ├── ai-service.ts        # OpenAI streaming wrapper
│   ├── vite.ts              # Vite dev server integration
│   └── static.ts            # Production static file serving
│
├── shared/
│   ├── schema.ts            # Re-exports all models
│   └── models/
│       ├── auth.ts          # users, sessions tables
│       ├── law.ts           # All domain tables + enums + Zod schemas
│       └── chat.ts          # (reserved)
│
├── script/
│   └── build.ts             # Production build script
│
├── drizzle.config.ts        # Drizzle Kit config (points at shared/schema.ts)
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── REQUIREMENTS.md
```

---

## Database Schema

All tables are defined in [shared/models/law.ts](shared/models/law.ts) and [shared/models/auth.ts](shared/models/auth.ts). Drizzle infers TypeScript types from them automatically.

### Core Tables

| Table | Key Columns | Notes |
|---|---|---|
| `users` | `id` (UUID), `email`, `passwordHash`, `firstName`, `lastName` | Auth identity |
| `sessions` | `sid`, `sess`, `expire` | connect-pg-simple session store |
| `user_profiles` | `userId`, `role`, `phone`, `bio`, `onboardingComplete` | Extended profile |
| `professionals` | `userId`, `specialty`, `verificationStatus`, `barNumber`, `licenseDocUrl` | Lawyer-specific data |
| `appointments` | `clientId`, `professionalId`, `status`, `scheduledDate`, `amount` | |
| `documents` | `clientId`, `documentTypeId`, `assignedLawyerId`, `status`, `currentDraft` | |
| `document_types` | `name`, `category`, `price`, `intakeFields` | Admin-managed catalog |
| `ai_conversations` | `userId`, `title` | Chat session |
| `ai_messages` | `conversationId`, `role`, `content`, `refusalFlag` | |
| `videos` | `title`, `videoUrl`, `category`, `isPublished` | Legal video library |
| `video_progress` | `userId`, `videoId`, `watchedSeconds`, `completed` | |
| `audit_logs` | `actorId`, `action`, `resource`, `resourceId`, `metadata` | Immutable admin log |

### Enums

| Enum | Values |
|---|---|
| `user_role` | `client`, `professional`, `tenant_admin` |
| `verification_status` | `pending`, `verified`, `rejected` |
| `appointment_status` | `hold`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`, `expired` |
| `document_status` | `drafting`, `awaiting_payment`, `in_review`, `needs_client_input`, `finalized`, `delivered` |

### Schema Changes

Always edit `shared/models/law.ts` (or `auth.ts`), then run:

```bash
npm run db:push
```

Never write raw SQL migrations by hand — Drizzle generates and applies them.

---

## User Roles & Access

| Role | Who | Access |
|---|---|---|
| `client` | Regular users | Dashboard, AI chat, book lawyers, request documents, videos |
| `professional` | Verified lawyers | + Manage appointments, review assigned documents |
| `tenant_admin` | Firm admins | + User management, lawyer approval, analytics, audit logs, video management |

### How Role Checks Work

**Server** — `requireRole(...roles)` middleware in [server/routes.ts](server/routes.ts:11):
```typescript
app.get("/api/admin/stats", isAuthenticated, requireRole("tenant_admin"), handler)
```

**Client** — `useAuth()` hook exposes `isAdmin`, `isLawyer`, `isPendingVerification`:
```typescript
const { isAdmin, isLawyer } = useAuth();
if (!isAdmin) return <NotFound />;
```

Pending lawyers (`verificationStatus !== "verified"`) are blocked from AI chat, bookings, documents, and videos by `VerificationLock`.

---

## Authentication Flow

1. **Register** (`/register`) → `POST /api/auth/register` → creates `users` + `user_profiles` row → session set
2. **Login** (`/login`) → `POST /api/auth/login` → passport-local validates email/password → session set
3. **Admin login** (`/admin-login`) → `POST /api/auth/admin-login` → same as login but rejects non-admins
4. **Session check** → `GET /api/auth/user` → merges `users` + `user_profiles` + `professionals` → returns `AuthUser`
5. **Logout** → `POST /api/logout` → destroys session

Sessions are stored in the `sessions` PostgreSQL table. Cookie is `httpOnly`, `secure` in production. Default lifetime: 7 days.

Auth code lives entirely in [server/auth/index.ts](server/auth/index.ts).

---

## API Reference

All routes requiring login use the `isAuthenticated` middleware. Routes requiring a role use `requireRole(role)`.

### Auth (`server/auth/index.ts`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register; body: `{ email, password, firstName, lastName, role }` |
| POST | `/api/auth/login` | — | Login; body: `{ email, password }` |
| POST | `/api/auth/admin-login` | — | Admin login (rejects non-admins) |
| POST | `/api/logout` | — | Destroy session |
| GET | `/api/auth/user` | ✓ | Current user (merged profile) |
| PATCH | `/api/auth/profile-picture` | ✓ | Update profile image URL |
| DELETE | `/api/auth/delete-account` | ✓ | Self-delete (non-admins only) |

### Onboarding

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/select-role` | ✓ | Save personal info + role during onboarding |
| POST | `/api/register/lawyer` | ✓ | Submit lawyer credentials for verification |

### Lawyers

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/lawyers` | — | All verified lawyers (license/govId stripped) |
| GET | `/api/lawyers/:id` | — | Single lawyer |

### Appointments

| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/api/appointments` | ✓ | Client's appointments |
| POST | `/api/appointments` | ✓ | Book appointment |
| POST | `/api/appointments/:id/cancel` | ✓ | Cancel appointment |
| GET | `/api/lawyer/appointments` | ✓ | `professional` — own appointments |
| POST | `/api/lawyer/appointments/:id/status` | ✓ | `professional` — update status |

### Documents

| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/api/document-types` | — | Document catalog |
| GET | `/api/documents` | ✓ | Client's documents |
| POST | `/api/documents` | ✓ | Request a document (triggers AI draft) |
| POST | `/api/documents/:id/resubmit` | ✓ | Resubmit after lawyer requests changes |
| GET | `/api/lawyer/documents` | ✓ | `professional` — assigned documents |
| POST | `/api/lawyer/documents/:id/approve` | ✓ | `professional` — approve/finalize |
| POST | `/api/lawyer/documents/:id/request-changes` | ✓ | `professional` — request client edits |
| GET | `/api/admin/documents` | ✓ | `tenant_admin` — all documents |
| POST | `/api/admin/documents/:id/assign` | ✓ | `tenant_admin` — assign lawyer |

### AI Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/ai/conversations` | ✓ | List conversations |
| POST | `/api/ai/conversations` | ✓ | Create conversation |
| DELETE | `/api/ai/conversations/:id` | ✓ | Delete conversation |
| GET | `/api/ai/conversations/:id/messages` | ✓ | Get messages |
| POST | `/api/ai/conversations/:id/messages` | ✓ | Send message (SSE stream response) |

### Videos

| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/api/videos` | — | Published videos |
| GET | `/api/admin/videos` | ✓ | `tenant_admin` — all videos |
| POST | `/api/admin/videos` | ✓ | `tenant_admin` — create video |
| DELETE | `/api/admin/videos/:id` | ✓ | `tenant_admin` — delete video |

### Admin

| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/api/admin/stats` | ✓ | `tenant_admin` — dashboard stats |
| GET | `/api/admin/analytics` | ✓ | `tenant_admin` — detailed analytics |
| GET | `/api/admin/lawyers` | ✓ | `tenant_admin` — all lawyers |
| GET | `/api/admin/lawyers/pending` | ✓ | `tenant_admin` — pending approvals |
| POST | `/api/admin/lawyers/:id/approve` | ✓ | `tenant_admin` — approve lawyer |
| POST | `/api/admin/lawyers/:id/reject` | ✓ | `tenant_admin` — reject lawyer |
| GET | `/api/admin/users` | ✓ | `tenant_admin` — all users |
| POST | `/api/admin/users/:id/role` | ✓ | `tenant_admin` — change user role |
| DELETE | `/api/admin/users/:id` | ✓ | `tenant_admin` — delete user |
| GET | `/api/admin/audit-logs` | ✓ | `tenant_admin` — audit log |
| GET | `/api/user/profile` | ✓ | Current user's full profile + professional data |

---

## Client-Side Routing

There is no React Router. Routing is a manual `switch` in [client/src/App.tsx](client/src/App.tsx) driven by `window.location.pathname`. Navigation is done by pushing to the History API and dispatching a `popstate` event:

```typescript
window.history.pushState(null, "", "/dashboard");
window.dispatchEvent(new PopStateEvent("popstate"));
```

Use the `<TenantLink href="/path">` component for in-app links, or the pattern above for imperative navigation. **Never use `<a href="...">` directly** for internal links — it will cause a full page reload.

---

## Data Fetching Pattern

All API calls go through `apiRequest` from [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts):

```typescript
import { apiRequest, queryClient } from "@/lib/queryClient";

// In a mutation:
const mutation = useMutation({
  mutationFn: () => apiRequest("POST", "/api/appointments", { ... }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/appointments"] }),
});

// In a query:
const { data } = useQuery({
  queryKey: ["/api/appointments"],
  queryFn: () => apiRequest("GET", "/api/appointments").then(r => r.json()),
});
```

The `apiRequest` helper automatically includes `credentials: "include"` (for session cookies) and sets `Content-Type: application/json`.

---

## Adding a New Feature

### New API endpoint

1. Add the route in [server/routes.ts](server/routes.ts) inside `registerRoutes`.
2. If it needs a new DB operation, add the method signature to `IStorage` and implement it in `DatabaseStorage` in [server/storage.ts](server/storage.ts).
3. If it needs a new table or column, add it to [shared/models/law.ts](shared/models/law.ts) and run `npm run db:push`.

### New page

1. Create `client/src/pages/your-page.tsx`.
2. Import it in [client/src/App.tsx](client/src/App.tsx).
3. Add a `case "/your-path":` to the `Router` switch, with role checks if needed.
4. Add a nav link in [client/src/components/app-sidebar.tsx](client/src/components/app-sidebar.tsx) to the appropriate menu array.

### New admin-only page

Same as above, but wrap the `case` with `isAdmin ? <YourPage /> : <NotFound />`.

---

## Seeded Accounts

The seed runs automatically on startup (idempotent — safe to run multiple times).

| Email | Password | Role |
|---|---|---|
| `admin@simplisolve.us` | `TestTest123!` | `tenant_admin` |
| `arafat@simplisolve.us` | `TestTest123!` | `tenant_admin` |

Eight sample lawyers are also seeded (all `verified` except `michael.brown@unicortex.law` which is `pending`).

---

## NPM Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start dev server (Express + Vite HMR) on port 5000 |
| `npm run build` | Build client (Vite) + bundle server (esbuild) into `dist/` |
| `npm start` | Run the production build |
| `npm run db:push` | Apply schema changes to the database (Drizzle Kit) |
| `npm run check` | TypeScript type-check (no emit) |

---

## Key Conventions

- **Storage layer**: All DB access goes through `storage.*` — never import `db` directly in routes.
- **Audit logs**: Any privileged admin action should call `storage.createAuditLog(...)`.
- **Role guard pattern** (server): `requireRole("tenant_admin")` middleware before the handler.
- **Role guard pattern** (client): Check `isAdmin` / `isLawyer` from `useAuth()` before rendering.
- **No comments** on what code does — use clear naming. Only add a comment if the *why* is non-obvious.
- **No direct tenant references** — the app is single-tenant; do not add `tenantId` to new tables or queries.
