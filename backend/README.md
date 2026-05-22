# Backend — REST API

A modular Express + Prisma REST API for the Cal.com-style scheduling app.

## Tech Stack

- **Runtime**: Node.js v18+ (ESM — `"type": "module"`)
- **Framework**: Express.js v5
- **ORM**: Prisma v7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL
- **Validation**: Zod v4

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma         # Data models (source of truth)
│   ├── seed.js               # Seeds admin user, event types, availability
│   └── migrations/           # Auto-generated SQL migration history
├── src/
│   ├── controllers/          # Business logic (one file per resource)
│   │   ├── eventTypes.controller.js
│   │   ├── availability.controller.js
│   │   ├── bookings.controller.js
│   │   ├── slots.controller.js     ← Availability engine
│   │   └── public.controller.js    ← Unauthenticated endpoints
│   ├── routes/               # Thin routing layer (maps HTTP → controller)
│   │   ├── eventTypes.js
│   │   ├── availability.js
│   │   ├── bookings.js
│   │   ├── slots.js
│   │   └── public.js
│   ├── middleware/
│   │   └── auth.js           # Dummy auth — sets req.userId = 1
│   ├── utils/
│   │   └── slotGenerator.js  # Pure slot-generation + overlap functions
│   ├── lib/
│   │   └── prisma.js         # Prisma client singleton
│   └── index.js              # App entry point + middleware stack
├── .env                      # Environment variables (git-ignored)
├── .env.example              # Template — copy to .env and fill in values
└── package.json
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to your PostgreSQL connection string
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
node prisma/seed.js
```

Seed output:
```
✅  Admin user ready: "Admin User"  (id = 1)
✅  "15 Min Chat"         →  /book/15-min-chat        (15 min)
✅  "30 Min Interview"    →  /book/30-min-interview   (30 min)
✅  "60 Min Deep Dive"    →  /book/60-min-deep-dive   (60 min)
✅  Monday … Friday       →  09:00 – 17:00
⛔  Saturday / Sunday     →  Off
```

### 5. Start the server

```bash
npm run dev        # node --watch (hot-reload)
# or
npm start          # node (no watch)
```

Server starts at `http://localhost:3001`.

## API Endpoints

### Public (no auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/public/event-type/:slug` | Event type info for booking page |
| GET | `/api/slots?date=YYYY-MM-DD&slug=...` | Available time slots |

### Protected (userId = 1 via dummy middleware)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/event-types` | List event types |
| POST | `/api/event-types` | Create event type |
| PUT | `/api/event-types/:id` | Update event type |
| DELETE | `/api/event-types/:id` | Delete event type |
| GET | `/api/availability` | Get weekly schedule |
| POST | `/api/availability` | Save weekly schedule |
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking (soft delete) |

## Scripts

```bash
npm run dev              # Start with hot-reload (node --watch)
npm start                # Start without watch
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run pending migrations
npm run prisma:studio    # Open Prisma Studio GUI
npm run db:seed          # Run seed script
npm run db:reset         # Drop + re-migrate (⚠️ destructive)
```
