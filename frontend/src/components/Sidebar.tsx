import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router";

interface SidebarProps {
  role: "student" | "teacher";
  items: Array<{
    icon: LucideIcon;
    label: string;
    path: string;
  }>;
}

export function Sidebar({ role, items }: SidebarProps) {
  const location = useLocation();

  const bgClass =
    role === "student"
      ? "bg-gradient-to-b from-[#1e3a8a] to-[#1e40af]"
      : "bg-gradient-to-b from-[#6D28D9] to-[#9333EA]";

  return (
    <div className={`w-64 h-screen ${bgClass} text-white flex flex-col shadow-xl`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">AREWS</h1>
        <p className="text-xs text-white/70 mt-1">
          Academic Risk Early-Warning System
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive ? "bg-white/20 shadow-lg" : "hover:bg-white/10"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
