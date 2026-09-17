const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiFailure {
  success: false;
  error: { message: string; details?: unknown };
}

/**
 * Wrapper fetch tipis ke apps/api. Selalu kirim cookie sesi admin (credentials: 'include')
 * dan lempar ApiError yang konsisten supaya komponen tidak perlu urus parsing response
 * sukses/gagal berulang-ulang.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  let body: ApiSuccess<T> | ApiFailure | null = null;
  try {
    body = await res.json();
  } catch {
    // response tanpa body (jarang terjadi di API ini, tapi jangan sampai throw parsing error membingungkan)
  }

  if (!res.ok || !body || body.success === false) {
    const message = body && !body.success ? body.error.message : `Permintaan gagal (${res.status})`;
    const details = body && !body.success ? body.error.details : undefined;
    throw new ApiError(res.status, message, details);
  }

  return body.data;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
  });
}

export function apiPut<T>(path: string, data?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}
