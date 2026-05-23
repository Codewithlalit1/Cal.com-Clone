import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, AlertCircle, CheckCircle2, Globe, Plus, Trash2 } from "lucide-react";
import api from "../lib/api";

const DAYS = [
  { label: "Sunday",    short: "Sun", dayOfWeek: 0 },
  { label: "Monday",    short: "Mon", dayOfWeek: 1 },
  { label: "Tuesday",   short: "Tue", dayOfWeek: 2 },
  { label: "Wednesday", short: "Wed", dayOfWeek: 3 },
  { label: "Thursday",  short: "Thu", dayOfWeek: 4 },
  { label: "Friday",    short: "Fri", dayOfWeek: 5 },
  { label: "Saturday",  short: "Sat", dayOfWeek: 6 },
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function buildDefaultSchedule() {
  return DAYS.map(({ dayOfWeek }) => {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    return {
      dayOfWeek,
      isEnabled: isWeekday,
      intervals: isWeekday ? [{ startTime: "09:00", endTime: "17:00", id: generateId() }] : []
    };
  });
}

function Toggle({ id, checked, onChange }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
        checked ? "bg-white" : "bg-neutral-800"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function Availability() {
  const [schedule, setSchedule] = useState(buildDefaultSchedule());
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem("availability_timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [notification, setNotification] = useState(null);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await api.get("/api/availability");
      const dbRows = res.data.data;
      
      if (dbRows.length === 0) {
        setSchedule(buildDefaultSchedule());
        return;
      }

      setSchedule(DAYS.map((day) => {
        const rowsForDay = dbRows.filter((r) => r.dayOfWeek === day.dayOfWeek);
        if (rowsForDay.length > 0 && rowsForDay[0].isEnabled) {
          return {
            dayOfWeek: day.dayOfWeek,
            isEnabled: true,
            intervals: rowsForDay.map(r => ({ startTime: r.startTime, endTime: r.endTime, id: generateId() }))
          };
        } else {
          return {
            dayOfWeek: day.dayOfWeek,
            isEnabled: false,
            intervals: []
          };
        }
      }));
    } catch (err) {
      setFetchError(err.response?.data?.message || "Could not load availability.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  function handleToggle(dayOfWeek) {
    setSchedule((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const isEnabled = !d.isEnabled;
      return {
        ...d,
        isEnabled,
        // If toggling on and there are no intervals, add a default one
        intervals: isEnabled && d.intervals.length === 0 
          ? [{ startTime: "09:00", endTime: "17:00", id: generateId() }] 
          : d.intervals
      };
    }));
  }

  function handleIntervalChange(dayOfWeek, intervalId, field, value) {
    setSchedule((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      return {
        ...d,
        intervals: d.intervals.map(inv => inv.id === intervalId ? { ...inv, [field]: value } : inv)
      };
    }));
  }

  function addInterval(dayOfWeek) {
    setSchedule((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      return {
        ...d,
        intervals: [...d.intervals, { startTime: "09:00", endTime: "17:00", id: generateId() }]
      };
    }));
  }

  function removeInterval(dayOfWeek, intervalId) {
    setSchedule((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const newIntervals = d.intervals.filter(inv => inv.id !== intervalId);
      return {
        ...d,
        isEnabled: newIntervals.length > 0, // Auto-disable if removing last interval
        intervals: newIntervals
      };
    }));
  }

  function handleTimezoneChange(e) {
    const tz = e.target.value;
    setTimezone(tz);
    localStorage.setItem("availability_timezone", tz);
  }

  function validate() {
    for (const day of schedule) {
      if (!day.isEnabled) continue;
      if (day.intervals.length === 0) {
         const meta = DAYS.find((d) => d.dayOfWeek === day.dayOfWeek);
         return `${meta.label}: You must add at least one time slot if the day is enabled.`;
      }
      for (const interval of day.intervals) {
        if (interval.startTime >= interval.endTime) {
          const meta = DAYS.find((d) => d.dayOfWeek === day.dayOfWeek);
          return `${meta.label}: Start time must be before end time.`;
        }
      }
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setNotification({ type: "error", msg: validationError });
      return;
    }
    setSaving(true);
    setNotification(null);

    // Flatten for backend
    const flatAvailability = [];
    for (const day of schedule) {
      if (day.isEnabled && day.intervals.length > 0) {
        for (const inv of day.intervals) {
          flatAvailability.push({
            dayOfWeek: day.dayOfWeek,
            startTime: inv.startTime,
            endTime: inv.endTime,
            isEnabled: true
          });
        }
      } else {
        flatAvailability.push({
          dayOfWeek: day.dayOfWeek,
          startTime: "00:00",
          endTime: "00:00",
          isEnabled: false
        });
      }
    }

    try {
      await api.post("/api/availability", { availability: flatAvailability });
      setNotification({ type: "success", msg: "Availability saved successfully." });
    } catch (err) {
      setNotification({ type: "error", msg: err.response?.data?.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-[15px]">Loading availability…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-start gap-3 p-5 bg-red-950/20 border border-red-900/50 rounded-xl text-[15px] text-red-400">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Could not load availability</p>
          <p className="mt-1 text-sm text-red-400/80">{fetchError}</p>
          <button onClick={fetchAvailability} className="mt-3 text-sm font-medium underline underline-offset-2 hover:text-red-300">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-white font-sans pt-2 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Availability</h1>
        <p className="text-[15px] text-neutral-400">Configure times when you are available for bookings.</p>
      </div>

      {notification && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl mb-6 border ${notification.type === "success" ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400" : "bg-red-950/20 border-red-900/50 text-red-400"}`}>
          {notification.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-[15px] font-medium">{notification.msg}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        
        {/* Timezone Selector */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#1C1C1C] border border-neutral-800 rounded-xl">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Globe className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-[15px] font-semibold text-white">Timezone</p>
              <p className="text-sm text-neutral-500">Set your local timezone for these hours.</p>
            </div>
          </div>
          <select 
            value={timezone} 
            onChange={handleTimezoneChange}
            className="bg-[#111111] text-white border border-neutral-700 rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-neutral-500 w-full sm:w-64"
          >
            {Intl.supportedValuesOf('timeZone').map(tz => (
              <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Schedule Grid */}
        <div className="bg-[#1C1C1C] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          {DAYS.map(({ label, short, dayOfWeek }) => {
            const day = schedule.find((d) => d.dayOfWeek === dayOfWeek);
            return (
              <div key={dayOfWeek} className={`flex flex-col sm:flex-row sm:items-start gap-4 px-6 py-5 border-b border-neutral-800 last:border-b-0 transition-colors duration-150 ${day.isEnabled ? "bg-[#1C1C1C]" : "bg-neutral-900/30"}`}>
                
                <div className="flex items-center gap-4 w-40 mt-2">
                  <Toggle id={`toggle-${dayOfWeek}`} checked={day.isEnabled} onChange={() => handleToggle(dayOfWeek)} />
                  <span className={`text-[15px] font-semibold select-none ${day.isEnabled ? "text-white" : "text-neutral-500"}`}>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{short}</span>
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  {day.isEnabled ? (
                    day.intervals.map((inv, index) => (
                      <div key={inv.id} className="flex items-center gap-3">
                        <input 
                          type="time" 
                          value={inv.startTime} 
                          onChange={(e) => handleIntervalChange(dayOfWeek, inv.id, "startTime", e.target.value)} 
                          required 
                          className="bg-[#111111] text-white text-[15px] px-3 py-2 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500" 
                        />
                        <span className="text-neutral-500 font-medium">-</span>
                        <input 
                          type="time" 
                          value={inv.endTime} 
                          onChange={(e) => handleIntervalChange(dayOfWeek, inv.id, "endTime", e.target.value)} 
                          required 
                          className="bg-[#111111] text-white text-[15px] px-3 py-2 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500" 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeInterval(dayOfWeek, inv.id)} 
                          className="p-2 ml-2 text-neutral-500 hover:text-white transition-colors"
                          title="Remove time slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {index === day.intervals.length - 1 && (
                          <button 
                            type="button" 
                            onClick={() => addInterval(dayOfWeek)} 
                            className="p-2 text-neutral-500 hover:text-white transition-colors"
                            title="Add time slot"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="mt-2 text-[15px] text-neutral-600 font-medium select-none">Unavailable</div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 px-6 py-2.5 text-[15px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-full transition-colors disabled:opacity-70 shadow-sm">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Availability"}
          </button>
        </div>

      </form>
    </div>
  );
}
