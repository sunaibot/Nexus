// API 基础地址 - 使用环境变量验证
import { getApiBase } from './env'
const API_BASE = getApiBase()

import type { Bookmark, Category } from '../types/bookmark'
import { ApiError, NetworkError, getHttpErrorMessage } from './error-handling'
import { STORAGE_KEYS } from './storage-keys'

// ========== API 类型定义 ==========

// 创建书签请求参数
export interface CreateBookmarkParams {
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string[]  // 统一使用数组类型
  isReadLater?: boolean
}

// 更新书签请求参数
export interface UpdateBookmarkParams {
  url?: string
  internalUrl?: string
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string[]
  isPinned?: boolean
  isReadLater?: boolean
  isRead?: boolean
  orderIndex?: number
}

// 创建分类请求参数
export interface CreateCategoryParams {
  name: string
  icon?: string
  color: string
}

// 更新分类请求参数
export interface UpdateCategoryParams {
  name?: string
  icon?: string
  color?: string
  orderIndex?: number
}

// 元数据响应
export interface MetadataResponse {
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  error?: string
}

// 登录响应
export interface LoginResponse {
  success: boolean
  token: string
  user: { id: string; username: string }
  requirePasswordChange?: boolean
}

// 通用成功响应
export interface SuccessResponse {
  success: boolean
  message?: string
}

// 验证响应
export interface VerifyResponse {
  valid: boolean
  user: { id: string; username: string }
}

// 重排序项
export interface ReorderItem {
  id: string
  orderIndex: number
}

// ========== 请求工具函数 ==========

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
  timeout?: number
}

// 获取存储的 Token
function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN)
}

// 统一请求处理
export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = false, timeout = 30000, ...fetchOptions } = options
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  
  // 需要认证时添加 Token
  if (requireAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    
    // 处理无内容响应
    if (res.status === 204) {
      return undefined as T
    }
    
    // 尝试解析 JSON
    let data: Record<string, unknown> | undefined
    try {
      data = await res.json()
    } catch {
      // 如果无法解析 JSON，继续处理
    }
    
    if (!res.ok) {
      // 401 未授权 - 清除登录状态
      if (res.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.AUTH.IS_AUTHENTICATED)
        localStorage.removeItem(STORAGE_KEYS.AUTH.LOGIN_TIME)
        localStorage.removeItem(STORAGE_KEYS.AUTH.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.AUTH.USERNAME)
        localStorage.removeItem(STORAGE_KEYS.AUTH.REQUIRE_PASSWORD_CHANGE)
      }
      
      // 构建 ApiError
      const message = (data?.error as string) || (data?.message as string) || getHttpErrorMessage(res.status)
      const details = data?.details as Array<{ field: string; message: string }> | undefined
      throw new ApiError(message, res.status, details)
    }
    
    // 后端返回格式是 { success: true, data: ... }，这里提取 data 字段
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return (data as { success: boolean; data: T }).data
    }
    
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    
    // 处理 AbortError（超时）
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', 408)
    }
    
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('网络连接失败，请检查网络设置')
    }
    
    // 重新抛出 ApiError
    if (error instanceof ApiError) {
      throw error
    }
    
    // 其他错误
    throw new NetworkError('请求失败，请稍后重试')
  }
}

// ========== 书签 API ==========

export async function fetchBookmarks(): Promise<Bookmark[]> {
  return request<Bookmark[]>('/api/v2/bookmarks')
}

// 获取公共书签（无需登录）
export async function fetchPublicBookmarks(): Promise<Bookmark[]> {
  return request<Bookmark[]>('/api/v2/bookmarks/public')
}

// 分页查询参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  isPinned?: boolean
  isReadLater?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex'
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// 分页获取书签
export async function fetchBookmarksPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Bookmark>> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.category) searchParams.set('category', params.category)
  if (typeof params.isPinned === 'boolean') searchParams.set('isPinned', params.isPinned.toString())
  if (typeof params.isReadLater === 'boolean') searchParams.set('isReadLater', params.isReadLater.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  
  const queryString = searchParams.toString()
  const endpoint = `/api/v2/bookmarks/paginated${queryString ? `?${queryString}` : ''}`
  
  return request<PaginatedResponse<Bookmark>>(endpoint)
}

