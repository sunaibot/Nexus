// API 基础地址 - 使用环境变量验证
import { getApiBase } from './env'
const API_BASE = getApiBase()

import type { Bookmark, Category } from '../types/bookmark'
import { ApiError, NetworkError, getHttpErrorMessage } from './error-handling'

// ========== API 类型定义 ==========

// 创建书签请求参数
export interface CreateBookmarkParams {
  url: string
  internalUrl?: string | null
  title: string
  description?: string | null
  favicon?: string | null
  ogImage?: string | null
  icon?: string | null
  iconUrl?: string | null
  category?: string | null
  tags?: string | null
  notes?: string | null
  isReadLater?: boolean
  visibility?: 'public' | 'personal' | 'private'
}

// 更新书签请求参数
export interface UpdateBookmarkParams {
  url?: string
  internalUrl?: string | null
  title?: string
  description?: string | null
  favicon?: string | null
  ogImage?: string | null
  icon?: string | null
  iconUrl?: string | null
  category?: string | null
  tags?: string | null
  notes?: string | null
  orderIndex?: number
  isPinned?: boolean
  isReadLater?: boolean
  isRead?: boolean
  visibility?: 'public' | 'personal' | 'private'
}

// 创建分类请求参数
export interface CreateCategoryParams {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}

// 更新分类请求参数
export interface UpdateCategoryParams {
  name?: string
  description?: string | null
  icon?: string | null
  color?: string | null
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
  user: { id: string; username: string; role: 'admin' | 'user' }
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
  return localStorage.getItem('admin_token')
}

// 获取 CSRF Token（从内存）
let csrfTokenMemory: string | null = null

function getCsrfToken(): string | null {
  return csrfTokenMemory
}

function setCsrfToken(token: string | null): void {
  csrfTokenMemory = token
}

// 刷新 CSRF Token - 发送 GET 请求获取新的 Token
async function refreshCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      credentials: 'include', // 确保发送和接收 Cookie
    })
    const token = res.headers.get('X-CSRF-Token')
    if (token) {
      setCsrfToken(token)
      console.log('[CSRF] Token refreshed successfully')
      return token
    }
    return null
  } catch (err) {
    console.error('[CSRF] Failed to refresh token:', err)
    return null
  }
}

// 统一请求处理
async function request<T>(
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
  
  // 非 GET 请求添加 CSRF Token
  if (fetchOptions.method && fetchOptions.method !== 'GET') {
    let csrfToken = getCsrfToken()
    
    // 如果没有 CSRF Token，先刷新获取
    if (!csrfToken) {
      console.log(`[CSRF] Token missing, refreshing...`)
      csrfToken = await refreshCsrfToken()
    }
    
    console.log(`[API Debug] ${fetchOptions.method} ${endpoint} - CSRF Token:`, csrfToken ? '存在' : '缺失')
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
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
      credentials: 'include', // 确保发送和接收 Cookie
    })

    clearTimeout(timeoutId)
    
    // 保存 CSRF Token（从响应头）
    const csrfTokenFromHeader = res.headers.get('X-CSRF-Token')
    if (csrfTokenFromHeader) {
      setCsrfToken(csrfTokenFromHeader)
    }
    
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
      console.error(`[API Error] ${fetchOptions.method || 'GET'} ${endpoint} - Status: ${res.status}`, data)
      
      // 401 未授权 - 清除登录状态
      if (res.status === 401) {
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('admin_login_time')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_username')
        localStorage.removeItem('admin_require_password_change')
      }
      
      // 构建 ApiError
      const message = (data?.error as string) || (data?.message as string) || getHttpErrorMessage(res.status)
      const details = data?.details as Array<{ field: string; message: string }> | undefined
      throw new ApiError(message, res.status, details)
    }
    
    // 后端返回格式是 { success: true, data: ... }，这里提取 data 字段
    if (data && data.success === true && 'data' in data) {
      return data.data as T
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
  return request<Bookmark[]>('/api/v2/bookmarks', { requireAuth: true })
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
  
  return request<PaginatedResponse<Bookmark>>(endpoint, { requireAuth: true })
}

export async function createBookmark(data: CreateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>('/api/v2/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function updateBookmark(id: string, data: UpdateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>(`/api/v2/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  return request<void>(`/api/v2/bookmarks/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function reorderBookmarks(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/bookmarks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    requireAuth: true,
  })
}

