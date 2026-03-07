import { useState, useEffect } from 'react'
import {
  fetchCurrentBookmarkCardStyle,
  styleToCSS,
  getHoverStyle,
  getTitleStyle,
  getDescriptionStyle,
  getIconStyle,
  type BookmarkCardStyle,
} from '../lib/api'

interface UseBookmarkCardStyleReturn {
  style: BookmarkCardStyle | null
  isLoading: boolean
  error: Error | null
  // CSS 样式
  cardStyle: React.CSSProperties
  hoverStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  descriptionStyle: React.CSSProperties
  iconStyle: React.CSSProperties
  // 布局配置
  layoutType: BookmarkCardStyle['layoutType']
  iconPosition: BookmarkCardStyle['iconPosition']
  showTitle: boolean
  showDescription: boolean
  textAlign: BookmarkCardStyle['textAlign']
  // 圆形卡片
  isCircular: boolean
  circleStyle: React.CSSProperties
}

export function useBookmarkCardStyle(): UseBookmarkCardStyleReturn {
  const [style, setStyle] = useState<BookmarkCardStyle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadStyle() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchCurrentBookmarkCardStyle()
        if (mounted) {
          setStyle(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('加载样式失败'))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadStyle()

    // 监听样式更新事件
    const handleStyleUpdate = () => {
      loadStyle()
    }
    window.addEventListener('bookmark-card-style-updated', handleStyleUpdate)

    // 当页面重新可见时刷新样式
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStyle()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 每30秒自动刷新一次
    const interval = setInterval(loadStyle, 30000)

    return () => {
      mounted = false
      window.removeEventListener('bookmark-card-style-updated', handleStyleUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [])

  // 圆形卡片样式
  const circleStyle: React.CSSProperties = style?.isCircular
    ? {
        width: style.circleSize,
        height: style.circleSize,
        borderRadius: '50%',
        backgroundColor: style.circleBackgroundColor,
        borderWidth: style.circleBorderWidth,
        borderStyle: 'solid',
        borderColor: style.circleBorderColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : {}

  return {
    style,
    isLoading,
    error,
    cardStyle: styleToCSS(style),
    hoverStyle: getHoverStyle(style),
    titleStyle: getTitleStyle(style),
    descriptionStyle: getDescriptionStyle(style),
    iconStyle: getIconStyle(style),
    // 布局配置
    layoutType: style?.layoutType || 'standard',
    iconPosition: style?.iconPosition || 'left',
    showTitle: style?.showTitle !== false,
    showDescription: style?.showDescription !== false,
    textAlign: style?.textAlign || 'left',
    // 圆形卡片
    isCircular: style?.isCircular || false,
    circleStyle,
  }
}
