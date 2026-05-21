# Scaler AI Assignment — Backend

A production-ready Express.js + Prisma backend for a Calendly-like scheduling application.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js v5
- **ORM**: Prisma v7
- **Database**: PostgreSQL
- **Validation**: Zod

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Data models
│   ├── seed.ts             # Database seeder
│   └── migrations/         # Auto-generated migrations
├── src/
│   ├── lib/
│   │   └── prisma.ts       # Prisma client singleton
│   ├── middleware/
│   │   └── auth.ts         # No-login middleware (userId=1)
│   ├── routes/
│   │   ├── eventTypes.ts   # Event type CRUD
│   │   ├── availability.ts # Availability GET/PUT
│   │   └── bookings.ts     # Booking create/cancel
│   ├── types/
│   │   └── express.d.ts    # Express type augmentation
│   └── index.ts            # App entry point
├── prisma.config.ts        # Prisma v7 datasource config
├── .env                    # Environment variables (git-ignored)
└── package.json
```

## Setup

### 1. Configure Database

Edit `.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/scaler_scheduler?schema=public"
PORT=3001
```

### 2. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 3. Seed Database

```bash
npm run db:seed
```

This seeds:
- **User** (id=1): `admin@scheduler.local` — the hardcoded dummy admin
- **Event Types**: "15 Min Chat", "30 Min Interview", "60 Min Deep Dive"
- **Availability**: Mon–Fri 9 AM – 5 PM (Sat/Sun disabled)

### 4. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3001`

## API Endpoints

### Authentication
No login required. All requests automatically use `userId = 1`.

### Event Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types` | List all event types |
| GET | `/api/event-types/:id` | Get single event type |
| POST | `/api/event-types` | Create event type |
| PUT | `/api/event-types/:id` | Update event type |
| DELETE | `/api/event-types/:id` | Delete event type |

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability` | Get weekly availability |
| PUT | `/api/availability` | Update weekly availability |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List all bookings |
| GET | `/api/bookings/:id` | Get single booking |
| POST | `/api/bookings` | Create a booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel a booking |

## Useful Scripts

```bash
npm run dev             # Start dev server with hot reload
npm run build           # Compile TypeScript
npm run start           # Run compiled output
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio GUI
npm run db:seed         # Seed database
npm run db:reset        # Reset & re-migrate database
```
