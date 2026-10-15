"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, HeartPulse, ShieldAlert, Award, FileText, Plus, Trash2, CheckCircle2, User, MessageSquare, ClipboardCheck, Check, X, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface LeaveRequest {
  id: string;
  name: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: "pending_supervisor" | "pending_hr" | "approved" | "rejected";
  avatar: string;
  supervisorName: string;
  supervisorNotes?: string;
  hrNotes?: string;
  attachment?: string;
  approvedBy?: string;
}

const seedRequests: LeaveRequest[] = [
  {
    id: "LV-206",
    name: "Budi Santoso",
    department: "Technology",
    type: "Annual Leave",
    startDate: "2026-08-25",
    endDate: "2026-08-27",
    duration: 3,
    reason: "Family vacation to Bali",
    status: "pending_supervisor",
    avatar: "BS",
    supervisorName: "Dani Raharjo",
  },
  {
    id: "LV-198",
    name: "Budi Santoso",
    department: "Technology",
    type: "Sick Leave",
    startDate: "2026-07-10",
    endDate: "2026-07-11",
    duration: 2,
    reason: "Medical checkup & fever rest",
    status: "approved",
    avatar: "BS",
    supervisorName: "Dani Raharjo",
    supervisorNotes: "Approved. Rest well.",
    hrNotes: "Medical certificate verified. Balance adjusted.",
    attachment: "medical_cert_1007.pdf",
  },
  {
    id: "LV-154",
    name: "Budi Santoso",
    department: "Technology",
    type: "Annual Leave",
    startDate: "2026-05-02",
    endDate: "2026-05-03",
    duration: 2,
    reason: "Personal business",
    status: "approved",
    avatar: "BS",
    supervisorName: "Dani Raharjo",
    supervisorNotes: "Approved. Back-up staff available.",
    hrNotes: "Annual leave processed.",
  },
  {
    id: "LV-207",
    name: "Rian Hidayat",
    department: "Technology",
    type: "Annual Leave",
    startDate: "2026-08-20",
    endDate: "2026-08-21",
    duration: 2,
    reason: "Attend cousin's wedding",
    status: "pending_supervisor",
    avatar: "RH",
    supervisorName: "Dani Raharjo",
  },
];

