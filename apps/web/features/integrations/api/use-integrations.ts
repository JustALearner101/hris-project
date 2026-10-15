import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import { IntegrationConnector, IntegrationSyncLog, CoupaExpenseReport } from "../types/integration";

export function useIntegrations() {
  const {
    data: connectorsData,
    error: connectorsError,
    isLoading: isConnectorsLoading,
    mutate: mutateConnectors,
  } = useSWR<DefaultDtoResponse<IntegrationConnector>>("/api/v1/Integration/connectors", fetcher, {
    refreshInterval: 5000,
  });

  const {
    data: logsData,
    error: logsError,
    isLoading: isLogsLoading,
    mutate: mutateLogs,
  } = useSWR<DefaultDtoResponse<IntegrationSyncLog>>("/api/v1/Integration/logs", fetcher, {
    refreshInterval: 3000,
  });

  async function syncEmployeesToCoupa() {
    const res = await apiClient<IntegrationSyncLog>("/api/v1/Integration/coupa/sync-users", {
      method: "POST",
    });
    await Promise.all([mutateConnectors(), mutateLogs()]);
    return res;
  }

  async function pullCoupaExpenses() {
    const res = await apiClient<CoupaExpenseReport>("/api/v1/Integration/coupa/pull-expenses", {
      method: "POST",
    });
    await Promise.all([mutateConnectors(), mutateLogs()]);
    return res;
  }

  async function simulateCoupaError(errorType: "401_UNAUTHORIZED" | "422_VALIDATION") {
    const res = await apiClient<IntegrationSyncLog>(
      `/api/v1/Integration/coupa/simulate-error?errorType=${errorType}`,
      { method: "POST" }
    );
    await Promise.all([mutateConnectors(), mutateLogs()]);
    return res;
  }

  return {
    connectors: connectorsData?.data ?? [],
    logs: logsData?.data ?? [],
    isLoading: isConnectorsLoading || isLogsLoading,
    isError: connectorsError || logsError,
    syncEmployeesToCoupa,
    pullCoupaExpenses,
    simulateCoupaError,
    mutateConnectors,
    mutateLogs,
  };
}
