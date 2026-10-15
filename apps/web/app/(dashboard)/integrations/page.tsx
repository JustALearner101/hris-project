"use client";

import { useIntegrations } from "@/features/integrations/api/use-integrations";
import { ConnectorCard } from "@/features/integrations/components/connector-card";
import { CoupaActionPanel } from "@/features/integrations/components/coupa-action-panel";
import { SyncLogsTable } from "@/features/integrations/components/sync-logs-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Database, Server, Cpu, Info } from "lucide-react";

export default function IntegrationsPage() {
  const {
    connectors,
    logs,
    isLoading,
    syncEmployeesToCoupa,
    pullCoupaExpenses,
    simulateCoupaError,
    mutateLogs,
  } = useIntegrations();

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Cpu className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Enterprise Integration Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Laboratorium interaktif integrasi sistem HRIS dengan ekosistem enterprise (Coupa, SAP S/4HANA, Oracle Cloud)
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-4 text-xs flex items-start gap-3">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-blue-900 dark:text-blue-300">
          <p className="font-semibold">Mode Pembelajaran Aktif (Built-in Mock Simulator)</p>
          <p className="text-blue-800/80 dark:text-blue-400">
            Sistem berjalan dalam mode Enterprise Sandbox Simulator. Kamu dapat bereksperimen mengirim data, menarik data, dan menginspeksi struktur payload asli JSON/XML yang digunakan oleh raksasa enterprise tanpa perlu lisensi berbayar.
          </p>
        </div>
      </div>

      {/* Connector Overview Cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Enterprise Connectors Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connectors.map((connector) => (
            <ConnectorCard key={connector.id} connector={connector} />
          ))}
        </div>
      </div>

      {/* Tab Navigations for Vendor Labs */}
      <Tabs defaultValue="coupa" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[450px]">
          <TabsTrigger value="coupa" className="flex items-center gap-1.5 text-xs">
            <Radio className="size-3.5 text-amber-500" /> Coupa Spend
          </TabsTrigger>
          <TabsTrigger value="sap" className="flex items-center gap-1.5 text-xs">
            <Database className="size-3.5 text-blue-600" /> SAP S/4HANA
          </TabsTrigger>
          <TabsTrigger value="oracle" className="flex items-center gap-1.5 text-xs">
            <Server className="size-3.5 text-red-600" /> Oracle HCM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupa" className="space-y-4">
          <CoupaActionPanel
            onSyncUsers={syncEmployeesToCoupa}
            onPullExpenses={pullCoupaExpenses}
            onSimulateError={simulateCoupaError}
          />
        </TabsContent>

        <TabsContent value="sap" className="space-y-4">
          <div className="p-8 border rounded-lg text-center bg-card text-muted-foreground text-xs space-y-2">
            <Database className="size-8 mx-auto text-blue-600 opacity-60" />
            <p className="font-semibold text-foreground text-sm">Level 2: SAP S/4HANA OData & GL Posting</p>
            <p>Siap dieksplorasi setelah kita menuntaskan fondasi Coupa!</p>
          </div>
        </TabsContent>

        <TabsContent value="oracle" className="space-y-4">
          <div className="p-8 border rounded-lg text-center bg-card text-muted-foreground text-xs space-y-2">
            <Server className="size-8 mx-auto text-red-600 opacity-60" />
            <p className="font-semibold text-foreground text-sm">Level 3: Oracle SCIM 2.0 & HDL Batch Data Loader</p>
            <p>Siap dieksplorasi di tahap berikutnya!</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sync Logs Table */}
      <SyncLogsTable
        logs={logs}
        isLoading={isLoading}
        onRefresh={() => mutateLogs()}
      />
    </div>
  );
}
