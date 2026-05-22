// =============================================================================
// src/index.js — Express Application Entry Point
//
// MIDDLEWARE ORDER MATTERS in Express. Requests flow top-to-bottom through
// the middleware chain. The order here is intentional:
//
//   1. CORS          — must be first so preflight OPTIONS requests are handled
//   2. Body parsers  — must run before any route reads req.body
//   3. Public routes — /api/slots is mounted BEFORE the auth middleware
//                      so guests can access it without authentication
//   4. Auth middleware — attaches req.userId = 1 to all subsequent requests
//   5. Protected routes — require req.userId (event-types, availability, bookings)
//   6. 404 handler    — catches any unmatched routes
//   7. Error handler  — catches any error thrown/next(err) in route handlers
// =============================================================================

import "dotenv/config"; // Load .env variables — must be first import
import express from "express";
import cors from "cors";

// Middleware
import { dummyAuthMiddleware } from "./middleware/auth.js";

// Route modules
import eventTypesRouter from "./routes/eventTypes.js";
import availabilityRouter from "./routes/availability.js";
import bookingsRouter from "./routes/bookings.js";
import slotsRouter from "./routes/slots.js"; // Public — no auth required

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// ── CORS ──────────────────────────────────────────────────────────────────────
// Tells browsers to allow cross-origin requests from the Vite frontend.
// Without this, the browser blocks all API calls from localhost:5173.
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server (frontend)
      "http://localhost:3000", // CRA / alternative
    ],
    methods:      ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── Body Parsers ───────────────────────────────────────────────────────────────
// Parse JSON bodies: enables req.body to be a plain JS object
app.use(express.json());
// Parse URL-encoded bodies (HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// PUBLIC ROUTES (no auth required)
// Mounted BEFORE dummyAuthMiddleware so these endpoints are accessible
// to unauthenticated guests (e.g. someone viewing a booking page).
// =============================================================================

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status:      "ok",
    message:     "Scheduler API is running",
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Slot Availability Engine ───────────────────────────────────────────────────
// GET /api/slots?date=YYYY-MM-DD&slug=event-slug
// Used by the public booking page to fetch open time slots.
app.use("/api/slots", slotsRouter);

// =============================================================================
// AUTH MIDDLEWARE (applied to all routes below this line)
// Sets req.userId = 1 on every request.
// In production, this would verify a JWT and decode the real user ID.
// See: src/middleware/auth.js
// =============================================================================
app.use(dummyAuthMiddleware);

// =============================================================================
// PROTECTED ROUTES (require req.userId — set by dummyAuthMiddleware above)
// =============================================================================

app.use("/api/event-types",  eventTypesRouter);   // CRUD for event types
app.use("/api/availability", availabilityRouter);  // Read/update weekly schedule
app.use("/api/bookings",     bookingsRouter);       // Create and manage bookings

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// Must be defined AFTER all routes.
// =============================================================================

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found. Check the URL and HTTP method.",
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Express identifies this as an error handler via the 4-argument signature.
// Any route can trigger it by calling next(new Error("something went wrong")).
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err.message);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message           // show full details in dev
        : "Internal server error", // hide internals in production
  });
});

// =============================================================================
// START SERVER
// =============================================================================
app.listen(PORT, () => {
  console.log(`\n🚀  Server running on http://localhost:${PORT}`);
  console.log(`\n📡  Public endpoints (no auth):`);
  console.log(`    GET  /health`);
  console.log(`    GET  /api/slots?date=YYYY-MM-DD&slug=event-slug`);
  console.log(`\n🔒  Protected endpoints (auth middleware applied):`);
  console.log(`    GET  POST PUT DELETE  /api/event-types`);
  console.log(`    GET  POST PUT         /api/availability`);
  console.log(`    GET  POST PATCH       /api/bookings\n`);
});

export default app;