export async function createBookmark(data: CreateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>('/api/v2/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBookmark(id: string, data: UpdateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>(`/api/v2/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  return request<void>(`/api/v2/bookmarks/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderBookmarks(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/bookmarks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

// ========== 分类 API ==========

export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/api/v2/categories')
}

// 获取公共分类（无需登录）
export async function fetchPublicCategories(): Promise<Category[]> {
  return request<Category[]>('/api/v2/categories/public')
}

export async function createCategory(data: CreateCategoryParams): Promise<Category> {
  return request<Category>('/api/v2/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCategory(id: string, data: UpdateCategoryParams): Promise<Category> {
  return request<Category>(`/api/v2/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/api/v2/categories/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderCategories(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/categories/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

// ========== 元数据 API ==========

export async function fetchMetadata(url: string, lang?: string): Promise<MetadataResponse> {
  return request<MetadataResponse>('/api/v2/metadata', {
    method: 'POST',
    body: JSON.stringify({ url, lang }),
  })
}

// 兼容旧导入名称
export const metadataApi = {
  parse: fetchMetadata,
} as const

// ========== 演示模式判断 ==========

/** 判断当前是否为演示模式（通过 118.145.185.221 访问） */
export function isDemoMode(): boolean {
  return window.location.hostname === '118.145.185.221'
}

// ========== 管理员 API ==========

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>('/api/v2/users/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  
  // 保存登录状态
  if (data.success && data.token) {
    localStorage.setItem(STORAGE_KEYS.AUTH.IS_AUTHENTICATED, 'true')
    localStorage.setItem(STORAGE_KEYS.AUTH.LOGIN_TIME, Date.now().toString())
    localStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, data.token)
    localStorage.setItem(STORAGE_KEYS.AUTH.USERNAME, data.user.username)
    // 保存是否需要修改密码的状态（演示模式下跳过强制改密）
    if (data.requirePasswordChange && !isDemoMode()) {
      localStorage.setItem(STORAGE_KEYS.AUTH.REQUIRE_PASSWORD_CHANGE, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH.REQUIRE_PASSWORD_CHANGE)
    }
  }
  
  return data
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    requireAuth: true,
  })
}

// 验证 Token 有效性
export async function adminVerify(): Promise<VerifyResponse> {
  return request<VerifyResponse>('/api/v2/users/verify', {
    requireAuth: true,
  })
}

// 退出登录
export async function adminLogout(): Promise<void> {
  try {
    await request<SuccessResponse>('/api/v2/users/logout', {
      method: 'POST',
      requireAuth: true,
    })
  } finally {
    clearAuthStatus()
  }
}

// 认证状态响应类型
export interface AuthStatus {
  isValid: boolean
  username: string | null
  requirePasswordChange?: boolean
}

// 从 Cookie 获取值
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// 验证登录状态（同时检查 localStorage 和 Cookie，支持前后台共享）
export function checkAuthStatus(): AuthStatus {
  // 优先从 localStorage 读取
  let authenticated = localStorage.getItem(STORAGE_KEYS.AUTH.IS_AUTHENTICATED)
  let loginTime = localStorage.getItem(STORAGE_KEYS.AUTH.LOGIN_TIME)
  let username = localStorage.getItem(STORAGE_KEYS.AUTH.USERNAME)
  let token = localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN)
  const requirePasswordChange = localStorage.getItem(STORAGE_KEYS.AUTH.REQUIRE_PASSWORD_CHANGE) === 'true'
  
  // 如果 localStorage 没有，尝试从 Cookie 读取（用于前后台共享登录状态）
  if (!authenticated) {
    authenticated = getCookie('admin_authenticated')
    loginTime = getCookie('admin_login_time')
    username = getCookie('admin_username')
    token = getCookie('admin_token')
    
    // 如果 Cookie 中有数据，同步到 localStorage
    if (authenticated === 'true' && loginTime && username && token) {
      localStorage.setItem(STORAGE_KEYS.AUTH.IS_AUTHENTICATED, authenticated)
      localStorage.setItem(STORAGE_KEYS.AUTH.LOGIN_TIME, loginTime)
      localStorage.setItem(STORAGE_KEYS.AUTH.USERNAME, username)
      localStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, token)
    }
  }
  
  if (authenticated === 'true' && loginTime) {
    // 登录有效期 24 小时
    const isValid = Date.now() - parseInt(loginTime) < 24 * 60 * 60 * 1000
    if (isValid) {
      return { isValid: true, username, requirePasswordChange }
    }
  }
  
  // 已过期，清除登录状态
  clearAuthStatus()
  return { isValid: false, username: null }
}

// 清除登录状态
export function clearAuthStatus(): void {
  // 清除 localStorage
  localStorage.removeItem(STORAGE_KEYS.AUTH.IS_AUTHENTICATED)
  localStorage.removeItem(STORAGE_KEYS.AUTH.LOGIN_TIME)
  localStorage.removeItem(STORAGE_KEYS.AUTH.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.AUTH.USERNAME)
  localStorage.removeItem(STORAGE_KEYS.AUTH.REQUIRE_PASSWORD_CHANGE)
  
  // 同时清除 Cookie
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'
  // 设置 domain 为 localhost 以支持跨端口清除
  const domain = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
  document.cookie = `admin_authenticated=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`
  document.cookie = `admin_username=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`
  document.cookie = `admin_token=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`
  document.cookie = `admin_login_time=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`
}

// 清除密码变更标志
export function clearPasswordChangeFlag(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH.REQUIRE_PASSWORD_CHANGE)
}

// ========== 站点设置 API ==========

// 仪表显示配置
export interface WidgetVisibility {
  systemMonitor?: boolean      // 系统监控仪表
  hardwareIdentity?: boolean   // 硬件信息卡片
  vitalSigns?: boolean         // 生命体征卡片
  networkTelemetry?: boolean   // 网络遥测卡片
  processMatrix?: boolean      // 进程矩阵卡片
  dockMiniMonitor?: boolean    // Dock 迷你监控
  mobileTicker?: boolean       // 移动端状态栏
}

// 菜单项可见性配置
export interface MenuVisibility {
  languageToggle?: boolean  // 多语言切换开关
  themeToggle?: boolean     // 日间/夜间模式切换开关
}

// 壁纸设置
export interface WallpaperSettings {
  enabled?: boolean         // 是否启用壁纸
  source?: 'upload' | 'url' | 'unsplash' | 'picsum' | 'pexels'  // 壁纸来源
  imageData?: string        // 上传的图片 data URL
  imageUrl?: string         // 外部图片 URL
  blur?: number             // 模糊度 0-20
  overlay?: number          // 遮罩透明度 0-100
}

// 主题颜色配置
export interface ThemeColors {
  iconPrimary?: string      // 主图标颜色
  iconSecondary?: string    // 次图标颜色
  iconMuted?: string        // 淡化图标颜色
  buttonPrimaryBg?: string      // 主按钮背景
  buttonPrimaryText?: string    // 主按钮文字
  buttonSecondaryBg?: string    // 次按钮背景
  buttonSecondaryText?: string  // 次按钮文字
}

export interface SiteSettings {
  siteTitle?: string
  siteFavicon?: string
  siteDescription?: string  // 站点描述
  enableBeamAnimation?: boolean
  enableLiteMode?: boolean // 精简模式开关 - 禅 (Zen)
  enableWeather?: boolean  // 天气显示开关
  enableLunar?: boolean    // 农历显示开关
  footerText?: string      // 底部备案信息
  widgetVisibility?: WidgetVisibility
  menuVisibility?: MenuVisibility  // 菜单项可见性配置
  wallpaper?: WallpaperSettings    // 壁纸设置
  themeId?: string         // 当前主题ID
  themeMode?: 'light' | 'dark' | 'auto'  // 主题模式
  themeColors?: ThemeColors  // 主题颜色配置
  networkEnv?: NetworkEnvConfig  // 网络环境配置
}

export interface NetworkEnvConfig {
  internalSuffixes: string[]  // 内网域名后缀
  internalIPs: string[]       // 内网IP段
  localhostNames: string[]    // localhost别名
}

// 默认站点设置
const defaultSiteSettings: SiteSettings = {
  siteTitle: 'NOWEN',
  siteFavicon: '',
  enableBeamAnimation: true,
  enableLiteMode: false,
  enableWeather: true,
  enableLunar: true,
  footerText: '',
  widgetVisibility: {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  },
  menuVisibility: {
    languageToggle: true,
    themeToggle: true,
  },
  wallpaper: {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  },
  themeId: 'default',
  themeMode: 'auto',
  themeColors: {
    iconPrimary: '',
    iconSecondary: '',
    iconMuted: '',
    buttonPrimaryBg: '',
    buttonPrimaryText: '',
    buttonSecondaryBg: '',
    buttonSecondaryText: '',
  },
}

// 转换设置值类型（后端存储为字符串）
function parseSettings(raw: Record<string, string>): SiteSettings {
  // 解析 widgetVisibility JSON
  let widgetVisibility: WidgetVisibility = {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  }
  
  if (raw.widgetVisibility) {
    try {
      const parsed = JSON.parse(raw.widgetVisibility)
      widgetVisibility = { ...widgetVisibility, ...parsed }
    } catch (e) {
      // 忽略解析错误，使用默认值
    }
  }

  // 解析 menuVisibility JSON
  let menuVisibility: MenuVisibility = {
    languageToggle: true,
    themeToggle: true,
  }
  
  if (raw.menuVisibility) {
    try {
      const parsed = JSON.parse(raw.menuVisibility)
      menuVisibility = { ...menuVisibility, ...parsed }
    } catch (e) {
      // 忽略解析错误，使用默认值
    }
  }

  // 解析 wallpaper JSON（后端可能返回对象或字符串）
  let wallpaper: WallpaperSettings = {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  }

  if (raw.wallpaper) {
    try {
      if (typeof raw.wallpaper === 'string') {
        const parsed = JSON.parse(raw.wallpaper)
        wallpaper = { ...wallpaper, ...parsed }
      } else if (typeof raw.wallpaper === 'object' && raw.wallpaper !== null) {
        wallpaper = { ...wallpaper, ...(raw.wallpaper as WallpaperSettings) }
      }
    } catch (e) {
      // 忽略解析错误，使用默认值
    }
  }

  // 解析 themeColors JSON（后端可能返回对象或字符串）
  let themeColors: ThemeColors = {
    iconPrimary: '',
    iconSecondary: '',
    iconMuted: '',
    buttonPrimaryBg: '',
    buttonPrimaryText: '',
    buttonSecondaryBg: '',
    buttonSecondaryText: '',
  }

  if (raw.themeColors) {
    try {
      if (typeof raw.themeColors === 'string') {
        const parsed = JSON.parse(raw.themeColors)
        themeColors = { ...themeColors, ...parsed }
      } else if (typeof raw.themeColors === 'object' && raw.themeColors !== null) {
        themeColors = { ...themeColors, ...(raw.themeColors as ThemeColors) }
      }
    } catch (e) {
      // 忽略解析错误，使用默认值
    }
  }

  return {
    siteTitle: raw.siteTitle,
    siteFavicon: raw.siteFavicon,
    // 默认开启光束，默认关闭精简模式
    enableBeamAnimation: raw.enableBeamAnimation === undefined ? true : raw.enableBeamAnimation === 'true' || raw.enableBeamAnimation === '1',
    enableLiteMode: raw.enableLiteMode === 'true' || raw.enableLiteMode === '1',
    // 默认开启天气和农历
    enableWeather: raw.enableWeather === undefined ? true : raw.enableWeather === 'true' || raw.enableWeather === '1',
    enableLunar: raw.enableLunar === undefined ? true : raw.enableLunar === 'true' || raw.enableLunar === '1',
    footerText: raw.footerText || '',
    widgetVisibility,
    menuVisibility,
    wallpaper,
    themeColors,
  }
}

// 获取站点公开设置（无需登录）
export async function fetchPublicSiteSettings(): Promise<Partial<SiteSettings>> {
  const response = await request<{ success: boolean; data: Record<string, unknown> }>('/api/v2/settings/site')
  const data = response.data || response as unknown as Record<string, unknown>
  
  return {
    siteTitle: (data.siteTitle as string) || (data.siteName as string) || 'NOWEN',
    siteFavicon: (data.siteFavicon as string) || '',
    enableBeamAnimation: data.enableBeamAnimation !== false,
    enableLiteMode: data.enableLiteMode === true,
    enableWeather: data.enableWeather !== false,
    enableLunar: data.enableLunar !== false,
    wallpaper: data.wallpaper as WallpaperSettings || {
      enabled: false,
      source: 'upload',
      imageData: '',
      imageUrl: '',
      blur: 0,
      overlay: 30,
    },
  }
}

export async function fetchSettings(): Promise<SiteSettings> {
  // 统一使用站点设置接口获取所有设置（包括壁纸、主题等）
  const response = await request<{ success: boolean; data: Record<string, unknown> }>('/api/v2/settings/site')
  const data = response.data || response as unknown as Record<string, unknown>
  
  // 解析 wallpaper（后端存储为 JSON 字符串）
  let wallpaper = defaultSiteSettings.wallpaper
  if (data.wallpaper) {
    try {
      if (typeof data.wallpaper === 'string') {
        wallpaper = { ...wallpaper, ...JSON.parse(data.wallpaper) }
      } else {
        wallpaper = { ...wallpaper, ...(data.wallpaper as WallpaperSettings) }
      }
    } catch (e) {
      console.error('解析 wallpaper 失败:', e)
    }
  }
  
  // 解析 widgetVisibility
  let widgetVisibility = defaultSiteSettings.widgetVisibility
  if (data.widgetVisibility) {
    try {
      if (typeof data.widgetVisibility === 'string') {
        widgetVisibility = { ...widgetVisibility, ...JSON.parse(data.widgetVisibility) }
      } else {
        widgetVisibility = { ...widgetVisibility, ...(data.widgetVisibility as typeof widgetVisibility) }
      }
    } catch (e) {
      console.error('解析 widgetVisibility 失败:', e)
    }
  }
  
  // 解析 menuVisibility
  let menuVisibility = defaultSiteSettings.menuVisibility
  if (data.menuVisibility) {
    try {
      if (typeof data.menuVisibility === 'string') {
        menuVisibility = { ...menuVisibility, ...JSON.parse(data.menuVisibility) }
      } else {
        menuVisibility = { ...menuVisibility, ...(data.menuVisibility as typeof menuVisibility) }
      }
    } catch (e) {
      console.error('解析 menuVisibility 失败:', e)
    }
  }

  // 解析 themeColors
  let themeColors = defaultSiteSettings.themeColors
  if (data.themeColors) {
    try {
      if (typeof data.themeColors === 'string') {
        themeColors = { ...themeColors, ...JSON.parse(data.themeColors) }
      } else {
        themeColors = { ...themeColors, ...(data.themeColors as typeof themeColors) }
      }
    } catch (e) {
      console.error('解析 themeColors 失败:', e)
    }
  }
  
  return {
    ...defaultSiteSettings,
    siteTitle: (data.siteTitle as string) || (data.siteName as string) || defaultSiteSettings.siteTitle,
    siteFavicon: (data.siteFavicon as string) || '',
    siteDescription: (data.siteDescription as string) || '',
    enableBeamAnimation: data.enableBeamAnimation !== false,
    enableLiteMode: data.enableLiteMode === true,
    enableWeather: data.enableWeather !== false,
    enableLunar: data.enableLunar !== false,
    footerText: (data.footerText as string) || '',
    themeId: (data.themeId as string) || defaultSiteSettings.themeId,
    themeMode: (data.themeMode as 'light' | 'dark' | 'auto') || defaultSiteSettings.themeMode,
    widgetVisibility,
    menuVisibility,
    wallpaper,
    themeColors,
  } as SiteSettings
}

export async function updateSettings(settings: SiteSettings): Promise<SiteSettings> {
  // 转换布尔值为字符串发送
  const payload: Record<string, string | undefined> = {
    siteTitle: settings.siteTitle,
    siteFavicon: settings.siteFavicon,
    enableBeamAnimation: settings.enableBeamAnimation ? 'true' : 'false',
    enableLiteMode: settings.enableLiteMode ? 'true' : 'false',
    enableWeather: settings.enableWeather ? 'true' : 'false',
    enableLunar: settings.enableLunar ? 'true' : 'false',
    footerText: settings.footerText ?? '',
    widgetVisibility: settings.widgetVisibility ? JSON.stringify(settings.widgetVisibility) : undefined,
    menuVisibility: settings.menuVisibility ? JSON.stringify(settings.menuVisibility) : undefined,
    wallpaper: settings.wallpaper ? JSON.stringify(settings.wallpaper) : undefined,
    themeColors: settings.themeColors ? JSON.stringify(settings.themeColors) : undefined,
  }
  const raw = await request<Record<string, string>>('/api/v2/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    requireAuth: true,
  })
  return parseSettings(raw)
}

// ========== API 导出对象 (便于统一使用) ==========

export const bookmarkApi = {
  list: fetchBookmarks,
  listPaginated: fetchBookmarksPaginated,
  create: createBookmark,
  update: updateBookmark,
  delete: deleteBookmark,
  reorder: reorderBookmarks,
}

export const categoryApi = {
  list: fetchCategories,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
  reorder: reorderCategories,
}

export const adminApi = {
  login: adminLogin,
  changePassword: adminChangePassword,
  verify: adminVerify,
  logout: adminLogout,
  checkStatus: checkAuthStatus,
  clearStatus: clearAuthStatus,
  clearPasswordChangeFlag,
}

export const settingsApi = {
  get: fetchSettings,
  update: updateSettings,
}

// ========== 数据导入导出 API ==========

export interface ExportData {
  version: string
  exportedAt: string
  data: {
    bookmarks: Bookmark[]
    categories: Category[]
    settings: SiteSettings
  }
}

export async function exportData(): Promise<ExportData> {
  return request<ExportData>('/api/v2/data/export', {
    requireAuth: true,
  })
}

export async function importData(data: ExportData['data']): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/data/import', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function factoryReset(): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/data/factory-reset', {
    method: 'POST',
    requireAuth: true,
  })
}

export const dataApi = {
  export: exportData,
  import: importData,
  factoryReset,
}

// ========== 名言 API ==========

export interface QuotesData {
  quotes: string[]
  useDefaultQuotes: boolean
}

export interface QuotesUpdateResponse {
  success: boolean
  count: number
}

export async function fetchQuotes(): Promise<QuotesData> {
  return request<QuotesData>('/api/v2/quotes', { requireAuth: true })
}

export async function updateQuotes(quotes: string[], useDefaultQuotes?: boolean): Promise<QuotesUpdateResponse> {
  return request<QuotesUpdateResponse>('/api/v2/quotes', {
    method: 'PUT',
    body: JSON.stringify({ quotes, useDefaultQuotes }),
    requireAuth: true,
  })
}

export const quotesApi = {
  list: fetchQuotes,
  update: updateQuotes,
}

// ========== 访问统计 API ==========

export interface VisitStats {
  totalVisits: number
  todayVisits: number
  weekVisits: number
  monthVisits: number
  totalBookmarks: number
  visitedBookmarks: number
}

export interface TopBookmark {
  id: string
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  visitCount: number
}

export interface VisitTrend {
  date: string
  count: number
}

export interface RecentVisit {
  id: string
  visitedAt: string
  ip?: string
  userAgent?: string
  bookmark: {
    id: string
    url: string
    internalUrl?: string
    title: string
    favicon?: string
    icon?: string
    iconUrl?: string
  }
}

export interface BookmarkVisitStats {
  bookmarkId: string
  visitCount: number
  lastVisited: string | null
  trend: number[]
}

// 获取总体统计概览
export async function fetchVisitStats(): Promise<VisitStats> {
  return request<VisitStats>('/api/v2/visits/stats', { requireAuth: true })
}

// 获取热门书签排行
export async function fetchTopBookmarks(
  limit: number = 10,
  period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<TopBookmark[]> {
  return request<TopBookmark[]>(`/api/v2/visits/top?limit=${limit}&period=${period}`, { requireAuth: true })
}

// 获取访问趋势
export async function fetchVisitTrend(days: number = 7): Promise<VisitTrend[]> {
  return request<VisitTrend[]>(`/api/v2/visits/trend?days=${days}`, { requireAuth: true })
}

// 获取最近访问记录
export async function fetchRecentVisits(limit: number = 20): Promise<RecentVisit[]> {
  return request<RecentVisit[]>(`/api/v2/visits/recent?limit=${limit}`, { requireAuth: true })
}

// 获取单个书签的统计
export async function fetchBookmarkStats(bookmarkId: string): Promise<BookmarkVisitStats> {
  return request<BookmarkVisitStats>(`/api/v2/visits/stats/${bookmarkId}`, { requireAuth: true })
}

// 记录访问（公开接口）
export async function trackVisit(bookmarkId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/v2/visits/track', {
    method: 'POST',
    body: JSON.stringify({ bookmarkId }),
  })
}

// 使用 sendBeacon 记录访问（用于页面关闭时）
export function trackVisitBeacon(bookmarkId: string): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return false
  }
  
  const data = JSON.stringify({ bookmarkId })
  return navigator.sendBeacon(`${API_BASE}/api/v2/visits/track`, new Blob([data], { type: 'application/json' }))
}

// 清除所有访问记录
export async function clearVisits(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/v2/visits/clear', {
    method: 'DELETE',
    requireAuth: true,
  })
}

export const visitsApi = {
  stats: fetchVisitStats,
  top: fetchTopBookmarks,
  trend: fetchVisitTrend,
  recent: fetchRecentVisits,
  bookmarkStats: fetchBookmarkStats,
  track: trackVisit,
  trackBeacon: trackVisitBeacon,
  clear: clearVisits,
}

// ========== 健康检查 API ==========

export interface HealthCheckResult {
  bookmarkId: string
  url: string
  title: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  status: 'ok' | 'error' | 'timeout' | 'redirect'
  statusCode?: number
  responseTime: number
  error?: string
  redirectUrl?: string
}

export interface HealthCheckSummary {
  total: number
  ok: number
  error: number
  timeout: number
  redirect: number
  averageResponseTime: number
}

export interface HealthCheckResponse {
  results: HealthCheckResult[]
  summary: HealthCheckSummary
}

export async function checkBookmarksHealth(bookmarkIds?: string[]): Promise<HealthCheckResponse> {
  return request<HealthCheckResponse>('/api/v2/health-check', {
    method: 'POST',
    body: JSON.stringify({ bookmarkIds }),
    requireAuth: true,
    timeout: 300000, // 5 分钟超时（批量检查耗时）
  })
}

export const healthCheckApi = {
  check: checkBookmarksHealth,
}

// 书签卡片样式 API
export {
  fetchCurrentBookmarkCardStyle,
  styleToCSS,
  getHoverStyle,
  getTitleStyle,
  getDescriptionStyle,
  getIconStyle,
  type BookmarkCardStyle,
} from './api/bookmark-card-styles'

// 重新导出类型供外部使用
export type { Bookmark, Category } from '../types/bookmark'
