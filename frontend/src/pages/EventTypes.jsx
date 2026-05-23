// src/pages/EventTypes.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  Link2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CalendarOff,
  Search,
  ExternalLink,
  EyeOff,
  Pencil,
  Check
} from "lucide-react";
import api from "../lib/api";

function CreateOrEditModal({ onClose, onSave, initialData }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData || {
      title: "",
      slug: "",
      description: "",
      duration: 15,
      isActive: true,
    }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "title" && !prev.slugModified && !isEdit) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      }
      if (name === "slug") {
        next.slugModified = true;
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        color: "#6366f1",
      };
      
      let res;
      if (isEdit) {
        res = await api.put(`/api/event-types/${form.id}`, payload);
      } else {
        res = await api.post("/api/event-types", payload);
      }
      
      onSave(res.data.data, isEdit);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} event type.`;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[500px] bg-[#111111] rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden flex flex-col font-sans">
        <div className="px-6 pt-7 pb-5">
          <h2 className="text-[22px] font-bold text-white tracking-tight">{isEdit ? "Edit event type" : "Add a new event type"}</h2>
          <p className="text-[15px] text-neutral-400 mt-1">
            {isEdit ? "Update your event details below." : "Set up event types to offer different types of meetings."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[15px] font-semibold text-white mb-2">Title</label>
            <input
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="Quick chat"
              className="w-full bg-[#1C1C1C] text-white px-3.5 py-3 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 placeholder-neutral-500 text-[15px] transition-all"
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-white mb-2">URL</label>
            <div className="flex items-center w-full bg-[#1C1C1C] border border-neutral-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-white/20 focus-within:border-neutral-600 transition-all">
              <span className="pl-3.5 pr-0.5 text-[15px] text-neutral-400 select-none">
                https://cal.com/user/
              </span>
              <input
                name="slug"
                type="text"
                required
                value={form.slug}
                onChange={handleChange}
                placeholder="quick-chat"
                className="flex-1 bg-transparent text-white py-3 pr-3.5 border-none focus:outline-none focus:ring-0 text-[15px] placeholder-neutral-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-white mb-2">Description</label>
            <div className="w-full bg-[#1C1C1C] border border-neutral-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-white/20 focus-within:border-neutral-600 transition-all flex flex-col">
              <textarea
                name="description"
                rows={3}
                value={form.description || ""}
                onChange={handleChange}
                placeholder="A quick video meeting."
                className="w-full bg-transparent text-white px-4 py-3 border-none focus:outline-none focus:ring-0 placeholder-neutral-500 text-[15px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[15px] font-semibold text-white mb-2">Duration</label>
              <div className="relative w-full">
                <input
                  name="duration"
                  type="number"
                  min="1"
                  required
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full bg-[#1C1C1C] text-white px-3.5 py-3 pr-20 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 text-[15px] transition-all"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-[15px] text-neutral-300">minutes</span>
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="flex-1 flex flex-col items-start justify-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-neutral-600 bg-[#1C1C1C] text-white focus:ring-white/20 focus:ring-2"
                  />
                  <span className="text-[15px] text-white font-medium">Event is Active</span>
                </label>
              </div>
            )}
          </div>
        </form>
        
        <div className="px-6 py-4 bg-[#111111] border-t border-neutral-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[15px] font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-[15px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-full transition-colors disabled:opacity-70"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalState, setModalState] = useState({ isOpen: false, eventData: null });
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  async function fetchEventTypes() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/event-types");
      setEventTypes(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load event types.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this event type?")) return;
    try {
      await api.delete(`/api/event-types/${id}`);
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event type.");
    }
  }

  function handleCopy(id, slug) {
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSave(savedEvent, isEdit) {
    if (isEdit) {
      setEventTypes(prev => prev.map(et => et.id === savedEvent.id ? savedEvent : et));
    } else {
      setEventTypes(prev => [...prev, savedEvent]);
    }
  }

  const filteredEvents = eventTypes.filter(et => 
    et.title.toLowerCase().includes(search.toLowerCase()) || 
    et.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto font-sans text-white pt-2 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Event types</h1>
          <p className="text-[15px] text-neutral-400">Configure different events for people to book on your calendar.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#111111] text-white pl-9 pr-4 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 text-sm w-full sm:w-64 transition-all" 
            />
          </div>
          <button
            onClick={() => setModalState({ isOpen: true, eventData: null })}
            className="flex items-center gap-1.5 px-4 py-2 text-[15px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-[15px]">Loading event types…</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 p-5 bg-red-950/20 border border-red-900/50 rounded-xl text-[15px] text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load event types</p>
            <p className="mt-1 text-sm text-red-400/80">{error}</p>
            <button onClick={fetchEventTypes} className="mt-3 text-sm font-medium underline underline-offset-2 hover:text-red-300">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && eventTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neutral-800 rounded-xl bg-[#1C1C1C]/50">
          <CalendarOff className="h-10 w-10 text-neutral-600 mb-4" strokeWidth={1.5} />
          <p className="text-[15px] font-medium text-neutral-300">No event types yet</p>
          <p className="text-sm text-neutral-500 mt-1">Click "New" to create your first one.</p>
        </div>
      )}

      {!loading && !error && eventTypes.length > 0 && (
        <div className="bg-[#1C1C1C] rounded-2xl border border-neutral-800 overflow-hidden shadow-sm">
          {filteredEvents.map((et) => (
            <div key={et.id} className="relative group border-b border-neutral-800/80 last:border-b-0 flex items-center justify-between p-5 hover:bg-neutral-800/30 transition-colors">
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <h3 className="text-[15px] font-bold text-white tracking-tight">{et.title}</h3>
                  <span className="text-sm text-neutral-500">/lalit-kumar-ru7uos/{et.slug}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{et.duration}m</span>
                  </div>
                  {!et.isActive && (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs font-semibold text-yellow-600 bg-yellow-950/40">
                      <EyeOff className="h-3 w-3" />
                      <span>Hidden</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => setModalState({ isOpen: true, eventData: et })} className="p-2 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors" title="Edit">
                    <Pencil className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </button>
                  <a href={`/book/${et.slug}`} target="_blank" rel="noreferrer" className="p-2 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors" title="Preview">
                    <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </a>
                  <button 
                    onClick={() => handleCopy(et.id, et.slug)} 
                    className={`p-2 border border-neutral-800 rounded-lg transition-colors ${copiedId === et.id ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} 
                    title="Copy Link"
                  >
                    {copiedId === et.id ? <Check className="h-[18px] w-[18px]" strokeWidth={2} /> : <Link2 className="h-[18px] w-[18px]" strokeWidth={1.5} />}
                  </button>
                  <button onClick={() => handleDelete(et.id)} className="p-2 text-neutral-400 hover:text-red-400 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors" title="Delete">
                    <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
             <div className="p-6 text-center text-neutral-500 text-sm">No event types match your search.</div>
          )}
        </div>
      )}

      {modalState.isOpen && (
        <CreateOrEditModal
          onClose={() => setModalState({ isOpen: false, eventData: null })}
          onSave={handleSave}
          initialData={modalState.eventData}
        />
      )}
    </div>
  );
}
