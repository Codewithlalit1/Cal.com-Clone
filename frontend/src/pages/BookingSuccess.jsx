// src/pages/BookingSuccess.jsx
//
// PUBLIC — standalone confirmation page shown after a successful booking.
// Receives booking details via React Router navigation state.
// =============================================================================

import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Clock, CalendarDays, User, Mail, CheckCircle2 } from "lucide-react";

/** "14:30" → "2:30 PM" */
function to12h(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function BookingSuccess() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  // Guard — if someone navigates here directly without state, send them home
  if (!state) return <Navigate to="/" replace />;

  const {
    bookerName,
    bookerEmail,
    eventTitle,
    eventColor,
    duration,
    slug,
    displayDate,
    startSlot,
    endSlot,
  } = state;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* ── Checkmark icon ─────────────────────────────────────────────────── */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center animate-pop-in"
            style={{ backgroundColor: `${eventColor}18` }}  /* 10% opacity tint */
          >
            {/* Outer ring uses the event colour */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}30` }}
            >
              <CheckCircle2
                className="h-7 w-7"
                strokeWidth={1.75}
                style={{ color: eventColor }}
              />
            </div>
          </div>
        </div>

        {/* ── Heading ──────────────────────────────────────────────────────────── */}
        <div className="text-center mb-7 animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Booking confirmed
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            This meeting is scheduled.
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            A confirmation has been sent to{" "}
            <span className="font-medium text-gray-700">{bookerEmail}</span>.
          </p>
        </div>

        {/* ── Meeting details card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-up-delay">
          {/* Colour top strip */}
          <div className="h-1" style={{ backgroundColor: eventColor }} />

          <div className="p-6 flex flex-col gap-4">
            {/* Event title */}
            <div className="flex items-start gap-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5"
                style={{ backgroundColor: eventColor }}
              >
                {eventTitle[0]?.toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{eventTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{duration} minutes</p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Date */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <CalendarDays
                className="h-4 w-4 text-gray-400 shrink-0"
                strokeWidth={1.75}
              />
              {displayDate}
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock
                className="h-4 w-4 text-gray-400 shrink-0"
                strokeWidth={1.75}
              />
              {to12h(startSlot)} – {to12h(endSlot)}
            </div>

            <div className="border-t border-gray-100" />

            {/* Booker */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <User className="h-4 w-4 text-gray-400 shrink-0" strokeWidth={1.75} />
              {bookerName}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" strokeWidth={1.75} />
              {bookerEmail}
            </div>
          </div>
        </div>

        {/* ── CTAs ─────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 animate-fade-up-delay-2">
          <button
            id="book-another-btn"
            onClick={() => navigate(`/book/${slug}`)}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-400 rounded-md transition-colors duration-150"
          >
            Book another time
          </button>
          <button
            id="back-to-events-btn"
            onClick={() => navigate("/event-types")}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors duration-150"
          >
            Back to dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
