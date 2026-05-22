// src/pages/BookingPage.jsx
//
// PUBLIC — no authentication required.
//
// Step machine:
//   'slots' → calendar is shown + slots panel slides in on date pick
//   'form'  → clicking a slot transitions to the booking form
//   (success navigates away to /booking-success)
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
  AlertCircle,
  User,
  Mail,
  FileText,
} from "lucide-react";
import api from "../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Date → "YYYY-MM-DD" in local time */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date → "Wednesday, June 4" */
function toDisplayDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

/** "14:30" → "2:30 PM" */
function to12h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Add minutes to a HH:MM string → new HH:MM string */
function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Initials from a name */
function initials(name = "Cal Admin") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// =============================================================================
// Sub-component: CalendarGrid
// =============================================================================
function CalendarGrid({ year, month, selectedDate, today, onSelect, onPrev, onNext }) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewStart      = new Date(year, month, 1);
  const canGoPrev      = viewStart > thisMonthStart;

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="calendar-prev-month"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className={`p-2 rounded-md transition-colors ${
            canGoPrev ? "hover:bg-gray-100 text-gray-600" : "text-gray-300 cursor-not-allowed"
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

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="flex items-center justify-center text-xs font-medium text-gray-400 h-9">
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
                  isPast ? "text-gray-300 cursor-not-allowed" : "cursor-pointer",
                  isSelected
                    ? "bg-gray-900 text-white"
                    : isToday && !isPast
                    ? "ring-2 ring-gray-900 text-gray-900"
                    : !isPast
                    ? "hover:bg-gray-100 text-gray-700"
                    : "",
                ].filter(Boolean).join(" ")}
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
// Sub-component: SlotsPanel  (step = 'slots')
// =============================================================================
function SlotsPanel({ date, slots, loading, onSlotSelect }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        {toDisplayDate(date)}
      </h3>
      <p className="text-xs text-gray-400 mb-4">Select a time</p>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {!loading && slots.length === 0 && (
        <div className="flex flex-col items-center text-center py-8 px-2">
          <CalendarOff className="h-7 w-7 text-gray-300 mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">No slots available</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Try picking a different day.
          </p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
          {slots.map((slot) => (
            <li key={slot}>
              <button
                id={`slot-${slot}`}
                onClick={() => onSlotSelect(slot)}
                className="w-full text-sm font-medium py-2.5 px-3 rounded-md border border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150"
              >
                {to12h(slot)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// Sub-component: BookingForm  (step = 'form')
// =============================================================================
function BookingForm({ eventType, selectedDate, selectedSlot, onBack, onSuccess }) {
  const [form, setForm]         = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");

  const endSlot = addMinutes(selectedSlot, eventType.duration);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/api/bookings", {
        eventTypeId:  eventType.id,
        date:         toISO(selectedDate),
        startTime:    selectedSlot,
        bookerName:   form.name.trim(),
        bookerEmail:  form.email.trim(),
        notes:        form.notes.trim() || undefined,
      });
      onSuccess({
        booking:      res.data.data,
        bookerName:   form.name.trim(),
        bookerEmail:  form.email.trim(),
        eventTitle:   eventType.title,
        eventColor:   eventType.color,
        duration:     eventType.duration,
        slug:         eventType.slug,
        displayDate:  toDisplayDate(selectedDate),
        startSlot:    selectedSlot,
        endSlot,
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <button
          id="back-to-slots-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Change time
        </button>
        <h2 className="text-base font-semibold text-gray-900">Enter your details</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {toDisplayDate(selectedDate)} · {to12h(selectedSlot)} – {to12h(endSlot)}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label
            htmlFor="booker-name"
            className="block text-xs font-medium text-gray-700 mb-1.5"
          >
            Your name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              id="booker-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Smith"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="booker-email"
            className="block text-xs font-medium text-gray-700 mb-1.5"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              id="booker-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="booker-notes"
            className="block text-xs font-medium text-gray-700 mb-1.5"
          >
            Additional notes{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <textarea
              id="booker-notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Anything you'd like to share beforehand…"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          id="confirm-booking-btn"
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors duration-150 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Confirming…" : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// Main: BookingPage
// =============================================================================
export default function BookingPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();

  // ── Event type ───────────────────────────────────────────────────────────────
  const [eventType,   setEventType]   = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError,   setPageError]   = useState("");

  // ── Calendar ─────────────────────────────────────────────────────────────────
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Slots ────────────────────────────────────────────────────────────────────
  const [slots,        setSlots]        = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ── Step machine ─────────────────────────────────────────────────────────────
  // 'slots' → date/time picker   'form' → name/email form
  const [step, setStep] = useState("slots");

  // ── Fetch event type ─────────────────────────────────────────────────────────
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

  // ── Fetch slots ──────────────────────────────────────────────────────────────
  const fetchSlots = useCallback(
    async (date) => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const res = await api.get("/api/slots", { params: { date: toISO(date), slug } });
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
    setStep("slots");        // reset to slots step if changing date
    fetchSlots(date);
  }

  // Clicking a slot goes straight to the form (no intermediate "Continue" step)
  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setStep("form");
  }

  function handleBackToSlots() {
    setStep("slots");
    setSelectedSlot(null);
  }

  // ── Month nav ────────────────────────────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // ── Success → navigate to /booking-success ───────────────────────────────────
  function handleSuccess(successData) {
    navigate("/booking-success", { state: successData });
  }

  // ── Full-page loading / error ────────────────────────────────────────────────
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
        <p className="text-sm font-medium text-gray-700 text-center max-w-xs">{pageError}</p>
        <button
          onClick={() => navigate("/")}
          className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800 transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
    );
  }

  // ── Shared left panel (event info) ───────────────────────────────────────────
  const LeftPanel = (
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

      {/* Organizer */}
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: eventType.color }}
        >
          {initials("Cal Admin")}
        </span>
        <span className="text-xs font-medium text-gray-500">Cal Admin</span>
      </div>

      <div className="border-t border-gray-100" />

      {/* Event details */}
      <div className="flex flex-col gap-3">
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{eventType.title}</h1>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>{eventType.duration} minutes</span>
        </div>

        {eventType.description && (
          <p className="text-sm text-gray-500 leading-relaxed">{eventType.description}</p>
        )}

        {/* In form step, also show selected date/time summary */}
        {step === "form" && selectedDate && selectedSlot && (
          <div className="mt-1 flex flex-col gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" strokeWidth={1.75} />
              {toDisplayDate(selectedDate)}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" strokeWidth={1.75} />
              {to12h(selectedSlot)} – {to12h(addMinutes(selectedSlot, eventType.duration))}
            </div>
          </div>
        )}

        {step === "slots" && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-500 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-md w-fit">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
            /book/{eventType.slug}
          </div>
        )}
      </div>
    </aside>
  );

  // ── Render: FORM step ────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col lg:flex-row overflow-hidden">
          {LeftPanel}
          <div className="flex-1 p-7">
            <BookingForm
              eventType={eventType}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onBack={handleBackToSlots}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Render: SLOTS step (default) ─────────────────────────────────────────────
  const slotsVisible = !!selectedDate;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div
        className={`
          w-full bg-white border border-gray-200 rounded-xl shadow-sm
          flex flex-col lg:flex-row overflow-hidden
          transition-all duration-300
          ${slotsVisible ? "max-w-4xl" : "max-w-2xl"}
        `}
      >
        {LeftPanel}

        {/* Centre — Calendar */}
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

        {/* Right — Slots (slides in when date selected) */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${slotsVisible
              ? "w-full lg:w-60 opacity-100 max-h-[9999px]"
              : "w-0 opacity-0 max-h-0 lg:max-h-[9999px]"}
          `}
        >
          {selectedDate && (
            <div className="h-full p-7">
              <SlotsPanel
                date={selectedDate}
                slots={slots}
                loading={slotsLoading}
                onSlotSelect={handleSlotSelect}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
