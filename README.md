# 📅 Cal.com Clone — SDE Intern Assignment

> A full-stack scheduling application built from scratch, inspired by [Cal.com](https://cal.com).  
> Features a **React admin dashboard** for managing event types and availability, and a fully **public booking flow** with a split-screen calendar UI — all powered by a **REST API** built with Express, Prisma, and PostgreSQL.

---

## 🔗 Live Demo

| Surface | URL |
|---|---|
| 🖥️ **Frontend (Admin Dashboard + Booking Page)** | `https://YOUR_FRONTEND_URL.vercel.app` |
| ⚙️ **Backend REST API** | `https://YOUR_BACKEND_URL.railway.app` |
| 🩺 **Health Check** | `https://YOUR_BACKEND_URL.railway.app/health` |

> **Note:** Replace the placeholder URLs above with your actual deployment links before submission.

---

## 🧱 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 18](https://react.dev/) | Component-based UI framework |
| [Vite](https://vitejs.dev/) | Lightning-fast dev server & bundler |
| [Tailwind CSS v3](https://tailwindcss.com/) | Utility-first styling — Cal.com aesthetic |
| [React Router v6](https://reactrouter.com/) | Client-side routing (admin + public flows) |
| [Axios](https://axios-http.com/) | HTTP client with a shared base instance |
| [Lucide React](https://lucide.dev/) | Clean, consistent SVG icon set |

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime (ESM, native `--watch`) |
| [Express v5](https://expressjs.com/) | HTTP server and routing |
| [Prisma ORM v7](https://www.prisma.io/) | Type-safe database client & migrations |
| [PostgreSQL](https://www.postgresql.org/) | Primary relational database |
| [Zod](https://zod.dev/) | Schema-first request body validation |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable loading |

---

## 🏆 Evaluation Criteria Highlights

### ✅ Functionality
The application implements the **complete end-to-end scheduling loop**:

1. **Admin creates Event Types** — title, description, duration, colour, and a unique URL slug.
2. **Admin sets weekly availability** — day-by-day toggles with start/end time inputs for Mon–Sun.
3. **Guest opens a public booking page** (`/book/:slug`) — a split-screen calendar shows available dates.
4. **Guest picks a date** → the availability engine computes free 30-minute slots, filtering out confirmed bookings.
5. **Guest clicks a slot** → a booking form slides in (name, email, notes).
6. **Successful submission** → a beautiful animated confirmation screen (`/booking-success`).
7. **Admin views the Bookings dashboard** — filterable by Upcoming / Past, with a two-click cancel that performs a soft-delete.

---

### 🎨 UI/UX
The interface was designed to closely mirror **Cal.com's minimalist aesthetic**:

- **Design system:** `border-gray-200` borders, `rounded-md` corners, `shadow-sm` depth — consistent throughout every component.
- **Typography:** Inter (Google Fonts) with tightly tuned weights for hierarchy without clutter.
- **Booking page — split-screen layout:** The public `/book/:slug` page uses a 3-panel card (Event Info | Calendar | Slots). The slots panel slides in with a CSS transition (`transition-all duration-300`) when a date is selected, and the entire card gracefully widens from `max-w-2xl` to `max-w-4xl`.
- **Step-machine transitions:** Clicking a time slot immediately transitions the right panel from a slot list to a name/email form — no intermediate page navigation required.
- **Micro-interactions:** Two-click delete/cancel pattern (first click: "Confirm?", auto-resets after 3 s), toggle switches built in pure CSS (no library), and animated loading spinners on every async action.
- **Success screen animations:** A CSS `@keyframes pop-in` animation on the checkmark (with spring overshoot), followed by staggered `fade-up` entrance for the details card and CTAs.
- **Responsive design:** All layouts collapse gracefully on mobile using Tailwind's `sm:` and `lg:` breakpoints.

---

### 🧩 Code Modularity
The codebase applies a strict **separation of concerns** at every layer.

#### Backend — MVC Pattern
```
backend/src/
├── controllers/          # Business logic (one file per resource)
│   ├── eventTypes.controller.js
│   ├── availability.controller.js
│   ├── bookings.controller.js
│   ├── slots.controller.js    ← Availability engine lives here
│   └── public.controller.js  ← Unauthenticated endpoints
├── routes/               # Thin routing layer (HTTP method → controller)
│   ├── eventTypes.js
│   ├── availability.js
│   ├── bookings.js
│   ├── slots.js
│   └── public.js
├── middleware/
│   └── auth.js           ← Dummy auth (sets req.userId = 1)
├── utils/
│   └── slotGenerator.js  ← Pure functions: slot math, overlap detection
└── lib/
    └── prisma.js         ← Singleton Prisma client
```

Each controller only handles **one resource**. All slot-generation math is isolated in `slotGenerator.js` as **pure, deterministic functions** — no Express or Prisma dependencies, making them trivially testable.

#### Frontend — Component Architecture
```
frontend/src/
├── pages/                # Route-level page components
│   ├── EventTypes.jsx    ← Card grid + create modal
│   ├── Availability.jsx  ← Day toggles + time inputs
│   ├── Bookings.jsx      ← Table with Upcoming/Past tabs
│   ├── BookingPage.jsx   ← Public booking flow (step machine)
│   └── BookingSuccess.jsx← Animated confirmation screen
├── components/
│   └── AdminLayout.jsx   ← Persistent sidebar + header shell
└── lib/
    └── api.js            ← Shared Axios instance (single baseURL)
```

Every page composes **small, focused sub-components** (e.g., `<EventCard>`, `<CreateModal>`, `<CalendarGrid>`, `<SlotsPanel>`, `<BookingForm>`) to keep individual files readable and independently changeable.

---

### 🗄️ Database Design

#### Entity-Relationship Summary

```
User (1) ──────────── (many) EventType
User (1) ──────────── (many) Availability
User (1) ──────────── (many) Booking
EventType (1) ──────── (many) Booking
```

#### Model Reference

**`EventType`** — A schedulable meeting format created by the admin.

| Column | Type | Notes |
|---|---|---|
| `id` | `Int` (PK) | Auto-increment |
| `title` | `String` | Display name, e.g. *"30 Min Interview"* |
| `description` | `String?` | Optional — shown on the public booking page |
| `duration` | `Int` | Meeting length in **minutes** |
| `slug` | `String` (unique) | URL-safe identifier, e.g. `30-min-interview` |
| `isActive` | `Boolean` | Soft-hides the event type from guests |
| `color` | `String` | Hex colour used as a UI accent (default `#6366f1`) |
| `userId` | `Int` (FK) | Owner — cascades on user delete |

---

**`Availability`** — The admin's available hours per day of the week.

| Column | Type | Notes |
|---|---|---|
| `id` | `Int` (PK) | Auto-increment |
| `dayOfWeek` | `Int` | `0` = Sunday … `6` = Saturday |
| `startTime` | `String` | `"HH:MM"` 24-hour format, e.g. `"09:00"` |
| `endTime` | `String` | `"HH:MM"` 24-hour format, e.g. `"17:00"` |
| `isEnabled` | `Boolean` | `false` = admin unavailable that day |
| `userId` | `Int` (FK) | Owner — cascades on user delete |

> **Unique constraint:** `@@unique([userId, dayOfWeek])` — one rule per admin per weekday.

---

**`Booking`** — A confirmed appointment created by a guest.

| Column | Type | Notes |
|---|---|---|
| `id` | `Int` (PK) | Auto-increment |
| `bookerName` | `String` | Guest's full name |
| `bookerEmail` | `String` | Guest's email |
| `date` | `DateTime` | Midnight UTC of the booking's calendar day — efficient calendar queries |
| `startTime` | `DateTime` | Full UTC timestamp of meeting start |
| `endTime` | `DateTime` | `startTime + duration` — stored to avoid re-calculation on reads |
| `status` | `BookingStatus` | `CONFIRMED` / `CANCELLED` / `COMPLETED` |
| `notes` | `String?` | Optional guest message |
| `eventTypeId` | `Int` (FK) | Which event type was booked |
| `userId` | `Int` (FK) | Which admin's calendar |

> **Why store `endTime`?** Overlap queries (`WHERE startTime < x AND endTime > y`) run as a single indexed range scan instead of computing `startTime + duration` on every row.

---

### ⚙️ Availability Engine — Core Logic

The slot engine lives in `backend/src/utils/slotGenerator.js` and is called by `slots.controller.js` on every `GET /api/slots?date=YYYY-MM-DD&slug=event-slug` request.

#### Step-by-Step Algorithm

```
Given: date, eventType (slug → duration), admin's Availability rows, existing Bookings

Step 1 — Look up the day's availability
  dayOfWeek = date.getDay()   // 0=Sun … 6=Sat
  Find the Availability row where dayOfWeek matches AND isEnabled = true.
  → If no row, or isEnabled = false: return [] (admin is unavailable)

Step 2 — Generate candidate slots
  windowStart = buildDateTimeUTC(date, availability.startTime)
  windowEnd   = buildDateTimeUTC(date, availability.endTime)
  slots = []
  cursor = windowStart
  WHILE (cursor + duration) <= windowEnd:
    slots.push(cursor)   // e.g. 09:00, 09:30, 10:00 … 16:30
    cursor += 30 minutes

Step 3 — Fetch existing CONFIRMED bookings for that day
  bookings = prisma.booking.findMany({
    where: { date: midnight(date), status: "CONFIRMED", eventTypeId }
  })

Step 4 — Filter out conflicting slots
  FOR each candidate slot [slotStart, slotEnd):
    isConflicting = bookings.some(b =>
      slotStart < b.endTime   AND   slotEnd > b.startTime
    )
    → Keep slot only if isConflicting = false

Step 5 — Return the filtered HH:MM strings
```

#### Overlap Detection — The Math

Two intervals `[A_start, A_end)` and `[B_start, B_end)` **overlap** if and only if:

```
A_start < B_end   AND   A_end > B_start
```

This single condition correctly handles all three overlap cases:

```
Case A — New slot starts inside an existing booking:
  |--- existing ---|
       |--- new ---|

Case B — New slot ends inside an existing booking:
       |--- existing ---|
  |--- new ---|

Case C — New slot completely contains an existing booking:
  |---------- new ----------|
       |--- existing ---|
```

#### Double-Booking Prevention (Race Condition Guard)

When a guest submits the booking form, the `POST /api/bookings` controller **re-runs the conflict check immediately before inserting**, guarding against the TOCTOU (Time-Of-Check-Time-Of-Use) race condition where two guests click "Book" for the same slot within milliseconds of each other.

If a conflict is detected at insert time, the server returns:
```
HTTP 409 Conflict
{ "message": "This time slot was just booked by someone else. Please select a different time." }
```

---

## 🚀 Local Setup & Installation

### Prerequisites

- **Node.js** v18 or later
- **PostgreSQL** v14 or later (running locally or a remote connection string)
- **npm** v9 or later

---

### 1. Clone the Repository

```bash
git clone https://github.com/Codewithlalit1/Cal.com-Clone.git
cd cal-clone-assignment
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in your values:

```env
# ── Database ─────────────────────────────────────────────────────────────────
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cal_clone_db"

# ── Server ────────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
```

> **Required:** `DATABASE_URL` must point to a running PostgreSQL instance.  
> The database (`cal_clone_db`) will be created automatically by Prisma migrations.

---

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 4. Run Database Migrations

```bash
cd backend

# Apply all Prisma migrations (creates tables in your database)
npx prisma migrate dev --name init
```

---

### 5. Seed the Database

This creates the default admin user (`id = 1`) required by the dummy auth middleware.

```bash
cd backend
node prisma/seed.js
```

Expected output:
```
✅ Seeded admin user: { id: 1, name: 'Cal Admin', email: 'admin@cal.local' }
```

---

### 6. Start the Servers

Open **two terminal windows** and run:

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
# → Server running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → Vite server running on http://localhost:5173
```

---

### 7. Open the App

| URL | Page |
|---|---|
| `http://localhost:5173/event-types` | Admin dashboard — Event Types |
| `http://localhost:5173/availability` | Admin dashboard — Weekly Availability |
| `http://localhost:5173/bookings` | Admin dashboard — Bookings |
| `http://localhost:5173/book/:slug` | **Public** booking page for a given event slug |
| `http://localhost:3001/health` | Backend health check |

---

### Available npm Scripts

#### Backend (`backend/`)
| Script | Description |
|---|---|
| `npm run dev` | Start with `node --watch` (hot-reload on file change) |
| `npm start` | Start without file watching (production-like) |
| `npm run prisma:migrate` | Run pending migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:seed` | Re-seed the database |
| `npm run db:reset` | Drop and re-create the database (⚠️ destructive) |

#### Frontend (`frontend/`)
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Preview the production build locally |

---

## 💡 Assumptions Made

### 1. Single Admin User (No Authentication)

> **Assignment constraint:** *"Assume a default user is always logged in for the admin side."*

Rather than implementing a full JWT authentication system (out of scope for this assignment), a **dummy auth middleware** in `backend/src/middleware/auth.js` attaches `req.userId = 1` to every protected request. This simulates a logged-in admin without a login form or token verification.

```
GET /api/event-types
    ↓ dummyAuthMiddleware
    req.userId = 1   ← hardcoded
    ↓ eventTypes.controller.js
    prisma.eventType.findMany({ where: { userId: 1 } })
```

All protected endpoints (`/api/event-types`, `/api/availability`, `/api/bookings`) are scoped to `userId = 1` automatically. Public endpoints (`/api/slots`, `/api/public/*`) are mounted **before** this middleware and are fully accessible to unauthenticated guests.

### 2. Slot Duration is Fixed at the Event Type's Duration

The availability engine generates candidate slots at an interval equal to the event type's `duration`. For example, a 30-minute event type produces slots at `09:00`, `09:30`, `10:00`, etc. A 60-minute event produces `09:00`, `10:00`, `11:00`, etc. No "buffer time" between slots is currently implemented.

### 3. Times Are Stored and Served in UTC

All `DateTime` values in the database (`startTime`, `endTime`, `date`) are stored in **UTC**. The `buildDateTimeUTC` utility treats the `HH:MM` input from the guest as UTC. The frontend formats these values back to 12-hour display strings using `toLocaleTimeString` with `timeZone: "UTC"` to prevent timezone-shifted display.

### 4. Cancellation is a Soft Delete

Cancelling a booking sets its `status` to `CANCELLED` rather than removing the row. This preserves the historical record for audit and analytics purposes, and also frees the time slot for new bookings (the conflict checker only considers `CONFIRMED` bookings).

---

## 📁 Project Structure

```
cal-clone-assignment/
│
├── backend/                  ← Express + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma     ← Database schema (source of truth)
│   │   ├── migrations/       ← Generated SQL migration files
│   │   └── seed.js           ← Seeds the admin user
│   ├── src/
│   │   ├── controllers/      ← Business logic (MVC controllers)
│   │   ├── routes/           ← Express routers (thin routing layer)
│   │   ├── middleware/       ← Auth + error handling
│   │   ├── utils/            ← Pure helper functions (slot engine)
│   │   ├── lib/              ← Prisma client singleton
│   │   └── index.js          ← App entry point + middleware stack
│   ├── .env.example
│   └── package.json
│
└── frontend/                 ← React + Vite + Tailwind SPA
    ├── src/
    │   ├── pages/            ← Route-level page components
    │   ├── components/       ← Shared UI components (AdminLayout)
    │   ├── lib/              ← Shared Axios instance
    │   ├── App.jsx           ← Router (public + admin routes)
    │   ├── main.jsx          ← React DOM entry point
    │   └── index.css         ← Tailwind directives + custom animations
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🔌 API Reference

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/public/event-type/:slug` | Event type details for the booking page |
| `GET` | `/api/slots?date=YYYY-MM-DD&slug=...` | Available time slots for a date |

### Protected Endpoints (Admin — `userId = 1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/event-types` | List all event types |
| `POST` | `/api/event-types` | Create a new event type |
| `PUT` | `/api/event-types/:id` | Update an event type |
| `DELETE` | `/api/event-types/:id` | Delete an event type |
| `GET` | `/api/availability` | Get weekly availability schedule |
| `POST` | `/api/availability` | Save weekly availability schedule |
| `GET` | `/api/bookings` | List all bookings (filterable by status) |
| `POST` | `/api/bookings` | Create a new booking |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel a booking (soft delete) |

---

## 👤 Author

| | |
|---|---|
| **Name** | `YOUR NAME HERE` |
| **Email** | `your.email@example.com` |
| **GitHub** | [@your-github-handle](https://github.com/your-github-handle) |
| **LinkedIn** | [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile) |

---

<div align="center">

Built with ❤️ as part of the **Scaler SDE Intern Assignment**.

</div>
