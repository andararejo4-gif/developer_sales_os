const AUTH_STORAGE_KEY = 'devos_auth_session_v1';
export const REMOTE_STATE_HYDRATED_EVENT = 'devos:remote-state-hydrated';

function getAuthToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return typeof parsed?.token === 'string' && parsed.token.trim() ? parsed.token.trim() : null;
  } catch {
    return null;
  }
}

export async function fetchRemoteState<T>(
  key: string,
  projectId = '__global__'
): Promise<T | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  const token = getAuthToken();
  if (!token) return null;
  try {
    const params = new URLSearchParams({ key, projectId });
    const res = await fetch(`/api/state?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; payload?: T | null };
    if (!data?.ok || data.payload === undefined || data.payload === null) return null;
    return data.payload;
  } catch {
    return null;
  }
}

export async function saveRemoteState<T>(
  key: string,
  payload: T,
  projectId = '__global__'
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  const token = getAuthToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/state', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, projectId, payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hydrateAllRemoteState(
  projectId = '__global__'
): Promise<Record<string, unknown>> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return {};
  const token = getAuthToken();
  if (!token) return {};
  try {
    const params = new URLSearchParams({ projectId });
    const res = await fetch(`/api/state?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { ok?: boolean; items?: Record<string, unknown> };
    if (!data?.ok || !data.items || typeof data.items !== 'object') return {};

    if (window.localStorage) {
      for (const [k, v] of Object.entries(data.items)) {
        if (!k || k === AUTH_STORAGE_KEY || v === undefined) continue;
        try {
          window.localStorage.setItem(k, typeof v === 'string' && k.startsWith('devos_hook_cooldown_') ? v : JSON.stringify(v));
        } catch {
          /* abaikan quota */
        }
      }
    }
    window.dispatchEvent(new CustomEvent(REMOTE_STATE_HYDRATED_EVENT, { detail: data.items }));
    return data.items;
  } catch {
    return {};
  }
}
