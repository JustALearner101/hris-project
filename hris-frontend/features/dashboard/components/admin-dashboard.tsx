"use client";

import { KpiCard } from "./kpi-card";
import { DashboardCharts } from "./dashboard-charts";
import { ApprovalCenter } from "./approval-center";
import { RecentActivities } from "./recent-activities";
import { UpcomingEvents } from "./upcoming-events";

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Employees" value="1,284" delta="+2.1%" variant="positive" />
        <KpiCard label="Attendance Today" value="96.4%" delta="+0.4%" variant="positive" />
        <KpiCard label="Payroll This Month" value="Rp 4.2B" delta="+3.2%" variant="neutral" />
        <KpiCard label="Open Requests" value="37" delta="-12%" variant="negative" />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">
        {/* Left Column: Charts + Approvals */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <DashboardCharts />
          <ApprovalCenter />
        </div>

        {/* Right Column: Events + Activities */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <UpcomingEvents />
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