// ========== 分类 API ==========

export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/api/v2/categories', { requireAuth: true })
}

export async function createCategory(data: CreateCategoryParams): Promise<Category> {
  return request<Category>('/api/v2/categories', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function updateCategory(id: string, data: UpdateCategoryParams): Promise<Category> {
  return request<Category>(`/api/v2/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/api/v2/categories/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function reorderCategories(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/v2/categories/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    requireAuth: true,
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

// 登录专用请求函数（不提取 data 字段，因为需要访问 success 字段）
async function requestRaw<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = false, timeout = 30000, ...fetchOptions } = options
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  
  if (requireAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    
    if (res.status === 204) {
      return undefined as T
    }
    
    let data: Record<string, unknown> | undefined
    try {
      data = await res.json()
    } catch {
    }
    
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('admin_login_time')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_username')
        localStorage.removeItem('admin_require_password_change')
      }
      
      const message = (data?.error as string) || (data?.message as string) || getHttpErrorMessage(res.status)
      const details = data?.details as Array<{ field: string; message: string }> | undefined
      throw new ApiError(message, res.status, details)
    }
    
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', 408)
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('网络连接失败，请检查网络设置')
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new NetworkError('请求失败，请稍后重试')
  }
}

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const data = await requestRaw<LoginResponse>('/api/v2/users/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  
  // 保存登录状态
  if (data.success && data.token) {
    localStorage.setItem('admin_authenticated', 'true')
    localStorage.setItem('admin_login_time', Date.now().toString())
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_username', data.user.username)
    localStorage.setItem('admin_role', data.user.role || 'user')
    // 保存是否需要修改密码的状态（演示模式下跳过强制改密）
    if (data.requirePasswordChange && !isDemoMode()) {
      localStorage.setItem('admin_require_password_change', 'true')
    } else {
      localStorage.removeItem('admin_require_password_change')
    }
    
    // 同时设置 Cookie，用于前后台共享登录状态
    // 设置 Cookie 有效期为 24 小时
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `admin_authenticated=true; expires=${expires}; path=/; SameSite=Lax`
    document.cookie = `admin_username=${encodeURIComponent(data.user.username)}; expires=${expires}; path=/; SameSite=Lax`
    document.cookie = `admin_token=${encodeURIComponent(data.token)}; expires=${expires}; path=/; SameSite=Lax`
    document.cookie = `admin_login_time=${Date.now()}; expires=${expires}; path=/; SameSite=Lax`
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

// 验证登录状态
export function checkAuthStatus(): AuthStatus {
  const authenticated = localStorage.getItem('admin_authenticated')
  const loginTime = localStorage.getItem('admin_login_time')
  const username = localStorage.getItem('admin_username')
  const requirePasswordChange = localStorage.getItem('admin_require_password_change') === 'true'
  
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
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('admin_login_time')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_username')
  localStorage.removeItem('admin_require_password_change')
  
  // 同时清除 Cookie（用于前后台共享登录状态）
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = `admin_authenticated=; expires=${expires}; path=/; SameSite=Lax`
  document.cookie = `admin_username=; expires=${expires}; path=/; SameSite=Lax`
  document.cookie = `admin_token=; expires=${expires}; path=/; SameSite=Lax`
  document.cookie = `admin_login_time=; expires=${expires}; path=/; SameSite=Lax`
}

// 清除密码变更标志
export function clearPasswordChangeFlag(): void {
  localStorage.removeItem('admin_require_password_change')
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
  siteDescription?: string  // 站点描述
  siteFavicon?: string
  enableBeamAnimation?: boolean
  enableLiteMode?: boolean // 精简模式开关 - 禅 (Zen)
  enableWeather?: boolean  // 天气显示开关
  enableLunar?: boolean    // 农历显示开关
  footerText?: string      // 底部备案信息
  footerInfo?: string      // 底部备案信息（别名）
  widgetVisibility?: WidgetVisibility
  menuVisibility?: MenuVisibility  // 菜单项可见性配置
  wallpaper?: WallpaperSettings    // 壁纸设置
  // 主题设置
  themeId?: string         // 当前主题ID
  themeMode?: 'light' | 'dark' | 'auto'  // 主题模式
  themeColors?: ThemeColors  // 主题颜色配置
  // 前端展示用字段映射
  liteMode?: boolean       // 精简模式（映射到 enableLiteMode）
  showWeather?: boolean    // 显示天气（映射到 enableWeather）
  showLunarCalendar?: boolean  // 显示农历（映射到 enableLunar）
  showLanguageSwitcher?: boolean  // 显示语言切换（映射到 menuVisibility.languageToggle）
  showThemeToggle?: boolean       // 显示主题切换（映射到 menuVisibility.themeToggle）
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
    themeId: raw.themeId,
    themeMode: raw.themeMode as 'light' | 'dark' | 'auto' | undefined,
    widgetVisibility,
    menuVisibility,
    wallpaper,
  }
}

export async function fetchSettings(): Promise<SiteSettings> {
  // 获取站点设置（站点级别，所有用户共享）
  const res = await request<{ success: boolean; data: Record<string, any> }>('/api/v2/settings/site', { requireAuth: false })
  return parseSettings(res.data || {})
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
    themeId: settings.themeId,
    themeMode: settings.themeMode,
    widgetVisibility: settings.widgetVisibility ? JSON.stringify(settings.widgetVisibility) : undefined,
    menuVisibility: settings.menuVisibility ? JSON.stringify(settings.menuVisibility) : undefined,
    wallpaper: settings.wallpaper ? JSON.stringify(settings.wallpaper) : undefined,
  }
  // 使用站点设置API（需要管理员权限）
  const res = await request<{ success: boolean; data: Record<string, string> }>('/api/v2/settings/site', {
    method: 'PUT',
    body: JSON.stringify(payload),
    requireAuth: true,
  })
  return parseSettings(res.data || {})
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
  exportedBy: string
  bookmarks: Bookmark[]
  categories: Category[]
  settings: Record<string, any>
  themes: any[]
  quotes: any[]
  tags: any[]
  widgets: any[]
  customMetrics: any[]
  serviceMonitors: any[]
}

export interface ImportResult {
  bookmarks: { imported: number; skipped: number }
  categories: { imported: number; skipped: number }
  themes: { imported: number; skipped: number }
  quotes: { imported: number; skipped: number }
  tags: { imported: number; skipped: number }
  widgets: { imported: number; skipped: number }
  customMetrics: { imported: number; skipped: number }
  serviceMonitors: { imported: number; skipped: number }
}

export interface DataOverview {
  stats: {
    bookmarks: number
    categories: number
    users: number
    themes: number
    customThemes: number
    quotes: number
    tags: number
    widgets: number
    customMetrics: number
    serviceMonitors: number
    visits: number
    auditLogs: number
    fileTransfers: number
  }
  dbSize: string
  lastBackup: string | null
}

export async function exportData(): Promise<ExportData> {
  const response = await request<{ success: boolean; data: ExportData; message: string }>('/api/v2/data/export', {
    requireAuth: true,
  })
  return response.data
}

export async function importData(data: Partial<ExportData>, mode: 'merge' | 'overwrite' | 'skip' = 'merge'): Promise<ImportResult> {
  const response = await request<{ success: boolean; data: ImportResult; message: string }>('/api/v2/data/import', {
    method: 'POST',
    body: JSON.stringify({ data, mode }),
    requireAuth: true,
  })
  return response.data
}

export type FactoryResetMode = 'full' | 'keepUsers' | 'initial'

export async function factoryReset(mode: FactoryResetMode = 'keepUsers'): Promise<{ beforeStats: { bookmarks: number; categories: number; themes: number }; mode: FactoryResetMode }> {
  const response = await request<{ success: boolean; message: string; data: { beforeStats: { bookmarks: number; categories: number; themes: number }; mode: FactoryResetMode } }>('/api/v2/data/factory-reset', {
    method: 'POST',
    body: JSON.stringify({ mode }),
    requireAuth: true,
  })
  return response.data
}

export async function fetchDataOverview(): Promise<DataOverview> {
  const response = await request<{ success: boolean; data: DataOverview }>('/api/v2/data/overview', {
    requireAuth: true,
  })
  return response.data
}

export const dataApi = {
  export: exportData,
  import: importData,
  factoryReset,
}

// ========== 主题 API ==========

export interface Theme {
  id: string
  name: string
  description?: string
  isDark: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    border: string
    muted: string
    card: string
    hover: string
    active: string
  }
  layout: {
    maxWidth: string
    padding: string
    gridColumns: number
    gridGap: string
    borderRadius: string
    shadow: string
  }
  font: {
    family: string
    headingFamily: string
    baseSize: string
    lineHeight: number
    smallSize?: string
    largeSize?: string
  }
  animation: {
    enabled: boolean
    duration: string
    easing: string
    hoverDuration: string
  }
  components: {
    button: {
      borderRadius: string
      padding: string
      fontSize: string
    }
    card: {
      borderRadius: string
      padding: string
      shadow: string
    }
    input: {
      borderRadius: string
      padding: string
      borderWidth: string
    }
  }
  customCSS?: string
  isSystem: boolean
  isActive: boolean
  createdBy?: string
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  createdAt: string
  updatedAt: string
}

export interface ThemePreference {
  themeId: string
  isAutoMode: boolean
  customOverrides?: Record<string, any>
}

export async function fetchThemes(): Promise<Theme[]> {
  const response = await request<{ success: boolean; data: Theme[] }>('/api/v2/theme/all', { requireAuth: true })
  return response.data || []
}

export async function fetchTheme(id: string): Promise<Theme> {
  const response = await request<{ success: boolean; data: Theme }>(`/api/v2/theme/${id}`, { requireAuth: true })
  return response.data
}

export async function fetchCurrentTheme(): Promise<Theme & { isAutoMode?: boolean; customOverrides?: Record<string, any> }> {
  const response = await request<{ success: boolean; data: Theme & { isAutoMode?: boolean; customOverrides?: Record<string, any> } }>('/api/v2/theme', { requireAuth: true })
  return response.data
}

export async function createTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
  const response = await request<{ success: boolean; data: { id: string }; message: string }>('/api/v2/theme', {
    method: 'POST',
    body: JSON.stringify(theme),
    requireAuth: true,
  })
  return response.data
}

export async function updateTheme(id: string, updates: Partial<Theme>): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/v2/theme/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
    requireAuth: true,
  })
}

export async function deleteTheme(id: string): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/v2/theme/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  await request<{ success: boolean; message: string }>('/api/v2/theme/preference', {
    method: 'POST',
    body: JSON.stringify(preference),
    requireAuth: true,
  })
}

export async function setRoleDefaultTheme(role: string, themeId: string): Promise<void> {
  await request<{ success: boolean; message: string }>('/api/v2/theme/role-default', {
    method: 'POST',
    body: JSON.stringify({ role, themeId }),
    requireAuth: true,
  })
}

export const themeApi = {
  list: fetchThemes,
  get: fetchTheme,
  getCurrent: fetchCurrentTheme,
  create: createTheme,
  update: updateTheme,
  delete: deleteTheme,
  setPreference: setThemePreference,
  setRoleDefault: setRoleDefaultTheme,
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

// ========== 私密书签密码保护 API ==========

export async function setPrivateBookmarkPassword(bookmarkId: string, password: string): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/api/bookmarks/${bookmarkId}/password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
    requireAuth: true,
  })
}

export async function verifyPrivateBookmarkPassword(bookmarkId: string, password: string): Promise<{ valid: boolean }> {
  return request<{ valid: boolean }>(`/api/bookmarks/${bookmarkId}/password/verify`, {
    method: 'POST',
    body: JSON.stringify({ password }),
    requireAuth: true,
  })
}

export async function removePrivateBookmarkPassword(bookmarkId: string): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/api/bookmarks/${bookmarkId}/password`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function checkPrivateBookmarkHasPassword(bookmarkId: string): Promise<{ hasPassword: boolean }> {
  return request<{ hasPassword: boolean }>(`/api/bookmarks/${bookmarkId}/password`, {
    requireAuth: true,
  })
}

export async function changeBookmarkVisibility(bookmarkId: string, visibility: 'public' | 'personal' | 'private'): Promise<Bookmark> {
  return request<Bookmark>(`/api/bookmarks/${bookmarkId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
    requireAuth: true,
  })
}

export const privateBookmarkApi = {
  setPassword: setPrivateBookmarkPassword,
  verifyPassword: verifyPrivateBookmarkPassword,
  removePassword: removePrivateBookmarkPassword,
  checkHasPassword: checkPrivateBookmarkHasPassword,
  changeVisibility: changeBookmarkVisibility,
}

// 重新导出类型供外部使用
export type { Bookmark, Category } from '../types/bookmark'
