import { KpiCard } from "@/components/dashboard-component/kpi-card/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {RevenueAreaChart} from "@/components/dashboard-component/revenue-area-chart/revenue-area-chart";

export default function DashboardPage() {
    return (
        <div data-static-light className="overflow-hidden">
            <div className="rounded-2xl border bg-card shadow-sm p-4 md:p-6 lg:p-8">
                <header className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-pretty">Dashboard</h1>
                </header>

                {/* KPI row */}
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KpiCard label="Total Employees" value="1,284" delta="+2.1%" variant="neutral" />
                    <KpiCard label="Attendance Today" value="96.4%" delta="+0.4%" variant="positive" />
                    <KpiCard label="Payroll This Month" value="Rp 4.2B" delta="+3.2%" variant="neutral" />
                    <KpiCard label="Open Requests" value="37" delta="-12%" variant="negative" />
                </section>

                {/* Upper charts */}
                <section className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Number of Employees by Monthly Salary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RevenueAreaChart />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Retention rate</span>
                                <span className="font-medium">96.2%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Absence today</span>
                                <span className="font-medium">3.8%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Open positions</span>
                                <span className="font-medium">12</span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Employees panels */}

                {/* Bottom charts (compact, to keep static height) */}
            </div>
        </div>
    )
}