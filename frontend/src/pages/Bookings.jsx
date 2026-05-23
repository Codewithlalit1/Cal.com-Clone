// src/pages/Bookings.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Loader2,
  AlertCircle,
  Video,
  MoreHorizontal,
  Clock,
  Send,
  MapPin,
  UserPlus,
  Video as VideoIcon,
  Info,
  EyeOff,
  Flag,
  XCircle,
  Filter,
  ChevronDown,
  Globe,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import api from "../lib/api";

function getAbsoluteDate(dateStr) {
  const date = new Date(dateStr);
  return new Date(date.getTime() - (5 * 60 + 30) * 60000); // Subtract 5.5 hours (IST offset) to get true UTC
}

function formatDayAndDate(dateStr, tz) {
  const date = getAbsoluteDate(dateStr);
  const day = date.toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
  const dayNum = date.toLocaleDateString("en-US", { day: "numeric", timeZone: tz });
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: tz });
  return `${day}, ${dayNum} ${month}`;
}

function formatTimeRange(startStr, endStr, tz) {
  const start = getAbsoluteDate(startStr);
  const end = getAbsoluteDate(endStr);
  const s = start.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz,
  }).toLowerCase();
  const e = end.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz,
  }).toLowerCase();
  return `${s} - ${e}`;
}

function isUpcoming(booking) {
  return booking.status === "CONFIRMED" && new Date(booking.startTime) > new Date();
}

