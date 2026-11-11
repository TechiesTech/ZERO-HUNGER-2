/**
 * frontend/src/services/apiClient.ts
 * Unified API client for frontend
 */

import { API_URL } from '../config';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const responseText = await res.text();
  let json: { message?: string; errors?: Array<{ field?: string; message?: string }> } = {};
  if (responseText) {
    try {
      json = JSON.parse(responseText);
    } catch {
      if (res.ok) throw new Error('The server returned an invalid response.');
    }
  }
  if (!res.ok) {
    const message = json.message ?? `Request failed (${res.status})`;
    const details = json.errors
      ?.map((item) => [item.field, item.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join('; ');
    throw new ApiError(details ? `${message}: ${details}` : message, res.status);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
