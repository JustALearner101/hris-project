"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, FileText, Check, X, Search, ShieldCheck, UserCheck, AlertTriangle, Eye, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeaveRequest } from "./employee-leave-view";

export function AdminLeaveView() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Review modal state
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [hrNotes, setHrNotes] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Sync state from localStorage
  const loadRequests = () => {
    const stored = localStorage.getItem("leaveRequests");
    if (stored) {
      setLeaves(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadRequests();
    // Listen for storage events (allows syncing across multiple tabs/simulations)
    window.addEventListener("storage", loadRequests);
    return () => window.removeEventListener("storage", loadRequests);
  }, []);

  const saveToStorage = (updatedLeaves: LeaveRequest[]) => {
    localStorage.setItem("leaveRequests", JSON.stringify(updatedLeaves));
    setLeaves(updatedLeaves);
  };

  const handleReviewOpen = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setHrNotes("");
    setIsReviewOpen(true);
  };

  const handleHRReviewSubmit = (action: "approve" | "reject") => {
    if (!selectedLeave) return;

    const updated = leaves.map((item) => {
      if (item.id === selectedLeave.id) {
        return {
          ...item,
          status: action === "approve" ? ("approved" as const) : ("rejected" as const),
          hrNotes: hrNotes || "Processed and verified by HR.",
          approvedBy: action === "approve" ? "Admin HR" : "—",
        };
      }
      return item;
    });

    saveToStorage(updated);
    setIsReviewOpen(false);
    setSelectedLeave(null);

    if (action === "approve") {
      toast.success(`Request ${selectedLeave.id} has been fully approved.`);
    } else {
      toast.error(`Request ${selectedLeave.id} has been rejected.`);
    }
  };

  const handleBypassSupervisor = () => {
    if (!selectedLeave) return;
    
    const updated = leaves.map((item) => {
      if (item.id === selectedLeave.id) {
        return {
          ...item,
          status: "pending_hr" as const,
          supervisorNotes: "Bypassed by HR Admin.",
        };
      }
      return item;
    });
    
    saveToStorage(updated);
    toast.info(`Bypassed supervisor approval for request ${selectedLeave.id}. Ready for HR review.`);
    
    // Update active modal layout
    setSelectedLeave({
      ...selectedLeave,
      status: "pending_hr",
      supervisorNotes: "Bypassed by HR Admin.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="secondary" className="bg-green-50 text-dark-700 dark:bg-green-900/20 dark:text-green-700 border-none font-normal text-xs">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-50 text-dark-700 dark:bg-red-900/20 dark:text-red-300 border-none font-normal text-xs">Rejected</Badge>;
      case "pending_supervisor":
        return <Badge variant="secondary" className="bg-amber-50 text-dark-700 dark:bg-amber-900/20 dark:text-amber-300 border-none font-normal text-xs">Awaiting Manager</Badge>;
      case "pending_hr":
        return <Badge variant="secondary" className="bg-purple-50 text-dark-700 dark:bg-purple-900/20 dark:text-purple-300 border-none font-normal text-xs">Awaiting HR</Badge>;
      default:
        return null;
    }
  };

  // Filter requests
  const pendingRequests = leaves.filter(
    (item) => item.status === "pending_supervisor" || item.status === "pending_hr"
  );
  
  const resolvedRequests = leaves.filter(
    (item) => item.status === "approved" || item.status === "rejected"
  );

  const filteredLedger = resolvedRequests.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Absence Overview KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* On Leave Today */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On Leave Today</span>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-bold tracking-tight">4 Employees</div>
            <p className="text-[10px] text-muted-foreground mt-2 block">Dani, Rian, Lestari, Siti</p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Approvals</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-bold tracking-tight">
              {pendingRequests.filter((l) => l.status === "pending_hr").length} Reviewable
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 block">
              {pendingRequests.filter((l) => l.status === "pending_supervisor").length} awaiting manager approval
            </p>
          </CardContent>
        </Card>

        {/* Absence Rate */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Absence Rate (Month)</span>
            <UserCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-bold tracking-tight">2.1%</div>
            <p className="text-[10px] text-green-500 mt-2 block">-0.4% vs previous month</p>
          </CardContent>
        </Card>

        {/* Approved Leaves */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved Leaves</span>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-bold tracking-tight">
              {resolvedRequests.filter((l) => l.status === "approved").length} Approved
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 block">Total resolved leave records in system</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Approvals Queue */}
        <Card className="lg:col-span-1 shadow-sm border-border bg-card h-[480px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Approvals Queue</CardTitle>
            <CardDescription>Monitor and process all incoming leave workflows</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-1">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-8">
                <ShieldCheck className="w-10 h-10 text-muted-foreground/60" />
                <p className="text-sm">Queue is clean! No requests left.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-slate-50/20 dark:bg-slate-900/10 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {item.avatar}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-foreground block truncate">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.department}</span>
                        </div>
                      </div>
                      
                      {/* Step Indicator status */}
                      {item.status === "pending_supervisor" ? (
                        <Badge className="bg-amber-100 text-amber-800 border-none font-semibold text-[9px] uppercase tracking-wide">
                          Awaiting Manager
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-800 border-none font-semibold text-[9px] uppercase tracking-wide">
                          Awaiting HR
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs pt-1 border-t border-border/40 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">{item.type}</span>
                        <span className="text-muted-foreground font-semibold">{item.startDate} to {item.endDate}</span>
                      </div>
                      <p className="text-muted-foreground pt-1 italic">"{item.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        className="w-full text-[11px] h-8 gap-1.5"
                        onClick={() => handleReviewOpen(item)}
                      >
                        {item.status === "pending_supervisor" ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Monitor Request
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Review & Action
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Absence Ledger */}
        <Card className="lg:col-span-2 shadow-sm border-border bg-card h-[480px] flex flex-col">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Absence Ledger</CardTitle>
              <CardDescription>Comprehensive audit list of processed employee leaves</CardDescription>
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff or dept..."
                className="pl-8 h-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {filteredLedger.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-8">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/60" />
                <p className="text-xs">No records found matching search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold bg-slate-50/50 dark:bg-slate-900/10">
                      <th className="py-2.5 px-4">ID</th>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Department</th>
                      <th className="py-2.5 px-4">Leave Type</th>
                      <th className="py-2.5 px-4">Dates</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Approved By</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium">{item.id}</td>
                        <td className="py-2.5 px-4 font-semibold text-foreground">{item.name}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{item.department}</td>
                        <td className="py-2.5 px-4 text-foreground font-medium">{item.type}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{item.startDate} to {item.endDate} ({item.duration}d)</td>

                        <td className="py-2.5 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{item.approvedBy}</td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={() => handleReviewOpen(item)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
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
      </div>

      {/* Review Dialog for HR Admins */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedLeave && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  {selectedLeave.status === "approved" || selectedLeave.status === "rejected"
                    ? "Leave Request Details"
                    : selectedLeave.status === "pending_supervisor"
                    ? "Monitor Leave Request"
                    : "HR Leave Request Review"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedLeave.status === "approved" || selectedLeave.status === "rejected"
                    ? "Detailed review logs and notes for this leave application."
                    : selectedLeave.status === "pending_supervisor"
                    ? "This request is currently waiting for manager approval. HR can monitor or bypass."
                    : "Supervisor has approved. Review details and finalize decision."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block">Employee Name</span>
                    <span className="font-semibold text-sm text-foreground">{selectedLeave.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Department</span>
                    <span className="font-semibold text-sm text-foreground">{selectedLeave.department}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block">Leave Type</span>
                    <Badge className="bg-primary/10 text-primary font-normal mt-1 border-none text-[10px]">{selectedLeave.type}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Dates & Duration</span>
                    <span className="font-semibold text-foreground mt-1 block">
                      {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.duration} Days)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground block">Employee Reason</span>
                    <p className="p-2 border rounded bg-slate-50 dark:bg-slate-900/10 italic text-foreground mt-1">
                      "{selectedLeave.reason}"
                    </p>
                  </div>
                  
                  {selectedLeave.attachment && (
                    <div className="flex items-center gap-1.5 py-1">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="underline cursor-pointer font-medium text-blue-600 truncate">{selectedLeave.attachment}</span>
                    </div>
                  )}
                </div>

                {/* Workflow Audit Trail */}
                <div className="space-y-3 border-t pt-3">
                  <span className="text-xs font-semibold text-foreground block">Workflow Notes</span>
                  
                  {/* Supervisor Note */}
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Supervisor Notes ({selectedLeave.supervisorName})</span>
                    {selectedLeave.supervisorNotes ? (
                      <p className="p-2 border rounded bg-slate-50 dark:bg-slate-900/10 text-foreground flex items-start gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <span>"{selectedLeave.supervisorNotes}"</span>
                      </p>
                    ) : selectedLeave.status === "rejected" ? (
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
                    {selectedLeave.status === "approved" || selectedLeave.status === "rejected" ? (
                      selectedLeave.hrNotes ? (
                        <p className="p-2 border rounded bg-purple-50/30 dark:bg-purple-950/10 text-purple-700 dark:text-purple-300 flex items-start gap-1 font-medium">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-purple-600 flex-shrink-0" />
                          <span>"{selectedLeave.hrNotes}"</span>
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

                {/* HR Comments Input / Warning (only visible for active reviews) */}
                {selectedLeave.status === "pending_hr" && (
                  <div className="space-y-1.5 border-t pt-3">
                    <Label htmlFor="hrNotes" className="text-xs font-semibold">HR Reviewer Notes</Label>
                    <Textarea
                      id="hrNotes"
                      placeholder="Add processing comments or compliance notes..."
                      value={hrNotes}
                      onChange={(e) => setHrNotes(e.target.value)}
                      className="text-xs min-h-[70px]"
                    />
                  </div>
                )}

                {selectedLeave.status === "pending_supervisor" && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-2 text-amber-800 dark:text-amber-300 mt-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-[10px]">Supervisor Approval Required</span>
                      <span className="text-[10px] leading-relaxed">
                        This request must be approved by **{selectedLeave.supervisorName}** before HR can process it. You may bypass this step if urgent.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-2 border-t">
                {selectedLeave.status === "approved" || selectedLeave.status === "rejected" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReviewOpen(false)}
                    className="w-full text-xs"
                  >
                    Close
                  </Button>
                ) : selectedLeave.status === "pending_supervisor" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReviewOpen(false)}
                      className="text-xs flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleBypassSupervisor}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex-1"
                    >
                      Bypass Supervisor
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleHRReviewSubmit("reject")}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/20 text-xs flex-1"
                    >
                      <X className="w-4 h-4 mr-1" /> Reject Request
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleHRReviewSubmit("approve")}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" /> Final Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
