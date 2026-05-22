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

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC",
  });
}

function isUpcoming(booking) {
  return booking.status === "CONFIRMED" && new Date(booking.startTime) > new Date();
}

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { className: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50", dot: "bg-emerald-500", label: "Confirmed" },
    CANCELLED: { className: "bg-neutral-900 text-neutral-400 border border-neutral-800", dot: "bg-neutral-500", label: "Cancelled" },
    COMPLETED: { className: "bg-blue-950/40 text-blue-400 border border-blue-900/50", dot: "bg-blue-500", label: "Completed" },
  };
  const { className, dot, label } = map[status] ?? map.CONFIRMED;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function CancelButton({ bookingId, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
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
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 ${
        confirming
          ? "bg-red-950/40 text-red-400 hover:bg-red-900/50 border border-red-900/50"
          : "text-neutral-400 hover:text-red-400 hover:bg-neutral-800 border border-transparent hover:border-neutral-700"
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {loading ? "Cancelling…" : confirming ? "Confirm?" : "Cancel"}
    </button>
  );
}

function BookingsTable({ bookings, showCancelCol, onCancel }) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-neutral-800 rounded-xl bg-[#1C1C1C]/50 mt-4">
        <CalendarOff className="h-8 w-8 text-neutral-600 mb-3" strokeWidth={1.5} />
        <p className="text-[15px] font-medium text-neutral-400">No bookings here</p>
        <p className="text-sm text-neutral-500 mt-1">
          {showCancelCol ? "You have no upcoming confirmed bookings." : "Past and cancelled bookings will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-[#1C1C1C] shadow-sm mt-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-[#111111] border-b border-neutral-800">
            {["Event Type", "Booker", "Date", "Time", "Status", ...(showCancelCol ? [""] : [])].map((heading) => (
              <th key={heading} className="px-5 py-3.5 text-left text-[13px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/50">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-neutral-800/30 transition-colors duration-150">
              <td className="px-5 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.eventType?.color ?? "#6366f1" }} />
                  <span className="font-semibold text-white text-[15px]">{b.eventType?.title ?? "—"}</span>
                  <span className="text-neutral-500 text-[13px]">· {b.eventType?.duration}m</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-medium text-neutral-200 text-[14px]">
                    <User className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    {b.bookerName}
                  </span>
                  <span className="flex items-center gap-2 text-[13px] text-neutral-500">
                    <Mail className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    {b.bookerEmail}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 whitespace-nowrap text-neutral-300 font-medium">
                {formatDate(b.startTime)}
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="flex items-center gap-2 text-neutral-300 font-medium">
                  <Clock className="h-4 w-4 text-neutral-500 shrink-0" strokeWidth={1.75} />
                  {formatTime(b.startTime)}
                  <span className="text-neutral-600">–</span>
                  {formatTime(b.endTime)}
                </span>
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                <StatusBadge status={b.status} />
              </td>
              {showCancelCol && (
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  {b.status === "CONFIRMED" && <CancelButton bookingId={b.id} onCancel={onCancel} />}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/bookings");
      setBookings(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }

  const { upcoming, past } = useMemo(() => {
    const upcoming = bookings.filter(isUpcoming).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const past = bookings.filter((b) => !isUpcoming(b)).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    return { upcoming, past };
  }, [bookings]);

  async function handleCancel(id) {
    try {
      await api.patch(`/api/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    }
  }

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length, icon: CheckCircle2 },
    { id: "past", label: "Past", count: past.length, icon: XCircle },
  ];
  const visibleBookings = activeTab === "upcoming" ? upcoming : past;

  return (
    <div className="max-w-6xl mx-auto text-white">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Bookings</h1>
        <p className="text-[15px] text-neutral-400">View and manage all scheduled meetings.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-[15px]">Loading bookings…</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 p-5 bg-red-950/20 border border-red-900/50 rounded-xl text-[15px] text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load bookings</p>
            <p className="mt-1 text-sm text-red-400/80">{error}</p>
            <button onClick={fetchBookings} className="mt-3 text-sm font-medium underline underline-offset-2 hover:text-red-300">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex gap-4 border-b border-neutral-800">
            {tabs.map(({ id, label, count, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 pb-3 text-[15px] font-medium border-b-2 transition-colors duration-150 focus:outline-none ${
                    active ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-white" : "text-neutral-500"}`} strokeWidth={2} />
                  {label}
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-bold ${
                    active ? "bg-white text-black" : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <BookingsTable bookings={visibleBookings} showCancelCol={activeTab === "upcoming"} onCancel={handleCancel} />

          {visibleBookings.length > 0 && (
            <p className="mt-4 text-[13px] text-neutral-500 text-right font-medium">
              {visibleBookings.length} {visibleBookings.length === 1 ? "booking" : "bookings"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
