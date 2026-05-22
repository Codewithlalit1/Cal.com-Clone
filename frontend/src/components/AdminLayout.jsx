// src/components/AdminLayout.jsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  BookOpen,
  LayoutGrid,
} from "lucide-react";

/* ─── Route → label mapping for the top header ─────────────────── */
const PAGE_TITLES = {
  "/event-types": "Event Types",
  "/availability": "Availability",
  "/bookings": "Bookings",
};

/* ─── Sidebar navigation items ──────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/event-types", label: "Event Types", icon: LayoutGrid },
  { to: "/availability", label: "Availability", icon: Clock },
  { to: "/bookings", label: "Bookings", icon: BookOpen },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-gray-200 flex flex-col bg-white">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 h-14 px-4 border-b border-gray-200">
          <CalendarDays className="h-5 w-5 text-gray-900" strokeWidth={2} />
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            Cal Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "nav-link",
                  isActive ? "active" : "",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">Cal.com Clone · Admin</p>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 shrink-0 flex items-center px-6 border-b border-gray-200 bg-white">
          <h1 className="text-sm font-semibold text-gray-900">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
