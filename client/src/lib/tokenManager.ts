let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  refreshAttempts = 0;
}

export function clearAccessToken(): void {
  accessToken = null;
  refreshAttempts = 0;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    console.warn('[TokenManager] Max refresh attempts reached, clearing token');
    clearAccessToken();
    return null;
  }

  isRefreshing = true;
  refreshAttempts++;

  refreshPromise = (async () => {
    try {
      console.log('[TokenManager] Refreshing access token, attempt:', refreshAttempts);
      
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[TokenManager] Refresh failed:', response.status, errorData.code);
        
        if (response.status === 401) {
          clearAccessToken();
          return null;
        }
        
        throw new Error(errorData.code || 'REFRESH_FAILED');
      }

      const data = await response.json();
      accessToken = data.accessToken;
      refreshAttempts = 0;
      console.log('[TokenManager] Token refreshed successfully');
      
      return data.accessToken;
    } catch (error) {
      console.error('[TokenManager] Refresh error:', error);
      clearAccessToken();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function initializeAuth(): Promise<boolean> {
  try {
    console.log('[TokenManager] Initializing auth...');
    const token = await refreshAccessToken();
    const success = token !== null;
    console.log('[TokenManager] Auth initialized:', success ? 'authenticated' : 'not authenticated');
    return success;
  } catch (error) {
    console.error('[TokenManager] Init auth error:', error);
    return false;
  }
}

export function isAuthenticated(): boolean {
  return accessToken !== null;
}
