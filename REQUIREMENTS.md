# Requirements — Bichar Bebostha Legal App

---

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x (bundled with Node) | latest |
| PostgreSQL | 14 | 16 |
| OS | Windows 10, macOS 12, Ubuntu 20.04 | Any modern 64-bit OS |
| RAM | 1 GB | 2 GB+ |
| Disk | 500 MB (app + node_modules) | 1 GB+ |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

### Required

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/legalapp` | PostgreSQL connection string |
| `SESSION_SECRET` | `a-long-random-string-64-chars` | Signing key for session cookies. Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | _(none)_ | Enables AI chat, document draft generation. Get from [platform.openai.com](https://platform.openai.com/api-keys). Without this key the app runs but AI features return errors. |
| `PORT` | `5000` | Port the Express server listens on |
| `NODE_ENV` | `development` | Set to `production` for production builds (enables secure cookies, serves static files) |

---

## External Services

| Service | Required? | Purpose |
|---|---|---|
| PostgreSQL | **Yes** | Primary database — all app data |
| OpenAI API | No | AI legal assistant chat + document draft generation |

No other external services are required. File uploads are stored in the local filesystem under `uploads/` (created automatically).

---

## Runtime Dependencies (production)

Key packages the server needs at runtime (from `package.json`):

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.0 | HTTP server |
| `passport` | ^0.7 | Authentication framework |
| `passport-local` | ^1.0 | Email/password auth strategy |
| `bcryptjs` | ^3.0 | Password hashing |
| `express-session` | ^1.19 | Session middleware |
| `connect-pg-simple` | ^10.0 | PostgreSQL session store |
| `drizzle-orm` | ^0.39 | Database ORM |
| `pg` | ^8.16 | PostgreSQL driver |
| `openai` | ^6.21 | OpenAI SDK (AI features) |
| `zod` | ^3.25 | Runtime schema validation |

---

## Dev Dependencies (build only)

| Package | Purpose |
|---|---|
| `vite` | Frontend build tool + HMR dev server |
| `tsx` | Run TypeScript directly (dev server) |
| `drizzle-kit` | Schema migrations (`npm run db:push`) |
| `typescript` | Type checking |
| `esbuild` | Bundle server for production |

---

## Quick Setup Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ running and accessible
- [ ] `npm install` completed
- [ ] `.env` file created from `.env.example` with `DATABASE_URL` and `SESSION_SECRET` set
- [ ] `npm run db:push` run (creates all tables)
- [ ] `npm run dev` starts without errors
- [ ] App loads at `http://localhost:5000`
- [ ] Can log in with `admin@simplisolve.us` / `TestTest123!`

---

## Database Setup (quick reference)

### Local PostgreSQL
```bash
createdb legalapp
# Then set DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/legalapp
```

### Docker
```bash
docker run -d \
  --name legalapp-db \
  -e POSTGRES_DB=legalapp \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16

# Then set DATABASE_URL=postgresql://postgres:password@localhost:5432/legalapp
```

---

## Production Deployment Checklist

- [ ] `NODE_ENV=production` set
- [ ] `SESSION_SECRET` is a long random string (minimum 32 characters, 64 recommended)
- [ ] `DATABASE_URL` points to a production PostgreSQL instance with SSL (`?sslmode=require`)
- [ ] `npm run build` completes without errors
- [ ] `npm start` serves the app
- [ ] HTTPS is terminated at the reverse proxy (nginx / load balancer) — the app redirects HTTP → HTTPS when `x-forwarded-proto: http` is detected
- [ ] PostgreSQL `sessions` table exists (created by `npm run db:push`)
- [ ] `OPENAI_API_KEY` set if AI features are needed
