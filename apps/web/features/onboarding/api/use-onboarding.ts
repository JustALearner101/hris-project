import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import type { Process } from "../types/onboarding";

export function useProcesses() {
  const endpoint = "/api/v1/Onboarding";

  const { data, mutate, isLoading, error } = useSWR<DefaultDtoResponse<Process>>(
    endpoint,
    fetcher
  );

  async function createProcess(payload: Partial<Process>) {
    const res = await apiClient<Process>("/api/v1/Onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function updateProcess(id: string, payload: Partial<Process>) {
    const res = await apiClient<Process>(`/api/v1/Onboarding/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function deleteProcess(id: string) {
    const res = await apiClient<Process>(`/api/v1/Onboarding/${id}`, {
      method: "DELETE",
    });
    await mutate();
    return res;
  }

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
    createProcess,
    updateProcess,
    deleteProcess,
  };
}
