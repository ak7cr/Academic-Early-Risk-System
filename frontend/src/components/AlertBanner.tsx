import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  message: string;
  type?: "danger" | "warning" | "info";
}

export function AlertBanner({ message, type = "danger" }: AlertBannerProps) {
  const colors = {
    danger: "bg-red-50 dark:bg-red-900/30 border-red-200 text-red-700",
    warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 text-yellow-700",
    info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 text-blue-700",
  };

  return (
    <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${colors[type]}`}>
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <p className="font-medium">{message}</p>
    </div>
  );
}
