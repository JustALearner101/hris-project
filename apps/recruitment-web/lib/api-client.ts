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

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8083";

export const TOKEN_KEY = "hris_ats_token";
export const ROLE_KEY = "hris_ats_role";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromStorage = window.localStorage.getItem(TOKEN_KEY);
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + TOKEN_KEY + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthToken(token: string, role = "HR Admin"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ROLE_KEY, role);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
    token
  )}; path=/; max-age=28800; SameSite=Lax`;
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<DefaultDtoResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      (typeof errorData.message?.error === "string" &&
        errorData.message.error) ||
      (typeof errorData.message?.detail === "string" &&
        errorData.message.detail) ||
      (typeof errorData.title === "string" && errorData.title) ||
      `HTTP Error ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export const fetcher = <T>(url: string) => apiClient<T>(url);

export interface UploadFileOptions {
  headers?: Record<string, string>;
  onProgress?: (percent: number) => void;
}

export function uploadFile<T>(
  endpoint: string,
  formData: FormData,
  options?: UploadFileOptions
): Promise<DefaultDtoResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== "content-type") {
          xhr.setRequestHeader(key, value);
        }
      });
    }

    if (xhr.upload && options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(pct);
        }
      };
    }

    xhr.onload = () => {
      let parsed: DefaultDtoResponse<T> | null = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        parsed = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && parsed) {
        resolve(parsed);
      } else {
        const errMsg =
          (parsed?.message &&
            typeof parsed.message.error === "string" &&
            parsed.message.error) ||
          (parsed?.message &&
            typeof parsed.message.detail === "string" &&
            parsed.message.detail) ||
          `Upload failed with status ${xhr.status}`;
        reject(new Error(errMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading file."));
    };

    xhr.send(formData);
  });
}
