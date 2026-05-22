// =============================================================================
// src/controllers/public.controller.js
//
// Public (unauthenticated) handlers used by the guest-facing booking page.
//
// WHY A SEPARATE CONTROLLER?
//   The booking page needs event type details (title, description, duration,
//   color) BEFORE a date is selected. The /api/slots endpoint only returns
//   this info once a date is provided. Having a dedicated public endpoint
//   lets the page render the left panel immediately on load.
// =============================================================================

import { prisma } from "../lib/prisma.js";

// =============================================================================
// GET /api/public/event-type/:slug
// Returns the public-facing details of an active event type.
// No authentication required — guests call this from the booking page.
// =============================================================================
export const getPublicEventType = async (req, res) => {
  try {
    const { slug } = req.params;

    const eventType = await prisma.eventType.findFirst({
      where: { slug, isActive: true },
      select: {
        id:          true,
        title:       true,
        description: true,
        duration:    true,
        color:       true,
        slug:        true,
      },
    });

    if (!eventType) {
      res.status(404).json({
        success: false,
        message: `No active event type found with slug "${slug}".`,
      });
      return;
    }

    res.json({ success: true, data: eventType });
  } catch (error) {
    console.error("[Public] getPublicEventType error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
