// src/components/AdminLayout.jsx
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  BookOpen,
  LayoutGrid,
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden font-sans">
      
      {/* ── Mobile Overlay ────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-[#111111] border-r border-neutral-800 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-white" strokeWidth={2} />
            <span className="text-sm font-semibold text-white tracking-tight">
              Cal Admin
            </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-neutral-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                [
                  "nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer hint */}
        <div className="px-4 py-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500">Cal.com Clone · Admin</p>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 shrink-0 flex items-center px-4 md:px-8 border-b border-neutral-800 bg-[#111111] gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1 -ml-1 text-neutral-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-white">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
