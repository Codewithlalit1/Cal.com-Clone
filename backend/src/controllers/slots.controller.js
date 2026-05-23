// =============================================================================
// src/controllers/slots.controller.js — The Slot Generation Engine
//
// This is the most algorithmically complex part of the backend.
// It answers the question: "Given a date and an event type, which time slots
// are still available for booking?"
//
// ENDPOINT: GET /api/slots?date=YYYY-MM-DD&slug=event-slug
// ACCESS:   Public — no authentication required.
//
// ALGORITHM (step by step):
//   1. Validate query parameters (date format and slug presence)
//   2. Look up the EventType by slug → get duration (e.g. 30 min)
//   3. Determine the day of the week for the requested date (e.g. Monday = 1)
//   4. Fetch admin's Availability for that day
//      - If the day is disabled or has no availability record → return []
//   5. Generate all theoretical time slots for that day
//      e.g. 09:00, 09:30, 10:00, ..., 16:30  (for a 30-min event, 9–5)
//   6. Fetch all CONFIRMED bookings for that date + this event type
//   7. Filter out any generated slots that conflict with existing bookings
//   8. Return the remaining available slots as an array of "HH:MM" strings
//
// WHY IS THIS PUBLIC?
//   Guests visit the booking page without logging in. They need to see
//   available slots before they can fill in their name/email and book.
// =============================================================================

import { prisma } from "../lib/prisma.js";
import {
  generateTimeSlots,
  isSlotConflicting,
  parseDateString,
  buildDateTimeUTC,
} from "../utils/slotGenerator.js";

// Regex for strict YYYY-MM-DD date validation
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// The hardcoded admin user ID (since auth is bypassed for this project)
// Public endpoints can't use req.userId (no auth middleware), so we
// reference the constant directly.
const ADMIN_USER_ID = 1;

// =============================================================================
// GET /api/slots?date=YYYY-MM-DD&slug=event-slug
// =============================================================================
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, slug, excludeBookingId } = req.query;

    // ─── Step 1: Validate Query Parameters ───────────────────────────────────
    if (!date || !slug) {
      res.status(400).json({
        success: false,
        message: 'Both "date" (YYYY-MM-DD) and "slug" query parameters are required.',
        example: "/api/slots?date=2024-01-15&slug=30-min-interview",
      });
      return;
    }

    if (!DATE_REGEX.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected "YYYY-MM-DD", e.g. "2024-01-15".',
      });
      return;
    }

    // ─── Step 2: Find the Event Type by Slug ─────────────────────────────────
    // The slug is the public identifier used in booking URLs (/book/:slug).
    // We also require the event type to be active — inactive types aren't bookable.
    const eventType = await prisma.eventType.findFirst({
      where: {
        slug,
        userId:   ADMIN_USER_ID,
        isActive: true,
      },
    });

    if (!eventType) {
      res.status(404).json({
        success: false,
        message: `No active event type found with slug "${slug}".`,
      });
      return;
    }

    // ─── Step 3: Determine Day of the Week ───────────────────────────────────
    // We use parseDateString (not `new Date(dateStr)`) to parse in LOCAL time,
    // avoiding the UTC midnight pitfall that can shift the day by -1 in some
    // timezones when JS parses "YYYY-MM-DD" as UTC midnight.
    //
    // getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
    const dateObj   = parseDateString(date);
    const dayOfWeek = dateObj.getDay();

    // ─── Step 4: Fetch Admin's Availability for This Day of the Week ─────────
    const availability = await prisma.availability.findUnique({
      where: {
        userId_dayOfWeek: { userId: ADMIN_USER_ID, dayOfWeek },
      },
    });

    // If no availability record exists, or the day is explicitly disabled,
    // return an empty array — the admin has no available slots on this day.
    if (!availability || !availability.isEnabled) {
      res.json({
        success: true,
        data: {
          date,
          slug,
          eventType:      { title: eventType.title, duration: eventType.duration },
          availableSlots: [],
          message: availability
            ? "The admin is not available on this day."
            : "No availability configured for this day.",
        },
      });
      return;
    }

    // ─── Step 5: Generate All Theoretical Time Slots ─────────────────────────
    // Divide the availability window into equal chunks of eventType.duration.
    // e.g. 09:00–17:00 with duration=30 → ["09:00","09:30",...,"16:30"]
    const allSlots = generateTimeSlots(
      availability.startTime,  // "09:00"
      availability.endTime,    // "17:00"
      eventType.duration       // e.g. 30
    );

    // ─── Step 6: Fetch Existing Bookings for This Date + Event Type ──────────
    // We query by date (midnight UTC of the requested day) so we only get
    // bookings on that calendar day — not across day boundaries.
    const dateStart = new Date(`${date}T00:00:00.000Z`); // midnight UTC
    const dateEnd   = new Date(`${date}T23:59:59.999Z`); // end of day UTC

    const existingBookings = await prisma.booking.findMany({
      where: {
        userId:      ADMIN_USER_ID,
        status:      "CONFIRMED",
        ...(excludeBookingId && { id: { not: parseInt(excludeBookingId) } }),
        // Find all bookings whose startTime falls on the requested date
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      select: {
        startTime: true,
        endTime:   true,
      },
    });

    // ─── Step 7: Filter Out Conflicting Slots ────────────────────────────────
    // For each theoretical slot, check if it overlaps with any existing booking.
    // We use the interval overlap formula: slotStart < bookingEnd AND slotEnd > bookingStart
    const availableSlots = allSlots.filter((slotTime) => {
      // Build the full DateTime for this slot (UTC)
      const slotStart = buildDateTimeUTC(date, slotTime);
      const slotEnd   = new Date(
        slotStart.getTime() + eventType.duration * 60 * 1000
      );

      // Keep the slot only if it does NOT conflict with any booking
      return !isSlotConflicting(slotStart, slotEnd, existingBookings);
    });

    // ─── Step 8: Return the Result ───────────────────────────────────────────
    res.json({
      success: true,
      data: {
        date,
        slug,
        dayOfWeek,         // useful for debugging (0=Sun, 1=Mon, etc.)
        eventType: {
          id:       eventType.id,
          title:    eventType.title,
          duration: eventType.duration,
          color:    eventType.color,
        },
        availability: {
          startTime: availability.startTime,
          endTime:   availability.endTime,
        },
        totalSlots:    allSlots.length,        // how many existed before filtering
        bookedCount:   existingBookings.length, // how many are already taken
        availableSlots,                         // the final bookable list
      },
    });
  } catch (error) {
    console.error("[Slots] getAvailableSlots error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
