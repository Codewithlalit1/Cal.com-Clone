// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import EventTypes from "./pages/EventTypes";
import Availability from "./pages/Availability";
import Bookings from "./pages/Bookings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root → event-types (default landing page) */}
        <Route path="/" element={<Navigate to="/event-types" replace />} />

        {/* Admin layout wraps all dashboard pages */}
        <Route element={<AdminLayout />}>
          <Route path="/event-types" element={<EventTypes />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/bookings" element={<Bookings />} />
        </Route>

        {/* Catch-all: redirect unknown routes to event-types */}
        <Route path="*" element={<Navigate to="/event-types" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
