"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AppDialogAttendance } from "@/components/app-dialog/app-dialog-attendance/app-dialog-attendance";
import Calendar from "@/components/app-calendar/app-calendar"
import { CalendarDays, FileText, Wallet } from "lucide-react";
import {ConfirmationDialog} from "@/components/app-dialog/app-dialog-confirmation/app-dialog-confirmation";
import {AppDialogRequest} from "@/components/app-dialog/app-dialog-request/app-dialog-request";


export default function EmployeeDashboard() {
    const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [showRequestDialog, setShowRequestDialog] = useState(false)


    return (
        <div className="p-6 grid gap-6">
            {/* Header */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src="/avatar.png" alt="Employee" />
                        <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-xl font-semibold">Budi Santoso</h2>
                        <p className="text-sm text-muted-foreground">Software Engineer</p>
                        <p className="text-sm text-muted-foreground">Dept: IT | Jakarta</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-end items-center ml-auto">
                        {!isClockedIn ? (
                            <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    setIsClockedIn(true);
                                    setShowAttendanceDialog(true);
                                }}
                            >
                                Clock In
                            </Button>
                        ) : (
                            <Button
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => setShowDialog(true)}>
                                Clock Out
                            </Button>

                        )}
                        <Button className="" onClick={() => setShowRequestDialog(true)}>
                            Request
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* 3 Column Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                            <CalendarDays className="w-4 h-4" /> Kehadiran Hari Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Status: {isClockedIn ? (
                            <span className="font-semibold text-green-600">Sudah Absen</span>
                        ) : (
                            <span className="font-semibold text-red-500">Belum Absen</span>
                        )}
                        </p>
                        <p>Shift: 09:00 - 17:00</p>
                        <p>Overtime: 0 jam</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-orange-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <FileText className="w-4 h-4" /> Saldo & Tunjangan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Cuti Tahunan: 10 hari</p>
                        <p>Cuti Sakit: 5 hari</p>
                        <p>BPJS: Aktif</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <Wallet className="w-4 h-4" /> Gaji Bulan Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Gaji Bersih: Rp 5.000.000</p>
                        <Button size="sm" className="mt-2">Lihat Slip Gaji</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Announcements & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pengumuman</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc ml-4 text-sm space-y-1">
                            <li>Townhall Jumat jam 15.00</li>
                            <li>Update kebijakan cuti</li>
                            <li>Event Family Gathering</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance & Learning</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2 font-medium">KPI Q3</p>
                        <Progress value={75} className="mb-4" />
                        <p>Training: Cloud Security</p>
                        <p>Deadline: 15 Okt 2025</p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <CardTitle>Calendar & Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <Calendar />
                </CardContent>
            </Card>

            {showAttendanceDialog && (
                <AppDialogAttendance
                    onClose={() => setShowAttendanceDialog(false)}
                />
            )}
            <ConfirmationDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                title="Clock Out Confirmation"
                description="Are you sure you want to clock out? This will end your work session for today."
                confirmText="Clock Out"
                cancelText="Cancel"
                onConfirm={() => {
                    setIsClockedIn(false);
                    console.log("Clocked out successfully");
                }}
                variant="destructive"
            />
            {showRequestDialog && (
                <AppDialogRequest onClose={() => setShowRequestDialog(false)} open={showRequestDialog} />
            )}
        </div>
    );
}