<div align="center">
  <img src="https://cal.com/logo.svg" alt="Cal.com" width="120" />
  <h1>📅 Cal.com Clone — SDE Intern Assignment</h1>
  <p>A full-stack scheduling application built from scratch, inspired by Cal.com. Features a React admin dashboard, a fully public booking flow with comprehensive timezone support, and automated email notifications powered by Resend.</p>
  
  [![React](https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-Framework-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![Resend](https://img.shields.io/badge/Resend-Email-black.svg?style=flat-square)](https://resend.com/)
</div>

---

## ✨ Key Features

### 📅 Advanced Scheduling Engine
- **Dynamic Slot Generation:** Calculates available 30-minute slots based on the Admin's configured weekly availability.
- **Double-Booking Prevention:** Bulletproof SQL-level transaction checks to prevent overlapping meetings, guarding against TOCTOU race conditions.
- **Buffer Times (Upcoming):** Automatic pre/post padding between meetings to avoid back-to-back burnout.

### 🌍 Universal Timezone Support
- **Guest Timezones:** Guests can select their local timezone from a dropdown. All available slots are mathematically shifted and formatted to their exact timezone and calendar day.
- **Admin Dashboard Toggles:** The admin can instantly toggle between viewing bookings in the Guest's timezone or the Admin's local timezone (IST).

### ✉️ Automated Email Notifications (Resend API)
- **Instant Confirmations:** Guests receive a beautiful HTML email the second they book a meeting.
- **Reschedules & Cancellations:** Automated updates are dispatched dynamically when meetings are moved or cancelled.
- **Reply-To Routing:** Emails are sent from the system but route replies directly to the Admin's personal email address.

### 🖥️ Premium UI / UX
- **Cal.com Aesthetic:** Pixel-perfect implementation of Cal.com's minimalist design system (Tailwind CSS).
- **Split-Screen Booking:** A seamless, transition-heavy public booking page with no page reloads.
- **Dashboard Side-Pane:** Clicking a booking row slides in a detailed side-pane showing exact Host/Guest details, video links, and dynamic timezone info.
- **Pagination & Search:** Fully functional client-side pagination and real-time text filtering on the Bookings dashboard.

---

## 🧱 Tech Stack & Dependencies

### Frontend (`frontend/`)
- **Core:** `react`, `react-dom`
- **Routing:** `react-router-dom`
- **Styling:** `tailwindcss`, `postcss`, `autoprefixer`
- **Icons & UI:** `lucide-react`
- **Networking:** `axios`
- **Build Tool:** `vite`

### Backend (`backend/`)
- **Core:** `express`, `node`
- **Database:** `pg`, `@prisma/client`, `@prisma/adapter-neon`
- **ORM:** `prisma`
- **Validation:** `zod`
- **Email:** `resend`
- **Utilities:** `cors`, `dotenv`

---

## 🚀 Local Setup & Installation

Follow these steps to run the project locally on your machine.

### Prerequisites
- **Node.js** (v18 or later)
- **Git**
- A **PostgreSQL** database (e.g., local Postgres or a free cloud DB like Neon.tech)
- A **Resend** account for email API keys

### 1. Clone the Repository
```bash
git clone https://github.com/Codewithlalit1/Cal.com-Clone.git
cd Cal.com-Clone
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:

```bash
cd backend
touch .env
```

Open `backend/.env` and configure your keys:
```env
# PostgreSQL connection string (Neon or Local)
DATABASE_URL="postgresql://USER:PASSWORD@host:5432/cal_clone_db"

# Resend API Key for Email Notifications
RESEND_API_KEY="re_your_api_key_here"

# Server Port
PORT=3001
```

### 3. Install Dependencies
Install the required NPM packages for both the backend and frontend.
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Initialize Database & Run Migrations
Generate the Prisma client and push the schema to your PostgreSQL database.
```bash
cd ../backend
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed the Database
Create the default Admin user.
```bash
node prisma/seed.js
```

### 6. Start the Application
Open **two terminal windows** to run the frontend and backend simultaneously.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Vite server running on http://localhost:5173
```

---

## 🌐 Application Architecture

The codebase applies a strict **separation of concerns** at every layer.

### Backend — MVC Pattern
- **Controllers** (`src/controllers/`): Business logic, isolated one file per resource.
- **Routes** (`src/routes/`): Thin routing layer mapping HTTP methods to controllers.
- **Services** (`src/services/`): External integrations, like `email.service.js` which abstracts the Resend SDK.
- **Utils** (`src/utils/`): Pure, stateless, deterministic functions (e.g., slot generation math) ensuring easy testability.

### Database — Prisma Schema
- `User`: The admin managing the schedule.
- `EventType`: Configurable meeting templates (e.g., "15 Min Chat", duration, URL slugs).
- `Availability`: The admin's configured working hours per day of the week.
- `Booking`: Confirmed appointments linked to an Event Type and Guest.

---

## 👤 Author

**Lalit Kumar**
- **GitHub:** [@Codewithlalit1](https://github.com/Codewithlalit1)
- **Email:** lalitkumarlk1120@gmail.com

---
<div align="center">
Built with ❤️ for the Scaler SDE Intern Assignment.
</div>
