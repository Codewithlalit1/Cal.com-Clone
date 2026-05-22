// =============================================================================
// src/routes/availability.js — Availability Route Definitions
//
// Thin routing layer only — all logic is in:
// src/controllers/availability.controller.js
//
// ROUTES:
//   GET  /api/availability — fetch weekly schedule  (getAvailability)
//   POST /api/availability — upsert weekly schedule (saveAvailability)
//   PUT  /api/availability — same as POST, kept for backwards compatibility
// =============================================================================

import { Router } from "express";
import {
  getAvailability,
  saveAvailability,
} from "../controllers/availability.controller.js";

const router = Router();

router.get("/",  getAvailability);
router.post("/", saveAvailability); // Primary method (as per Phase 2 spec)
router.put("/",  saveAvailability); // Alias — same handler, accepts both methods

export default router;
