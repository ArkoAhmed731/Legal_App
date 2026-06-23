# UniCortex Platform Documentation

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Multi-Tenant Architecture](#4-multi-tenant-architecture)
5. [Authentication System](#5-authentication-system)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Frontend Pages & Routing](#9-frontend-pages--routing)
10. [Sidebar & Navigation](#10-sidebar--navigation)
11. [Professional Verification Flow](#11-professional-verification-flow)
12. [AI Chat Service](#12-ai-chat-service)
13. [Document Management System](#13-document-management-system)
14. [Appointment & Booking System](#14-appointment--booking-system)
15. [Video Library](#15-video-library)
16. [Object Storage](#16-object-storage)
17. [Audit Logging](#17-audit-logging)
18. [User Flows](#18-user-flows)
19. [Environment Variables & Secrets](#19-environment-variables--secrets)
20. [Seeded Data](#20-seeded-data)

---

## 1. Platform Overview

UniCortex is a production-ready multi-tenant SaaS platform designed to serve multiple professional verticals. Each tenant operates as an independent application with its own URL path, feature set, branding, and data isolation.

### Supported Verticals

| Vertical | Tenant Slug | Status | Professional Label | Description |
|----------|-------------|--------|-------------------|-------------|
| Law | `law` | Active | Lawyer | AI-powered legal education, verified lawyer directory, appointment booking, document generation, educational video library |
| Psychology | `psychology` | Disabled | Therapist | AI-powered mental wellness education, verified therapist directory, session booking, wellness video library |

### Key Capabilities

- **AI-Powered Education**: OpenAI-driven chat assistant providing educational information (not advice) with streaming responses
- **Verified Professional Directory**: Browse professionals filtered by specialty, rating, and availability
- **Appointment Booking**: Book consultations with verified professionals
- **Document Generation**: AI-drafted legal documents with lawyer review workflow
- **Educational Video Library**: Categorized video content per tenant vertical
- **Professional Verification**: Multi-step onboarding with license and ID document upload, admin approval workflow
- **Multi-Tenant Isolation**: Complete data separation between tenants with per-tenant feature flags
- **Comprehensive RBAC**: Four-tier role system (superadmin, tenant_admin, professional, client)
- **Audit Trail**: All privileged actions logged with actor, action, resource, and metadata

---

## 2. Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Wouter | Lightweight client-side routing |
| TanStack Query (React Query) v5 | Server state management and data fetching |
| Shadcn/UI + Radix UI | Accessible component library (45+ components) |
| Tailwind CSS v3 | Utility-first styling |
| next-themes | Dark/light mode support |
| Framer Motion | Animations |
| React Hook Form + Zod | Form handling and validation |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js 5.0 | HTTP server |
| TypeScript | Type safety |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL (Neon) | Primary database |
| Passport.js | OIDC authentication strategy |
| bcryptjs | Password hashing for admin accounts |
| OpenAI SDK | AI chat and document generation |
| Google Cloud Storage | File/document storage |
| connect-pg-simple | PostgreSQL session store |

### Shared
| Technology | Purpose |
|------------|---------|
| Drizzle-Zod | Schema-to-validator generation |
| Zod | Runtime validation |

---

## 3. Project Structure

```
unicortex/
+-- package.json                   # Dependencies and npm scripts
+-- tsconfig.json                  # TypeScript config with path aliases
+-- vite.config.ts                 # Vite bundler config (DO NOT MODIFY)
+-- drizzle.config.ts              # Database migration config (DO NOT MODIFY)
+-- tailwind.config.ts             # Tailwind theme config
+-- postcss.config.js              # PostCSS config
+-- components.json                # Shadcn/UI config
+-- replit.md                      # Project summary for AI context
+-- DOCUMENTATION.md               # This file
|
+-- client/                        # Frontend application
|   +-- index.html                 # HTML entry point
|   +-- public/
|   |   +-- favicon.png
|   |   +-- images/                # Static assets (hero images, patterns, testimonials)
|   +-- src/
|       +-- main.tsx               # React entry point
|       +-- App.tsx                # Root router with multi-tenant routing
|       +-- index.css              # Global styles and CSS variables
|       +-- pages/                 # 21 page components
|       |   +-- landing.tsx             # Public landing page
|       |   +-- dashboard.tsx           # User dashboard
|       |   +-- role-selection.tsx       # First-time role picker + profile info
|       |   +-- admin-login.tsx         # Admin email/password login
|       |   +-- ai-chat.tsx             # AI assistant chat interface
|       |   +-- lawyers.tsx             # Professional directory browser
|       |   +-- lawyer-profile.tsx      # Individual professional profile
|       |   +-- bookings.tsx            # Client appointment management
|       |   +-- documents.tsx           # Document generation/management
|       |   +-- documents-review.tsx    # Document review workflow (admin/lawyer)
|       |   +-- videos.tsx              # Educational video library
|       |   +-- register-lawyer.tsx     # Professional registration with doc upload
|       |   +-- lawyer-appointments.tsx # Professional's appointment view
|       |   +-- lawyer-review.tsx       # Lawyer document review page
|       |   +-- edit-profile.tsx        # Profile editor + account deletion
|       |   +-- admin.tsx               # Tenant admin dashboard
|       |   +-- admin-users.tsx         # User management (roles, verification)
|       |   +-- analytics.tsx           # Admin analytics/metrics
|       |   +-- audit-logs.tsx          # Audit log viewer
|       |   +-- tenant-management.tsx   # Superadmin tenant CRUD
|       |   +-- portal.tsx              # Legacy portal (unused)
|       |   +-- not-found.tsx           # 404 page
|       +-- components/
|       |   +-- app-sidebar.tsx         # Dynamic role/feature-aware sidebar
|       |   +-- theme-provider.tsx      # Dark/light mode provider
|       |   +-- theme-toggle.tsx        # Theme toggle button
|       |   +-- ObjectUploader.tsx      # File upload component
|       |   +-- tenant-link.tsx         # Tenant-aware navigation helper
|       |   +-- verification-lock.tsx   # Lock screen for unverified professionals
|       |   +-- ui/                     # 45+ Shadcn/UI components
|       +-- hooks/
|       |   +-- use-auth.ts             # Auth context, role checks, feature flags
|       |   +-- use-tenant.ts           # Tenant context (slug, basePath)
|       |   +-- use-toast.ts            # Toast notification hook
|       |   +-- use-mobile.tsx          # Mobile device detection
|       |   +-- use-upload.ts           # File upload hook
|       +-- lib/
|           +-- queryClient.ts          # TanStack Query config + tenant header injection
|           +-- tenant-config.ts        # Per-tenant display configuration
|           +-- auth-utils.ts           # Auth utilities
|           +-- utils.ts               # General utilities (cn, etc.)
|
+-- server/                        # Backend application
|   +-- index.ts                   # Express setup, tenant middleware, auth, seed
|   +-- routes.ts                  # All API endpoints with RBAC + feature gates
|   +-- storage.ts                 # DatabaseStorage class (all DB queries)
|   +-- db.ts                      # PostgreSQL connection
|   +-- ai-service.ts             # OpenAI integration (chat + document drafting)
|   +-- seed.ts                    # Database seeding (tenants, lawyers, docs, videos)
|   +-- static.ts                  # Static file serving
|   +-- vite.ts                    # Vite dev server integration (DO NOT MODIFY)
|   +-- replit_integrations/
|       +-- auth/
|       |   +-- index.ts
|       |   +-- routes.ts          # /api/auth/* endpoints
|       |   +-- replitAuth.ts      # Passport.js OIDC strategy
|       |   +-- storage.ts         # Auth-specific DB queries
|       +-- chat/                  # Audio conversation integration
|       +-- image/                 # Image generation integration
|       +-- audio/                 # Voice generation integration
|       +-- object_storage/        # GCS file storage integration
|       +-- batch/                 # Batch processing utilities
|
+-- shared/                        # Shared models and schemas
|   +-- schema.ts                  # Re-exports all models
|   +-- models/
|       +-- auth.ts                # users, sessions tables (global)
|       +-- law.ts                 # Domain tables with tenant_id columns
|       +-- chat.ts                # Basic conversation/message tables
|       +-- tenant.ts              # tenants, auditLogs, config interfaces
|
+-- script/
|   +-- build.ts                   # Custom ESBuild script for backend
|
+-- migrations/                    # Drizzle ORM migration files
+-- attached_assets/               # Reference documents and screenshots
```

---

## 4. Multi-Tenant Architecture

### Tenant Resolution

Every HTTP request goes through tenant resolution middleware defined in `server/index.ts`:

1. The middleware reads the `X-Tenant-ID` header from the request
2. If no header is present, it defaults to `"law"`
3. The middleware queries the database to verify the tenant exists and has `status = "active"`
4. If the tenant is not found or is disabled/in maintenance, the request is rejected with HTTP 403
5. On success, `req.tenantId` and `req.tenantConfig` are set on the request object for downstream use

### URL Routing

Each tenant is accessible at its own URL path:

```
/t/{slug}/...
```

Examples:
- `/t/law/dashboard` - Law tenant dashboard
- `/t/psychology/ai-chat` - Psychology tenant AI chat
- `/t/law/lawyers` - Law tenant lawyer directory

The root path `/` redirects authenticated users to `/t/law/dashboard` (default tenant). Unauthenticated users see the public landing page.

### Client-Side Tenant Header Injection

The frontend automatically includes the tenant context on every API request. In `client/src/lib/queryClient.ts`:

- A global `currentTenantSlug` variable is set when the tenant app mounts
- `setCurrentTenant(slug)` is called synchronously before any component renders
- All fetch requests via TanStack Query include `X-Tenant-ID: {slug}` in their headers
- The `apiRequest()` helper also includes this header for mutations

### Data Isolation

All core database tables include a `tenantId` column (defaults to `"law"`). The storage layer (`server/storage.ts`) filters every query by `tenantId`:

```
AND table.tenantId = :tenantId
```

The `users` table is the one exception: it is global (no tenant_id). Users connect to tenants through the `userProfiles` table, which has a `tenantId` column.

### Feature Flags

Each tenant has a set of feature flags stored in `tenants.config.featureFlags` (JSONB):

| Flag | Description | Law Default | Psychology Default |
|------|-------------|------------|-------------------|
| `AI_CHAT_ENABLED` | AI assistant feature | true | true |
| `APPOINTMENTS_ENABLED` | Booking system | true | true |
| `DOCUMENT_SYSTEM_ENABLED` | Document generation | true | false |
| `VIDEO_LIBRARY_ENABLED` | Educational videos | true | true |
| `CRISIS_HANDLING_ENABLED` | Crisis support | false | true |
| `JOURNALING_ENABLED` | Journaling | false | true |

Feature flags are enforced at two levels:

1. **Server-side**: `requireFeature(flag)` middleware checks `req.tenantConfig.featureFlags[flag]` and returns HTTP 403 if disabled
2. **Client-side**: `hasFeature(flag)` hook controls UI visibility (sidebar items, page access)

### Tenant Configuration

The full `TenantConfig` interface:

```typescript
interface TenantConfig {
  featureFlags: TenantFeatureFlags;
  aiConfig: {
    mode: "chatgpt" | "rag" | "hybrid";
    model: string;
    maxTokens: number;
    requireCitations: boolean;
  };
  commissionPercentage: number;
  customSignupFields?: CustomSignupField[];
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
}
```

### Tenant Display Configuration

The frontend maintains a separate `TenantDisplayConfig` in `client/src/lib/tenant-config.ts` that controls UI presentation per tenant:

- **Professional labels**: "Lawyer" vs "Therapist"
- **Quick actions**: Different dashboard shortcuts per vertical
- **AI assistant**: Different welcome messages, placeholders, and suggestions
- **Specialties**: Different lists per vertical (e.g., "Family Law" vs "Cognitive Behavioral Therapy")
- **Video categories**: Different category colors and labels
- **Taglines and disclaimers**: Contextual messaging per vertical

---

## 5. Authentication System

UniCortex uses a dual authentication system supporting both Replit OIDC and email/password admin login.

### Replit Auth (OIDC)

**Files**: `server/replit_integrations/auth/replitAuth.ts`

The primary authentication method uses OpenID Connect via Replit's identity provider:

1. **Login**: `GET /api/login` initiates the OIDC flow with scopes `['openid', 'email', 'profile', 'offline_access']`
2. **Callback**: `GET /api/callback` handles the provider response, extracts user claims, and creates a session
3. **User creation**: On first login, a user record is created/upserted in the `users` table with ID, email, name, and profile image
4. **Token refresh**: The middleware automatically refreshes expired OIDC tokens using the refresh token

OIDC configuration is discovered and cached from `process.env.ISSUER_URL` with a 1-hour cache. Dynamic strategy registration supports multi-domain deployments.

### Email/Password Admin Login

**Files**: `server/replit_integrations/auth/routes.ts`

A secondary authentication method for hardcoded admin accounts:

1. `POST /api/auth/admin-login` accepts `{ email, password }`
2. Looks up the user by email in the database
3. Verifies the password using bcryptjs
4. Validates the user has `superadmin` or `tenant_admin` role
5. Creates a session via `req.session.adminUser` containing `{ id, email, claims: { sub: id } }`

### Session Management

- **Storage**: PostgreSQL via `connect-pg-simple` (stored in the `sessions` table)
- **TTL**: 7 days (604,800,000 milliseconds)
- **Cookie settings**:
  - `httpOnly: true` (XSS protection)
  - `secure: true` (HTTPS only)
  - `sameSite: "lax"` (CSRF protection)
  - `maxAge: 7 days`

### Authentication Middleware

The `isAuthenticated` middleware checks both auth methods:

1. First checks for `req.session.adminUser` (admin login)
2. Falls back to `req.user` (OIDC user)
3. Validates OIDC token expiration
4. Auto-refreshes expired tokens using the refresh token
5. Sets `req.userId` for downstream use

### Client-Side Auth

The `use-auth.ts` hook:

- Fetches `/api/auth/user` with `credentials: "include"` to send session cookies
- 5-minute stale time for the query cache
- Provides: `user`, `isLoading`, `isAdmin`, `isSuperadmin`, `isLawyer`, `hasFeature()`, `isPendingVerification`, `isVerifiedProfessional`, `verificationStatus`
- Logout redirects to `/api/logout`

---

## 6. Role-Based Access Control

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| `superadmin` | Platform | Full access to everything including tenant management, audit logs, and user role assignment |
| `tenant_admin` | Organization | Admin features within a tenant: lawyer verification, document management, video management, analytics |
| `professional` | Service Provider | Professional features (appointments, document reviews) plus all client features |
| `client` | End User | Standard features: AI chat, find professionals, book appointments, create documents, watch videos |

### Role Assignment Rules

1. **First user**: The first user to register via Replit Auth is automatically assigned the `superadmin` role
2. **New users**: All subsequent users default to the `client` role
3. **Admin accounts**: Seeded admin accounts have pre-assigned roles (`superadmin` and `tenant_admin`)
4. **Role selection**: After first OIDC signup, users choose between `client` and `professional` on the role selection page
5. **Manual promotion**: Superadmins can change any user's role via `POST /api/admin/users/:id/role`
6. **Admin bypass**: Users with `superadmin` or `tenant_admin` roles bypass the role selection flow

### Permissions Matrix

| Feature / Action | Client | Professional | Tenant Admin | Superadmin |
|-----------------|--------|-------------|-------------|-----------|
| Dashboard | Yes | Yes | Yes | Yes |
| AI Chat | Yes | Yes (if verified) | Yes | Yes |
| Find Professionals | Yes | Yes (if verified) | Yes | Yes |
| Book Appointments | Yes | Yes (if verified) | Yes | Yes |
| Create Documents | Yes | Yes (if verified) | Yes | Yes |
| Watch Videos | Yes | Yes (if verified) | Yes | Yes |
| View Own Appointments (as professional) | No | Yes (if verified) | Yes | Yes |
| Review Documents (as professional) | No | Yes (if verified) | Yes | Yes |
| Admin Panel | No | No | Yes | Yes |
| User Management | No | No | Yes | Yes |
| Analytics | No | No | Yes | Yes |
| Approve/Reject Lawyers | No | No | Yes | Yes |
| Manage Videos | No | No | Yes | Yes |
| Tenant Management | No | No | No | Yes |
| Audit Logs | No | No | Tenant-scoped | All tenants |
| Change User Roles | No | No | No | Yes |

### Enforcement

- **Server-side**: `requireRole(...roles)` middleware on route handlers
- **Client-side**: Conditional rendering based on `isAdmin`, `isSuperadmin`, `isLawyer` from `use-auth.ts`
- **Route-level**: `App.tsx` checks roles before rendering pages; unauthorized access shows 404

---

## 7. Database Schema

### Enums

```
user_role:          'client' | 'professional' | 'tenant_admin' | 'superadmin'
verification_status: 'pending' | 'verified' | 'rejected'
appointment_status:  'hold' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired'
document_status:     'drafting' | 'awaiting_payment' | 'in_review' | 'needs_client_input' | 'finalized' | 'delivered'
tenant_status:       'active' | 'disabled' | 'maintenance'
```

### Tables

#### sessions
PostgreSQL session store for Express sessions.

| Column | Type | Constraints |
|--------|------|-------------|
| sid | varchar | PRIMARY KEY |
| sess | jsonb | NOT NULL |
| expire | timestamp | NOT NULL, INDEXED |

#### users
Global user table (no tenant_id). Shared across all tenants.

| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PRIMARY KEY, default: `gen_random_uuid()` |
| email | varchar | UNIQUE |
| firstName | varchar | |
| lastName | varchar | |
| profileImageUrl | varchar | |
| passwordHash | varchar | For admin email/password login |
| createdAt | timestamp | default: NOW() |
| updatedAt | timestamp | default: NOW() |

#### tenants
Tenant definitions with configuration.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| slug | varchar | NOT NULL, UNIQUE |
| name | varchar | NOT NULL |
| domain | varchar | |
| status | tenant_status | NOT NULL, default: 'disabled' |
| config | jsonb | default: '{}' (TenantConfig) |
| createdAt | timestamp | default: NOW() |
| updatedAt | timestamp | default: NOW() |

#### auditLogs
Audit trail for privileged actions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenantId | varchar | |
| actorId | varchar | |
| action | varchar | NOT NULL |
| resource | varchar | |
| resourceId | varchar | |
| metadata | jsonb | |
| createdAt | timestamp | default: NOW() |

#### userProfiles
User profile data linked to a tenant. This is how users connect to tenants.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| userId | varchar | NOT NULL, FK -> users.id |
| tenantId | varchar | default: 'law' |
| role | user_role | NOT NULL, default: 'client' |
| fullName | varchar | |
| dateOfBirth | varchar | |
| emailAddress | varchar | |
| address | text | |
| phone | varchar | |
| country | varchar | |
| state | varchar | |
| language | varchar | default: 'en' |
| bio | text | |
| customFields | jsonb | Record<string, string> |
| onboardingComplete | boolean | default: false |
| createdAt | timestamp | default: NOW() |

#### professionals
Professional profiles (lawyers, therapists) with verification data.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| userId | varchar | NOT NULL, FK -> users.id |
| tenantId | varchar | default: 'law' |
| specialty | text | NOT NULL |
| secondarySpecialties | text[] | |
| barNumber | varchar | |
| yearsExperience | integer | default: 0 |
| hourlyRate | decimal(10,2) | default: 150.00 |
| consultationRate | decimal(10,2) | default: 75.00 |
| verificationStatus | verification_status | NOT NULL, default: 'pending' |
| verificationDocs | text | |
| licenseDocUrl | text | Object storage path for license document |
| govIdDocUrl | text | Object storage path for government ID |
| jurisdictions | text[] | |
| languages | text[] | default: ['English'] |
| rating | decimal(3,2) | default: 0.00 |
| totalReviews | integer | default: 0 |
| totalCases | integer | default: 0 |
| availableDays | text[] | default: ['Monday'..'Friday'] |
| availableTimeStart | varchar | default: '09:00' |
| availableTimeEnd | varchar | default: '17:00' |
| isActive | boolean | default: true |
| createdAt | timestamp | default: NOW() |

#### appointments
Booking records linking clients to professionals.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| clientId | varchar | NOT NULL, FK -> users.id |
| professionalId | integer | NOT NULL, FK -> professionals.id |
| tenantId | varchar | default: 'law' |
| serviceType | varchar | NOT NULL, default: 'consultation' |
| status | appointment_status | NOT NULL, default: 'hold' |
| scheduledDate | timestamp | NOT NULL |
| durationMinutes | integer | default: 30 |
| notes | text | |
| amount | decimal(10,2) | |
| lockExpiresAt | timestamp | |
| completedAt | timestamp | |
| cancelledAt | timestamp | |
| createdAt | timestamp | default: NOW() |

#### reviews
Client reviews for professionals after appointments.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| appointmentId | integer | NOT NULL, FK -> appointments.id |
| clientId | varchar | NOT NULL, FK -> users.id |
| professionalId | integer | NOT NULL, FK -> professionals.id |
| tenantId | varchar | default: 'law' |
| rating | integer | NOT NULL |
| comment | text | |
| createdAt | timestamp | default: NOW() |

#### documentTypes
Template definitions for document generation.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenantId | varchar | default: 'law' |
| name | varchar | NOT NULL |
| description | text | |
| category | varchar | NOT NULL |
| price | decimal(10,2) | default: 49.99 |
| intakeFields | jsonb | Array<{ name, label, type, required }> |
| isActive | boolean | default: true |
| createdAt | timestamp | default: NOW() |

#### documents
Generated document instances with review workflow.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| clientId | varchar | NOT NULL, FK -> users.id |
| documentTypeId | integer | NOT NULL, FK -> documentTypes.id |
| assignedLawyerId | integer | FK -> professionals.id (nullable) |
| tenantId | varchar | default: 'law' |
| status | document_status | NOT NULL, default: 'drafting' |
| intakeAnswers | jsonb | Record<string, string> |
| currentDraft | text | |
| finalContent | text | |
| reviewNotes | text | |
| amount | decimal(10,2) | |
| paidAt | timestamp | |
| deliveredAt | timestamp | |
| createdAt | timestamp | default: NOW() |

#### documentVersions
Version history for documents.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| documentId | integer | NOT NULL, FK -> documents.id |
| tenantId | varchar | default: 'law' |
| versionNumber | integer | NOT NULL, default: 1 |
| content | text | NOT NULL |
| editedBy | varchar | FK -> users.id (nullable) |
| changeNotes | text | |
| createdAt | timestamp | default: NOW() |

#### aiConversations
AI chat conversation threads.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| userId | varchar | NOT NULL, FK -> users.id |
| tenantId | varchar | default: 'law' |
| title | varchar | default: 'New Conversation' |
| createdAt | timestamp | default: NOW() |
| updatedAt | timestamp | default: NOW() |

#### aiMessages
Individual messages within AI conversations.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| conversationId | integer | NOT NULL, FK -> aiConversations.id (CASCADE DELETE) |
| role | varchar | NOT NULL ('user' or 'assistant') |
| content | text | NOT NULL |
| refusalFlag | boolean | default: false |
| escalationType | varchar | 'BOOK_LAWYER', 'DOC_GEN', or null |
| createdAt | timestamp | default: NOW() |

#### videos
Educational video content.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| tenantId | varchar | default: 'law' |
| title | varchar | NOT NULL |
| description | text | |
| videoUrl | text | NOT NULL |
| thumbnailUrl | text | |
| category | varchar | NOT NULL |
| duration | integer | In seconds |
| jurisdiction | varchar | |
| language | varchar | default: 'en' |
| isPublished | boolean | default: true |
| createdAt | timestamp | default: NOW() |

#### videoProgress
User watch progress tracking.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| userId | varchar | NOT NULL, FK -> users.id |
| videoId | integer | NOT NULL, FK -> videos.id |
| tenantId | varchar | default: 'law' |
| watchedSeconds | integer | default: 0 |
| completed | boolean | default: false |
| updatedAt | timestamp | default: NOW() |

#### conversations
Basic conversation table (from Replit chat integration).

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| title | text | NOT NULL |
| createdAt | timestamp | default: CURRENT_TIMESTAMP, NOT NULL |

#### messages
Messages within basic conversations (from Replit chat integration).

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| conversationId | integer | NOT NULL, FK -> conversations.id (CASCADE DELETE) |
| role | text | NOT NULL |
| content | text | NOT NULL |
| createdAt | timestamp | default: CURRENT_TIMESTAMP, NOT NULL |

### Key Relationships

- `userProfiles.userId` -> `users.id` (many profiles per user, one per tenant)
- `professionals.userId` -> `users.id` (one professional record per user per tenant)
- `appointments` links `clientId` (users) to `professionalId` (professionals)
- `reviews` links appointments, clients, and professionals
- `documents` links clients to documentTypes and optionally to professionals (assignedLawyerId)
- `documentVersions` tracks document edit history with `editedBy` -> users
- `aiMessages` cascade-deletes when parent `aiConversation` is deleted

---

## 8. API Reference

### Authentication Endpoints

#### POST /api/auth/admin-login
Admin email/password authentication.

- **Auth**: None (public)
- **Body**: `{ email: string, password: string }`
- **Response**: `{ message: "Login successful", userId: string }`
- **Errors**: 400 (missing fields), 401 (invalid credentials), 403 (not admin role)

#### GET /api/login
Initiates Replit OIDC login flow. Redirects to OIDC provider.

#### GET /api/callback
OIDC callback handler. Redirects to `/` on success or `/?auth_error=...` on failure.

#### GET /api/logout
Destroys session and redirects to `/` or OIDC logout endpoint.

#### POST /api/auth/select-role
First-time user role selection and profile creation.

- **Auth**: Required
- **Body**: `{ role: "client"|"professional", fullName, dateOfBirth, emailAddress, phone, address, customFields? }`
- **Response**: `{ message: "Role selected successfully", role }`
- **Behavior**: Creates userProfile record, sets `onboardingComplete=true` for clients. Professionals redirected to document upload step.

#### GET /api/auth/user
Returns current user data including role, tenant config, and verification status.

- **Auth**: Required
- **Response**:
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "profileImageUrl": "string",
  "role": "client|professional|tenant_admin|superadmin",
  "profileId": 1,
  "fullName": "string",
  "dateOfBirth": "string",
  "emailAddress": "string",
  "address": "string",
  "phone": "string",
  "country": "string",
  "state": "string",
  "bio": "string",
  "customFields": {},
  "onboardingComplete": true,
  "tenantId": "law",
  "tenantConfig": { ... },
  "verificationStatus": "pending|verified|rejected"
}
```

#### PATCH /api/auth/profile-picture
Update user's profile picture URL.

- **Auth**: Required
- **Body**: `{ profileImageUrl: "/objects/..." }`
- **Response**: `{ message: "Profile picture updated", profileImageUrl }`

#### DELETE /api/auth/delete-account
Delete the current user's account and all associated data.

- **Auth**: Required
- **Response**: `{ message: "Account deleted successfully" }`
- **Restrictions**: Admins cannot self-delete
- **Cleanup**: Nullifies document assignments and version edit references, deletes sessions, profiles, professional records, then user row

---

### Tenant Endpoints

#### GET /api/tenant
Returns current tenant info and config.

- **Auth**: None
- **Response**: `{ slug, name, status, config }`

---

### Professional Endpoints

#### GET /api/lawyers
Browse verified professionals.

- **Auth**: None
- **Feature Flag**: `APPOINTMENTS_ENABLED`
- **Response**: Array of professional objects (sensitive doc URLs stripped)
- **Filter**: Only returns `verificationStatus = "verified"` and `isActive = true`

#### GET /api/lawyers/:id
Get a single professional's profile.

- **Auth**: None
- **Response**: Professional object (sensitive doc URLs stripped)

#### POST /api/register/lawyer
Submit professional registration with verification documents.

- **Auth**: Required
- **Body**:
```json
{
  "specialty": "string (required)",
  "secondarySpecialties": ["string"],
  "barNumber": "string (required)",
  "yearsExperience": 0,
  "bio": "string",
  "jurisdictions": ["string"],
  "languages": ["string"],
  "licenseDocUrl": "/objects/... (required)",
  "govIdDocUrl": "/objects/... (required)"
}
```
- **Behavior**: Creates professional record with `verificationStatus: "pending"`, `isActive: false`. Updates user role to `professional`. Sets `onboardingComplete: true`.

#### GET /api/admin/lawyers
List all professionals (all statuses).

- **Auth**: Required
- **Role**: tenant_admin or superadmin

#### GET /api/admin/lawyers/pending
List professionals awaiting verification.

- **Auth**: Required
- **Role**: tenant_admin

#### POST /api/admin/lawyers/:id/approve
Approve a professional's verification.

- **Auth**: Required
- **Role**: tenant_admin
- **Behavior**: Sets `verificationStatus: "verified"`. Creates audit log.

#### POST /api/admin/lawyers/:id/reject
Reject a professional's verification.

- **Auth**: Required
- **Role**: tenant_admin
- **Behavior**: Sets `verificationStatus: "rejected"`. Creates audit log.

#### DELETE /api/admin/lawyers/:id
Delete a professional profile and demote user to client.

- **Auth**: Required
- **Role**: tenant_admin
- **Behavior**: Deletes professional record, updates user role to "client". Creates audit log.

---

### Appointment Endpoints

#### GET /api/appointments
Get the current client's appointments.

- **Auth**: Required
- **Feature Flag**: `APPOINTMENTS_ENABLED`

#### POST /api/appointments
Create a new appointment.

- **Auth**: Required
- **Feature Flag**: `APPOINTMENTS_ENABLED`
- **Body**: `{ professionalId, serviceType?, scheduledDate, durationMinutes?, notes? }`
- **Pricing**: 60-min = hourlyRate, 30-min = consultationRate
- **Initial Status**: `"confirmed"`

#### POST /api/appointments/:id/cancel
Cancel an appointment.

- **Auth**: Required

#### GET /api/lawyer/appointments
Get the current professional's appointments.

- **Auth**: Required
- **Role**: professional

#### POST /api/lawyer/appointments/:id/status
Update an appointment's status (professional-side).

- **Auth**: Required
- **Role**: professional
- **Body**: `{ status: "confirmed"|"completed"|"cancelled"|"no_show" }`
- **Ownership**: Professional must own the appointment

---

### Document Endpoints

#### GET /api/document-types
List available document templates.

- **Auth**: None
- **Feature Flag**: `DOCUMENT_SYSTEM_ENABLED`

#### GET /api/documents
Get the current client's documents.

- **Auth**: Required
- **Feature Flag**: `DOCUMENT_SYSTEM_ENABLED`

#### POST /api/documents
Create a new document with AI-generated draft.

- **Auth**: Required
- **Feature Flag**: `DOCUMENT_SYSTEM_ENABLED`
- **Body**: `{ documentTypeId, intakeAnswers? }`
- **Behavior**: Creates document record, then asynchronously generates AI draft

#### GET /api/admin/documents
List all documents in the tenant.

- **Auth**: Required
- **Role**: tenant_admin

#### POST /api/admin/documents/:id/assign
Assign a lawyer to review a document.

- **Auth**: Required
- **Role**: tenant_admin
- **Body**: `{ lawyerId: number }`
- **Audit**: Creates "document.assign_lawyer" log entry

#### GET /api/lawyer/documents
Get documents assigned to the current lawyer.

- **Auth**: Required
- **Role**: professional

#### POST /api/lawyer/documents/:id/approve
Approve and finalize a document.

- **Auth**: Required
- **Role**: professional
- **Behavior**: Sets status to "finalized", copies currentDraft to finalContent
- **Ownership**: Lawyer must be assigned to the document

#### POST /api/lawyer/documents/:id/request-changes
Request changes from the client.

- **Auth**: Required
- **Role**: professional
- **Body**: `{ notes: "string" }`
- **Behavior**: Sets status to "needs_client_input", stores reviewNotes

#### POST /api/documents/:id/resubmit
Client resubmits an edited document.

- **Auth**: Required
- **Body**: `{ updatedDraft: "string" }`
- **Behavior**: Sets status to "in_review", updates currentDraft
- **Guard**: Only if current status is "needs_client_input" and user owns the document

---

### AI Chat Endpoints

#### GET /api/ai/conversations
List the current user's conversations.

- **Auth**: Required
- **Feature Flag**: `AI_CHAT_ENABLED`

#### POST /api/ai/conversations
Create a new conversation.

- **Auth**: Required
- **Feature Flag**: `AI_CHAT_ENABLED`
- **Body**: `{ title? }`

#### DELETE /api/ai/conversations/:id
Delete a conversation and all its messages.

- **Auth**: Required
- **Response**: 204 No Content

#### GET /api/ai/conversations/:id/messages
Get all messages in a conversation.

- **Auth**: Required

#### POST /api/ai/conversations/:id/messages
Send a message and stream AI response.

- **Auth**: Required
- **Body**: `{ content: "string" }`
- **Response**: Server-Sent Events stream
```
data: {"content":"streaming text"}
data: {"content":"more text"}
data: {"done":true,"escalation":"BOOK_LAWYER"}
```

---

### Video Endpoints

#### GET /api/videos
List published videos for the current tenant.

- **Auth**: None
- **Feature Flag**: `VIDEO_LIBRARY_ENABLED`

#### GET /api/admin/videos
List all videos (including unpublished).

- **Auth**: Required
- **Role**: tenant_admin

#### POST /api/admin/videos
Create a new video entry.

- **Auth**: Required
- **Role**: tenant_admin
- **Body**: `{ title, description?, videoUrl, thumbnailUrl?, category, duration?, jurisdiction?, language? }`

#### DELETE /api/admin/videos/:id
Delete a video.

- **Auth**: Required
- **Role**: tenant_admin

---

### Object Storage Endpoints

#### POST /api/uploads/request-url
Request a presigned upload URL.

- **Auth**: Required
- **Body**: `{ name: "string", size?: number, contentType?: "string" }`
- **Allowed types**: image/jpeg, image/png, image/gif, image/webp, application/pdf
- **Max size**: 10MB
- **Response**: `{ uploadURL, objectPath, metadata }`

#### GET /objects/:objectPath
Serve an uploaded file.

- **Auth**: Required
- **Response**: File binary data

---

### User Management Endpoints

#### GET /api/user/profile
Get current user's profile and professional data.

- **Auth**: Required
- **Response**: `{ profile: UserProfile, professional: Professional|null }`

#### GET /api/admin/users
List all users. Superadmins see all tenants; tenant_admins see only their tenant.

- **Auth**: Required
- **Role**: tenant_admin or superadmin

#### POST /api/admin/users/:id/role
Change a user's role.

- **Auth**: Required
- **Role**: superadmin only
- **Body**: `{ role: "client"|"professional"|"tenant_admin"|"superadmin" }`
- **Audit**: Creates "user.role_change" log entry

#### DELETE /api/admin/users/:id
Delete a user account (admin action).

- **Auth**: Required
- **Role**: tenant_admin
- **Restrictions**: Cannot delete self, cannot delete superadmin (unless you are superadmin)
- **Audit**: Creates "user.admin_delete" log entry

---

### Superadmin Tenant Management Endpoints

#### GET /api/superadmin/tenants
List all tenants.

- **Auth**: Required
- **Role**: superadmin

#### GET /api/superadmin/tenants/:id
Get a single tenant's details.

- **Auth**: Required
- **Role**: superadmin

#### POST /api/superadmin/tenants
Create a new tenant.

- **Auth**: Required
- **Role**: superadmin
- **Body**: `{ slug, name, domain?, status?, config? }`
- **Audit**: Creates "tenant.create" log entry

#### PATCH /api/superadmin/tenants/:id
Update a tenant. Config is merged with existing values (preserves fields not included in the update).

- **Auth**: Required
- **Role**: superadmin
- **Body**: Partial tenant fields
- **Audit**: Creates "tenant.update" log entry

---

### Audit Log Endpoints

#### GET /api/superadmin/audit-logs
List audit log entries.

- **Auth**: Required
- **Role**: superadmin
- **Query params**: `tenant` (filter by tenant slug), `limit` (default: 100)

---

### Admin Analytics Endpoints

#### GET /api/admin/analytics
Tenant analytics data.

- **Auth**: Required
- **Role**: tenant_admin

#### GET /api/admin/stats
Admin statistics summary.

- **Auth**: Required
- **Role**: tenant_admin

---

## 9. Frontend Pages & Routing

### Root-Level Routes (not tenant-scoped)

| Path | Page | Description |
|------|------|-------------|
| `/` | RootRedirect / Landing | Authenticated users redirect to `/t/law/dashboard`; unauthenticated users see the landing page |
| `/admin-login` | AdminLoginPage | Email/password login for admin accounts |

### Tenant-Scoped Routes (`/t/{slug}/...`)

| Path | Page | Feature Gate | Role Gate | Verification Lock |
|------|------|-------------|-----------|-------------------|
| `/dashboard` | Dashboard | None | None | No |
| `/role-selection` | RoleSelection | None | None | No |
| `/profile` | EditProfile | None | None | No |
| `/ai-chat` | AiChat | AI_CHAT_ENABLED | None | Yes |
| `/lawyers` | Lawyers | APPOINTMENTS_ENABLED | None | Yes |
| `/lawyers/:id` | LawyerProfile | None | None | Yes |
| `/bookings` | Bookings | APPOINTMENTS_ENABLED | None | Yes |
| `/documents` | Documents | DOCUMENT_SYSTEM_ENABLED | None | Yes |
| `/videos` | Videos | VIDEO_LIBRARY_ENABLED | None | Yes |
| `/register/lawyer` | RegisterLawyer | None | None | No |
| `/lawyer/appointments` | LawyerAppointments | None | professional, tenant_admin | Yes |
| `/lawyer/reviews` | LawyerReview | None | professional, tenant_admin | Yes |
| `/admin` | Admin | None | tenant_admin, superadmin | No |
| `/admin/users` | AdminUsers | None | tenant_admin, superadmin | No |
| `/admin/analytics` | Analytics | None | tenant_admin, superadmin | No |
| `/admin/audit-logs` | AuditLogs | None | tenant_admin, superadmin | No |
| `/superadmin/tenants` | TenantManagement | None | superadmin | No |
| `/superadmin/audit-logs` | AuditLogs | None | superadmin | No |

### Routing Implementation

The frontend uses Wouter with nested routers:

1. `App.tsx` defines root-level routes
2. The `TenantApp` component extracts the tenant slug from the URL path using regex `/^\/t\/([^/]+)/`
3. A nested `<Router base={basePath}>` is used so inner routes are relative (e.g., `/dashboard` instead of `/t/law/dashboard`)
4. `setCurrentTenant(slug)` is called synchronously before rendering to ensure API requests include the correct tenant header

### Onboarding Redirects

- If `!user.onboardingComplete` and user is not admin: redirect to `/t/{slug}/role-selection`
- If user role is `professional` and has no professional record: redirect to `/t/{slug}/register/lawyer`
- If verification is pending/rejected and user navigates to a locked route: show `VerificationLock` component

---

## 10. Sidebar & Navigation

### Sidebar Structure

The sidebar (`client/src/components/app-sidebar.tsx`) has four dynamic sections:

#### Section 1: Main (visible to all authenticated users)

| Item | Icon | Feature Flag | Lock when pending |
|------|------|-------------|-------------------|
| Dashboard | Home | Always shown | No |
| AI Assistant | MessageSquare | AI_CHAT_ENABLED | Yes |
| Find Lawyers/Therapists | Users | APPOINTMENTS_ENABLED | Yes |
| My Bookings | Calendar | APPOINTMENTS_ENABLED | Yes |
| Documents | FileText | DOCUMENT_SYSTEM_ENABLED | Yes |
| Legal/Wellness Videos | Video | VIDEO_LIBRARY_ENABLED | Yes |

#### Section 2: Professional (visible if user role is `professional`)

| Item | Icon | Feature Flag | Lock when pending |
|------|------|-------------|-------------------|
| My Appointments | Calendar | APPOINTMENTS_ENABLED | Yes |
| Document Reviews | FileCheck | DOCUMENT_SYSTEM_ENABLED | Yes |

Shows "Pending" badge next to section header if professional is not yet verified.

#### Section 3: Administration (visible if user role is `tenant_admin` or `superadmin`)

| Item | Icon |
|------|------|
| Admin Panel | Shield |
| User Management | UserCog |
| Analytics | BarChart3 |

#### Section 4: Super Admin (visible if user role is `superadmin`)

| Item | Icon |
|------|------|
| Tenant Management | Building2 |
| Audit Logs | FileSearch |

### Sidebar Footer

- User avatar with initials fallback
- User's first and last name
- Role badge (colored by role: gold for superadmin, blue for tenant_admin, emerald for professional; hidden for clients)
- User email
- Edit Profile link
- Logout link

### Dynamic Behavior

- Items are filtered by feature flags: `hasFeature(flag)` from the `useAuth` hook
- Items are locked (disabled + lock icon) when `isPendingVerification` is true for professionals
- Labels adapt per tenant: "Find Lawyers" vs "Find Therapists", "Legal Videos" vs "Wellness Videos"
- Sidebar icon changes per tenant: Scale (law) vs Brain (psychology)

---

## 11. Professional Verification Flow

### Overview

Professionals must complete a multi-step onboarding process and upload verification documents before accessing any platform features.

### Step-by-Step Flow

#### Step 1: Role Selection (`role-selection.tsx`)
- After first OIDC login, users land on the role selection page
- Two options: "I Need Legal Help" (client) or "I'm a Lawyer" (professional)
- Admin users (superadmin, tenant_admin) bypass this step entirely

#### Step 2: Personal Information (`role-selection.tsx`)
- All users fill in: full name, date of birth, email address, phone number, address
- Phone number is required and validated server-side
- Custom signup fields (if configured per tenant) are shown here
- Clients complete onboarding at this step and are redirected to the dashboard

#### Step 3: Professional Verification (`register-lawyer.tsx`)
- Professionals continue to this step for document upload
- Required fields:
  - **Specialty** (dropdown from tenant config specialties list)
  - **Bar Number** (text input)
  - **Professional License** (file upload: PDF, JPG, PNG, WebP; max 10MB)
  - **Government-Issued Photo ID** (file upload: same constraints)
- Optional fields: years of experience, bio, jurisdictions, languages, secondary specialties
- Files are uploaded to object storage via presigned URLs using the `useUpload` hook
- On submission, a `professionals` record is created with `verificationStatus: "pending"` and `isActive: false`
- User role is updated to `professional` and `onboardingComplete` is set to `true`

### Verification States

| Status | Dashboard Access | Feature Access | Sidebar Display |
|--------|-----------------|----------------|-----------------|
| `pending` | Yes | Locked (VerificationLock) | Lock icons + "Pending" badge |
| `verified` | Yes | Full access | Normal |
| `rejected` | Yes | Locked (VerificationLock) | Lock icons |

### VerificationLock Component (`verification-lock.tsx`)

Shown on all feature pages when a professional has pending or rejected verification:

- **Pending**: Clock icon, "Your professional account is under review", "Typically takes 1-2 business days"
- **Rejected**: Shield icon, "Your verification was not approved", suggests contacting admin

### Admin Verification Workflow

1. Tenant admin navigates to Admin Panel
2. Views "Pending Lawyers" tab showing professionals awaiting review
3. Can view uploaded license and government ID documents
4. Approves or rejects each professional
5. Approval sets `verificationStatus: "verified"` and unlocks all features
6. Rejection sets `verificationStatus: "rejected"` and keeps features locked
7. All approval/rejection actions create audit log entries

### Security

- Verification document URLs (`licenseDocUrl`, `govIdDocUrl`) are stripped from public API responses
- The `/objects/:path` endpoint requires authentication to serve files
- Only admins can see verification documents through the admin panel

---

## 12. AI Chat Service

### Architecture

The AI service (`server/ai-service.ts`) integrates with OpenAI via Replit AI Integrations using the `gpt-4o-mini` model.

### Configuration

| Parameter | Value |
|-----------|-------|
| Model | gpt-4o-mini |
| Max Tokens (chat) | 1024 |
| Max Tokens (document generation) | 2048 |
| Temperature (chat) | 0.7 |
| Temperature (document generation) | 0.3 |
| Streaming | Enabled for chat |

### System Prompt & Safety Rules

The AI assistant operates under 10 strict safety rules:

1. Provides GENERAL legal/wellness education ONLY. It is NOT a lawyer/therapist.
2. Always includes a disclaimer about educational-only nature
3. Can explain legal/wellness concepts, processes, rights, and procedures
4. Can help users understand what type of professional they need
5. **Must REFUSE to**:
   - Draft or review specific legal documents
   - Provide case-specific legal advice
   - Recommend specific legal strategies
   - Interpret specific contracts or agreements
6. **Escalates** when users need specific help:
   - Suggests "Book a Lawyer" -> `BOOK_LAWYER` escalation
   - Suggests "Generate Document" -> `DOC_GEN` escalation
7. Maintains warm, professional, empathetic tone
8. Covers topics: employment, family, immigration, business, contracts, real estate, criminal defense, estate planning, IP, tax law
9. Uses simple language, avoids jargon
10. Keeps responses focused and practical with actionable next steps

### Streaming Implementation

**Server-side** (`server/routes.ts`):
1. Sets SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
2. Loads conversation history from database
3. Sends messages to OpenAI with streaming enabled
4. Streams chunks as `data: {"content":"..."}\n\n`
5. After stream completes, checks response for escalation keywords
6. Sends final event: `data: {"done":true,"escalation":"BOOK_LAWYER"}\n\n`
7. Saves both user message and assistant response to database

**Client-side** (`client/src/pages/ai-chat.tsx`):
1. Uses `fetch()` with response body reader
2. Decodes streaming chunks with `TextDecoder`
3. Parses JSON messages prefixed with `data: `
4. Updates UI in real-time with `setStreamingMessage()`
5. On `done` flag, finalizes the message and refreshes the query cache

### Escalation Detection

After the full response is generated, the system scans for escalation keywords:

| Keywords Found | Escalation Type | UI Action |
|---------------|-----------------|-----------|
| "book a lawyer", "consult with a lawyer", "speak with an attorney", "hire an attorney", "retain a lawyer" | `BOOK_LAWYER` | Shows "Book a Lawyer" action button |
| "generate a document", "document generation", "create a contract", "draft a" | `DOC_GEN` | Shows "Generate Document" action button |

### Document Draft Generation

The `generateDocumentDraft()` function uses a separate system prompt for document generation:
- Generates professional legal document drafts
- Includes standard legal language and proper formatting
- Adds "DRAFT - FOR REVIEW ONLY" header
- Adds "AI-generated, must be reviewed by a qualified attorney" footer
- Uses temperature 0.3 for more deterministic output

---

## 13. Document Management System

### Document Types

Document types are templates with dynamic intake fields. Each type has:
- Name and description
- Category (Business, Dispute, Real Estate, Employment, Personal)
- Price
- Dynamic intake fields with type validation (text, textarea, date, email, tel, select)

### Document Lifecycle

```
Client creates document  ->  AI generates draft  ->  Admin assigns lawyer
       |                          |                        |
   [drafting]               [drafting]               [in_review]
                                                          |
                              Lawyer reviews -------------|
                              /                           \
                   [needs_client_input]              [finalized]
                        |                                 |
                  Client edits                      [delivered]
                        |
                   [in_review] (resubmitted)
```

### Status Transitions

| Status | Description | Next States |
|--------|-------------|------------|
| `drafting` | Initial state, AI generating draft | `in_review` (when admin assigns lawyer) |
| `awaiting_payment` | Payment required (future use) | `in_review` |
| `in_review` | Assigned lawyer is reviewing | `finalized`, `needs_client_input` |
| `needs_client_input` | Lawyer requested changes | `in_review` (client resubmits) |
| `finalized` | Lawyer approved, document complete | `delivered` |
| `delivered` | Document delivered to client | Terminal state |

### Version Tracking

Each document edit creates a `documentVersions` record with:
- Version number
- Full content snapshot
- Editor ID
- Change notes
- Timestamp

---

## 14. Appointment & Booking System

### Booking Flow

1. Client browses the professional directory (filtered by specialty, search, rating)
2. Client views a professional's profile with availability info
3. Client selects a date, time, and service type
4. Client submits the booking request

### Pricing

| Duration | Rate Field | Default |
|----------|-----------|---------|
| 30 minutes | consultationRate | $75.00 |
| 60 minutes | hourlyRate | $150.00 |

### Appointment Status Lifecycle

```
Client books  ->  [hold]  ->  [confirmed]  ->  [in_progress]  ->  [completed]
                                    |                                    
                              [cancelled]                             
                              [no_show]                               
                              [expired]                               
```

| Status | Description |
|--------|-------------|
| `hold` | Initial booking, awaiting confirmation |
| `confirmed` | Appointment confirmed (default on creation) |
| `in_progress` | Appointment is currently happening |
| `completed` | Appointment finished successfully |
| `cancelled` | Appointment cancelled by either party |
| `no_show` | Client did not attend |
| `expired` | Lock time expired without confirmation |

### Professional-Side Management

Professionals can:
- View their appointments via `GET /api/lawyer/appointments`
- Update appointment status (confirm, complete, cancel, mark no-show)
- Ownership is verified: a professional can only manage their own appointments

---

## 15. Video Library

### Structure

Videos are categorized by topic and scoped to tenants. Each video has:
- Title and description
- Video URL (external hosting)
- Optional thumbnail URL
- Category (matches tenant-specific categories)
- Duration (in seconds)
- Jurisdiction and language
- Published flag (admin controls visibility)

### Categories by Tenant

**Law tenant**: Employment, Family Law, Immigration, Business, Contracts, Real Estate, Criminal

**Psychology tenant**: Stress Management, Anxiety, Depression, Relationships, Self-Care, Mindfulness, Sleep

### Progress Tracking

The `videoProgress` table tracks:
- How many seconds a user has watched
- Whether the video is marked as completed
- Last update timestamp

### Admin Management

Tenant admins can:
- View all videos (including unpublished)
- Create new video entries
- Delete videos

---

## 16. Object Storage

### Overview

File uploads use Google Cloud Storage via the Replit object storage integration. Files are stored in a default bucket with public and private directories.

### Upload Flow

1. Client requests a presigned upload URL: `POST /api/uploads/request-url`
2. Server validates file type and size, generates presigned URL
3. Client uploads directly to the presigned URL
4. The returned `objectPath` (e.g., `/objects/private/abc123.pdf`) is stored in the database

### Constraints

| Constraint | Value |
|-----------|-------|
| Max file size | 10MB |
| Allowed image types | image/jpeg, image/png, image/gif, image/webp |
| Allowed document types | application/pdf |

### Serving Files

`GET /objects/:objectPath` serves uploaded files. This endpoint requires authentication to prevent unauthorized access to private documents (verification docs, etc.).

### Directory Structure

| Directory | Purpose |
|-----------|---------|
| `public` | Public assets (profile pictures, thumbnails) |
| `.private` | Private objects (verification documents, uploaded files) |

---

## 17. Audit Logging

### Tracked Actions

| Action | Trigger | Resource |
|--------|---------|----------|
| `tenant.create` | Superadmin creates a new tenant | tenant |
| `tenant.update` | Superadmin updates tenant config/status | tenant |
| `lawyer.approve` | Admin approves a professional | professional |
| `lawyer.reject` | Admin rejects a professional | professional |
| `lawyer.delete` | Admin deletes a professional profile | professional |
| `user.role_change` | Superadmin changes a user's role | user |
| `user.admin_delete` | Admin deletes a user account | user |
| `document.assign_lawyer` | Admin assigns a lawyer to review a document | document |
| `document.approve` | Lawyer approves/finalizes a document | document |

### Log Entry Structure

Each audit log entry contains:
- **tenantId**: Which tenant the action occurred in
- **actorId**: The user who performed the action
- **action**: The action identifier (e.g., `"lawyer.approve"`)
- **resource**: The resource type affected
- **resourceId**: The specific resource ID
- **metadata**: Additional context (JSON object with varying fields)
- **createdAt**: Timestamp

### Access Control

- **Superadmins**: Can view all audit logs across all tenants, with optional tenant filter
- **Tenant admins**: Can view audit logs for their own tenant only
- **Other roles**: No access to audit logs

---

## 18. User Flows

### Flow 1: New User Registration (Client)

1. User clicks "Sign Up" on landing page
2. Redirected to Replit OIDC login
3. After successful auth, redirected to `/t/law/role-selection`
4. **Step 1**: Selects "I Need Legal Help" (client role)
5. **Step 2**: Fills in personal info (name, DOB, email, phone, address)
6. Submits -> `POST /api/auth/select-role` with `role: "client"`
7. `userProfile` created with `onboardingComplete: true`
8. Redirected to `/t/law/dashboard`
9. Full access to all client features

### Flow 2: New User Registration (Professional)

1. User clicks "Sign Up" on landing page
2. Redirected to Replit OIDC login
3. After successful auth, redirected to `/t/law/role-selection`
4. **Step 1**: Selects "I'm a Lawyer" (professional role)
5. **Step 2**: Fills in personal info (name, DOB, email, phone, address)
6. Submits -> `POST /api/auth/select-role` with `role: "professional"`
7. `userProfile` created with `onboardingComplete: false`, role set to `professional`
8. Redirected to `/t/law/register/lawyer`
9. **Step 3**: Fills in professional details + uploads license and government ID
10. Submits -> `POST /api/register/lawyer`
11. `professionals` record created with `verificationStatus: "pending"`, `isActive: false`
12. `onboardingComplete` set to `true`
13. Redirected to `/t/law/dashboard`
14. All features locked until admin approval (VerificationLock shown)

### Flow 3: Admin Login

1. Navigate to `/admin-login`
2. Enter email and password for a seeded admin account
3. `POST /api/auth/admin-login` validates credentials
4. Session created, redirected to `/t/law/dashboard`
5. Full admin access based on role (superadmin or tenant_admin)

### Flow 4: Professional Verification (Admin Side)

1. Tenant admin navigates to Admin Panel (`/t/law/admin`)
2. Views "Pending Lawyers" tab
3. Reviews each professional's submitted documents (license + ID)
4. Clicks "Approve" or "Reject"
5. Approval: `verificationStatus` -> "verified", features unlocked for the professional
6. Rejection: `verificationStatus` -> "rejected", features remain locked
7. Audit log entry created

### Flow 5: AI Chat Conversation

1. User navigates to AI Chat (`/t/law/ai-chat`)
2. Creates a new conversation or selects an existing one
3. Types a message and sends it
4. Message is saved to database, sent to OpenAI with conversation history
5. Response streams back via SSE, displayed in real-time
6. If AI mentions booking a lawyer or generating a document, escalation buttons appear
7. User can continue the conversation with full context preserved

### Flow 6: Document Generation and Review

1. Client navigates to Documents (`/t/law/documents`)
2. Clicks "Create Document"
3. Selects a document type (e.g., "Non-Disclosure Agreement")
4. Fills in the intake form with dynamic fields
5. Submits -> `POST /api/documents`
6. AI generates draft asynchronously using intake answers
7. Document appears in client's document list with status "drafting"
8. Admin assigns a lawyer for review -> status changes to "in_review"
9. Lawyer reviews the document:
   - **Approves**: Status -> "finalized", `finalContent` = `currentDraft`
   - **Requests changes**: Status -> "needs_client_input", review notes provided
10. If changes requested, client edits and resubmits -> status back to "in_review"
11. Cycle continues until lawyer approves
12. Finalized document available for download

### Flow 7: Booking a Consultation

1. Client navigates to Find Lawyers (`/t/law/lawyers`)
2. Searches/filters by specialty, name, or rating
3. Clicks on a lawyer's card to view their profile
4. On the profile page, selects date, time, and consultation type (30-min or 60-min)
5. Adds optional notes
6. Submits -> `POST /api/appointments`
7. Appointment created with status "confirmed"
8. Appointment appears in client's bookings (`/t/law/bookings`)
9. Professional sees the appointment in their view (`/t/law/lawyer/appointments`)
10. Professional can update status: complete, cancel, or mark no-show

### Flow 8: Tenant Management (Superadmin)

1. Superadmin navigates to Tenant Management (`/t/law/superadmin/tenants`)
2. Views all tenants with their status, feature flags, and configuration
3. Can create a new tenant with slug, name, and initial config
4. Can edit existing tenant: toggle feature flags, change commission rate, add custom signup fields, change status
5. Can enable/disable tenants (disabled tenants reject all requests with 403)
6. All changes create audit log entries

### Flow 9: Account Deletion and Re-Registration

1. User navigates to Edit Profile (`/t/law/profile`)
2. Clicks "Delete Account"
3. `DELETE /api/auth/delete-account` is called
4. Server cleans up all references:
   - Nullifies `documents.assignedLawyerId` where user was assigned
   - Nullifies `documentVersions.editedBy` where user edited
   - Deletes all active sessions
   - Deletes professional record (if any)
   - Deletes user profile
   - Deletes user record
5. User is logged out
6. The same email can now be used for a completely fresh registration

---

## 19. Environment Variables & Secrets

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Replit PostgreSQL | Database connection string |
| `SESSION_SECRET` | Secret | Express session encryption key |
| `ISSUER_URL` | Replit Auth | OIDC provider discovery URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit AI Integration | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit AI Integration | OpenAI API base URL |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Replit Object Storage | GCS bucket identifier |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Replit Object Storage | Public asset paths |
| `PRIVATE_OBJECT_DIR` | Replit Object Storage | Private object directory |
| `GITHUB_TOKEN` | Secret | GitHub integration token |
| `REPL_ID` | Replit Environment | Repl identifier (auto-set) |

---

## 20. Seeded Data

The database is seeded on application startup (`server/seed.ts`). Seeding uses `onConflictDoNothing` to avoid duplicates on restart.

### Seeded Tenants

| Slug | Name | Status | Commission |
|------|------|--------|-----------|
| `law` | UniCortex Law | active | 15% |
| `psychology` | UniCortex Psychology | disabled | 20% |

### Seeded Admin Accounts

| Email | Role | Tenant |
|-------|------|--------|
| `admin@simplisolve.us` | superadmin | law |
| `arafat@simplisolve.us` | tenant_admin | law |

Both accounts use the same password hash (bcrypt with 12 rounds).

### Seeded Lawyers (8 professionals)

| Name | Specialty | Bar Number | State | Status | Rating |
|------|-----------|-----------|-------|--------|--------|
| Sarah Chen | Family Law | CA-123456 | CA | verified | 4.90 |
| Marcus Johnson | Criminal Defense | NY-789012 | NY | verified | 4.85 |
| Elena Rodriguez | Immigration | TX-345678 | TX | verified | 4.95 |
| David Kim | Corporate Law | CA-901234 | CA | verified | 4.80 |
| Jessica Williams | Employment Law | IL-567890 | IL | verified | 4.75 |
| Robert Taylor | Real Estate | FL-234567 | FL | verified | 4.70 |
| Aisha Patel | Intellectual Property | WA-678901 | WA | verified | 4.88 |
| Michael Brown | Estate Planning | MA-012345 | MA | pending | 4.65 |

All seeded lawyers belong to the "law" tenant. 7 are verified, 1 is pending (Michael Brown).

### Seeded Document Types (6 templates)

| Name | Category | Price |
|------|----------|-------|
| Non-Disclosure Agreement (NDA) | Business | $49.99 |
| Demand Letter | Dispute | $39.99 |
| Freelance Service Agreement | Business | $59.99 |
| Lease Agreement | Real Estate | $69.99 |
| Power of Attorney | Personal | $54.99 |
| Employment Offer Letter | Employment | $44.99 |

Each document type has 5-6 dynamic intake fields with labels, types, and required flags.

### Seeded Videos (9 educational videos)

| Title | Category | Duration |
|-------|----------|----------|
| Understanding Your Tenant Rights | Real Estate | 12 min |
| How to Form an LLC | Business | 9 min |
| Employment Discrimination: Know Your Rights | Employment | 15 min |
| Family Law Basics: Divorce Process | Family Law | 14 min |
| Immigration: Visa Categories Explained | Immigration | 11 min |
| Small Claims Court: A Complete Guide | Contracts | 13 min |
| Protecting Your Intellectual Property | Business | 10 min |
| Estate Planning Fundamentals | Real Estate | 13.5 min |
| Criminal Defense: Your Rights During Arrest | Criminal | 8 min |

All seeded videos belong to the "law" tenant and are published.

---

## Appendix: NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx server/index.ts` | Start development server (Express + Vite) |
| `build` | `vite build && tsx script/build.ts` | Build frontend + backend for production |
| `start` | `NODE_ENV=production node dist/index.js` | Start production server |
| `check` | `tsc` | TypeScript type checking |
| `db:push` | `drizzle-kit push` | Push schema changes to database |

---

*This documentation reflects the current state of the UniCortex platform as of February 2026.*
