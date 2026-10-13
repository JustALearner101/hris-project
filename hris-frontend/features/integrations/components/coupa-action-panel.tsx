"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Send,
  Download,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface CoupaActionPanelProps {
  onSyncUsers: () => Promise<unknown>;
  onPullExpenses: () => Promise<unknown>;
  onSimulateError: (type: "401_UNAUTHORIZED" | "422_VALIDATION") => Promise<unknown>;
}

export function CoupaActionPanel({
  onSyncUsers,
  onPullExpenses,
  onSimulateError,
}: CoupaActionPanelProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleSyncUsers = async () => {
    try {
      setLoadingAction("sync-users");
      await onSyncUsers();
      toast.success("Berhasil mengirim data pegawai ke Coupa!", {
        description: "Payload JSON format Coupa User API v30+ berhasil diproses.",
      });
    } catch (err: unknown) {
      toast.error("Gagal sinkronisasi data ke Coupa", {
        description: (err as Error)?.message || "Terjadi kesalahan",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePullExpenses = async () => {
    try {
      setLoadingAction("pull-expenses");
      await onPullExpenses();
      toast.success("Berhasil menarik data expenses dari Coupa!", {
        description: "Data klaim reimbursement approved berhasil ditarik ke slip gaji.",
      });
    } catch (err: unknown) {
      toast.error("Gagal menarik data expense", {
        description: (err as Error)?.message || "Terjadi kesalahan",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateError = async (type: "401_UNAUTHORIZED" | "422_VALIDATION") => {
    try {
      setLoadingAction(`error-${type}`);
      await onSimulateError(type);
      toast.warning(`Simulasi Error ${type} tercatat di Audit Log!`, {
        description: "Buka 'Inspect Payload' pada tabel log untuk melihat response error Coupa.",
      });
    } catch (err: unknown) {
      toast.error("Gagal menjalankan simulasi error", {
        description: (err as Error)?.message || "Terjadi kesalahan",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/20 via-background to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Coupa Spend Interactive Laboratory
              </CardTitle>
              <CardDescription className="text-xs">
                Praktek langsung sinkronisasi REST API 2-Arah (Outbound & Inbound) + Error Handling
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-amber-300 text-amber-700 dark:text-amber-300">
            Coupa REST v30+
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action 1: Outbound Push */}
          <div className="p-3.5 rounded-lg border bg-card/60 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <ArrowUpRight className="size-4" />
              <span>1. Outbound: Push Karyawan ke Coupa</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mengambil daftar pegawai aktif HRIS, mentransformasikan ke format <code>CoupaUserDto</code> (Cost Center & Approval Limit), lalu mengirimnya via <code>POST /api/users</code>.
            </p>
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSyncUsers}
              disabled={!!loadingAction}
            >
              {loadingAction === "sync-users" ? (
                <Loader2 className="size-3.5 animate-spin mr-2" />
              ) : (
                <Send className="size-3.5 mr-2" />
              )}
              Push Users ke Coupa
            </Button>
          </div>

          {/* Action 2: Inbound Pull */}
          <div className="p-3.5 rounded-lg border bg-card/60 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-400">
              <ArrowDownLeft className="size-4" />
              <span>2. Inbound: Tarik Approved Expenses</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Memanggil <code>GET /api/expense_reports?status=approved_for_payment</code> untuk mengambil klaim reimburse dinas pegawai dan meneruskannya ke slip gaji bulanan.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 dark:text-purple-300"
              onClick={handlePullExpenses}
              disabled={!!loadingAction}
            >
              {loadingAction === "pull-expenses" ? (
                <Loader2 className="size-3.5 animate-spin mr-2" />
              ) : (
                <Download className="size-3.5 mr-2" />
              )}
              Tarik Expenses dari Coupa
            </Button>
          </div>
        </div>

        {/* Action 3: Error Simulation Panel */}
        <div className="pt-3 border-t">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
            <AlertTriangle className="size-3.5 text-amber-500" />
            Eksperimen Error Handling Enterprise:
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-900"
              onClick={() => handleSimulateError("401_UNAUTHORIZED")}
              disabled={!!loadingAction}
            >
              Simulasi 401 Unauthorized (Token Kadaluarsa)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 border border-orange-200 dark:border-orange-900"
              onClick={() => handleSimulateError("422_VALIDATION")}
              disabled={!!loadingAction}
            >
              Simulasi 422 Unprocessable Entity (Cost Center Salah)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
