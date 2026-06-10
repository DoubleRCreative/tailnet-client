export interface ApiResult<T> {
  data: T | null
  error: string | null
}

export function useApi() {
  async function api<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
    if (body) opts.body = JSON.stringify(body)
    const r = await fetch(path, opts)
    return r.json()
  }

  return { api }
}
