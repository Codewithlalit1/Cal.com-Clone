// =============================================================================
// src/routes/eventTypes.js — Event Type Route Definitions
//
// This file is intentionally thin. Its only job is to declare which HTTP
// method + path maps to which controller function.
// All business logic lives in: src/controllers/eventTypes.controller.js
//
// ROUTES:
//   GET    /api/event-types       — list all (listEventTypes)
//   GET    /api/event-types/:id   — get one  (getEventType)
//   POST   /api/event-types       — create   (createEventType)
//   PUT    /api/event-types/:id   — update   (updateEventType)
//   DELETE /api/event-types/:id   — delete   (deleteEventType)
// =============================================================================

import { Router } from "express";
import {
  listEventTypes,
  getEventType,
  createEventType,
  updateEventType,
  deleteEventType,
} from "../controllers/eventTypes.controller.js";

const router = Router();

router.get("/",      listEventTypes);
router.get("/:id",   getEventType);
router.post("/",     createEventType);
router.put("/:id",   updateEventType);
router.delete("/:id", deleteEventType);

export default router;
