"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Dummy events
const events = [
    { date: "2024-09-11", title: "Meeting With Client" },
]


export default function Calendar() {
    const [currentMonth, setCurrentMonth] = React.useState(new Date(2024, 8)) // Sept 2024

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const startDay = startOfMonth.getDay() // 0: Sunday
    const daysInMonth = endOfMonth.getDate()

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" })

    // Memoize events lookup by creating a Map for O(1) access
    const eventsByDate = React.useMemo(() => {
        const map = new Map<string, typeof events>()
        for (const event of events) {
            const existing = map.get(event.date) ?? []
            existing.push(event)
            map.set(event.date, existing)
        }
        return map
    }, [])

    const getEventsForDate = React.useCallback((day: number) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        return eventsByDate.get(dateStr) ?? []
    }, [currentMonth, eventsByDate])

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle>{monthName}</CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 text-center font-medium mb-2">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-2" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, day) => {
                        const dayNum = day + 1
                        const dayEvents = getEventsForDate(dayNum)
                        return (
                            <div
                                key={dayNum}
                                className="min-h-[80px] border rounded-md p-1 text-left relative"
                            >
                                <div className="text-xs font-medium mb-1">{dayNum}</div>
                                {dayEvents.map((ev, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-blue-500 text-white text-xs rounded px-1 truncate"
                                    >
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}