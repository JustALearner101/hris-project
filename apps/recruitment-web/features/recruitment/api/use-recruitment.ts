import useSWR from "swr";
import {
  BASE_URL,
  DefaultDtoPagingParams,
  DefaultDtoResponse,
  apiClient,
  fetcher,
} from "@/lib/api-client";
import {
  ApplicationDetailDto,
  ApplicationDto,
  CandidateDto,
  HireApplicationDto,
  JobPostingDto,
  JobPostingFormValues,
  MoveStageDto,
  RejectApplicationDto,
} from "../types/recruitment";

export interface JobPostingsQueryParams extends DefaultDtoPagingParams {
  status?: string;
}

export function useJobPostings(params?: JobPostingsQueryParams) {
  const query = new URLSearchParams();
  if (params?.offset !== undefined) query.set("Offset", String(params.offset));
  if (params?.limit !== undefined) query.set("Limit", String(params.limit));
  if (params?.sort) query.set("Sort", params.sort);
  if (params?.order) query.set("Order", params.order);
  if (params?.search) query.set("Search", params.search);
  if (params?.status && params.status !== "ALL") {
    query.set("status", params.status);
  }

  const qs = query.toString();
  const endpoint = `/api/v1/JobPosting${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<JobPostingDto>
  >(endpoint, fetcher);

  return {
    jobPostings: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export interface ApplicationsQueryParams extends DefaultDtoPagingParams {
  jobPostingId?: number;
  stage?: string;
}

export function useApplications(params?: ApplicationsQueryParams) {
  const query = new URLSearchParams();
  if (params?.jobPostingId !== undefined) {
    query.set("JobPostingId", String(params.jobPostingId));
  }
  if (params?.stage && params.stage !== "ALL") {
    query.set("Stage", params.stage);
  }
  if (params?.offset !== undefined) query.set("Offset", String(params.offset));
  if (params?.limit !== undefined) query.set("Limit", String(params.limit));
  if (params?.search) query.set("Search", params.search);

  const qs = query.toString();
  const endpoint = `/api/v1/Application${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<ApplicationDto>
  >(endpoint, fetcher);

  return {
    applications: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useApplicationDetail(id?: number | null) {
  const endpoint = id ? `/api/v1/Application/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<ApplicationDetailDto>
  >(endpoint, fetcher);

  return {
    application: data?.data?.[0] ?? null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCandidates(params?: DefaultDtoPagingParams) {
  const query = new URLSearchParams();
  if (params?.offset !== undefined) query.set("Offset", String(params.offset));
  if (params?.limit !== undefined) query.set("Limit", String(params.limit));
  if (params?.search) query.set("Search", params.search);

  const qs = query.toString();
  const endpoint = `/api/v1/Candidate${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<
    DefaultDtoResponse<CandidateDto>
  >(endpoint, fetcher);

  return {
    candidates: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createJobPosting(payload: JobPostingFormValues) {
  return apiClient<JobPostingDto>("/api/v1/JobPosting", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateJobPosting(
  id: number,
  payload: Partial<JobPostingFormValues> & { status?: string }
) {
  return apiClient<JobPostingDto>(`/api/v1/JobPosting/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteJobPosting(id: number) {
  return apiClient<JobPostingDto>(`/api/v1/JobPosting/${id}`, {
    method: "DELETE",
  });
}

export async function publishJobPosting(id: number) {
  return apiClient<JobPostingDto>(`/api/v1/JobPosting/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishJobPosting(id: number) {
  return apiClient<JobPostingDto>(`/api/v1/JobPosting/${id}/unpublish`, {
    method: "POST",
  });
}

export async function moveApplicationStage(id: number, dto: MoveStageDto) {
  return apiClient<ApplicationDetailDto>(
    `/api/v1/Application/${id}/move-stage`,
    {
      method: "POST",
      body: JSON.stringify(dto),
    }
  );
}

export async function rejectApplication(
  id: number,
  dto: RejectApplicationDto
) {
  return apiClient<ApplicationDetailDto>(`/api/v1/Application/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function hireApplication(id: number, dto: HireApplicationDto) {
  return apiClient<ApplicationDetailDto>(`/api/v1/Application/${id}/hire`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function getDocumentDownloadUrl(
  applicationId: number,
  documentId: number
): string {
  return `${BASE_URL}/api/v1/Application/${applicationId}/documents/${documentId}`;
}
