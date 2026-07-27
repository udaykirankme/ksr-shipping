import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api-url';

export async function getServerCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

export async function serverApiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(getApiUrl(path), {
      ...init,
      headers: {
        ...init?.headers,
        Cookie: await getServerCookieHeader(),
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data && typeof data === 'object' && 'success' in data) {
      return data.success ? data.data : null;
    }

    return data;
  } catch {
    return null;
  }
}
