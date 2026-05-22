// src/pages/Bookings.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Loader2,
  AlertCircle,
  CalendarOff,
  Clock,
  Mail,
  User,
  XCircle,
  CheckCircle2,
  Ban,
} from "lucide-react";
import api from "../lib/api";

// =============================================================================
// Helpers
// =============================================================================

/** Format a UTC ISO string → "Mon, Jan 15, 2026" */
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
    timeZone: "UTC",
  });
}

/** Format a UTC ISO string → "9:30 AM" */
function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour:     "numeric",
    minute:   "2-digit",
    hour12:   true,
    timeZone: "UTC",
  });
}

/** Decide if a booking belongs to the "upcoming" bucket */
function isUpcoming(booking) {
  return (
    booking.status === "CONFIRMED" &&
    new Date(booking.startTime) > new Date()
  );
}

// =============================================================================
// Sub-component: Status badge
// =============================================================================
function StatusBadge({ status }) {
  const map = {
    CONFIRMED: {
      className: "bg-green-50 text-green-700",
      dot:       "bg-green-500",
      label:     "Confirmed",
    },
    CANCELLED: {
      className: "bg-gray-100 text-gray-500",
      dot:       "bg-gray-400",
      label:     "Cancelled",
    },
    COMPLETED: {
      className: "bg-blue-50 text-blue-600",
      dot:       "bg-blue-400",
      label:     "Completed",
    },
  };

  const { className, dot, label } = map[status] ?? map.CONFIRMED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// =============================================================================
// Sub-component: Cancel button (two-click pattern)
// =============================================================================
function CancelButton({ bookingId, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const timerRef = useRef(null);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
    } else {
      clearTimeout(timerRef.current);
      setConfirming(false);
      executeCanel();
    }
  }

  async function executeCanel() {
    setLoading(true);
    await onCancel(bookingId);
    setLoading(false);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button
      id={`cancel-booking-${bookingId}`}
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50 ${
        confirming
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "text-gray-400 hover:text-red-500 hover:bg-red-50"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Ban className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
      {loading ? "Cancelling…" : confirming ? "Confirm?" : "Cancel"}
    </button>
  );
}

// =============================================================================
// Sub-component: Bookings table
// =============================================================================
function BookingsTable({ bookings, showCancelCol, onCancel }) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-md bg-gray-50">
        <CalendarOff
          className="h-8 w-8 text-gray-300 mb-3"
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-gray-500">No bookings here</p>
        <p className="text-xs text-gray-400 mt-1">
          {showCancelCol
            ? "You have no upcoming confirmed bookings."
            : "Past and cancelled bookings will appear here."}
        </p>
      </div>
    );
  }

  return (
    /* Horizontal scroll on narrow viewports */
    <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm">
        {/* ── Head ── */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {[
              "Event Type",
              "Booker",
              "Date",
              "Time",
              "Status",
              ...(showCancelCol ? [""] : []),
            ].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="divide-y divide-gray-100 bg-white">
          {bookings.map((b) => (
            <tr
              key={b.id}
              className="hover:bg-gray-50/60 transition-colors duration-100"
            >
              {/* Event type */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {/* Colour dot from event type */}
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: b.eventType?.color ?? "#6366f1" }}
                  />
                  <span className="font-medium text-gray-800">
                    {b.eventType?.title ?? "—"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    · {b.eventType?.duration}m
                  </span>
                </div>
              </td>

              {/* Booker */}
              <td className="px-4 py-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-gray-800">
                    <User className="h-3 w-3 text-gray-400 shrink-0" />
                    {b.bookerName}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                    {b.bookerEmail}
                  </span>
                </div>
              </td>

              {/* Date */}
              <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                {formatDate(b.startTime)}
              </td>

              {/* Time range */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Clock
                    className="h-3.5 w-3.5 text-gray-400 shrink-0"
                    strokeWidth={1.75}
                  />
                  {formatTime(b.startTime)}
                  <span className="text-gray-400">–</span>
                  {formatTime(b.endTime)}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <StatusBadge status={b.status} />
              </td>

              {/* Cancel action (upcoming tab only) */}
              {showCancelCol && (
                <td className="px-4 py-3.5 whitespace-nowrap text-right">
                  {b.status === "CONFIRMED" && (
                    <CancelButton bookingId={b.id} onCancel={onCancel} />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Main: Bookings page
// =============================================================================
export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'

  // ── Fetch all bookings on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/bookings");
      setBookings(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load bookings. Is the backend running on port 3001?"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Split into upcoming / past ───────────────────────────────────────────────
  const { upcoming, past } = useMemo(() => {
    const upcoming = bookings
      .filter(isUpcoming)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const past = bookings
      .filter((b) => !isUpcoming(b))
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // newest-first

    return { upcoming, past };
  }, [bookings]);

  // ── Cancel handler — optimistic local update ─────────────────────────────────
  async function handleCancel(id) {
    try {
      await api.patch(`/api/bookings/${id}/cancel`);
      // Flip status locally — booking will re-sort into "Past" bucket
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "CANCELLED" } : b
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    }
  }

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length, icon: CheckCircle2 },
    { id: "past",     label: "Past",     count: past.length,     icon: XCircle },
  ];

  const visibleBookings = activeTab === "upcoming" ? upcoming : past;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page sub-heading */}
      <p className="text-xs text-gray-500 mb-6">
        View and manage all scheduled meetings.
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading bookings…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load bookings</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-2 text-xs font-medium underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Tabs + table */}
      {!loading && !error && (
        <>
          {/* ── Tab bar ──────────────────────────────────────────────────────── */}
          <div className="flex gap-1 border-b border-gray-200 mb-5">
            {tabs.map(({ id, label, count, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors duration-150 focus:outline-none ${
                    active
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-gray-900" : "text-gray-400"
                    }`}
                    strokeWidth={1.75}
                  />
                  {label}
                  {/* Count pill */}
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                      active
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Bookings table ────────────────────────────────────────────────── */}
          <BookingsTable
            bookings={visibleBookings}
            showCancelCol={activeTab === "upcoming"}
            onCancel={handleCancel}
          />

          {/* Summary footer */}
          {visibleBookings.length > 0 && (
            <p className="mt-3 text-xs text-gray-400 text-right">
              {visibleBookings.length}{" "}
              {visibleBookings.length === 1 ? "booking" : "bookings"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
