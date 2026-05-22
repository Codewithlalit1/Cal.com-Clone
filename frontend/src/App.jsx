// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout   from "./components/AdminLayout";
import EventTypes    from "./pages/EventTypes";
import Availability  from "./pages/Availability";
import Bookings      from "./pages/Bookings";
import BookingPage    from "./pages/BookingPage";
import BookingSuccess from "./pages/BookingSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root → event-types (default landing page) */}
        <Route path="/" element={<Navigate to="/event-types" replace />} />

        {/* ── PUBLIC booking flow — no AdminLayout, no auth ── */}
        <Route path="/book/:slug"     element={<BookingPage />} />
        <Route path="/booking-success" element={<BookingSuccess />} />

        {/* ── Admin layout wraps all dashboard pages ── */}
        <Route element={<AdminLayout />}>
          <Route path="/event-types" element={<EventTypes />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/bookings"     element={<Bookings />} />
        </Route>

        {/* Catch-all: redirect unknown routes to event-types */}
        <Route path="*" element={<Navigate to="/event-types" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
