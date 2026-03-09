interface RiskBadgeProps {
  level: "high" | "medium" | "low";
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const colors = {
    high: "bg-red-100 dark:bg-red-900/40 text-red-700 border-red-200",
    medium: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 border-yellow-200",
    low: "bg-green-100 dark:bg-green-900/40 text-green-700 border-green-200",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const labels = {
    high: "HIGH RISK",
    medium: "MEDIUM RISK",
    low: "LOW RISK",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${colors[level]} ${sizes[size]} transition-all hover:scale-105`}
    >
      {labels[level]}
    </span>
  );
}