export function EmployeeLeaveView() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManagerMode, setIsManagerMode] = useState(false);
  
  // Leave review dialog state (for manager mode)
  const [selectedReviewLeave, setSelectedReviewLeave] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Leave details dialog state
  const [selectedDetailsLeave, setSelectedDetailsLeave] = useState<LeaveRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: "",
  });

  // Sync with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("leaveRequests");
    if (stored) {
      setLeaves(JSON.parse(stored));
    } else {
      localStorage.setItem("leaveRequests", JSON.stringify(seedRequests));
      setLeaves(seedRequests);
    }
  }, []);

  const saveToStorage = (updatedLeaves: LeaveRequest[]) => {
    localStorage.setItem("leaveRequests", JSON.stringify(updatedLeaves));
    setLeaves(updatedLeaves);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays || 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const duration = calculateDuration();

    if (duration <= 0) {
      toast.error("Invalid date range! End date must be after or equal to start date.");
      return;
    }

    const newLeave: LeaveRequest = {
      id: `LV-${Math.floor(100 + Math.random() * 900)}`,
      name: "Budi Santoso",
      department: "Technology",
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      duration,
      reason: formData.reason,
      status: "pending_supervisor",
      avatar: "BS",
      supervisorName: "Dani Raharjo",
      attachment: formData.attachment ? formData.attachment.split("\\").pop() : undefined,
    };

    const updated = [newLeave, ...leaves];
    saveToStorage(updated);
    setIsDialogOpen(false);
    toast.success("Leave request submitted! Awaiting Manager (Dani Raharjo) approval.");
    setFormData({
      type: "Annual Leave",
      startDate: "",
      endDate: "",
      reason: "",
      attachment: "",
    });
  };

  const handleCancelRequest = (id: string) => {
    const updated = leaves.filter((item) => item.id !== id);
    saveToStorage(updated);
    toast.info(`Request ${id} cancelled.`);
  };

  // Manager Approval Handlers
  const openReviewModal = (leave: LeaveRequest) => {
    setSelectedReviewLeave(leave);
    setReviewNotes("");
    setIsReviewOpen(true);
  };

  const handleManagerReviewSubmit = (action: "approve" | "reject") => {
    if (!selectedReviewLeave) return;

    const updated = leaves.map((item) => {
      if (item.id === selectedReviewLeave.id) {
        return {
          ...item,
          status: action === "approve" ? ("pending_hr" as const) : ("rejected" as const),
          supervisorNotes: reviewNotes || "Reviewed and approved by supervisor.",
        };
      }
      return item;
    });

    saveToStorage(updated);
    setIsReviewOpen(false);
    setSelectedReviewLeave(null);

    if (action === "approve") {
      toast.success(`Request ${selectedReviewLeave.id} approved. Forwarded to HR.`);
    } else {
      toast.error(`Request ${selectedReviewLeave.id} rejected.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-none font-medium">Approved</Badge>;
      case "pending_supervisor":
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-none font-medium">Awaiting Manager</Badge>;
      case "pending_hr":
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border-none font-medium">Awaiting HR</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-none font-medium">Rejected</Badge>;
      default:
        return null;
    }
  };

  // Separate requests for employee history vs supervisor approvals
  const myLeaves = leaves.filter((item) => item.name === "Budi Santoso");
  const pendingForManager = leaves.filter((item) => item.status === "pending_supervisor");

  return (
    <div className="space-y-6">
      {/* Simulation Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsManagerMode(!isManagerMode)}
          className={`text-xs gap-1.5 transition-colors ${
            isManagerMode
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          {isManagerMode ? "Back to Staff View" : "Simulate Manager View (Dani Raharjo)"}
        </Button>
      </div>

      {isManagerMode ? (
        /* Manager Mode approvals screen */
        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Team Leave Requests (Awaiting My Approval)
            </CardTitle>
            <CardDescription>
              Review and approve leave applications for subordinates in the Technology department.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingForManager.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                <p className="text-sm">No team requests awaiting your approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold bg-slate-50/50 dark:bg-slate-900/10">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pendingForManager.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                            {leave.avatar}
                          </div>
                          {leave.name}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{leave.type}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{leave.duration} days</td>
                        <td className="py-3 px-4 text-muted-foreground">{leave.startDate} to {leave.endDate}</td>
                        <td className="py-3 px-4 text-muted-foreground italic">"{leave.reason}"</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewModal(leave)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Review Request
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Regular Employee Dashboard */
        <>
          {/* Leave Balance Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annual Leave Balance</span>
                <CalendarDays className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold tracking-tight">12 / 15 Days</div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${(12/15)*100}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground mt-2 block">Valid until Dec 31, 2026</span>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sick Leave Taken</span>
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold tracking-tight">2 / 12 Days</div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(2/12)*100}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground mt-2 block">Requires medical certificate</span>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special / Paid Leave</span>
                <Award className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold tracking-tight">0 Days Used</div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "0%" }} />
                </div>
                <span className="text-[10px] text-muted-foreground mt-2 block">Maternity, marriage, condolence</span>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Active Requests</span>
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold tracking-tight">
                  {myLeaves.filter((l) => l.status.startsWith("pending")).length} Active
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "100%" }} />
                </div>
                <span className="text-[10px] text-muted-foreground mt-2 block">Awaiting manager or HR sign-off</span>
              </CardContent>
            </Card>
          </section>

          {/* Leave History List */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Personal Leave History</CardTitle>
                <CardDescription>Track status updates and reviewer feedback on your submissions</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs">
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Leave Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-base font-semibold">Submit Leave Request</DialogTitle>
                      <DialogDescription className="text-xs">Submit your leave details. Approved dates are calculated automatically.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-sm">
                      {/* Atasan Langsung */}
                      <div className="space-y-1.5">
                        <Label htmlFor="supervisor" className="text-xs font-medium text-muted-foreground">Direct Supervisor (Atasan Langsung)</Label>
                        <Input
                          id="supervisor"
                          defaultValue="Dani Raharjo (Engineering Manager)"
                          disabled
                          className="bg-slate-50 dark:bg-slate-400 text-xs font-medium"
                        />
                        <span className="text-[10px] text-muted-foreground block">Auto-assigned based on your department routing</span>
                      </div>

                      {/* Leave Type */}
                      <div className="space-y-1.5">
                        <Label htmlFor="type" className="text-xs font-medium">Leave Type</Label>
                        <select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Annual Leave">Annual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Maternity Leave">Maternity Leave</option>
                          <option value="Marriage Leave">Marriage Leave</option>
                          <option value="Compassionate Leave">Compassionate Leave</option>
                        </select>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="startDate" className="text-xs font-medium">Start Date</Label>
                          <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            required
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="endDate" className="text-xs font-medium">End Date</Label>
                          <Input
                            id="endDate"
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-xs font-medium">Reason for Absence</Label>
                        <Textarea
                          id="reason"
                          name="reason"
                          placeholder="Please clarify the purpose of your leave request..."
                          value={formData.reason}
                          onChange={handleInputChange}
                          required
                          className="text-xs min-h-[80px]"
                        />
                      </div>

                      {/* Attachment */}
                      <div className="space-y-1.5">
                        <Label htmlFor="attachment" className="text-xs font-medium">Supporting Documents (Optional)</Label>
                        <Input
                          id="attachment"
                          name="attachment"
                          type="file"
                          value={formData.attachment}
                          onChange={handleInputChange}
                          className="text-xs cursor-pointer"
                        />
                        <span className="text-[10px] text-muted-foreground block">PDF, PNG, JPG up to 5MB (Required for Sick Leave)</span>
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                        Submit Request
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold bg-slate-50/50 dark:bg-slate-900/10">
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Notes & Review Comments</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Attachment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {myLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-foreground">{leave.id}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{leave.type}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{leave.duration} day{leave.duration > 1 ? "s" : ""}</td>
                        <td className="py-3 px-4 text-muted-foreground">{leave.startDate} to {leave.endDate}</td>
                        <td className="py-3 px-4 text-muted-foreground max-w-[240px]">
                          <div className="space-y-1">
                            <p className="text-foreground italic">"{leave.reason}"</p>
                            {leave.supervisorNotes && (
                              <p className="text-[10px] text-primary flex items-start gap-1 font-medium bg-primary/5 p-1 rounded">
                                <MessageSquare className="w-3 h-3 mt-0.5" />
                                <span>Supervisor Note: {leave.supervisorNotes}</span>
                              </p>
                            )}
                            {leave.hrNotes && (
                              <p className="text-[10px] text-purple-600 flex items-start gap-1 font-medium bg-purple-50/50 p-1 rounded">
                                <MessageSquare className="w-3 h-3 mt-0.5" />
                                <span>HR Note: {leave.hrNotes}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(leave.status)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {leave.attachment ? (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                              <span className="underline cursor-pointer truncate max-w-[120px]" title={leave.attachment}>{leave.attachment}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setSelectedDetailsLeave(leave);
                                setIsDetailsOpen(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {leave.status === "pending_supervisor" ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleCancelRequest(leave.id)}
                                title="Cancel Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 font-medium ml-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> Done
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Review Dialog for Supervisor approvals */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedReviewLeave && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Review Subordinate Leave</DialogTitle>
                <DialogDescription className="text-xs">Evaluate the absence application and enter comments.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block">Employee Name</span>
                    <span className="font-semibold text-sm text-foreground">{selectedReviewLeave.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Department</span>
                    <span className="font-semibold text-sm text-foreground">{selectedReviewLeave.department}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block">Leave Type</span>
                    <Badge className="bg-primary/10 text-primary font-normal mt-1 border-none text-[10px]">{selectedReviewLeave.type}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Dates & Duration</span>
                    <span className="font-semibold text-foreground mt-1 block">
                      {selectedReviewLeave.startDate} to {selectedReviewLeave.endDate} ({selectedReviewLeave.duration} Days)
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block">Employee Reason</span>
                  <p className="p-2 border rounded bg-slate-50 dark:bg-slate-900/10 italic text-foreground mt-1">
                    "{selectedReviewLeave.reason}"
                  </p>
                </div>

                {selectedReviewLeave.attachment && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="underline cursor-pointer font-medium text-blue-600 truncate">{selectedReviewLeave.attachment}</span>
                  </div>
                )}

                {/* Supervisor Comments Input */}
                <div className="space-y-1.5 border-t pt-3">
                  <Label htmlFor="reviewNotes" className="text-xs font-semibold">Reviewer Notes / Comments</Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Enter approval details or reasons for rejection..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleManagerReviewSubmit("reject")}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/20 text-xs flex-1"
                >
                  <X className="w-4 h-4 mr-1" /> Reject Request
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleManagerReviewSubmit("approve")}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                >
                  <Check className="w-4 h-4 mr-1" /> Approve & Forward
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Details Modal for Employees */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedDetailsLeave && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Leave Request Details</DialogTitle>
                <DialogDescription className="text-xs">
                  Review logs, status tracking, and notes for this request.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                {/* Leave Type & Dates */}
                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block">Leave Type</span>
                    <Badge className="bg-primary/10 text-primary font-normal mt-1 border-none text-[10px]">
                      {selectedDetailsLeave.type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Dates & Duration</span>
                    <span className="font-semibold text-foreground mt-1 block">
                      {selectedDetailsLeave.startDate} to {selectedDetailsLeave.endDate} ({selectedDetailsLeave.duration} Days)
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <span className="text-muted-foreground block">Reason for Absence</span>
                  <p className="p-2 border rounded bg-slate-50 dark:bg-slate-900/10 italic text-foreground mt-1">
                    "{selectedDetailsLeave.reason}"
                  </p>
                </div>

                {/* Attachment */}
                {selectedDetailsLeave.attachment && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="underline cursor-pointer font-medium text-blue-600 truncate">
                      {selectedDetailsLeave.attachment}
                    </span>
                  </div>
                )}

                {/* Workflow Audit comments */}
                <div className="space-y-3 pt-3 border-t">
                  <span className="text-xs font-semibold text-foreground block">Workflow Notes</span>
                  
                  {/* Supervisor Note */}
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Supervisor Notes (Dani Raharjo)</span>
                    {selectedDetailsLeave.supervisorNotes ? (
                      <p className="p-2 border rounded bg-slate-50 dark:bg-slate-900/10 text-foreground flex items-start gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <span>"{selectedDetailsLeave.supervisorNotes}"</span>
                      </p>
                    ) : selectedDetailsLeave.status === "rejected" ? (
                      <p className="text-[10px] text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Rejected by Supervisor
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Awaiting supervisor review
                      </p>
                    )}
                  </div>

                  {/* HR Notes */}
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">HR Reviewer Notes</span>
                    {selectedDetailsLeave.status === "approved" || selectedDetailsLeave.status === "rejected" ? (
                      selectedDetailsLeave.hrNotes ? (
                        <p className="p-2 border rounded bg-purple-50/30 dark:bg-purple-950/10 text-purple-700 dark:text-purple-300 flex items-start gap-1 font-medium">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-purple-600 flex-shrink-0" />
                          <span>"{selectedDetailsLeave.hrNotes}"</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">No HR notes provided.</p>
                      )
                    ) : (
                      <p className="text-[10px] text-slate-500 bg-slate-100/60 dark:bg-slate-800 p-2 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        Awaiting HR review
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
