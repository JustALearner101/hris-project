import useSWR from "swr";
import { fetcher, DefaultDtoResponse } from "@/lib/api-client";
import type { TimesheetRow } from "../types/attendance";

export function useAttendance(query: string) {
  const endpoint = `/api/v1/Attendance/timesheets?${query}`;

  const { data, mutate, isLoading, error } = useSWR<DefaultDtoResponse<TimesheetRow>>(
    endpoint,
    fetcher
  );

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    meta: {
      page: 1,
      pageSize: 10,
      total: data?.total ?? 0,
    },
    isLoading,
    error,
    mutate,
  };
}
