import { Bell } from "lucide-react";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export function TopNavbar({ title, subtitle, userName = "User" }: TopNavbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#2563EB] to-[#9333EA] flex items-center justify-center text-white font-bold">
            {userName.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
