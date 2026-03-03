/**
 * 自定义插件渲染器
 * 将构建器创建的插件渲染为实际的 React 组件
 */

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { BuildingPlugin, CanvasComponent } from '../types/builder'
import { getCustomPluginContent } from '../../lib/api-client/custom-plugins'

interface CustomPluginRendererProps {
  pluginId: string
  className?: string
}

// 组件样式构建器
function buildComponentStyles(comp: CanvasComponent): React.CSSProperties {
  const baseStyles = comp.part.visual.base
  const styles: React.CSSProperties = {
    position: 'absolute',
    left: comp.position.x,
    top: comp.position.y,
    zIndex: comp.zIndex,
    opacity: comp.visible ? (baseStyles.opacity ?? 1) : 0,
  }

  // 添加基础样式
  if (baseStyles.width) styles.width = baseStyles.width
  if (baseStyles.height) styles.height = baseStyles.height
  if (baseStyles.minWidth) styles.minWidth = baseStyles.minWidth
  if (baseStyles.minHeight) styles.minHeight = baseStyles.minHeight
  if (baseStyles.maxWidth) styles.maxWidth = baseStyles.maxWidth
  if (baseStyles.maxHeight) styles.maxHeight = baseStyles.maxHeight
  if (baseStyles.padding) styles.padding = baseStyles.padding
  if (baseStyles.margin) styles.margin = baseStyles.margin
  if (baseStyles.background) styles.background = baseStyles.background
  if (baseStyles.backgroundColor) styles.backgroundColor = baseStyles.backgroundColor
  if (baseStyles.backgroundImage) styles.backgroundImage = baseStyles.backgroundImage
  if (baseStyles.border) styles.border = baseStyles.border
  if (baseStyles.borderWidth) styles.borderWidth = baseStyles.borderWidth
  if (baseStyles.borderColor) styles.borderColor = baseStyles.borderColor
  if (baseStyles.borderStyle) styles.borderStyle = baseStyles.borderStyle
  if (baseStyles.borderRadius) styles.borderRadius = baseStyles.borderRadius
  if (baseStyles.boxShadow) styles.boxShadow = baseStyles.boxShadow
  if (baseStyles.color) styles.color = baseStyles.color
  if (baseStyles.fontSize) styles.fontSize = baseStyles.fontSize
  if (baseStyles.fontWeight) styles.fontWeight = baseStyles.fontWeight
  if (baseStyles.fontFamily) styles.fontFamily = baseStyles.fontFamily
  if (baseStyles.textAlign) styles.textAlign = baseStyles.textAlign as any
  if (baseStyles.lineHeight) styles.lineHeight = baseStyles.lineHeight
  if (baseStyles.letterSpacing) styles.letterSpacing = baseStyles.letterSpacing
  if (baseStyles.display) styles.display = baseStyles.display as any
  if (baseStyles.overflow) styles.overflow = baseStyles.overflow as any
  if (baseStyles.transform) styles.transform = baseStyles.transform
  if (baseStyles.transition) styles.transition = baseStyles.transition
  if (baseStyles.flexDirection) styles.flexDirection = baseStyles.flexDirection as any
  if (baseStyles.justifyContent) styles.justifyContent = baseStyles.justifyContent as any
  if (baseStyles.alignItems) styles.alignItems = baseStyles.alignItems as any
  if (baseStyles.gap) styles.gap = baseStyles.gap
  if (baseStyles.flexWrap) styles.flexWrap = baseStyles.flexWrap as any
  if (baseStyles.objectFit) styles.objectFit = baseStyles.objectFit as any
  if (baseStyles.cursor) styles.cursor = baseStyles.cursor as any

  return styles
}

// 渲染单个组件
function renderComponent(comp: CanvasComponent, index: number): React.ReactNode {
  const styles = buildComponentStyles(comp)
  const partId = comp.part.id

  // 根据零件类型渲染不同的内容
  const renderContent = () => {
    // 按钮
    if (partId.includes('button')) {
      return (
        <motion.button
          style={{
            ...styles,
            cursor: 'pointer',
          }}
          whileHover={comp.part.visual.states.hover ? {
            backgroundColor: comp.part.visual.states.hover.backgroundColor,
            transform: comp.part.visual.states.hover.transform,
            boxShadow: comp.part.visual.states.hover.boxShadow,
          } : undefined}
          whileTap={comp.part.visual.states.active ? {
            backgroundColor: comp.part.visual.states.active.backgroundColor,
            transform: comp.part.visual.states.active.transform,
          } : undefined}
          onClick={() => {
            // 处理点击事件
            console.log('Button clicked:', comp.props.text)
          }}
        >
          {comp.props.text || '按钮'}
        </motion.button>
      )
    }

    // 文本
    if (partId.includes('text')) {
      return (
        <div style={styles}>
          {comp.props.content || '文本内容'}
        </div>
      )
    }

    // 输入框
    if (partId.includes('input')) {
      return (
        <input
          type={comp.props.type || 'text'}
          placeholder={comp.props.placeholder}
          style={{
            ...styles,
            width: '100%',
          }}
          readOnly
        />
      )
    }

    // 图片
    if (partId.includes('image')) {
      return (
        <img
          src={comp.props.src || 'https://via.placeholder.com/300x200'}
          alt={comp.props.alt}
          style={{
            ...styles,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )
    }

    // 卡片容器
    if (partId.includes('card')) {
      return (
        <motion.div
          style={styles}
          whileHover={comp.part.visual.states.hover ? {
            boxShadow: comp.part.visual.states.hover.boxShadow,
            transform: comp.part.visual.states.hover.transform,
          } : undefined}
        >
          {comp.props.children}
        </motion.div>
      )
    }

    // 默认渲染
    return (
      <div style={styles}>
        {comp.part.name}
      </div>
    )
  }

  return (
    <div key={comp.id} style={{ position: 'absolute', left: 0, top: 0 }}>
      {renderContent()}
    </div>
  )
}

export default function CustomPluginRenderer({ pluginId, className }: CustomPluginRendererProps) {
  const [plugin, setPlugin] = useState<BuildingPlugin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlugin = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const content = await getCustomPluginContent(pluginId)
      setPlugin(content.builderData)
    } catch (err) {
      console.error('加载自定义插件失败:', err)
      setError('加载插件失败')
    } finally {
      setLoading(false)
    }
  }, [pluginId])

  useEffect(() => {
    loadPlugin()
  }, [loadPlugin])

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !plugin) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        {error || '插件加载失败'}
      </div>
    )
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{
        width: plugin.canvas.width,
        height: plugin.canvas.height,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 渲染所有组件 */}
      {plugin.components.map((comp: CanvasComponent, index: number) => renderComponent(comp, index))}
    </div>
  )
}
