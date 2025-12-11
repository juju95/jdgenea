export const apiBase = '/api'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const t = getToken()
  if (t) headers.set('Authorization', `Bearer ${t}`)
  const res = await fetch(`${apiBase}${path}`, { ...init, headers })
  
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Session expirée')
  }

  if (!res.ok) throw new Error(await res.text())
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  // @ts-expect-error
  return res.text()
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${apiBase}/login_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function register(payload: { email: string, password: string, firstName: string, lastName: string }): Promise<{ token: string } & { user: any }> {
  return api('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

