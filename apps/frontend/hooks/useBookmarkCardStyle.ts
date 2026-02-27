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

    return () => {
      mounted = false
    }
  }, [])

  return {
    style,
    isLoading,
    error,
    cardStyle: styleToCSS(style),
    hoverStyle: getHoverStyle(style),
    titleStyle: getTitleStyle(style),
    descriptionStyle: getDescriptionStyle(style),
    iconStyle: getIconStyle(style),
  }
}
