# UniCortex — Local Development Setup

This guide explains how to run UniCortex on your local machine without Replit.

## Prerequisites

- **Node.js** 18 or newer
- **PostgreSQL** 14 or newer (local install or Docker)
- **npm** (comes with Node.js)

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd unicortex
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up PostgreSQL

### Option A: Local PostgreSQL

Create a database:

```bash
createdb unicortex
```

### Option B: Docker

```bash
docker run -d \
  --name unicortex-db \
  -e POSTGRES_DB=unicortex \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16
```

## 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Random string for session signing |
| `OPENAI_API_KEY` | No | OpenAI key for AI features |

## 5. Push Database Schema

```bash
npm run db:push
```

This creates all tables. If you get a conflict, use:

```bash
npm run db:push --force
```

## 6. Start the Application

```bash
npm run dev
```

The app starts at **http://localhost:5000**.

## 7. Create Your First Account

1. Open http://localhost:5000
2. Use one of the seeded admin accounts below, or click **Get Started** to register a new account
3. New registrations start as **client** role; use an admin account to manage users and tenants

### Seeded Admin Accounts

The database seeds two admin accounts you can use immediately:

| Email | Password | Role |
|---|---|---|
| `admin@simplisolve.us` | `Shakalaka69` | superadmin |
| `arafat@simplisolve.us` | `Shakalaka69` | tenant_admin |

## What Works Differently Locally

| Feature | On Replit | Locally |
|---|---|---|
| **Authentication** | Replit Auth (OIDC) | Email/password |
| **File uploads** | Google Cloud Storage | Local `uploads/` directory |
| **AI features** | Replit AI proxy | Direct OpenAI API |
| **Vite dev plugins** | Cartographer + dev banner | Disabled |

Everything else (database, routing, RBAC, multi-tenancy) works identically.

## Troubleshooting

### "SESSION_SECRET is not set"
Make sure your `.env` file exists and contains `SESSION_SECRET`.

### Database connection errors
Verify PostgreSQL is running and `DATABASE_URL` is correct. Test with:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### AI features not working
Set `OPENAI_API_KEY` in your `.env` file. You need a valid OpenAI API key with credits.

### File uploads fail
Uploads are saved to the `uploads/` directory in the project root. Make sure the directory is writable. It is created automatically on first startup.
