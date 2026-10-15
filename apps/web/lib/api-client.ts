export interface DefaultDtoResponse<T> {
  status: string;
  data: T[];
  message: Record<string, unknown>;
  total: number;
}

export interface DefaultDtoPagingParams {
  offset?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<DefaultDtoResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      (typeof errorData.message?.error === "string" && errorData.message.error) ||
      (typeof errorData.title === "string" && errorData.title) ||
      `HTTP Error ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export const fetcher = <T>(url: string) => apiClient<T>(url);
