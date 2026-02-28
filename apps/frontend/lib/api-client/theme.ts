/**
 * 主题 API 客户端
 * 提供主题配置的CRUD操作
 */
import { request } from './client'

// 主题颜色配置
export interface ThemeColors {
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

// 主题布局配置
export interface ThemeLayout {
  maxWidth: string
  padding: string
  gridColumns: number
  gridGap: string
  borderRadius: string
  shadow: string
}

// 主题字体配置
export interface ThemeFont {
  family: string
  headingFamily: string
  baseSize: string
  lineHeight: number
  smallSize?: string
  largeSize?: string
}

// 主题动画配置
export interface ThemeAnimation {
  enabled: boolean
  duration: string
  easing: string
  hoverDuration: string
}

// 主题组件配置
export interface ThemeComponents {
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

// 主题接口
export interface Theme {
  id: string
  name: string
  description?: string
  isDark: boolean
  colors: ThemeColors
  layout: ThemeLayout
  font: ThemeFont
  animation: ThemeAnimation
  components: ThemeComponents
  customCSS?: string
  isSystem: boolean
  isActive: boolean
  createdBy?: string
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  createdAt: string
  updatedAt: string
}

// 用户主题偏好
export interface UserThemePreference {
  themeId: string
  isAutoMode: boolean
  customOverrides?: Record<string, unknown>
}

// 主题列表项（简化版）
export interface ThemeListItem {
  id: string
  name: string
  description?: string
  isDark: boolean
  isSystem: boolean
  visibility: 'public' | 'role' | 'private'
  createdAt: string
}

// 创建主题请求
export interface CreateThemeRequest {
  name: string
  description?: string
  isDark?: boolean
  colors?: Partial<ThemeColors>
  layout?: Partial<ThemeLayout>
  font?: Partial<ThemeFont>
  animation?: Partial<ThemeAnimation>
  components?: Partial<ThemeComponents>
  customCSS?: string
  visibility?: 'public' | 'role' | 'private'
  allowedRoles?: string[]
}

// 更新主题请求
export interface UpdateThemeRequest extends Partial<CreateThemeRequest> {}

// 设置主题偏好请求
export interface SetThemePreferenceRequest {
  themeId: string
  isAutoMode?: boolean
  customOverrides?: Record<string, unknown>
}

/**
 * 获取当前用户的主题
 */
export async function fetchCurrentTheme(): Promise<Theme & { isAutoMode?: boolean; customOverrides?: Record<string, unknown> }> {
  return request<Theme & { isAutoMode?: boolean; customOverrides?: Record<string, unknown> }>('/v2/theme', {
    requireAuth: true,
  })
}

/**
 * 获取所有可访问的主题列表
 */
export async function fetchThemes(): Promise<ThemeListItem[]> {
  const response = await request<{ success: boolean; data: ThemeListItem[] }>('/v2/theme/all', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取特定主题详情
 */
export async function fetchThemeById(id: string): Promise<Theme> {
  const response = await request<{ success: boolean; data: Theme }>(`/v2/theme/${id}`, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 创建新主题
 */
export async function createTheme(data: CreateThemeRequest): Promise<{ id: string; name: string }> {
  const response = await request<{ success: boolean; data: { id: string; name: string }; message: string }>('/v2/theme', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新主题
 */
export async function updateTheme(id: string, data: UpdateThemeRequest): Promise<void> {
  await request<{ success: boolean; message: string }>(`/v2/theme/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除主题
 */
export async function deleteTheme(id: string): Promise<void> {
  await request<{ success: boolean; message: string }>(`/v2/theme/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 设置用户主题偏好
 */
export async function setThemePreference(data: SetThemePreferenceRequest): Promise<void> {
  await request<{ success: boolean; message: string }>('/v2/theme/preference', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 主题 API 对象
 */
export const themeApi = {
  fetchCurrent: fetchCurrentTheme,
  fetchAll: fetchThemes,
  fetchById: fetchThemeById,
  create: createTheme,
  update: updateTheme,
  delete: deleteTheme,
  setPreference: setThemePreference,
}

export default themeApi
