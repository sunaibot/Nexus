let API_BASE_URL = '/api'

export function setApiBaseUrl(url: string): void {
  API_BASE_URL = url
}

export interface RequestOptions extends RequestInit {
  requireAuth?: boolean
  timeout?: number
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

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

// 拦截器类型
type RequestInterceptor = (config: RequestOptions & { endpoint: string }) => RequestOptions & { endpoint: string }
type ResponseInterceptor = <T>(response: T) => T
type ErrorInterceptor = (error: Error) => void

class ApiClient {
  private baseUrl: string
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor)
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor)
      if (index > -1) this.requestInterceptors.splice(index, 1)
    }
  }

  // 添加响应拦截器
  addResponseInterceptor<T>(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor as ResponseInterceptor)
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor as ResponseInterceptor)
      if (index > -1) this.responseInterceptors.splice(index, 1)
    }
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor)
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor)
      if (index > -1) this.errorInterceptors.splice(index, 1)
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let config: RequestOptions & { endpoint: string } = { endpoint, ...options }

    // 应用请求拦截器
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config)
    }

    const url = `${this.baseUrl}${config.endpoint}`
    const { requireAuth = false, timeout = 30000, ...fetchOptions } = config

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    }

    if (requireAuth) {
      const token = getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    // 创建 AbortController 用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // 处理后端返回的错误格式: { error: { code, message, details } } 或 { error: string }
        let errorMessage: string
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        } else {
          errorMessage = `HTTP ${response.status}`
        }
        throw new ApiError(
          response.status,
          errorMessage,
          errorData
        )
      }

      if (response.status === 204) {
        return {} as T
      }

      let data = await response.json()

      // 应用响应拦截器
      for (const interceptor of this.responseInterceptors) {
        data = interceptor(data)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      // 处理超时
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new NetworkError('请求超时，请稍后重试')
        this.errorInterceptors.forEach(fn => fn(timeoutError))
        throw timeoutError
      }

      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new NetworkError('网络连接失败，请检查网络设置')
        this.errorInterceptors.forEach(fn => fn(networkError))
        throw networkError
      }

      // 应用错误拦截器
      if (error instanceof Error) {
        this.errorInterceptors.forEach(fn => fn(error))
      }

      throw error
    }
  }
}

// 全局 API 客户端实例
export const apiClient = new ApiClient(API_BASE_URL)

// 注册全局错误处理
apiClient.addErrorInterceptor((error) => {
  if (error instanceof ApiError && error.status === 401) {
    // 清除登录状态
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 可以在这里触发全局事件或重定向
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'unauthorized' } }))
    }
  }
})

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      return parsed.id || null
    } catch {
      return null
    }
  }
  return null
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { requireAuth = false, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
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
    // 处理后端返回的错误格式: { error: { code, message, details } } 或 { error: string }
    let errorMessage: string
    if (typeof errorData.error === 'string') {
      errorMessage = errorData.error
    } else if (errorData.error?.message) {
      errorMessage = errorData.error.message
    } else if (typeof errorData.message === 'string') {
      errorMessage = errorData.message
    } else {
      errorMessage = `HTTP ${response.status}`
    }
    throw new ApiError(
      response.status,
      errorMessage,
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
