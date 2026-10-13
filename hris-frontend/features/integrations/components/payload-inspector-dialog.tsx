"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationSyncLog } from "../types/integration";
import { Check, Copy, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, AlertCircle } from "lucide-react";

interface PayloadInspectorDialogProps {
  log: IntegrationSyncLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayloadInspectorDialog({
  log,
  open,
  onOpenChange,
}: PayloadInspectorDialogProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!log) return null;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const isSuccess = log.status === "SUCCESS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                isSuccess
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
              }
            >
              HTTP {log.httpStatusCode}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {log.direction === "OUTBOUND" ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <ArrowUpRight className="size-3" /> Outbound (HRIS ➔ Vendor)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-purple-600">
                  <ArrowDownLeft className="size-3" /> Inbound (Vendor ➔ HRIS)
                </span>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="size-3" /> {log.durationMs} ms
            </span>
          </div>
          <DialogTitle className="text-lg font-semibold mt-1">
            {log.operation} - {log.connectorName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{log.endpointUrl}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 p-2.5 rounded-md text-xs border flex items-start gap-2">
          {isSuccess ? (
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="text-muted-foreground">{log.message}</p>
        </div>

        <Tabs defaultValue="request" className="flex-1 flex flex-col min-h-0 mt-2">
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-2 w-56">
              <TabsTrigger value="request">Request Body</TabsTrigger>
              <TabsTrigger value="response">Response Body</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="request" className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="relative flex-1 bg-zinc-950 text-zinc-100 rounded-lg p-3 overflow-auto font-mono text-xs leading-relaxed border border-zinc-800">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => copyToClipboard(log.requestPayload, "request")}
              >
                {copiedTab === "request" ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span className="ml-1 text-[11px]">{copiedTab === "request" ? "Copied" : "Copy"}</span>
              </Button>
              <pre>{log.requestPayload || "// No Request Body (GET / empty)"}</pre>
            </div>
          </TabsContent>

          <TabsContent value="response" className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="relative flex-1 bg-zinc-950 text-zinc-100 rounded-lg p-3 overflow-auto font-mono text-xs leading-relaxed border border-zinc-800">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => copyToClipboard(log.responsePayload, "response")}
              >
                {copiedTab === "response" ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span className="ml-1 text-[11px]">{copiedTab === "response" ? "Copied" : "Copy"}</span>
              </Button>
              <pre>{log.responsePayload || "// No Response Body"}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
