/**
 * 懒加载图片组件
 * 支持 Intersection Observer 懒加载、加载状态、错误处理
 */

import { useState, useEffect, useRef, forwardRef, ImgHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Loader2, ImageOff } from 'lucide-react'

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  alt: string
  placeholder?: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number
  onLoad?: () => void
  onError?: () => void
}

export const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt,
      className,
      placeholder,
      fallback,
      rootMargin = '50px',
      threshold = 0.1,
      onLoad,
      onError,
      ...props
    },
    forwardedRef
  ) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isError, setIsError] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Intersection Observer 监听
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        {
          rootMargin,
          threshold,
        }
      )

      observer.observe(container)

      return () => observer.disconnect()
    }, [rootMargin, threshold])

    // 处理图片加载完成
    const handleLoad = () => {
      setIsLoaded(true)
      onLoad?.()
    }

    // 处理图片加载错误
    const handleError = () => {
      setIsError(true)
      onError?.()
    }

    // 默认占位符
    const defaultPlaceholder = (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )

    // 默认错误 fallback
    const defaultFallback = (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <ImageOff className="w-6 h-6 text-gray-400" />
      </div>
    )

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden', className)}
        style={props.style}
      >
        {/* 占位符 / Loading */}
        {!isLoaded && !isError && placeholder !== null && (
          <div className="absolute inset-0">
            {placeholder || defaultPlaceholder}
          </div>
        )}

        {/* 错误状态 */}
        {isError && (
          <div className="absolute inset-0">
            {fallback || defaultFallback}
          </div>
        )}

        {/* 实际图片 */}
        {isInView && !isError && (
          <img
            ref={forwardedRef}
            src={src}
            alt={alt}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}
      </div>
    )
  }
)

LazyImage.displayName = 'LazyImage'

/**
 * 带模糊渐显效果的图片组件
 */
interface BlurImageProps extends LazyImageProps {
  blurHash?: string
}

export const BlurImage = forwardRef<HTMLImageElement, BlurImageProps>(
  ({ blurHash, className, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false)

    return (
      <LazyImage
        ref={ref}
        className={cn(
          'transition-all duration-500',
          isLoaded ? 'blur-0' : 'blur-lg',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    )
  }
)

BlurImage.displayName = 'BlurImage'
