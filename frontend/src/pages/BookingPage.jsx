// src/pages/BookingPage.jsx
//
// PUBLIC — no authentication required.
// Cal.com-style 3-panel booking layout:
//   Left  : event type details (title, duration, description)
//   Centre: custom monthly calendar grid
//   Right : available time slots (slides in on date selection)
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarOff,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import api from "../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Date object → "YYYY-MM-DD" (local time, not UTC) */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date object → "Wednesday, June 4" */
function toDisplayDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  });
}

/** "14:30" → "2:30 PM" */
function to12h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Initials avatar from a name string */
function initials(name = "Cal Admin") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// =============================================================================
// Sub-component: CalendarGrid
// Pure presentational component — all state is lifted to BookingPage.
// =============================================================================
function CalendarGrid({ year, month, selectedDate, today, onSelect, onPrev, onNext }) {
  const firstDay    = new Date(year, month, 1).getDay();   // 0=Sun…6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build a flat array of day numbers with leading nulls for offset
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad tail to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Prevent navigating before the current month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewStart      = new Date(year, month, 1);
  const canGoPrev      = viewStart > thisMonthStart;

  return (
    <div className="select-none">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="calendar-prev-month"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className={`p-2 rounded-md transition-colors ${
            canGoPrev
              ? "hover:bg-gray-100 text-gray-600"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        <span className="text-sm font-semibold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </span>

        <button
          id="calendar-next-month"
          onClick={onNext}
          aria-label="Next month"
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="flex items-center justify-center text-xs font-medium text-gray-400 h-9"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="h-10" />;

          const cellDate   = new Date(year, month, day);
          const isPast     = cellDate < today;
          const isToday    = cellDate.getTime() === today.getTime();
          const isSelected =
            selectedDate &&
            cellDate.getFullYear() === selectedDate.getFullYear() &&
            cellDate.getMonth()    === selectedDate.getMonth() &&
            cellDate.getDate()     === selectedDate.getDate();

          return (
            <div key={day} className="flex items-center justify-center h-10">
              <button
                id={`day-${year}-${month + 1}-${day}`}
                onClick={() => !isPast && onSelect(cellDate)}
                disabled={isPast}
                aria-label={`${MONTH_NAMES[month]} ${day}, ${year}`}
                aria-pressed={isSelected}
                className={[
                  "w-9 h-9 rounded-full text-sm transition-colors duration-150 font-medium",
                  isPast
                    ? "text-gray-300 cursor-not-allowed"
                    : "cursor-pointer",
                  isSelected
                    ? "bg-gray-900 text-white"
                    : isToday && !isPast
                    ? "ring-2 ring-gray-900 text-gray-900"
                    : !isPast
                    ? "hover:bg-gray-100 text-gray-700"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-component: SlotsPanel
// =============================================================================
function SlotsPanel({ date, slots, loading, selectedSlot, onSlotSelect }) {
  return (
    <div className="flex flex-col h-full">
      {/* Selected date label */}
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        {toDisplayDate(date)}
      </h3>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading slots…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && slots.length === 0 && (
        <div className="flex flex-col items-center text-center py-8 px-2">
          <CalendarOff
            className="h-7 w-7 text-gray-300 mb-2"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-gray-500">
            No slots available
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            There are no open times on this date. Try picking a different day.
          </p>
        </div>
      )}

      {/* Slot buttons */}
      {!loading && slots.length > 0 && (
        <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
          {slots.map((slot) => {
            const active = selectedSlot === slot;
            return (
              <li key={slot}>
                <button
                  id={`slot-${slot}`}
                  onClick={() => onSlotSelect(slot)}
                  aria-pressed={active}
                  className={`w-full text-sm font-medium py-2.5 px-3 rounded-md border transition-colors duration-150 ${
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900"
                  }`}
                >
                  {to12h(slot)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// Main: BookingPage
// =============================================================================
export default function BookingPage() {
  const { slug }     = useParams();
  const navigate     = useNavigate();

  // ── Event type state ────────────────────────────────────────────────────────
  const [eventType, setEventType] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError]     = useState("");

  // ── Calendar state ──────────────────────────────────────────────────────────
  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Slots state ─────────────────────────────────────────────────────────────
  const [slots,         setSlots]         = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [selectedSlot,  setSelectedSlot]  = useState(null);

  // ── Fetch event type on mount ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/public/event-type/${slug}`);
        setEventType(res.data.data);
      } catch (err) {
        setPageError(
          err.response?.status === 404
            ? `No active event type found for "${slug}".`
            : "Could not load booking page. Is the backend running?"
        );
      } finally {
        setPageLoading(false);
      }
    })();
  }, [slug]);

  // ── Fetch slots when date changes ────────────────────────────────────────────
  const fetchSlots = useCallback(
    async (date) => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const res = await api.get("/api/slots", {
          params: { date: toISO(date), slug },
        });
        setSlots(res.data.data.availableSlots ?? []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug]
  );

  function handleDateSelect(date) {
    setSelectedDate(date);
    fetchSlots(date);
  }

  // ── Month navigation ─────────────────────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // ── Slot selected → continue to booking form (Step 4.2) ─────────────────────
  function handleContinue() {
    navigate(
      `/book/${slug}/confirm?date=${toISO(selectedDate)}&time=${selectedSlot}`
    );
  }

  // ── Full page loading / error ────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <CalendarOff className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-700 text-center max-w-xs">
          {pageError}
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800 transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
    );
  }

  const slotsVisible = !!selectedDate;

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      {/* Outer card */}
      <div
        className={`
          w-full bg-white border border-gray-200 rounded-xl shadow-sm
          flex flex-col lg:flex-row overflow-hidden
          transition-all duration-300
          ${slotsVisible ? "max-w-4xl" : "max-w-2xl"}
        `}
      >
        {/* ════════════════════════════════════════════
            LEFT PANEL — Event info
            ════════════════════════════════════════════ */}
        <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 p-7 flex flex-col gap-5">
          {/* Back link */}
          <button
            id="back-to-dashboard"
            onClick={() => navigate("/event-types")}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            All events
          </button>

          {/* Organizer avatar + brand */}
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: eventType.color }}
            >
              {initials("Cal Admin")}
            </span>
            <span className="text-xs font-medium text-gray-500">
              Cal Admin
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Event details */}
          <div className="flex flex-col gap-3">
            {/* Title */}
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {eventType.title}
            </h1>

            {/* Duration */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>{eventType.duration} minutes</span>
            </div>

            {/* Description */}
            {eventType.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {eventType.description}
              </p>
            )}

            {/* Booking URL pill */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-500 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-md w-fit">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
              /book/{eventType.slug}
            </div>
          </div>
        </aside>

        {/* ════════════════════════════════════════════
            CENTRE PANEL — Calendar
            ════════════════════════════════════════════ */}
        <div className="flex-1 p-7 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">
            Select a Date &amp; Time
          </h2>
          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            selectedDate={selectedDate}
            today={today}
            onSelect={handleDateSelect}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        </div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — Time slots
            Slides in when a date is selected.
            ════════════════════════════════════════════ */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${slotsVisible
              ? "w-full lg:w-60 opacity-100 max-h-[9999px]"
              : "w-0 opacity-0 max-h-0 lg:max-h-[9999px]"}
          `}
        >
          {selectedDate && (
            <div className="h-full p-7 flex flex-col gap-4">
              <SlotsPanel
                date={selectedDate}
                slots={slots}
                loading={slotsLoading}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
              />

              {/* Continue CTA — only shown when a slot is selected */}
              {selectedSlot && !slotsLoading && (
                <button
                  id="continue-booking-btn"
                  onClick={handleContinue}
                  className="mt-auto w-full py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors duration-150 shadow-sm"
                >
                  Continue →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
