let API_BASE_URL = '/api'

export function setApiBaseUrl(url: string): void {
  API_BASE_URL = url
}

export interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  const username = localStorage.getItem('admin_username')
  if (username) {
    return username
  }
  return null
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getCurrentUserRole(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_role')
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { requireAuth = false, ...fetchOptions } = options

  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
  }

  // 只有在有请求体时才设置 Content-Type
  if (fetchOptions.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (requireAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      errorData.error || errorData.message || `HTTP ${response.status}`,
      errorData
    )
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60 * 1000

export async function requestWithCache<T>(
  endpoint: string,
  options: RequestOptions = {},
  cacheKey?: string,
  ttl: number = CACHE_TTL
): Promise<T> {
  const key = cacheKey || endpoint
  const cached = cache.get(key)

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T
  }

  const data = await request<T>(endpoint, options)
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }

  const regex = new RegExp(pattern.replace('*', '.*'))
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
    }
  }
}

export default request
