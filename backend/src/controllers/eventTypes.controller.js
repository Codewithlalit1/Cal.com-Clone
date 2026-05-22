// =============================================================================
// src/controllers/eventTypes.controller.js
//
// Contains all business logic for the /api/event-types resource.
// Routes are kept thin (just routing declarations); this file does the work.
//
// Pattern used: Each export is a standalone async Express handler.
// The route file imports these and wires them to HTTP methods/paths.
// =============================================================================

import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// =============================================================================
// VALIDATION SCHEMAS
// Zod schemas defined at the module level (not inside handlers) so they are
// compiled once and reused on every request — a minor but good practice.
// =============================================================================

const createEventTypeSchema = z.object({
  title:       z.string().min(1, "title is required").max(100),
  description: z.string().optional(),
  duration:    z
    .number({ error: "duration is required" })
    .int("duration must be a whole number")
    .positive("duration must be positive")
    .refine((v) => [15, 30, 45, 60, 90, 120].includes(v), {
      message: "duration must be one of: 15, 30, 45, 60, 90, or 120 minutes",
    }),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/, "color must be a valid hex code e.g. #6366f1").optional().default("#6366f1"),
  isActive: z.boolean().optional().default(true),
});

// Partial makes every field optional — used for PUT (patch-style update)
const updateEventTypeSchema = createEventTypeSchema.partial();

// =============================================================================
// HELPER: slugify
// Converts a human-readable title into a URL-safe slug.
// "30 Min Interview" → "30-min-interview"
//
// Steps:
//   1. Lowercase everything
//   2. Replace non-alphanumeric characters with hyphens
//   3. Strip leading and trailing hyphens
// =============================================================================
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =============================================================================
// HELPER: ensureUniqueSlug
// Appends a counter suffix until the slug doesn't exist in the DB.
// e.g. "my-event" → "my-event-1" → "my-event-2"
//
// excludeId: when updating, exclude the current record from the uniqueness check
//            so a record can be updated without conflicting with itself.
// =============================================================================
async function ensureUniqueSlug(baseSlug, excludeId) {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const existing = await prisma.eventType.findUnique({ where: { slug } });

    // Slug is free OR the only match is the record we're currently editing
    if (!existing || (excludeId !== undefined && existing.id === excludeId)) {
      break;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// =============================================================================
// GET /api/event-types
// Returns all event types owned by the authenticated user (userId = 1).
// Ordered oldest-first so the dashboard list is stable.
// =============================================================================
export const listEventTypes = async (req, res) => {
  try {
    const eventTypes = await prisma.eventType.findMany({
      where:   { userId: req.userId },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, data: eventTypes });
  } catch (error) {
    console.error("[EventTypes] listEventTypes error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// GET /api/event-types/:id
// Returns a single event type by ID, scoped to the current user.
// Returns 404 if it doesn't exist or belongs to a different user.
// =============================================================================
export const getEventType = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Event type ID must be a number" });
      return;
    }

    const eventType = await prisma.eventType.findFirst({
      where: { id, userId: req.userId },
    });

    if (!eventType) {
      res.status(404).json({ success: false, message: "Event type not found" });
      return;
    }

    res.json({ success: true, data: eventType });
  } catch (error) {
    console.error("[EventTypes] getEventType error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// POST /api/event-types
// Creates a new event type for the authenticated user.
//
// The slug is auto-generated from the title and guaranteed unique.
// The user does NOT need to pass a slug — it's derived server-side.
// This matches how Cal.com works: title drives the URL slug.
// =============================================================================
export const createEventType = async (req, res) => {
  try {
    // Validate incoming body
    const parsed = createEventTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { title, description, duration, color, isActive } = parsed.data;

    // Auto-generate a unique slug from the title
    const slug = await ensureUniqueSlug(slugify(title));

    const eventType = await prisma.eventType.create({
      data: {
        title,
        slug,
        description,
        duration,
        color,
        isActive,
        userId: req.userId, // attach to the current admin (always 1)
      },
    });

    // 201 Created — the standard HTTP status for successful resource creation
    res.status(201).json({ success: true, data: eventType });
  } catch (error) {
    console.error("[EventTypes] createEventType error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// PUT /api/event-types/:id
// Updates an existing event type. Uses partial validation so the client
// can send only the fields it wants to change (PATCH-style semantics).
//
// If the title changes, the slug is regenerated automatically.
// =============================================================================
export const updateEventType = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Event type ID must be a number" });
      return;
    }

    // Verify the record exists and belongs to this user before touching it
    const existing = await prisma.eventType.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: "Event type not found" });
      return;
    }

    // Validate only the fields that were sent
    const parsed = updateEventTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { title, description, duration, color, isActive } = parsed.data;

    // Re-slug only if the title actually changed
    let slug = existing.slug;
    if (title !== undefined && title !== existing.title) {
      slug = await ensureUniqueSlug(slugify(title), id);
    }

    const updated = await prisma.eventType.update({
      where: { id },
      data: {
        // Conditional spread: only include a field if it was sent in the request
        ...(title       !== undefined && { title, slug }),
        ...(description !== undefined && { description }),
        ...(duration    !== undefined && { duration }),
        ...(color       !== undefined && { color }),
        ...(isActive    !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("[EventTypes] updateEventType error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =============================================================================
// DELETE /api/event-types/:id
// Permanently deletes an event type (and all its bookings via CASCADE).
// Returns 404 if the record doesn't exist or doesn't belong to this user.
// =============================================================================
export const deleteEventType = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Event type ID must be a number" });
      return;
    }

    const existing = await prisma.eventType.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: "Event type not found" });
      return;
    }

    await prisma.eventType.delete({ where: { id } });

    res.json({ success: true, message: `"${existing.title}" has been deleted` });
  } catch (error) {
    console.error("[EventTypes] deleteEventType error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
