"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Calendar, CheckCircle2, AlertCircle, Play, Square, Megaphone, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "./kpi-card";

interface ShiftSchedule {
  day: string;
  date: string;
  shiftName: string;
  time: string;
  status: "scheduled" | "completed" | "off";
}

interface UserRequest {
  id: string;
  type: string;
  detail: string;
  amount?: string;
  date: string;
  status: "approved" | "pending" | "rejected";
}

const mockShifts: ShiftSchedule[] = [
  { day: "Monday", date: "10 Aug", shiftName: "Regular Shift", time: "09:00 - 18:00", status: "completed" },
  { day: "Tuesday", date: "11 Aug", shiftName: "Regular Shift", time: "09:00 - 18:00", status: "completed" },
  { day: "Wednesday", date: "12 Aug", shiftName: "Regular Shift", time: "09:00 - 18:00", status: "completed" },
  { day: "Thursday", date: "13 Aug", shiftName: "Regular Shift", time: "09:00 - 18:00", status: "completed" },
  { day: "Friday", date: "14 Aug", shiftName: "Regular Shift", time: "09:00 - 18:00", status: "scheduled" },
];

const mockRequests: UserRequest[] = [
  { id: "LR-902", type: "Leave Request", detail: "Annual Leave (3 Days)", date: "12 Aug 2026", status: "pending" },
  { id: "CR-405", type: "Claim Reimbursement", detail: "Optical Glasses", amount: "Rp 1,200,000", date: "08 Aug 2026", status: "approved" },
  { id: "OR-112", type: "Overtime Request", detail: "Database Migration (2.5 hrs)", date: "05 Aug 2026", status: "approved" },
];

export function EmployeeDashboard() {
  const [time, setTime] = useState("");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Retrieve initial clock in state
  useEffect(() => {
    const storedClockIn = localStorage.getItem("clockInTime");
    if (storedClockIn) {
      setIsClockedIn(true);
      setClockInTime(storedClockIn);
    }
  }, []);

  const handleClockToggle = () => {
    if (!isClockedIn) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      localStorage.setItem("clockInTime", timeStr);
      setClockInTime(timeStr);
      setIsClockedIn(true);
      toast.success(`Clocked in successfully at ${timeStr}! Have a great workday.`);
    } else {
      localStorage.removeItem("clockInTime");
      setClockInTime(null);
      setIsClockedIn(false);
      toast.info("Clocked out successfully! Rest well.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-none font-normal text-xs">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-none font-normal text-xs">Pending</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-none font-normal text-xs">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Clock-In Widget & Shift Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Shift Check-In</CardTitle>
            <CardDescription>Record your daily attendance records below</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col md:flex-row items-center justify-between gap-6 pb-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="text-4xl font-extrabold tracking-tight tabular-nums text-foreground">
                {time || "00:00:00"}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                <Calendar className="w-4 h-4 text-primary" />
                {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="mt-4 pt-2 border-t border-border/60">
                <span className="text-xs text-muted-foreground block">Active Shift</span>
                <span className="text-sm font-semibold text-foreground">Regular Shift (09:00 - 18:00)</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              {isClockedIn ? (
                <div className="text-center space-y-1 bg-green-50 dark:bg-green-950/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-900 w-full">
                  <span className="text-[10px] text-green-700 dark:text-green-400 font-semibold uppercase tracking-wider block">Status</span>
                  <span className="text-xs text-green-800 dark:text-green-300">Clocked In at <span className="font-bold">{clockInTime}</span></span>
                </div>
              ) : (
                <div className="text-center space-y-1 bg-slate-50 dark:bg-slate-900/10 px-4 py-2 rounded-lg border w-full">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Status</span>
                  <span className="text-xs text-muted-foreground">Not Clocked In Yet</span>
                </div>
              )}

              <Button
                onClick={handleClockToggle}
                className={`w-[200px] h-11 font-medium transition-all ${
                  isClockedIn 
                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {isClockedIn ? (
                  <>
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Clock In
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Shift Status */}
        <Card className="col-span-1 border-border bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Shift Schedule</CardTitle>
            <CardDescription>Timetable for the current week</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 space-y-3 flex-1 overflow-y-auto">
            {mockShifts.map((s) => (
              <div key={s.day} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0 last:pb-0">
                <div>
                  <span className="font-semibold text-foreground block">{s.day}</span>
                  <span className="text-[10px] text-muted-foreground">{s.date} • {s.shiftName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">{s.time}</span>
                  {s.status === "completed" ? (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400 flex items-center justify-end gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  ) : s.status === "scheduled" ? (
                    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Scheduled
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> Off
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Personal KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Attendance Rate" value="98.2%" delta="+0.8%" variant="positive" />
        <KpiCard label="Remaining Leave" value="12 Days" delta="Active" variant="neutral" />
        <KpiCard label="Pending Claims" value="3 Claims" delta="Reviewing" variant="neutral" />
        <KpiCard label="Overtime Hours" value="8.5 Hrs" delta="+2.5 hrs" variant="positive" />
      </section>

      {/* Requests Status & Announcements */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* User Requests */}
        <Card className="lg:col-span-2 shadow-sm border-border bg-card h-[380px] flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">My Requests & Claims</CardTitle>
              <CardDescription>History of your leave and claim submissions</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("New Request Dialog is coming soon!")}
              className="text-xs h-8"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              New Request
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border/60">
              {mockRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{req.type}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">({req.id})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.detail}</p>
                    <span className="text-[10px] text-muted-foreground/80 block mt-1">Submitted: {req.date}</span>
                  </div>
                  <div className="text-right space-y-1.5">
                    {req.amount && (
                      <span className="font-bold text-xs text-foreground block">{req.amount}</span>
                    )}
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Announcements Accordion */}
        <Card className="col-span-1 shadow-sm border-border bg-card h-[380px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              Company Announcements
            </CardTitle>
            <CardDescription>Latest news and policy updates</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Important</span>
                <span className="font-semibold text-xs text-foreground block">Independence Day Flag Ceremony</span>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  All employees are invited to join the national flag ceremony on Monday, August 17 at 08:00 AM in the main yard. Dress code: Batik.
                </p>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Policy</span>
                <span className="font-semibold text-xs text-foreground block">Updated Medical Coverage</span>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  We have expanded our BPJS/Insurance partners for dental and optical clinics. Check the Documents tab for the full list of coverages.
                </p>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">General</span>
                <span className="font-semibold text-xs text-foreground block">Q3 Hackathon Announcement</span>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Registrations for our Q3 internal hackathon open next week. Form your teams of 3-5 and submit your ideas. Prizes await!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
