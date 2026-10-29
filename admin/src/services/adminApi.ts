/**
 * admin/src/services/adminApi.ts
 * TODO: Implement admin API calls (requires auth header once JWT is added).
 *
 * TODO (auth): Inject Authorization header from stored admin session token.
 * Example:
 *   headers: { Authorization: `Bearer ${getAdminToken()}` }
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const adminApi = {
  get: async <T>(path: string): Promise<T> => {
    // TODO: implement — add auth header
    throw new Error(`GET ${BASE_URL}/admin${path} — not yet implemented`);
  },
  post: async <T>(path: string, _body: unknown): Promise<T> => {
    // TODO: implement — add auth header
    throw new Error(`POST ${BASE_URL}/admin${path} — not yet implemented`);
  },
  patch: async <T>(path: string, _body: unknown): Promise<T> => {
    // TODO: implement — add auth header
    throw new Error(`PATCH ${BASE_URL}/admin${path} — not yet implemented`);
  },
  delete: async <T>(path: string): Promise<T> => {
    // TODO: implement — add auth header
    throw new Error(`DELETE ${BASE_URL}/admin${path} — not yet implemented`);
  },
};
