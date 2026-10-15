"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationSyncLog } from "../types/integration";
import { PayloadInspectorDialog } from "./payload-inspector-dialog";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

interface SyncLogsTableProps {
  logs: IntegrationSyncLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function SyncLogsTable({ logs, isLoading, onRefresh }: SyncLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<IntegrationSyncLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInspect = (log: IntegrationSyncLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Live Audit Trail & Payload Inspector
            </CardTitle>
            <CardDescription className="text-xs">
              Riwayat pengiriman dan penerimaan data antar sistem beserta status HTTP dan latency
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              Belum ada data integrasi yang dieksekusi. Coba klik salah satu tombol sinkronisasi di atas!
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-[100px]">Waktu</TableHead>
                    <TableHead>Konektor</TableHead>
                    <TableHead>Operasi & Arah</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Records</TableHead>
                    <TableHead className="text-center">Latency</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isSuccess = log.status === "SUCCESS";
                    return (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="font-mono text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">{log.connectorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {log.direction === "OUTBOUND" ? (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-blue-600">
                                <ArrowUpRight className="size-2.5 mr-0.5" /> Outbound
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-purple-600">
                                <ArrowDownLeft className="size-2.5 mr-0.5" /> Inbound
                              </Badge>
                            )}
                            <span className="truncate max-w-[200px]">{log.operation}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              isSuccess
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                                : "bg-rose-50 text-rose-700 border-rose-300 text-[10px]"
                            }
                          >
                            HTTP {log.httpStatusCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {log.recordsCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {log.durationMs} ms
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary hover:bg-primary/10"
                            onClick={() => handleInspect(log)}
                          >
                            <Eye className="size-3.5 mr-1" />
                            Inspect JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PayloadInspectorDialog
        log={selectedLog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