function DropdownMenu({ bookingId, bookingSlug, onCancel, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={menuRef} className="absolute right-0 top-10 w-56 bg-[#111111] border border-neutral-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden font-sans">
      
      {/* Edit Event Group */}
      <div className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
        Edit event
      </div>
      <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-white hover:bg-neutral-800 transition-colors" onClick={() => window.open(`/book/${bookingSlug}?rescheduleId=${bookingId}`, "_blank")}>
        <Clock className="h-4 w-4 text-neutral-400" /> Reschedule booking
      </button>

      <div className="h-px bg-neutral-800 my-1" />

      <button 
        onClick={() => {
          if(confirm("Are you sure you want to cancel this event?")) {
            onCancel(bookingId);
            onClose();
          }
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-white hover:bg-red-950/50 hover:text-red-400 transition-colors"
      >
        <XCircle className="h-4 w-4 text-neutral-400 group-hover:text-red-400" /> Cancel event
      </button>

    </div>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [viewTz, setViewTz] = useState("Asia/Kolkata");
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Pagination and filtering states
  const [filterText, setFilterText] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const filteredBookings = useMemo(() => {
    let list = [];
    if (activeTab === "Upcoming") {
      list = bookings.filter(isUpcoming).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else if (activeTab === "Past") {
      list = bookings.filter((b) => b.status === "CONFIRMED" && !isUpcoming(b)).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else if (activeTab === "Canceled") {
      list = bookings.filter((b) => b.status === "CANCELLED").sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }
    
    if (filterText.trim() !== "") {
      const lower = filterText.toLowerCase();
      list = list.filter(b => 
        b.bookerName.toLowerCase().includes(lower) || 
        b.bookerEmail.toLowerCase().includes(lower) ||
        (b.eventType?.title || "").toLowerCase().includes(lower)
      );
    }
    
    return list;
  }, [bookings, activeTab, filterText]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterText, rowsPerPage]);

  useEffect(() => {
    setSelectedBooking(null);
  }, [activeTab, filterText]);

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  async function handleCancel(id) {
    try {
      await api.patch(`/api/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    }
  }

  const tabs = ["Upcoming", "Past", "Canceled"];

  return (
    <div className="max-w-[1400px] mx-auto text-white font-sans pt-2 pb-10 flex flex-col lg:flex-row gap-6 px-4 sm:px-6">
      
      {/* Main Column */}
      <div className="flex-1 min-w-0">
        
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Bookings</h1>
        <p className="text-[15px] text-neutral-400">See upcoming and past events booked through your event type links.</p>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#1C1C1C] border border-neutral-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-[14px] font-medium rounded-lg transition-colors duration-150 ${
                  activeTab === tab 
                    ? "bg-[#2C2C2C] text-white shadow-sm" 
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Filter by name or event..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 pr-3 py-1.5 h-9 bg-[#111111] border border-neutral-800 rounded-xl text-[14px] text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-neutral-600 transition-all w-full sm:w-56"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 h-9 bg-[#111111] border border-neutral-800 rounded-xl text-[14px] font-medium text-white hover:bg-neutral-800 transition-colors">
            <Globe className="h-4 w-4 text-neutral-500" />
            <select 
              value={viewTz}
              onChange={(e) => setViewTz(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[14px] font-medium text-white cursor-pointer -ml-1 appearance-none outline-none hover:text-neutral-300 transition-colors"
            >
              {Intl.supportedValuesOf('timeZone').map(tz => (
                <option key={tz} value={tz} className="bg-[#1C1C1C] text-white">{tz}</option>
              ))}
            </select>
          </div>
        </div>
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
          </div>
        </div>
      )}

      {/* Bookings List Layout */}
      {!loading && !error && (
        <div className="bg-[#111111] border border-neutral-800 rounded-2xl overflow-visible">
          
          <div className="px-6 py-4 border-b border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">Next</span>
          </div>

          {paginatedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-[15px] font-medium text-neutral-500">No {activeTab.toLowerCase()} bookings found</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {paginatedBookings.map((b) => {
                let guestTz = "Asia/Kolkata";
                let displayNotes = b.notes || "";
                const tzMatch = displayNotes.match(/^\[TZ:\s*(.+?)\](?:\n\n)?([\s\S]*)$/);
                if (tzMatch) {
                  guestTz = tzMatch[1];
                  displayNotes = tzMatch[2];
                }
                
                return (
                <div 
                  key={b.id} 
                  onClick={() => setSelectedBooking(b)}
                  className={`group flex justify-between items-start px-6 py-5 border-b border-neutral-800/50 hover:bg-[#1A1A1A] transition-colors duration-150 cursor-pointer last:border-b-0 ${selectedBooking?.id === b.id ? 'bg-[#1A1A1A] border-l-[3px] border-l-white' : 'border-l-[3px] border-l-transparent'}`}
                >
                  
                  <div className="flex flex-col md:flex-row gap-4 md:gap-16 lg:gap-24 pointer-events-none">
                    {/* Date and Time Column */}
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-[15px] font-semibold text-white tracking-tight">{formatDayAndDate(b.startTime, viewTz)}</span>
                      <span className="text-[14px] text-neutral-400 mt-0.5">{formatTimeRange(b.startTime, b.endTime, viewTz)}</span>
                      <div className="flex items-center gap-1.5 mt-2">
                         <Globe className="h-[14px] w-[14px] text-neutral-400 shrink-0" />
                         <span className="text-[13px] text-neutral-400">{viewTz} {guestTz !== viewTz && `(Booked in ${guestTz})`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                         <Video className="h-[14px] w-[14px] text-neutral-400 shrink-0" />
                         <span className="text-[14px] text-blue-400 font-medium hover:underline cursor-pointer">Join Cal Video</span>
                      </div>
                    </div>
                    
                    {/* Title and Participants Column */}
                    <div className="flex flex-col">
                      <span className="text-[15px] font-semibold text-white tracking-tight">
                        {b.eventType?.duration || "30"} min meeting between {b.bookerName} and Lalit Kumar
                      </span>
                      <span className="text-[14px] text-neutral-400 mt-0.5">
                        You and {b.bookerName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Menu Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}
                      className="p-2 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                       <MoreHorizontal className="h-[18px] w-[18px]" />
                    </button>
                    {openMenuId === b.id && (
                      <DropdownMenu 
                        bookingId={b.id} 
                        bookingSlug={b.eventType?.slug}
                        onCancel={handleCancel}
                        onClose={() => setOpenMenuId(null)}
                      />
                    )}
                  </div>

                </div>
              )})}
            </div>
          )}

          {/* Footer Pagination */}
          <div className="px-6 py-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between bg-[#161616] rounded-b-2xl gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center px-3 py-1.5 bg-[#111111] border border-neutral-800 rounded-lg text-sm text-white focus-within:ring-1 focus-within:ring-white/20">
                <select 
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="bg-transparent appearance-none outline-none border-none pr-6 cursor-pointer font-medium"
                >
                  <option value={5} className="bg-[#1C1C1C]">5</option>
                  <option value={10} className="bg-[#1C1C1C]">10</option>
                  <option value={20} className="bg-[#1C1C1C]">20</option>
                  <option value={50} className="bg-[#1C1C1C]">50</option>
                </select>
                <ChevronDown className="absolute right-3 h-4 w-4 text-neutral-500 pointer-events-none" />
              </div>
              <span className="text-sm text-neutral-400">rows per page</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-neutral-400">
               <span>
                 {filteredBookings.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredBookings.length)} of {filteredBookings.length}
               </span>
               <div className="flex items-center gap-1">
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronLeft className="h-5 w-5" />
                 </button>
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage >= totalPages || totalPages === 0}
                   className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronRight className="h-5 w-5" />
                 </button>
               </div>
            </div>
          </div>

        </div>
      )}

      </div>

      {/* Side Detail Pane */}
      {selectedBooking && (
        <div className="w-full lg:w-[420px] shrink-0 bg-[#111111] border border-neutral-800 rounded-2xl p-6 self-start sticky top-6 font-sans">
          <div className="flex justify-between items-center mb-6">
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded-md">
              {selectedBooking.status === "CONFIRMED" ? "Confirmed" : selectedBooking.status === "CANCELLED" ? "Canceled" : "Completed"}
            </span>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 transition-colors"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 transition-colors"><XCircle className="h-4 w-4" /></button>
            </div>
          </div>

          <h2 className="text-[20px] font-bold text-white leading-snug mb-8">
            {selectedBooking.eventType?.duration || 30} min meeting between {selectedBooking.bookerName} and {selectedBooking.user?.name || "Lalit Kumar"}
          </h2>

          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block">When</span>
              <p className="text-[14px] text-white font-medium">
                {getAbsoluteDate(selectedBooking.startTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: viewTz })}
              </p>
              <p className="text-[14px] text-neutral-400 mt-0.5">
                {formatTimeRange(selectedBooking.startTime, selectedBooking.endTime, viewTz)} ({viewTz})
              </p>
            </div>

            <div className="h-px bg-neutral-800/50" />

            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-3 block">Who</span>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white shrink-0">
                    {(selectedBooking.user?.name || "L")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-white">{selectedBooking.user?.name || "Lalit Kumar"}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-800 text-white rounded">Host</span>
                    </div>
                    <span className="text-[13px] text-neutral-400">{selectedBooking.user?.email || "admin@example.com"}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-medium text-white shrink-0">
                    {selectedBooking.bookerName[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-white block">{selectedBooking.bookerName}</span>
                    <span className="text-[13px] text-neutral-400">{selectedBooking.bookerEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-neutral-800/50" />

            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Where</span>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-neutral-400 shrink-0" />
                <span className="text-[14px] text-white">Cal Video: </span>
                <span className="text-[14px] text-blue-400 cursor-pointer hover:underline truncate">https://app.cal.com/video/qotNao...</span>
              </div>
            </div>
            
            {selectedBooking.notes && (
              <>
                <div className="h-px bg-neutral-800/50" />
                <div>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Notes</span>
                  <p className="text-[14px] text-neutral-300 whitespace-pre-wrap">
                    {selectedBooking.notes.replace(/^\[TZ: .+?\](?:\n\n)?/, "")}
                  </p>
                </div>
              </>
            )}
            
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[14px] font-medium rounded-lg transition-colors">
              <Video className="h-4 w-4" /> Join Cal Video
            </button>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === selectedBooking.id ? null : selectedBooking.id); }}
                className="p-2 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {openMenuId === selectedBooking.id && (
                <div className="absolute bottom-full right-0 mb-2">
                  <DropdownMenu 
                    bookingId={selectedBooking.id} 
                    bookingSlug={selectedBooking.eventType?.slug}
                    onCancel={(id) => { handleCancel(id); setSelectedBooking(null); }}
                    onClose={() => setOpenMenuId(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
