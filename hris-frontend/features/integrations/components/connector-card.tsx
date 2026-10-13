"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegrationConnector } from "../types/integration";
import { Activity, Server, Radio, Database } from "lucide-react";

interface ConnectorCardProps {
  connector: IntegrationConnector;
}

export function ConnectorCard({ connector }: ConnectorCardProps) {
  const getVendorIcon = (id: string) => {
    switch (id) {
      case "coupa-spend":
        return <Radio className="size-5 text-amber-500" />;
      case "sap-s4hana":
        return <Database className="size-5 text-blue-600" />;
      case "oracle-hcm":
        return <Server className="size-5 text-red-600" />;
      default:
        return <Activity className="size-5 text-emerald-500" />;
    }
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted border">
              {getVendorIcon(connector.id)}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{connector.name}</CardTitle>
              <CardDescription className="text-xs">{connector.vendor}</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[11px]"
          >
            ● {connector.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="text-muted-foreground line-clamp-2">{connector.description}</p>
        
        <div className="pt-2 border-t grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-muted-foreground block">Protocol:</span>
            <span className="font-medium">{connector.protocol}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Execution Mode:</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">{connector.mode}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
