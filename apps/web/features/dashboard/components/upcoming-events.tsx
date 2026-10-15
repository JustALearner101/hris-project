"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Calendar as CalendarIcon, Users, Megaphone } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  date: string;
  type: "birthday" | "holiday" | "meeting" | "onboarding";
  desc: string;
}

const mockEvents: EventItem[] = [
  {
    id: "ev-1",
    title: "Agus Prasetyo's Birthday",
    date: "Today, 14 Aug",
    type: "birthday",
    desc: "Send him a Slack greeting! 🎂",
  },
  {
    id: "ev-2",
    title: "Independence Day Holiday",
    date: "Mon, 17 Aug",
    type: "holiday",
    desc: "National Holiday - Office Closed 🇮🇩",
  },
  {
    id: "ev-3",
    title: "Onboarding: 3 New Members",
    date: "Tue, 18 Aug",
    type: "onboarding",
    desc: "Welcome session at 09:00 AM (Tech Team)",
  },
  {
    id: "ev-4",
    title: "Monthly Town Hall Meeting",
    date: "Thu, 20 Aug",
    type: "meeting",
    desc: "Reviewing Q3 roadmap and HR updates",
  },
];

export function UpcomingEvents() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const getEventIcon = (type: string) => {
    switch (type) {
      case "birthday":
        return <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      case "holiday":
        return <Megaphone className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "onboarding":
        return <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <CalendarIcon className="w-4 h-4 text-primary" />;
    }
  };

  const getEventBorder = (type: string) => {
    switch (type) {
      case "birthday":
        return "border-l-pink-500";
      case "holiday":
        return "border-l-red-500";
      case "onboarding":
        return "border-l-blue-500";
      default:
        return "border-l-primary";
    }
  };

  return (
    <Card className="col-span-1 shadow-sm border-border bg-card flex flex-col h-full min-h-[400px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Events & Milestones</CardTitle>
        <CardDescription>Calendar view and upcoming key dates</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        {/* Calendar component wrapper with smaller size */}
        <div className="flex justify-center border rounded-lg bg-slate-50/50 dark:bg-slate-900/10 p-1.5">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border-none shadow-none max-w-full"
          />
        </div>

        {/* Event List */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Upcoming Events</span>
          <div className="space-y-2">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className={`p-2.5 rounded-lg border border-border/80 border-l-4 ${getEventBorder(event.type)} bg-slate-50/30 dark:bg-slate-900/10 flex gap-3`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getEventIcon(event.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground truncate">{event.title}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{event.date}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
