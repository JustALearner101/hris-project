"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, FileText, DollarSign, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PendingRequest {
  id: string;
  name: string;
  type: "leave" | "claim" | "overtime";
  detail: string;
  amount?: string;
  date: string;
  avatar: string;
}

const initialRequests: PendingRequest[] = [
  {
    id: "REQ-101",
    name: "Budi Santoso",
    type: "leave",
    detail: "Annual Leave (3 Days: Aug 18 - Aug 20)",
    date: "Today, 10:15 AM",
    avatar: "BS",
  },
  {
    id: "REQ-102",
    name: "Siti Rahma",
    type: "claim",
    detail: "Medical Reimbursement",
    amount: "Rp 450,000",
    date: "Today, 09:30 AM",
    avatar: "SR",
  },
  {
    id: "REQ-103",
    name: "Adit Prasetyo",
    type: "overtime",
    detail: "Weekend Overtime (4.5 hours - System Migration)",
    date: "Yesterday, 04:45 PM",
    avatar: "AP",
  },
  {
    id: "REQ-104",
    name: "Dewi Lestari",
    type: "leave",
    detail: "Sick Leave (1 Day: Aug 17)",
    date: "Yesterday, 02:10 PM",
    avatar: "DL",
  },
];

export function ApprovalCenter() {
  const [requests, setRequests] = useState<PendingRequest[]>(initialRequests);

  const handleAction = (id: string, name: string, action: "approve" | "reject") => {
    // Optimistic state update
    setRequests((prev) => prev.filter((r) => r.id !== id));

    if (action === "approve") {
      toast.success(`Request ${id} for ${name} has been approved.`);
    } else {
      toast.error(`Request ${id} for ${name} has been rejected.`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "claim":
        return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "overtime":
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case "leave":
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-none font-normal text-[10px]">Cuti</Badge>;
      case "claim":
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-none font-normal text-[10px]">Klaim</Badge>;
      case "overtime":
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-none font-normal text-[10px]">Lembur</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm border-border bg-card flex flex-col h-[400px]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Approval Center</CardTitle>
          <CardDescription>Pending tasks requiring your sign-off</CardDescription>
        </div>
        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-none">
          {requests.length} pending
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pr-1">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-8">
            <ShieldAlert className="w-10 h-10 text-muted-foreground/60" />
            <p className="text-sm">All requests cleared! Good job.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {requests.map((request) => (
              <div key={request.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 text-sm flex-shrink-0">
                    {request.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">{request.name}</span>
                      {getBadge(request.type)}
                      {request.amount && (
                        <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                          {request.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{request.detail}</p>
                    <span className="text-[10px] text-muted-foreground/80 block mt-1">{request.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-8 h-8 rounded-full border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                    onClick={() => handleAction(request.id, request.name, "approve")}
                    aria-label={`Approve request ${request.id}`}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-8 h-8 rounded-full border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleAction(request.id, request.name, "reject")}
                    aria-label={`Reject request ${request.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
