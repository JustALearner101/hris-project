import useSWR from "swr";
import {
  DefaultDtoPagingParams,
  DefaultDtoResponse,
  fetcher,
  uploadFile,
} from "@/lib/api-client";
import {
  ApplicationAcceptedDto,
  ApplicationStatusDto,
  PublicJobDetailDto,
  PublicJobDto,
} from "../types/careers";

export interface PublicJobsQueryParams extends DefaultDtoPagingParams {
  department?: string;
  location?: string;
}

export function usePublicJobs(params?: PublicJobsQueryParams) {
  const query = new URLSearchParams();
  if (params?.offset !== undefined) query.set("Offset", String(params.offset));
  if (params?.limit !== undefined) query.set("Limit", String(params.limit));
  if (params?.sort) query.set("Sort", params.sort);
  if (params?.order) query.set("Order", params.order);
  if (params?.search) query.set("Search", params.search);

  const queryString = query.toString();
  const endpoint = `/api/v1/public/jobs${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<PublicJobDto>
  >(endpoint, fetcher);

  const allItems = data?.data || [];
  const filteredItems = allItems.filter((job) => {
    if (
      params?.department &&
      params.department !== "ALL" &&
      job.department.toLowerCase() !== params.department.toLowerCase()
    ) {
      return false;
    }
    if (
      params?.location &&
      params.location !== "ALL" &&
      job.location.toLowerCase() !== params.location.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  return {
    jobs: filteredItems,
    allJobs: allItems,
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePublicJobBySlug(slug?: string) {
  const endpoint = slug
    ? `/api/v1/public/jobs/${encodeURIComponent(slug)}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<PublicJobDetailDto>
  >(endpoint, fetcher);

  return {
    job: data?.data?.[0] ?? null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useApplicationStatus(token?: string) {
  const endpoint = token
    ? `/api/v1/public/applications/${encodeURIComponent(token)}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<ApplicationStatusDto>
  >(endpoint, fetcher, {
    refreshInterval: (latestData) => {
      const status = latestData?.data?.[0]?.cvParseStatus;
      if (status === "PENDING" || status === "PROCESSING") {
        return 3000;
      }
      return 0;
    },
  });

  return {
    application: data?.data?.[0] ?? null,
    isLoading,
    isError: error,
    mutate,
  };
}

export interface SubmitApplicationRequest {
  jobId: number;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  consentAccepted: boolean;
  cv: File;
  idempotencyKey?: string;
  onProgress?: (percent: number) => void;
}

export async function submitPublicApplication(
  payload: SubmitApplicationRequest
): Promise<DefaultDtoResponse<ApplicationAcceptedDto>> {
  const formData = new FormData();
  formData.append("fullName", payload.fullName);
  formData.append("email", payload.email);
  formData.append("phone", payload.phone);
  if (payload.notes) {
    formData.append("notes", payload.notes);
  }
  formData.append("consentAccepted", String(payload.consentAccepted));
  formData.append("cv", payload.cv);

  const key =
    payload.idempotencyKey ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  return uploadFile<ApplicationAcceptedDto>(
    `/api/v1/public/jobs/${payload.jobId}/applications`,
    formData,
    {
      headers: {
        "Idempotency-Key": key,
      },
      onProgress: payload.onProgress,
    }
  );
}
