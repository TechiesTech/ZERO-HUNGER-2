const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  });

  const responseText = await response.text();
  let payload: { message?: string } | undefined;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as { message?: string };
    } catch {
      payload = undefined;
    }
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  if (!response.ok) {
    throw new ApiError(
      payload?.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const responseText = await response.text();
    let payload: { message?: string } | undefined;
    if (responseText) {
      try {
        payload = JSON.parse(responseText) as { message?: string };
      } catch {
        payload = undefined;
      }
    }

    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    if (!response.ok) {
      throw new ApiError(
        payload?.message || `Upload failed (${response.status})`,
        response.status
      );
    }

    return payload as T;
  },
};
