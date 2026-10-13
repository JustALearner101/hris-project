import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import type { Announcement } from "../types/announcement";

export function useAnnouncements() {
  const endpoint = "/api/v1/Announcement";

  const { data, mutate, isLoading, error } = useSWR<DefaultDtoResponse<Announcement>>(
    endpoint,
    fetcher
  );

  async function createAnnouncement(payload: Partial<Announcement>) {
    const res = await apiClient<Announcement>("/api/v1/Announcement", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function updateAnnouncement(id: string, payload: Partial<Announcement>) {
    const res = await apiClient<Announcement>(`/api/v1/Announcement/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function deleteAnnouncement(id: string) {
    const res = await apiClient<Announcement>(`/api/v1/Announcement/${id}`, {
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
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}
