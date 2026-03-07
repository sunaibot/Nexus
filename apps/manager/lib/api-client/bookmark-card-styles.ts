/**
 * 书签卡片样式配置 API 客户端
 */

import request from './client'

export interface BookmarkCardStyle {
  id: string
  // 基础样式
  backgroundColor: string
  backgroundGradient?: { from: string; to: string; angle: number }
  borderRadius: string
  borderWidth: string
  borderColor: string
  borderStyle: string
  // 阴影效果
  shadowColor: string
  shadowBlur: string
  shadowSpread: string
  shadowX: string
  shadowY: string
  // 间距
  padding: string
  margin: string
  gap: string
  // 尺寸
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  maxWidth?: string
  maxHeight?: string
  // 字体样式
  titleFontSize: string
  titleFontWeight: string
  titleColor: string
  descriptionFontSize: string
  descriptionFontWeight: string
  descriptionColor: string
  // 效果
  opacity: number
  backdropBlur: string
  backdropSaturate: string
  // 悬停效果
  hoverBackgroundColor?: string
  hoverBorderColor?: string
  hoverShadowBlur?: string
  hoverScale: number
  hoverTransition: string
  // 图标样式
  iconSize: string
  iconColor?: string
  iconBackgroundColor?: string
  iconBorderRadius: string
  // 图片样式
  imageHeight: string
  imageBorderRadius: string
  imageObjectFit: string
  // 标签样式
  tagBackgroundColor: string
  tagTextColor?: string
  tagBorderRadius: string
  tagFontSize: string
  // 图标透明度
  iconOpacity: number
  // 圆形卡片样式
  isCircular: boolean
  circleSize: string
  circleBackgroundColor?: string
  circleBorderWidth: string
  circleBorderColor?: string
  // 布局配置
  layoutType: 'standard' | 'icon-top' | 'icon-bottom' | 'icon-bg'
  iconPosition: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'background'
  showTitle: boolean
  showDescription: boolean
  textAlign: 'left' | 'center' | 'right'
  // 配置范围
  scope: 'global' | 'role' | 'user'
  userId?: string
  role?: string
  // 元数据
  priority: number
  isEnabled: boolean
  isDefault: boolean
  name?: string
  description?: string
  previewImage?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkCardStyleData {
  // 基础样式
  backgroundColor: string
  backgroundGradient?: { from: string; to: string; angle: number }
  borderRadius: string
  borderWidth: string
  borderColor: string
  borderStyle: string
  // 阴影效果
  shadowColor: string
  shadowBlur: string
  shadowSpread: string
  shadowX: string
  shadowY: string
  // 间距
  padding: string
  margin: string
  gap: string
  // 尺寸
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  maxWidth?: string
  maxHeight?: string
  // 字体样式
  titleFontSize: string
  titleFontWeight: string
  titleColor: string
  descriptionFontSize: string
  descriptionFontWeight: string
  descriptionColor: string
  // 效果
  opacity: number
  backdropBlur: string
  backdropSaturate: string
  // 悬停效果
  hoverBackgroundColor?: string
  hoverBorderColor?: string
  hoverShadowBlur?: string
  hoverScale: number
  hoverTransition: string
  // 图标样式
  iconSize: string
  iconColor?: string
  iconBackgroundColor?: string
  iconBorderRadius: string
  iconOpacity: number
  // 圆形卡片样式
  isCircular: boolean
  circleSize: string
  circleBackgroundColor?: string
  circleBorderWidth: string
  circleBorderColor?: string
  // 布局配置
  layoutType: 'standard' | 'icon-top' | 'icon-bottom' | 'icon-bg'
  iconPosition: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'background'
  showTitle: boolean
  showDescription: boolean
  textAlign: 'left' | 'center' | 'right'
  // 图片样式
  imageHeight: string
  imageBorderRadius: string
  imageObjectFit: string
  // 标签样式
  tagBackgroundColor: string
  tagTextColor?: string
  tagBorderRadius: string
  tagFontSize: string
  // 配置范围
  scope: 'global' | 'role' | 'user'
  userId?: string
  role?: string
  // 元数据
  priority: number
  isEnabled: boolean
  isDefault: boolean
  name?: string
  description?: string
  previewImage?: string
}

export interface UpdateBookmarkCardStyleData extends Partial<CreateBookmarkCardStyleData> {}

// 响应类型
interface ListResponse {
  success: boolean
  data: BookmarkCardStyle[]
}

interface SingleResponse {
  success: boolean
  data: BookmarkCardStyle
}

interface SuccessResponse {
  success: boolean
}

/**
 * 获取所有样式配置
 */
export async function fetchBookmarkCardStyles(
  params?: { scope?: string; userId?: string; role?: string }
): Promise<BookmarkCardStyle[]> {
  const queryParams = new URLSearchParams()
  if (params?.scope) queryParams.append('scope', params.scope)
  if (params?.userId) queryParams.append('userId', params.userId)
  if (params?.role) queryParams.append('role', params.role)

  const query = queryParams.toString()
  const endpoint = `/v2/bookmark-card-styles${query ? `?${query}` : ''}`

  const response = await request<ListResponse>(endpoint, { method: 'GET', requireAuth: true })
  return response.data || []
}

/**
 * 获取单个样式配置
 */
export async function fetchBookmarkCardStyle(id: string): Promise<BookmarkCardStyle> {
  const response = await request<SingleResponse>(`/v2/bookmark-card-styles/${id}`, { method: 'GET', requireAuth: true })
  return response.data
}

/**
 * 创建样式配置
 */
export async function createBookmarkCardStyle(
  data: CreateBookmarkCardStyleData
): Promise<BookmarkCardStyle> {
  const response = await request<SingleResponse>('/v2/bookmark-card-styles', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新样式配置
 */
export async function updateBookmarkCardStyle(
  id: string,
  data: UpdateBookmarkCardStyleData
): Promise<BookmarkCardStyle> {
  const response = await request<SingleResponse>(`/v2/bookmark-card-styles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 删除样式配置
 */
export async function deleteBookmarkCardStyle(id: string): Promise<void> {
  await request<SuccessResponse>(`/v2/bookmark-card-styles/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 设置默认样式
 */
export async function setDefaultBookmarkCardStyle(
  id: string,
  scope?: string
): Promise<void> {
  await request<SuccessResponse>(`/v2/bookmark-card-styles/${id}/set-default`, {
    method: 'POST',
    body: JSON.stringify({ scope }),
    requireAuth: true,
  })
}

/**
 * 获取当前用户的样式配置（前台使用）
 */
export async function fetchCurrentBookmarkCardStyle(): Promise<BookmarkCardStyle> {
  const response = await request<SingleResponse>('/v2/bookmark-card-styles/current', { method: 'GET', requireAuth: false })
  return response.data
}

// API对象导出
export const bookmarkCardStylesApi = {
  fetchAll: fetchBookmarkCardStyles,
  fetchById: fetchBookmarkCardStyle,
  create: createBookmarkCardStyle,
  update: updateBookmarkCardStyle,
  delete: deleteBookmarkCardStyle,
  setDefault: setDefaultBookmarkCardStyle,
  fetchCurrent: fetchCurrentBookmarkCardStyle,
}
