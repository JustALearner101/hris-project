import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import type { DocumentItem } from "../types/document";

export function useDocuments() {
  const endpoint = "/api/v1/Document";

  const { data, mutate, isLoading, error } = useSWR<DefaultDtoResponse<DocumentItem>>(
    endpoint,
    fetcher
  );

  async function createDocument(payload: Partial<DocumentItem>) {
    const res = await apiClient<DocumentItem>("/api/v1/Document", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function deleteDocument(id: string) {
    const res = await apiClient<DocumentItem>(`/api/v1/Document/${id}`, {
      method: "DELETE",
    });
    await mutate();
    return res;
  }

  return {
    documents: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
    createDocument,
    deleteDocument,
  };
}
