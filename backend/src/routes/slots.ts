// =============================================================================
// src/routes/slots.ts — Slot Generation Route Definition
//
// This is a PUBLIC route (no auth middleware applied).
// It delegates to the slot generation engine in:
// src/controllers/slots.controller.ts
//
// ROUTE:
//   GET /api/slots?date=YYYY-MM-DD&slug=event-slug  — getAvailableSlots
//
// WHY PUBLIC?
//   Guests need to see available time slots before they log in or create
//   an account. The slot list reveals no private information — just which
//   times are free on a given date for a given event type.
// =============================================================================

import { Router } from "express";
import { getAvailableSlots } from "../controllers/slots.controller";

const router = Router();

router.get("/", getAvailableSlots);

export default router;
