import useSWR from "swr";
import { apiClient, fetcher, DefaultDtoResponse } from "@/lib/api-client";
import { EmployeeDto, EmployeeFormValues } from "../types/employee";

export function useEmployees(offset = 0, limit = 10, search = "") {
  const searchParam = search ? `&Search=${encodeURIComponent(search)}` : "";
  const endpoint = `/api/v1/Employee?Offset=${offset}&Limit=${limit}${searchParam}`;

  const { data, error, isLoading, mutate } = useSWR<DefaultDtoResponse<EmployeeDto>>(
    endpoint,
    fetcher
  );

  async function createEmployee(payload: EmployeeFormValues) {
    const res = await apiClient<EmployeeDto>("/api/v1/Employee", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function updateEmployee(id: number, payload: Partial<EmployeeFormValues>) {
    const res = await apiClient<EmployeeDto>(`/api/v1/Employee/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await mutate();
    return res;
  }

  async function deleteEmployee(id: number) {
    const res = await apiClient<EmployeeDto>(`/api/v1/Employee/${id}`, {
      method: "DELETE",
    });
    await mutate();
    return res;
  }

  return {
    employees: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: error,
    mutate,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
