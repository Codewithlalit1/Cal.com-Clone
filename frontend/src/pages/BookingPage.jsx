// src/pages/BookingPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarOff,
  CalendarDays,
  AlertCircle,
  Video,
  Globe,
  UserPlus
} from "lucide-react";
import api from "../lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDisplayDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
}

function to12h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ── CalendarGrid ──
function CalendarGrid({ year, month, selectedDate, today, onSelect, onPrev, onNext }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewStart = new Date(year, month, 1);
  const canGoPrev = viewStart > thisMonthStart;

  return (
    <div className="select-none text-white w-full sm:w-[340px]">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[15px] font-semibold tracking-wide">
          {MONTH_NAMES[month]} <span className="text-neutral-400 font-normal">{year}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`p-1.5 rounded-md transition-colors ${canGoPrev ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "text-neutral-600 cursor-not-allowed"}`}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="flex items-center justify-center text-[11px] font-semibold tracking-wider text-neutral-400 h-8">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="h-10" />;

          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;
          const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();
          const isToday = cellDate.getTime() === today.getTime();

          return (
            <div key={day} className="flex items-center justify-center h-11">
              <button
                onClick={() => !isPast && onSelect(cellDate)}
                disabled={isPast}
                className={`
                  w-10 h-10 rounded-lg text-[15px] font-medium transition-all duration-150
                  ${isPast ? "text-neutral-600 cursor-not-allowed" : "cursor-pointer"}
                  ${isSelected ? "bg-white text-black font-semibold shadow-sm" : 
                    !isPast ? "bg-neutral-800/40 text-neutral-200 hover:bg-neutral-700 hover:text-white" : "bg-transparent"}
                `}
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

// ── SlotsPanel ──
function SlotsPanel({ date, slots, loading, onSlotSelect, selectedTz }) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "short", timeZone: selectedTz });
  const dayNum = date.toLocaleDateString("en-US", { day: "numeric", timeZone: selectedTz });

  return (
    <div className="flex flex-col h-full w-full sm:w-[240px]">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[15px] font-medium text-white">{dayName} {dayNum}</span>
        <div className="text-[13px] text-neutral-400">12h  24h</div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {!loading && slots.length === 0 && (
        <div className="flex flex-col items-center text-center py-8">
          <p className="text-sm font-medium text-neutral-500">No slots available</p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <ul className="flex flex-col gap-2.5 overflow-y-auto pr-2 custom-scrollbar">
          {slots.map((slot, idx) => (
            <li key={idx}>
              <button
                onClick={() => onSlotSelect(slot)}
                className="w-full relative text-[15px] font-medium py-2.5 px-4 rounded-lg border border-neutral-800 text-white hover:border-neutral-600 hover:bg-neutral-800/50 transition-all duration-150 text-center"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                {slot.toLocaleTimeString("en-US", { timeZone: selectedTz, hour: "numeric", minute: "2-digit", hour12: true })}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── BookingForm ──
function BookingForm({ eventType, selectedDate, selectedSlot, rescheduleData, selectedTz, onBack, onSuccess }) {
  const [form, setForm] = useState({ 
    name: rescheduleData?.bookerName || "", 
    email: rescheduleData?.bookerEmail || "", 
    notes: (rescheduleData?.notes || "").replace(/^\[TZ: .+?\](?:\n\n)?/, "")
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const endSlot = new Date(selectedSlot.getTime() + eventType.duration * 60000);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Convert the absolute selectedSlot Date back to Asia/Kolkata "YYYY-MM-DD" and "HH:MM" for the backend
      const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false };
      const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(selectedSlot);
      const p = {};
      parts.forEach(({ type, value }) => (p[type] = value));
      const backendDate = `${p.year}-${p.month}-${p.day}`;
      const backendTime = `${p.hour === "24" ? "00" : p.hour}:${p.minute}`;

      let res;
      if (rescheduleData) {
        res = await api.patch(`/api/bookings/${rescheduleData.id}/reschedule`, {
          date: backendDate,
          startTime: backendTime,
          bookerName: form.name.trim(),
          bookerEmail: form.email.trim(),
          notes: form.notes.trim() || undefined,
          timezone: selectedTz
        });
      } else {
        res = await api.post("/api/bookings", {
          eventTypeId: eventType.id,
          date: backendDate,
          startTime: backendTime,
          bookerName: form.name.trim(),
          bookerEmail: form.email.trim(),
          notes: form.notes.trim() || undefined,
          timezone: selectedTz
        });
      }
      
      onSuccess({
        booking: res.data.data,
        bookerName: form.name.trim(),
        bookerEmail: form.email.trim(),
        eventTitle: eventType.title,
        duration: eventType.duration,
        displayDate: selectedSlot.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: selectedTz }),
        startSlot: selectedSlot.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: selectedTz }),
        endSlot: endSlot.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: selectedTz }),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col w-full sm:w-[440px]">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-[15px] font-semibold text-white mb-2">
            Your name *
          </label>
          <input
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Smith"
            className="w-full bg-[#111111] text-white px-3.5 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-500 transition-all text-[15px]"
          />
        </div>

        <div>
          <label className="block text-[15px] font-semibold text-white mb-2">
            Email address *
          </label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="jane@example.com"
            className="w-full bg-[#111111] text-white px-3.5 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-500 transition-all text-[15px]"
          />
        </div>

        <div>
          <label className="block text-[15px] font-semibold text-white mb-2">
            Additional notes
          </label>
          <textarea
            name="notes"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            placeholder="Please share anything that will help prepare for our meeting."
            className="w-full bg-[#111111] text-white px-3.5 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-500 transition-all text-[15px] resize-none"
          />
        </div>
        
        <div>
           <button type="button" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-[15px]">
             <UserPlus className="h-4 w-4" />
             Add guests
           </button>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[13px] text-neutral-500">
            By proceeding, you agree to Cal.com's <span className="text-white cursor-pointer">Terms</span> and <span className="text-white cursor-pointer">Privacy Policy</span>.
          </p>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button
              type="button"
              onClick={onBack}
              className="text-[15px] text-neutral-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-[15px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-full transition-colors disabled:opacity-70 shadow-sm whitespace-nowrap"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Confirming…" : "Confirm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Main BookingPage ──
export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get("rescheduleId");
  const [rescheduleData, setRescheduleData] = useState(null);

  useEffect(() => {
    if (rescheduleId) {
      api.get(`/api/bookings/${rescheduleId}`).then(res => {
         setRescheduleData(res.data.data);
      }).catch(err => console.error("Failed to load reschedule data", err));
    }
  }, [rescheduleId]);

  const [eventType, setEventType] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [step, setStep] = useState("slots");
  const [selectedTz, setSelectedTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/public/event-type/${slug}`);
        setEventType(res.data.data);
      } catch (err) {
        setPageError("No active event type found.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [slug]);

  const fetchSlots = useCallback(
    async (date) => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const dMinus1 = new Date(date); dMinus1.setDate(dMinus1.getDate() - 1);
        const dPlus1 = new Date(date); dPlus1.setDate(dPlus1.getDate() + 1);

        const [res1, res2, res3] = await Promise.all([
          api.get("/api/slots", { params: { date: toISO(dMinus1), slug, ...(rescheduleId && { excludeBookingId: rescheduleId }) } }).catch(() => ({ data: { data: { availableSlots: [] } } })),
          api.get("/api/slots", { params: { date: toISO(date), slug, ...(rescheduleId && { excludeBookingId: rescheduleId }) } }).catch(() => ({ data: { data: { availableSlots: [] } } })),
          api.get("/api/slots", { params: { date: toISO(dPlus1), slug, ...(rescheduleId && { excludeBookingId: rescheduleId }) } }).catch(() => ({ data: { data: { availableSlots: [] } } })),
        ]);

        const allSlots = [];
        const pushSlots = (res, d) => {
           res.data?.data?.availableSlots?.forEach(s => {
               const isoString = `${toISO(d)}T${s}:00+05:30`;
               allSlots.push(new Date(isoString));
           });
        };
        pushSlots(res1, dMinus1);
        pushSlots(res2, date);
        pushSlots(res3, dPlus1);

        const targetDateString = date.toLocaleDateString("en-US", { timeZone: selectedTz });
        
        const finalSlots = allSlots.filter(dateObj => {
           return dateObj.toLocaleDateString("en-US", { timeZone: selectedTz }) === targetDateString;
        });

        setSlots(finalSlots);
      } catch (err) {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug, rescheduleId, selectedTz]
  );

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedTz]);

  function handleDateSelect(date) {
    setSelectedDate(date);
    setStep("slots");
    fetchSlots(date);
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setStep("form");
  }

  function handleBackToSlots() {
    setStep("slots");
    setSelectedSlot(null);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center text-white">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center gap-4 px-4 text-white">
        <CalendarOff className="h-10 w-10 text-neutral-600" strokeWidth={1.5} />
        <p className="text-[15px] font-medium text-neutral-300">{pageError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center pt-20 px-4 font-sans text-white pb-10 relative">
      <button 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-[14px] font-semibold text-neutral-400 hover:text-white transition-all hover:bg-neutral-800 px-4 py-2 rounded-full border border-neutral-800 bg-[#1C1C1C]"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        Main Page
      </button>

      <div className="bg-[#1C1C1C] border border-neutral-800 rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl transition-all duration-300 ease-in-out">
        
        {/* Left Panel (Event Info) */}
        <div className={`p-8 border-b md:border-b-0 md:border-r border-neutral-800 transition-all duration-300 ${step === 'form' ? 'w-full md:w-[320px]' : 'w-full md:w-[280px]'}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[13px] font-semibold mb-3">
            L
          </div>
          <p className="text-[15px] font-medium text-neutral-400 mb-1">Lalit Kumar</p>
          <h1 className="text-2xl font-bold tracking-tight mb-6">{eventType.title}</h1>
          
          <div className="flex flex-col gap-4">
            {step === 'form' && selectedDate && selectedSlot && (
              <div className="flex gap-3 text-neutral-300">
                <CalendarDays className="h-5 w-5 shrink-0 text-neutral-500" />
                <div className="text-[15px] font-medium leading-tight">
                  {selectedSlot.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: selectedTz })}<br/>
                  {selectedSlot.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: selectedTz })} – {new Date(selectedSlot.getTime() + eventType.duration * 60000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: selectedTz })}
                </div>
              </div>
            )}
            {rescheduleData && step === 'slots' && (
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded-xl">
                 <p className="text-sm text-blue-400 font-medium">You are rescheduling a booking for {rescheduleData.bookerName}. Pick a new time.</p>
              </div>
            )}

            <div className="flex items-center gap-3 text-neutral-300">
              <Clock className="h-5 w-5 shrink-0 text-neutral-500" />
              <span className="text-[15px] font-medium">{eventType.duration}m</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Video className="h-5 w-5 shrink-0 text-neutral-500" />
              <a href="https://meet.google.com/opp-hnpg-gpx" target="_blank" rel="noreferrer" className="text-[15px] font-medium text-blue-400 hover:underline">Cal Video</a>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <Globe className="h-5 w-5 shrink-0 text-neutral-500" />
              <select 
                value={selectedTz}
                onChange={(e) => setSelectedTz(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-[15px] font-medium text-white cursor-pointer -ml-1 appearance-none outline-none hover:text-neutral-300 transition-colors"
              >
                {Intl.supportedValuesOf('timeZone').map(tz => (
                  <option key={tz} value={tz} className="bg-[#1C1C1C] text-white">{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Panel(s) */}
        <div className="flex flex-col p-6 sm:p-8 relative">
          
          {step === "slots" && (
            <div className="flex flex-col md:flex-row gap-8">
              <CalendarGrid
                year={viewYear}
                month={viewMonth}
                selectedDate={selectedDate}
                today={today}
                onSelect={handleDateSelect}
                onPrev={prevMonth}
                onNext={nextMonth}
              />
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedDate ? 'h-auto opacity-100 md:w-[240px]' : 'h-0 opacity-0 md:h-auto md:w-0'}`}>
                {selectedDate && (
                  <SlotsPanel
                    date={selectedDate}
                    slots={slots}
                    loading={slotsLoading}
                    onSlotSelect={handleSlotSelect}
                    selectedTz={selectedTz}
                  />
                )}
              </div>
            </div>
          )}

          {step === "form" && (
            <BookingForm
              eventType={eventType}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              rescheduleData={rescheduleData}
              selectedTz={selectedTz}
              onBack={handleBackToSlots}
              onSuccess={(data) => navigate("/booking-success", { state: data })}
            />
          )}

        </div>
      </div>

      <div className="mt-8 text-neutral-500 font-bold tracking-tight text-xl">
        Cal.com
      </div>
    </div>
  );
}
