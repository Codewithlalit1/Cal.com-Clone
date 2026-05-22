// =============================================================================
// src/routes/public.js — Public (unauthenticated) Routes
//
// These routes are mounted BEFORE the dummyAuthMiddleware in index.js
// so they are accessible to guests without any authentication.
//
// ROUTES:
//   GET /api/public/event-type/:slug — returns event type info for booking page
// =============================================================================

import { Router } from "express";
import { getPublicEventType } from "../controllers/public.controller.js";

const router = Router();

router.get("/event-type/:slug", getPublicEventType);

export default router;
