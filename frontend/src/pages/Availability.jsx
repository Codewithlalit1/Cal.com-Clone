// src/pages/Availability.jsx
import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

// ─── Days displayed in the UI ─────────────────────────────────────────────────
// dayOfWeek matches the DB convention: 0=Sun … 6=Sat
const DAYS = [
  { label: "Monday",    short: "Mon", dayOfWeek: 1 },
  { label: "Tuesday",   short: "Tue", dayOfWeek: 2 },
  { label: "Wednesday", short: "Wed", dayOfWeek: 3 },
  { label: "Thursday",  short: "Thu", dayOfWeek: 4 },
  { label: "Friday",    short: "Fri", dayOfWeek: 5 },
  { label: "Saturday",  short: "Sat", dayOfWeek: 6 },
  { label: "Sunday",    short: "Sun", dayOfWeek: 0 },
];

// ─── Default schedule (used when the DB has no row for a given day) ───────────
function buildDefaultSchedule() {
  return DAYS.map(({ dayOfWeek }) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    // Mon-Fri on by default, weekends off
    isEnabled: dayOfWeek >= 1 && dayOfWeek <= 5,
  }));
}

// =============================================================================
// Sub-component: Toggle switch (pure CSS, no extra library)
// =============================================================================
function Toggle({ id, checked, onChange }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// =============================================================================
// Main: Availability page
// =============================================================================
export default function Availability() {
  const [schedule, setSchedule] = useState(buildDefaultSchedule());
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', msg }

  // ── Fetch existing availability on mount ────────────────────────────────────
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await api.get("/api/availability");
      const dbRows = res.data.data; // array of { dayOfWeek, startTime, endTime, isEnabled }

      // Merge DB rows into our default schedule so all 7 days are always shown
      setSchedule((prev) =>
        prev.map((day) => {
          const dbRow = dbRows.find((r) => r.dayOfWeek === day.dayOfWeek);
          return dbRow
            ? {
                dayOfWeek: day.dayOfWeek,
                startTime: dbRow.startTime,
                endTime:   dbRow.endTime,
                isEnabled: dbRow.isEnabled,
              }
            : day;
        })
      );
    } catch (err) {
      setFetchError(
        err.response?.data?.message ||
          "Could not load availability. Is the backend running on port 3001?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Auto-dismiss notification after 4 s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // ── Toggle a day on/off ────────────────────────────────────────────────────
  function handleToggle(dayOfWeek) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, isEnabled: !d.isEnabled } : d
      )
    );
  }

  // ── Update start or end time ───────────────────────────────────────────────
  function handleTimeChange(dayOfWeek, field, value) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
      )
    );
  }

  // ── Validate times client-side before sending ──────────────────────────────
  function validate() {
    for (const day of schedule) {
      if (!day.isEnabled) continue;
      if (day.startTime >= day.endTime) {
        const meta = DAYS.find((d) => d.dayOfWeek === day.dayOfWeek);
        return `${meta.label}: start time must be before end time.`;
      }
    }
    return null;
  }

  // ── Save handler ───────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setNotification({ type: "error", msg: validationError });
      return;
    }

    setSaving(true);
    setNotification(null);
    try {
      await api.post("/api/availability", { availability: schedule });
      setNotification({ type: "success", msg: "Availability saved successfully." });
    } catch (err) {
      const serverMsg =
        err.response?.data?.message || "Failed to save. Please try again.";
      setNotification({ type: "error", msg: serverMsg });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading availability…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Could not load availability</p>
          <p className="mt-0.5 text-xs text-red-600">{fetchError}</p>
          <button
            onClick={fetchAvailability}
            className="mt-2 text-xs font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Page sub-heading */}
      <p className="text-xs text-gray-500 mb-6">
        Set the hours you are available for bookings each week.
      </p>

      {/* Inline notification banner */}
      {notification && (
        <div
          className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-md mb-5 border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          {notification.msg}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Schedule table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm divide-y divide-gray-100">
          {DAYS.map(({ label, short, dayOfWeek }) => {
            const day = schedule.find((d) => d.dayOfWeek === dayOfWeek);

            return (
              <div
                key={dayOfWeek}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 ${
                  day.isEnabled ? "bg-white" : "bg-gray-50/60"
                }`}
              >
                {/* Toggle */}
                <Toggle
                  id={`toggle-${dayOfWeek}`}
                  checked={day.isEnabled}
                  onChange={() => handleToggle(dayOfWeek)}
                />

                {/* Day label */}
                <span
                  className={`w-24 text-sm font-medium select-none ${
                    day.isEnabled ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short}</span>
                </span>

                {/* Time inputs — only when enabled */}
                {day.isEnabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      id={`start-${dayOfWeek}`}
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        handleTimeChange(dayOfWeek, "startTime", e.target.value)
                      }
                      className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-800 bg-white"
                      required={day.isEnabled}
                    />
                    <span className="text-xs text-gray-400 select-none">to</span>
                    <input
                      id={`end-${dayOfWeek}`}
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        handleTimeChange(dayOfWeek, "endTime", e.target.value)
                      }
                      className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-800 bg-white"
                      required={day.isEnabled}
                    />
                  </div>
                ) : (
                  <span className="flex-1 text-xs text-gray-400 select-none">
                    Unavailable
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="mt-5 flex justify-end">
          <button
            id="save-availability-btn"
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {saving ? "Saving…" : "Save Availability"}
          </button>
        </div>
      </form>
    </div>
  );
}
