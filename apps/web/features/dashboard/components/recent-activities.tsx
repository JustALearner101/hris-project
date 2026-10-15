"use client";

import { Activity, Clock, LogIn, LogOut, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  type: "in" | "out" | "upload" | "system" | "task";
}

const mockActivities: ActivityItem[] = [
  {
    id: "act-1",
    user: "Dewi Lestari",
    action: "Clocked In (Shift Pagi - On Time)",
    time: "10 mins ago",
    type: "in",
  },
  {
    id: "act-2",
    user: "Dani Raharjo",
    action: "Uploaded Medical Claim Receipt (Rp 150.000)",
    time: "25 mins ago",
    type: "upload",
  },
  {
    id: "act-3",
    user: "Rian Hidayat",
    action: "Clocked Out (End of regular shift)",
    time: "1 hour ago",
    type: "out",
  },
  {
    id: "act-4",
    user: "System Scheduler",
    action: "Payroll reconciliation report compiled",
    time: "3 hours ago",
    type: "system",
  },
  {
    id: "act-5",
    user: "Yusuf Firmansyah",
    action: "Completed task 'Update BPJS details'",
    time: "4 hours ago",
    type: "task",
  },
];

export function RecentActivities() {
  const getIcon = (type: string) => {
    switch (type) {
      case "in":
        return <LogIn className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />;
      case "out":
        return <LogOut className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case "upload":
        return <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case "task":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "in":
        return "bg-green-100 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "out":
        return "bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
      case "upload":
        return "bg-blue-100 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      case "task":
        return "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900";
      default:
        return "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <Card className="col-span-1 shadow-sm border-border bg-card flex flex-col h-[400px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activities
        </CardTitle>
        <CardDescription>Live timeline of employee system events</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pr-1">
        <div className="relative border-l border-border/85 pl-4 ml-2 space-y-5">
          {mockActivities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Timeline dot */}
              <div className={`absolute -left-[27px] top-0 w-[20px] h-[20px] rounded-full border flex items-center justify-center ${getBg(act.type)}`}>
                {getIcon(act.type)}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-foreground">{act.user}</span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{act.time}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{act.action}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
