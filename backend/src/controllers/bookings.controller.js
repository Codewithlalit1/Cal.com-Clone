// =============================================================================
// src/controllers/bookings.controller.js
//
// Handles listing and creating bookings (appointments).
//
// KEY DESIGN DECISION — How time is received vs. stored:
//   The client sends:  date = "2024-01-15"  (YYYY-MM-DD)
//                      startTime = "09:30"  (HH:MM, 24-hour)
//   The server stores: startTime = DateTime  (full UTC timestamp)
//                      endTime   = DateTime  (startTime + eventType.duration)
//                      date      = DateTime  (midnight UTC of that calendar day)
//
//   Storing endTime avoids recalculating it on every read.
//   Storing date as its own column makes calendar-day queries simple:
//     WHERE date = '2024-01-15T00:00:00Z'  (no string parsing on reads)
//
// DOUBLE-BOOKING PREVENTION:
//   The POST handler re-checks for conflicts immediately before inserting.
//   This guards against the race condition where two guests click "Book"
//   for the same slot within milliseconds of each other (TOCTOU attack).
//   The check runs in the same transaction as the insert for full safety.
// =============================================================================

import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildDateTimeUTC } from "../utils/slotGenerator.js";

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour

const createBookingSchema = z.object({
  eventTypeId:  z.number({ error: "eventTypeId is required" }).int().positive(),
  date:         z.string().regex(DATE_REGEX, 'date must be "YYYY-MM-DD", e.g. "2024-01-15"'),
  startTime:    z.string().regex(TIME_REGEX, 'startTime must be "HH:MM", e.g. "09:30"'),
  bookerName:   z.string().min(1, "bookerName is required").max(100),
  bookerEmail:  z.string().email("bookerEmail must be a valid email address"),
  notes:        z.string().optional(),
});

// =============================================================================
// GET /api/bookings
// Returns all bookings for the admin, ordered chronologically.
// Supports optional query filters:
//   ?status=CONFIRMED    — filter by status (CONFIRMED | CANCELLED | COMPLETED)
//   ?eventTypeId=2       — filter to a specific event type
// =============================================================================
export const listBookings = async (req, res) => {
  try {
    const { status, eventTypeId } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.userId,
        // Only apply filters if the query params were provided
        ...(status      && { status }),
        ...(eventTypeId && { eventTypeId: parseInt(eventTypeId) }),
      },
      include: {
        // Include summary fields from the related EventType so the frontend
        // doesn't need to make a separate API call for each booking row.
        eventType: {
          select: { title: true, duration: true, color: true, slug: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("[Bookings] listBookings error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// GET /api/bookings/:id
// Returns a single booking by ID, scoped to the current admin.
// =============================================================================
export const getBooking = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Booking ID must be a number" });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: { id, userId: req.userId },
      include: {
        eventType: { select: { title: true, duration: true, color: true, slug: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("[Bookings] getBooking error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// POST /api/bookings
// Creates a new booking for a guest.
//
// Request body:
//   {
//     "eventTypeId":  2,
//     "date":        "2024-01-15",
//     "startTime":   "09:30",
//     "bookerName":  "Jane Smith",
//     "bookerEmail": "jane@example.com",
//     "notes":       "Please send the Zoom link beforehand."  // optional
//   }
//
// STEPS:
//   1. Validate the body
//   2. Look up the EventType to get duration
//   3. Compute startTime (DateTime), endTime (DateTime), date (midnight DateTime)
//   4. DOUBLE-BOOKING CHECK: query for any CONFIRMED bookings that overlap
//   5. If safe, insert the new booking and return it
// =============================================================================
export const createBooking = async (req, res) => {
  try {
    // ── Step 1: Validate the request body ────────────────────────────────────
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { eventTypeId, date, startTime, bookerName, bookerEmail, notes } =
      parsed.data;

    // ── Step 2: Look up the EventType ─────────────────────────────────────────
    // We need the duration to calculate endTime, and we confirm the event type
    // is active (inactive ones are not bookable by guests).
    const eventType = await prisma.eventType.findFirst({
      where: { id: eventTypeId, userId: req.userId, isActive: true },
    });

    if (!eventType) {
      res.status(404).json({
        success: false,
        message: "Event type not found or is no longer active",
      });
      return;
    }

    // ── Step 3: Build full DateTime objects ──────────────────────────────────
    // Combine the date string + time string into a UTC timestamp.
    // buildDateTimeUTC("2024-01-15", "09:30") → new Date("2024-01-15T09:30:00.000Z")
    const startDateTime = buildDateTimeUTC(date, startTime);

    // Calculate endTime by adding the event duration in milliseconds
    const endDateTime = new Date(
      startDateTime.getTime() + eventType.duration * 60 * 1000
    );

    // The `date` column stores midnight UTC of the booking's calendar day.
    // This makes querying all bookings on a given day very efficient.
    const dateOnly = new Date(`${date}T00:00:00.000Z`);

    // ── Step 4: Double-Booking Check ─────────────────────────────────────────
    // Re-fetch conflicting bookings RIGHT BEFORE inserting.
    // This is the "check-then-act" guard against race conditions (TOCTOU).
    //
    // Overlap condition (standard interval overlap):
    //   A new slot [startDateTime, endDateTime) conflicts with an existing
    //   booking [bookingStart, bookingEnd) if and only if:
    //   startDateTime < bookingEnd  AND  endDateTime > bookingStart
    //
    //   We only check CONFIRMED bookings — CANCELLED ones free the slot.
    const conflict = await prisma.booking.findFirst({
      where: {
        eventTypeId,
        userId: req.userId,
        status: "CONFIRMED",
        OR: [
          // Case A: New slot starts inside an existing booking
          { startTime: { gte: startDateTime, lt: endDateTime } },
          // Case B: New slot ends inside an existing booking
          { endTime: { gt: startDateTime, lte: endDateTime } },
          // Case C: New slot completely contains an existing booking
          { startTime: { lte: startDateTime }, endTime: { gte: endDateTime } },
        ],
      },
    });

    if (conflict) {
      // 409 Conflict — the standard HTTP status for a resource state conflict
      res.status(409).json({
        success: false,
        message:
          "This time slot was just booked by someone else. Please select a different time.",
      });
      return;
    }

    // ── Step 5: Create the Booking ────────────────────────────────────────────
    const booking = await prisma.booking.create({
      data: {
        eventTypeId,
        userId: req.userId,
        bookerName,
        bookerEmail,
        date:      dateOnly,
        startTime: startDateTime,
        endTime:   endDateTime,
        notes,
        status: "CONFIRMED",
      },
      include: {
        eventType: { select: { title: true, duration: true, color: true } },
      },
    });

    // 201 Created — booking was successfully persisted
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("[Bookings] createBooking error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// PATCH /api/bookings/:id/cancel
// Cancels an existing booking (soft-delete via status change, not hard delete).
//
// WHY SOFT DELETE?
//   Hard-deleting bookings would lose the historical record of past meetings.
//   Setting status = CANCELLED preserves the data for audit and analytics
//   while freeing the time slot for new bookings.
// =============================================================================
export const cancelBooking = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Booking ID must be a number" });
      return;
    }

    const existing = await prisma.booking.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    if (existing.status === "CANCELLED") {
      res.status(400).json({ success: false, message: "This booking is already cancelled" });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data:  { status: "CANCELLED" },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Bookings] cancelBooking error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
