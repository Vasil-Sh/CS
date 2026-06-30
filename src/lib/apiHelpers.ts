/**
 * Shared API fetch utilities — single source of truth for common patterns.
 * Avoids duplicate fetch+fallback code in 4+ components.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` };
}

/** Fetch user's bets from API. Returns empty array on error. */
export async function fetchBetsFromApi(
  page = 1,
  limit = 500,
): Promise<{ data: unknown[]; meta: { total: number } }> {
  const res = await fetch(`${API_BASE}/bets?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return { data: [], meta: { total: 0 } };
  return res.json();
}

/** Fetch user's goals from API. Returns empty array on error. */
export async function fetchGoalsFromApi(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_BASE}/goals`, { headers: authHeaders() });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

/** Fetch user's strategies from API. Returns empty array on error. */
export async function fetchStrategiesFromApi(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_BASE}/strategies`, { headers: authHeaders() });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

/** Fetch user's telegram groups from API. Returns empty array on error. */
export async function fetchTelegramGroupsFromApi(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_BASE}/telegram-groups`, { headers: authHeaders() });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

/** POST to API. Returns response data or null on error. */
export async function postToApi(path: string, body: unknown): Promise<unknown | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

/** DELETE from API. Returns true on success. */
export async function deleteFromApi(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
