// =============================================================================
// src/routes/bookings.js — Booking Route Definitions
//
// Thin routing layer only — all logic is in:
// src/controllers/bookings.controller.js
//
// ROUTES:
//   GET   /api/bookings            — list all bookings      (listBookings)
//   GET   /api/bookings/:id        — get one booking        (getBooking)
//   POST  /api/bookings            — create a booking       (createBooking)
//   PATCH /api/bookings/:id/cancel — cancel a booking       (cancelBooking)
// =============================================================================

import { Router } from "express";
import {
  listBookings,
  getBooking,
  createBooking,
  cancelBooking,
} from "../controllers/bookings.controller.js";

const router = Router();

router.get("/",              listBookings);
router.get("/:id",           getBooking);
router.post("/",             createBooking);
router.patch("/:id/cancel",  cancelBooking);

export default router;
