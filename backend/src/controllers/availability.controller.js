// =============================================================================
// src/controllers/availability.controller.js
//
// Handles reading and saving the admin's weekly availability schedule.
//
// Data model: one row per day of the week per user.
//   dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
//   startTime: "HH:MM" string (24-hour, e.g. "09:00")
//   endTime:   "HH:MM" string (24-hour, e.g. "17:00")
//   isEnabled: boolean — false means the admin is unavailable that day
//
// WHY UPSERT INSTEAD OF INSERT?
//   The availability table uses @@unique([userId, dayOfWeek]).
//   An upsert lets us run the same save operation whether the row already
//   exists or is being created for the first time — idempotent by design.
//
// WHY A PRISMA TRANSACTION?
//   We're updating up to 7 rows atomically. A transaction ensures either
//   all days are saved or none are — no partial writes if one fails.
// =============================================================================

import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Regex to validate "HH:MM" 24-hour time format
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Schema for a single day's availability object
const availabilityDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, "dayOfWeek must be 0 (Sun) to 6 (Sat)"),
  startTime: z.string().regex(TIME_REGEX, 'startTime must be "HH:MM" in 24-hour format'),
  endTime:   z.string().regex(TIME_REGEX, 'endTime must be "HH:MM" in 24-hour format'),
  isEnabled: z.boolean(),
});

// Schema for the request body — an array of up to 7 day objects
const saveAvailabilitySchema = z.object({
  availability: z
    .array(availabilityDaySchema)
    .min(1, "At least one day is required")
    .max(7, "Cannot have more than 7 days"),
});

// =============================================================================
// GET /api/availability
// Returns the full weekly availability schedule for userId = 1.
// Returns all 7 days ordered Sunday → Saturday.
// =============================================================================
export const getAvailability = async (req, res) => {
  try {
    const availability = await prisma.availability.findMany({
      where:   { userId: req.userId },
      orderBy: { dayOfWeek: "asc" }, // 0=Sun first, 6=Sat last
    });

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error("[Availability] getAvailability error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// POST /api/availability  (also handles PUT for backwards compatibility)
// Saves (upserts) the admin's availability for one or more days of the week.
//
// Request body example:
//   {
//     "availability": [
//       { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isEnabled": true },
//       { "dayOfWeek": 6, "startTime": "09:00", "endTime": "13:00", "isEnabled": false }
//     ]
//   }
//
// Each day is upserted independently (create if new, update if existing).
// All upserts run inside a single Prisma transaction.
// =============================================================================
export const saveAvailability = async (req, res) => {
  try {
    // Step 1: Validate the body
    const parsed = saveAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { availability } = parsed.data;

    // Step 2: Business rule — for enabled days, startTime must be before endTime
    for (const slot of availability) {
      if (slot.isEnabled && slot.startTime >= slot.endTime) {
        res.status(400).json({
          success: false,
          message: `Day ${slot.dayOfWeek}: startTime ("${slot.startTime}") must be earlier than endTime ("${slot.endTime}")`,
        });
        return;
      }
    }

    // Step 3: Upsert all days atomically in a transaction
    // prisma.$transaction accepts an array of Prisma query promises
    // and runs them all in a single database transaction.
    const results = await prisma.$transaction(
      availability.map((slot) =>
        prisma.availability.upsert({
          where: {
            // The composite unique key defined in schema.prisma
            userId_dayOfWeek: { userId: req.userId, dayOfWeek: slot.dayOfWeek },
          },
          update: {
            startTime: slot.startTime,
            endTime:   slot.endTime,
            isEnabled: slot.isEnabled,
          },
          create: {
            userId:    req.userId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime:   slot.endTime,
            isEnabled: slot.isEnabled,
          },
        })
      )
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[Availability] saveAvailability error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
