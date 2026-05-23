// =============================================================================
// src/controllers/availability.controller.js
//
// Handles reading and saving the admin's weekly availability schedule.
// Supports multiple intervals per day.
// =============================================================================

import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Regex to validate "HH:MM" 24-hour time format
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Schema for a single interval
const availabilityIntervalSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_REGEX, 'startTime must be "HH:MM" in 24-hour format'),
  endTime:   z.string().regex(TIME_REGEX, 'endTime must be "HH:MM" in 24-hour format'),
  isEnabled: z.boolean(),
});

// Schema for the request body — flat array of all intervals across the week
const saveAvailabilitySchema = z.object({
  availability: z.array(availabilityIntervalSchema),
});

// =============================================================================
// GET /api/availability
// Returns all availability intervals for the user.
// =============================================================================
export const getAvailability = async (req, res) => {
  try {
    const availability = await prisma.availability.findMany({
      where:   { userId: req.userId },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ],
    });

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error("[Availability] getAvailability error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// POST /api/availability
// Overwrites the user's availability with the provided intervals.
// =============================================================================
export const saveAvailability = async (req, res) => {
  try {
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

    // Validate times (start must be before end for enabled days)
    for (const slot of availability) {
      if (slot.isEnabled && slot.startTime >= slot.endTime) {
        res.status(400).json({
          success: false,
          message: `Day ${slot.dayOfWeek}: startTime ("${slot.startTime}") must be earlier than endTime ("${slot.endTime}")`,
        });
        return;
      }
    }

    // Replace all intervals in a single transaction
    const results = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing availability for this user
      await tx.availability.deleteMany({
        where: { userId: req.userId }
      });

      // 2. Insert the new intervals
      if (availability.length > 0) {
        await tx.availability.createMany({
          data: availability.map((slot) => ({
            userId:    req.userId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime:   slot.endTime,
            isEnabled: slot.isEnabled,
          }))
        });
      }
      
      // Return the newly created records
      return tx.availability.findMany({
        where: { userId: req.userId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      });
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[Availability] saveAvailability error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
