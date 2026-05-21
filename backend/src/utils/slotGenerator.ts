// =============================================================================
// src/utils/slotGenerator.ts — Pure Slot Generation Utility
//
// This module contains three pure, stateless helper functions used by the
// slot generation engine. They are isolated here so they can be unit-tested
// independently of Express and Prisma.
//
// WHY PURE FUNCTIONS?
//   Pure functions (no side effects, deterministic output) are the right tool
//   for this kind of algorithmic logic. They are easy to reason about,
//   compose, and test in isolation — a key point to make in code reviews.
// =============================================================================

// -----------------------------------------------------------------------------
// timeToMinutes
// Converts a "HH:MM" time string into total minutes since midnight.
// This lets us do arithmetic on times using simple integer math.
//
// Examples:
//   "00:00" →   0
//   "09:30" → 570
//   "17:00" → 1020
// -----------------------------------------------------------------------------
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// -----------------------------------------------------------------------------
// minutesToTime
// Converts total minutes since midnight back to an "HH:MM" string.
// The inverse of timeToMinutes.
//
// Examples:
//     0 → "00:00"
//   570 → "09:30"
//  1020 → "17:00"
// -----------------------------------------------------------------------------
export function minutesToTime(totalMinutes: number): string {
  const hours   = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// -----------------------------------------------------------------------------
// generateTimeSlots
// Divides an availability window into fixed-duration chunks.
//
// Parameters:
//   startTime       — "HH:MM" when availability begins, e.g. "09:00"
//   endTime         — "HH:MM" when availability ends,   e.g. "17:00"
//   durationMinutes — length of each slot,              e.g. 30
//
// Returns an array of slot start-times as "HH:MM" strings.
//
// Algorithm:
//   Walk from startTime to endTime in steps of durationMinutes.
//   A slot is only included if it ENDS at or before endTime.
//   (i.e., current + duration <= endMinutes)
//
// Example:
//   generateTimeSlots("09:00", "17:00", 30)
//   → ["09:00","09:30","10:00","10:30",...,"16:30"]
//
//   The last slot "16:30" ends at 17:00 ✓
//   "17:00" itself is NOT included because 17:00 + 30 = 17:30 > 17:00 ✗
// -----------------------------------------------------------------------------
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const startMins = timeToMinutes(startTime);
  const endMins   = timeToMinutes(endTime);
  const slots: string[] = [];

  for (
    let current = startMins;
    current + durationMinutes <= endMins;
    current += durationMinutes
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

// -----------------------------------------------------------------------------
// isSlotConflicting
// Checks whether a proposed time slot overlaps with ANY existing booking.
//
// Parameters:
//   slotStart — the slot's start as a Date object
//   slotEnd   — the slot's end   as a Date object (slotStart + duration)
//   bookings  — array of existing bookings, each with startTime and endTime
//
// Returns true if the slot overlaps with at least one booking.
//
// Overlap Logic (standard interval overlap test):
//   Two intervals [A_start, A_end) and [B_start, B_end) overlap if and only if:
//     A_start < B_end  AND  A_end > B_start
//
//   Visualisation:
//     Case 1 (no overlap): [---A---]     [---B---]
//     Case 2 (no overlap):           [---A---]  [---B---]  (A ends before B starts)
//     Case 3 (overlap):   [----A-----]
//                                [---B---]
//     Case 4 (overlap):      [---A---]
//                         [------B------]
// -----------------------------------------------------------------------------
export function isSlotConflicting(
  slotStart: Date,
  slotEnd: Date,
  bookings: Array<{ startTime: Date; endTime: Date }>
): boolean {
  return bookings.some(
    (booking) =>
      slotStart < booking.endTime && slotEnd > booking.startTime
  );
}

// -----------------------------------------------------------------------------
// parseDateString
// Safely parses a "YYYY-MM-DD" string into a Date object using LOCAL time,
// avoiding the UTC-offset pitfall of `new Date("YYYY-MM-DD")` which is
// interpreted as midnight UTC and can shift the day in timezones behind UTC.
//
// Example: "2024-01-15" → new Date(2024, 0, 15)  (local midnight)
// -----------------------------------------------------------------------------
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS
}

// -----------------------------------------------------------------------------
// buildDateTimeUTC
// Combines a "YYYY-MM-DD" date string and "HH:MM" time string into a UTC
// DateTime object. Used consistently for storing and comparing booking times.
//
// Example: buildDateTimeUTC("2024-01-15", "09:30")
//          → new Date("2024-01-15T09:30:00.000Z")
// -----------------------------------------------------------------------------
export function buildDateTimeUTC(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}
