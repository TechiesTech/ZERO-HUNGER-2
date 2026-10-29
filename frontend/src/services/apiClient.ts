/**
 * frontend/src/services/apiClient.ts
 *
 * TODO: Replace with a real HTTP client (e.g. axios or fetch wrapper)
 * that points at VITE_API_URL from import.meta.env.
 *
 * Example future usage:
 *   import { apiClient } from '@/services/apiClient';
 *   const meals = await apiClient.get('/meals');
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    // TODO: implement
    throw new Error(`GET ${BASE_URL}${path} — not yet implemented`);
  },
  post: async <T>(path: string, _body: unknown): Promise<T> => {
    // TODO: implement
    throw new Error(`POST ${BASE_URL}${path} — not yet implemented`);
  },
};
