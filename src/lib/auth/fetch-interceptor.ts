import type { AuthSession } from './dummy-accounts';
import { AUTH_STORAGE_KEY } from './dummy-accounts';

let installed = false;

export function installAuthFetchInterceptor(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!urlStr.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as AuthSession;
        if (session?.token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${session.token}`);
        }
      }
    } catch {
      /* abaikan error storage */
    }

    return originalFetch(input, {
      ...init,
      credentials: init?.credentials || 'include',
      headers,
    }).then((res) => {
      if (
        res.status === 401 &&
        !urlStr.startsWith('/api/auth/') &&
        !urlStr.startsWith('/api/public/')
      ) {
        try {
          if (localStorage.getItem(AUTH_STORAGE_KEY)) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            window.location.reload();
          }
        } catch {
          /* abaikan */
        }
      }
      return res;
    });
  };
}
