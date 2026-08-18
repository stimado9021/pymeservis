const TOKEN_KEY = 'pymes_token';
const REFRESH_KEY = 'pymes_refresh';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export const apiBase =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(apiBase + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function doFetch(
  path: string,
  options: RequestInit,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(apiBase + path, { ...options, headers });
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let res = await doFetch(path, options, getToken());

  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      res = await doFetch(path, options, fresh);
    } else {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/';
      throw new Error('Sesión expirada');
    }
  }

  if (res.status === 402) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/subscription?blocked=1';
    }
    throw new Error('Suscripción requerida');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.message === 'string'
        ? body.message
        : JSON.stringify(body.message || 'Error de red');
    throw new Error(message);
  }
  return res.json();
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await fetch(apiBase + '/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* ignore */
    }
  }
  clearTokens();
  window.location.href = '/';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; organizationId: string; role: string };
}

const SUPER_TOKEN_KEY = 'pymes_super_token';
const SUPER_REFRESH_KEY = 'pymes_super_refresh';

export function getSuperToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SUPER_TOKEN_KEY);
}

export function setSuperToken(token: string): void {
  localStorage.setItem(SUPER_TOKEN_KEY, token);
}

export function setSuperRefreshToken(token: string): void {
  localStorage.setItem(SUPER_REFRESH_KEY, token);
}

export function clearSuperTokens(): void {
  localStorage.removeItem(SUPER_TOKEN_KEY);
  localStorage.removeItem(SUPER_REFRESH_KEY);
}

let superRefreshing: Promise<string | null> | null = null;

async function superRefreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(SUPER_REFRESH_KEY);
  if (!refreshToken) return null;
  if (superRefreshing) return superRefreshing;
  superRefreshing = (async () => {
    try {
      const res = await fetch(apiBase + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setSuperToken(data.accessToken);
      if (data.refreshToken) setSuperRefreshToken(data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      superRefreshing = null;
    }
  })();
  return superRefreshing;
}

export async function superFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let res = await fetch(apiBase + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
      ...(getSuperToken() ? { Authorization: `Bearer ${getSuperToken()}` } : {}),
    },
  });

  if (res.status === 401) {
    const fresh = await superRefreshAccessToken();
    if (fresh) {
      res = await fetch(apiBase + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${fresh}`,
        },
      });
    } else {
      clearSuperTokens();
      if (typeof window !== 'undefined') window.location.href = '/super/login';
      throw new Error('Sesión expirada');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.message === 'string'
        ? body.message
        : JSON.stringify(body.message || 'Error de red');
    throw new Error(message);
  }
  return res.json();
}

export async function superLogout(): Promise<void> {
  const refreshToken = localStorage.getItem(SUPER_REFRESH_KEY);
  if (refreshToken) {
    try {
      await fetch(apiBase + '/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* ignore */
    }
  }
  clearSuperTokens();
  window.location.href = '/super/login';
}