import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description: string;
  status?: "danger" | "warning" | "success" | "neutral";
}

export function MetricCard({ icon: Icon, title, value, description, status = "neutral" }: MetricCardProps) {
  const statusColors = {
    danger: "text-[#DC2626]",
    warning: "text-[#FACC15]",
    success: "text-[#16A34A]",
    neutral: "text-[#2563EB]",
  };

  const bgColors = {
    danger: "bg-red-50 dark:bg-red-900/30",
    warning: "bg-yellow-50 dark:bg-yellow-900/30",
    success: "bg-green-50 dark:bg-green-900/30",
    neutral: "bg-blue-50 dark:bg-blue-900/30",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${bgColors[status]}`}>
              <Icon className={`w-5 h-5 ${statusColors[status]}`} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{title}</span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${statusColors[status]}`}>{value}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
