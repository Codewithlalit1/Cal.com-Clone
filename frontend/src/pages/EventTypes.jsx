// src/pages/EventTypes.jsx
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Clock,
  Link2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CalendarOff,
} from "lucide-react";
import api from "../lib/api";

// ─── Duration options (must match the backend's allowed values) ────────────────
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

// ─── Default form state ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: "",
  description: "",
  duration: 30,
  color: "#6366f1",
  isActive: true,
};

// =============================================================================
// Sub-component: EventCard
// =============================================================================
function EventCard({ event, onDelete }) {
  // Two-click delete pattern — avoids browser confirm() dialogs
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timerRef = useRef(null);

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-reset after 3 s if user doesn't confirm
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      clearTimeout(timerRef.current);
      setConfirmDelete(false);
      onDelete(event.id);
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const bookingUrl = `/book/${event.slug}`;

  return (
    <div className="relative bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Coloured top accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: event.color }} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">
            {event.title}
          </h3>

          {/* Active badge */}
          <span
            className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              event.isActive
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                event.isActive ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {event.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Duration */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>{event.duration} minutes</span>
        </div>

        {/* Booking link */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
          <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="truncate">{bookingUrl}</span>
        </div>

        {/* Divider + actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            id={`delete-event-${event.id}`}
            onClick={handleDeleteClick}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors duration-150 ${
              confirmDelete
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            {confirmDelete ? "Confirm?" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-component: CreateModal
// =============================================================================
function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
      };
      const res = await api.post("/api/event-types", payload);
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to create event type. Is the backend running?";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-md shadow-lg border border-gray-200">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            New Event Type
          </h2>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="event-title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. 30 Min Interview"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="event-description"
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="A short description visible to bookers"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 resize-none"
            />
          </div>

          {/* Duration + Color row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                id="event-duration"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Colour
              </label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-md px-2 py-1.5 h-[38px]">
                <input
                  id="event-color"
                  name="color"
                  type="color"
                  value={form.color}
                  onChange={handleChange}
                  className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {form.color}
                </span>
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              id="event-isActive"
              name="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <label
              htmlFor="event-isActive"
              className="text-xs text-gray-600 select-none"
            >
              Active (visible to bookers)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-event-btn"
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-60"
            >
              {submitting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Main: EventTypes page
// =============================================================================
export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ── Fetch on mount ───────────────────────────────────────────────────────────
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
      setError(
        err.response?.data?.message ||
          "Could not load event types. Is the backend running on port 3001?"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Delete handler ───────────────────────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await api.delete(`/api/event-types/${id}`);
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to delete event type."
      );
    }
  }

  // ── After creation, prepend to list ─────────────────────────────────────────
  function handleCreated(newEventType) {
    setEventTypes((prev) => [...prev, newEventType]);
  }

  // ── Render states ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage the types of meetings you offer.
          </p>
        </div>
        <button
          id="new-event-type-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          New Event Type
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading event types…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load event types</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
            <button
              onClick={fetchEventTypes}
              className="mt-2 text-xs font-medium underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && eventTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-200 rounded-md bg-gray-50">
          <CalendarOff className="h-8 w-8 text-gray-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">
            No event types yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Click "New Event Type" to create your first one.
          </p>
        </div>
      )}

      {/* Card grid */}
      {!loading && !error && eventTypes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {eventTypes.map((et) => (
            <EventCard key={et.id} event={et} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
