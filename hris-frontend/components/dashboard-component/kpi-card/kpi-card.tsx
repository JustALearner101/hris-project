import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
                            label,
                            value,
                            delta,
                            variant = "neutral",
                        }: {
    label: string
    value: string
    delta?: string
    variant?: "positive" | "negative" | "neutral"
}) {
    const badgeClasses = cn(
        "px-2 py-0.5 text-xs rounded-md",
        variant === "positive" && "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
        variant === "negative" && "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
        variant === "neutral" && "bg-secondary text-secondary-foreground",
    )

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                {delta ? <span className={badgeClasses}>{delta}</span> : null}
            </CardContent>
        </Card>
    )
}