import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  variant?: "positive" | "negative" | "neutral";
}

export function KpiCard({
  label,
  value,
  delta,
  variant = "neutral",
}: KpiCardProps) {
  const badgeClasses = cn(
    "px-2 py-0.5 text-[10px] rounded-md font-semibold tracking-wide uppercase",
    variant === "positive" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    variant === "negative" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    variant === "neutral" && "bg-secondary text-secondary-foreground"
  );

  // Generate lightweight sparkline points based on the card label
  const getSparklinePoints = (title: string) => {
    switch (title) {
      case "Total Employees":
        return [20, 22, 21, 24, 25, 28, 27, 32];
      case "Attendance Today":
        return [38, 37, 39, 36, 38, 37, 39, 40];
      case "Payroll This Month":
        return [18, 20, 24, 23, 26, 28, 27, 30];
      case "Open Requests":
        return [38, 35, 32, 28, 30, 25, 20, 16];
      default:
        return [20, 24, 22, 26, 25, 28, 27, 30];
    }
  };

  const points = getSparklinePoints(label);
  const width = 80;
  const height = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pointsStr = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor =
    variant === "positive"
      ? "stroke-green-500"
      : variant === "negative"
      ? "stroke-red-500"
      : "stroke-primary/60";

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border bg-card">
      <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        {delta ? <span className={badgeClasses}>{delta}</span> : null}
      </CardHeader>
      <CardContent className="flex items-end justify-between pt-1">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        
        {/* SVG Sparkline */}
        <div className="h-6 flex items-center pr-1" aria-hidden="true">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              className={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsStr}
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
