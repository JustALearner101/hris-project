import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import type { Department } from "../types/department";

interface UseDepartmentParams {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useDepartments(params: UseDepartmentParams = {}) {
  const { q, status, page = 1, pageSize = 10 } = params;

  const offset = (page - 1) * pageSize;
  const searchParam = q ? `&Search=${encodeURIComponent(q)}` : "";
  const statusParam = status && status !== "all" ? `&Status=${encodeURIComponent(status)}` : "";

  const endpoint = `/api/v1/Department?Offset=${offset}&Limit=${pageSize}${searchParam}${statusParam}`;

  const { data, mutate, isLoading, error } = useSWR<DefaultDtoResponse<Department>>(
    endpoint,
    fetcher
  );

  async function createDepartment(payload: Partial<Department>) {
    const res = await apiClient<Department>("/api/v1/Department", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function updateDepartment(id: string, payload: Partial<Department>) {
    const res = await apiClient<Department>(`/api/v1/Department/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function deleteDepartment(id: string) {
    const res = await apiClient<Department>(`/api/v1/Department/${id}`, {
      method: "DELETE",
    });
    await mutate();
    return res;
  }

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    isLoading,
    error,
    mutate,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
