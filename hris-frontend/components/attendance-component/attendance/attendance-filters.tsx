"use client"
import { CalendarIcon, FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export type DateRange = { from?: Date; to?: Date }

export type AttendanceFilterState = {
    range?: DateRange
    department?: string
    shift?: string
    status?: "all" | "on-time" | "late" | "absent"
}

export function AttendanceFilters({
                                      value,
                                      onChange,
                                      departments,
                                      shifts,
                                      className,
                                  }: {
    value: AttendanceFilterState
    onChange: (next: AttendanceFilterState) => void
    departments: string[]
    shifts: string[]
    className?: string
}) {
    return (
        <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-transparent">
                            <FilterIcon className="size-4" />
                            Filters
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] sm:w-[420px]" align="start">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Date range</p>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="size-4 text-muted-foreground" />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start bg-transparent">
                                                {value.range?.from ? (
                                                    value.range.to ? (
                                                        `${format(value.range.from, "LLL d, y")} - ${format(value.range.to, "LLL d, y")}`
                                                    ) : (
                                                        format(value.range.from, "LLL d, y")
                                                    )
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0">
                                            <Calendar
                                                mode="range"
                                                selected={{
                                                    from: value.range?.from,
                                                    to: value.range?.to,
                                                }}
                                                onSelect={(r) => onChange({ ...value, range: r || undefined })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Department</p>
                                <Select
                                    value={value.department || "all"}
                                    onValueChange={(v) => onChange({ ...value, department: v || undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {departments.map((d) => (
                                            <SelectItem key={d} value={d}>
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Shift</p>
                                <Select
                                    value={value.shift || "all"}
                                    onValueChange={(v) => onChange({ ...value, shift: v || undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All shifts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {shifts.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Status</p>
                                <Select value={value.status || "all"} onValueChange={(v) => onChange({ ...value, status: v as AttendanceFilterState["status"] })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="on-time">On-time</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" onClick={() => onChange({ status: "all", department: "all", shift: "all" })}>
                                    Reset
                                </Button>
                                <Button onClick={() => onChange({ ...value })}>Apply</Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                {value.department && value.department !== "all" && <Badge variant="secondary">Dept: {value.department}</Badge>}
                {value.shift && value.shift !== "all" && <Badge variant="secondary">Shift: {value.shift}</Badge>}
                {value.status && value.status !== "all" && <Badge variant="secondary">Status: {value.status}</Badge>}
            </div>
        </div>
    )
}