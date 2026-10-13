import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import type { Shift } from "../types/shift";

export function useShifts(queryUrl: string) {
  const endpoint = queryUrl.replace("/api/shifts", "/api/v1/Shift");

  const { data, mutate, isLoading, error } = useSWR<DefaultDtoResponse<Shift>>(
    endpoint,
    fetcher
  );

  async function createShift(payload: Partial<Shift>) {
    const res = await apiClient<Shift>("/api/v1/Shift", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function updateShift(id: string, payload: Partial<Shift>) {
    const res = await apiClient<Shift>(`/api/v1/Shift/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function deleteShift(id: string) {
    const res = await apiClient<Shift>(`/api/v1/Shift/${id}`, {
      method: "DELETE",
    });
    await mutate();
    return res;
  }

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    page: 1,
    pageSize: 10,
    isLoading,
    error,
    mutate,
    createShift,
    updateShift,
    deleteShift,
  };
}
