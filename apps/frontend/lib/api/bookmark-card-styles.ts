/**
 * 书签卡片样式配置 API
 */

import { request } from '../api'

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
  iconOpacity?: number
  // 圆形卡片样式
  isCircular?: boolean
  circleSize?: string
  circleBackgroundColor?: string
  circleBorderWidth?: string
  circleBorderColor?: string
  // 布局配置
  layoutType?: 'standard' | 'icon-top' | 'icon-bottom' | 'icon-bg'
  iconPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'background'
  showTitle?: boolean
  showDescription?: boolean
  textAlign?: 'left' | 'center' | 'right'
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
  createdAt: string
  updatedAt: string
}

/**
 * 获取当前用户的样式配置
 */
export async function fetchCurrentBookmarkCardStyle(): Promise<BookmarkCardStyle> {
  return request<BookmarkCardStyle>('/v2/bookmark-card-styles/current')
}

/**
 * 将样式配置转换为CSS样式对象
 */
export function styleToCSS(style: BookmarkCardStyle | null): React.CSSProperties {
  if (!style) return {}

  return {
    // 基础样式
    background: style.backgroundGradient
      ? `linear-gradient(${style.backgroundGradient.angle}deg, ${style.backgroundGradient.from}, ${style.backgroundGradient.to})`
      : style.backgroundColor,
    borderRadius: style.borderRadius,
    borderWidth: style.borderWidth,
    borderColor: style.borderColor,
    borderStyle: style.borderStyle,
    // 阴影
    boxShadow: `${style.shadowX} ${style.shadowY} ${style.shadowBlur} ${style.shadowSpread} ${style.shadowColor}`,
    // 间距
    padding: style.padding,
    margin: style.margin,
    // 效果
    opacity: style.opacity,
    backdropFilter: `blur(${style.backdropBlur}) saturate(${style.backdropSaturate})`,
    // 过渡
    transition: style.hoverTransition,
    // 尺寸
    width: style.width,
    height: style.height,
    minWidth: style.minWidth,
    minHeight: style.minHeight,
    maxWidth: style.maxWidth,
    maxHeight: style.maxHeight,
  }
}

/**
 * 获取悬停样式
 */
export function getHoverStyle(style: BookmarkCardStyle | null): React.CSSProperties {
  if (!style) return {}

  return {
    background: style.hoverBackgroundColor,
    borderColor: style.hoverBorderColor,
    boxShadow: style.hoverShadowBlur
      ? `${style.shadowX} ${style.shadowY} ${style.hoverShadowBlur} ${style.shadowSpread} ${style.shadowColor}`
      : undefined,
    transform: `scale(${style.hoverScale})`,
  }
}

/**
 * 获取标题样式
 */
export function getTitleStyle(style: BookmarkCardStyle | null): React.CSSProperties {
  if (!style) return {}

  return {
    fontSize: style.titleFontSize,
    fontWeight: style.titleFontWeight,
    color: style.titleColor,
  }
}

/**
 * 获取描述样式
 */
export function getDescriptionStyle(style: BookmarkCardStyle | null): React.CSSProperties {
  if (!style) return {}

  return {
    fontSize: style.descriptionFontSize,
    fontWeight: style.descriptionFontWeight,
    color: style.descriptionColor,
  }
}

/**
 * 获取图标样式
 */
export function getIconStyle(style: BookmarkCardStyle | null): React.CSSProperties {
  if (!style) return {}

  return {
    width: style.iconSize,
    height: style.iconSize,
    color: style.iconColor,
    backgroundColor: style.iconBackgroundColor,
    borderRadius: style.iconBorderRadius,
  }
}
