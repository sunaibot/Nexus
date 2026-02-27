/**
 * 插件前台显示配置管理组件
 * 管理插件在前台的显示位置、层级、样式等
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid3X3,
  Layers,
  Palette,
  MousePointer,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useToast } from '../../../../components/admin/Toast'
import type { Plugin } from '../../../../lib/api-client'
import {
  fetchPluginDisplayConfig,
  updatePluginDisplayConfig,
  resetPluginDisplayConfig,
  LAYER_OPTIONS,
  DEFAULT_GRID_POSITION,
  DEFAULT_STYLE_CONFIG,
  type PluginDisplayConfig,
  type GridPosition,
  type StyleConfig,
  type InteractionConfig,
} from '../../../../lib/plugin-display-config-api'

interface PluginDisplayConfigManagerProps {
  plugin: Plugin
  onConfigUpdate?: (config: PluginDisplayConfig) => void
}

// 网格可视化组件
function GridVisualizer({
  position,
  onChange,
  responsiveMode = 'desktop',
}: {
  position: GridPosition
  onChange: (pos: GridPosition) => void
  responsiveMode?: 'mobile' | 'tablet' | 'desktop'
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null)

  const cols = responsiveMode === 'mobile' ? 4 : responsiveMode === 'tablet' ? 8 : 12
  const rows = 6

  const handleMouseDown = (row: number, col: number) => {
    setIsDragging(true)
    setDragStart({ row, col })
    setDragEnd({ row, col })
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging) {
      setDragEnd({ row, col })
    }
  }

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const newPosition: GridPosition = {
        colStart: Math.min(dragStart.col, dragEnd.col) + 1,
        colEnd: Math.max(dragStart.col, dragEnd.col) + 2,
        rowStart: Math.min(dragStart.row, dragEnd.row) + 1,
        rowEnd: Math.max(dragStart.row, dragEnd.row) + 2,
      }
      onChange(newPosition)
    }
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  const isInSelection = (row: number, col: number) => {
    if (!dragStart || !dragEnd) return false
    const minRow = Math.min(dragStart.row, dragEnd.row)
    const maxRow = Math.max(dragStart.row, dragEnd.row)
    const minCol = Math.min(dragStart.col, dragEnd.col)
    const maxCol = Math.max(dragStart.col, dragEnd.col)
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol
  }

  const isCurrentPosition = (row: number, col: number) => {
    return (
      row + 1 >= position.rowStart &&
      row + 1 < position.rowEnd &&
      col + 1 >= position.colStart &&
      col + 1 < position.colEnd
    )
  }

  return (
    <div
      className="select-none"
      onMouseLeave={() => isDragging && handleMouseUp()}
      onMouseUp={handleMouseUp}
    >
      <div
        className="grid gap-1 p-4 rounded-lg bg-gray-100 dark:bg-gray-800"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className={cn(
                'aspect-square rounded cursor-pointer transition-all duration-150',
                isCurrentPosition(row, col)
                  ? 'bg-blue-500 shadow-lg shadow-blue-500/30'
                  : isInSelection(row, col)
                  ? 'bg-blue-300 dark:bg-blue-700'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
              onMouseDown={() => handleMouseDown(row, col)}
              onMouseEnter={() => handleMouseEnter(row, col)}
            />
          ))
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        拖拽选择网格区域 (当前: 列 {position.colStart}-{position.colEnd - 1}, 行 {position.rowStart}-{position.rowEnd - 1})
      </p>
    </div>
  )
}

// 颜色选择器组件
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600 dark:text-gray-400 w-20">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-0"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="transparent"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
      </div>
    </div>
  )
}

export default function PluginDisplayConfigManager({
  plugin,
  onConfigUpdate,
}: PluginDisplayConfigManagerProps) {
  const { showToast } = useToast()
  const [config, setConfig] = useState<PluginDisplayConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'position' | 'layer' | 'style' | 'interaction'>('position')
  const [responsiveMode, setResponsiveMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    position: true,
    layer: false,
    style: false,
    interaction: false,
  })

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchPluginDisplayConfig(plugin.id)
      setConfig(data)
    } catch (err: any) {
      showToast('error', err.message || '加载配置失败')
    } finally {
      setIsLoading(false)
    }
  }, [plugin.id, showToast])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // 保存配置
  const handleSave = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      const updated = await updatePluginDisplayConfig(plugin.id, {
        gridPosition: config.gridPosition,
        layer: config.layer,
        zIndex: config.zIndex,
        displayConfig: config.displayConfig,
        styleConfig: config.styleConfig,
        interactionConfig: config.interactionConfig,
      })
      setConfig(updated)
      onConfigUpdate?.(updated)
      showToast('success', '配置保存成功')
    } catch (err: any) {
      showToast('error', err.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 重置配置
  const handleReset = async () => {
    if (!confirm('确定要重置为默认配置吗？')) return

    try {
      setIsSaving(true)
      const reset = await resetPluginDisplayConfig(plugin.id)
      setConfig(reset)
      onConfigUpdate?.(reset)
      showToast('success', '配置已重置')
    } catch (err: any) {
      showToast('error', err.message || '重置失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 切换可见性
  const toggleVisibility = () => {
    if (!config) return
    setConfig({
      ...config,
      displayConfig: {
        ...config.displayConfig,
        visible: !config.displayConfig.visible,
      },
    })
  }

  // 更新网格位置
  const updateGridPosition = (position: GridPosition) => {
    if (!config) return
    setConfig({ ...config, gridPosition: position })
  }

  // 更新样式配置
  const updateStyleConfig = (updates: Partial<StyleConfig>) => {
    if (!config) return
    setConfig({
      ...config,
      styleConfig: {
        ...config.styleConfig,
        ...updates,
      },
    })
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>加载配置失败</p>
        <button
          onClick={loadConfig}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-lg">{plugin.name}</h3>
          <button
            onClick={toggleVisibility}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              config.displayConfig.visible
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            {config.displayConfig.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {config.displayConfig.visible ? '显示中' : '已隐藏'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 配置面板 */}
      <div className="space-y-4">
        {/* 网格定位 */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('position')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Grid3X3 className="w-5 h-5 text-blue-500" />
              <span className="font-medium">网格定位</span>
            </div>
            {expandedSections.position ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <AnimatePresence>
            {expandedSections.position && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* 响应式模式切换 */}
                  <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    {[
                      { mode: 'mobile' as const, icon: Smartphone, label: '手机' },
                      { mode: 'tablet' as const, icon: Tablet, label: '平板' },
                      { mode: 'desktop' as const, icon: Monitor, label: '桌面' },
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => setResponsiveMode(mode)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                          responsiveMode === mode
                            ? 'bg-white dark:bg-gray-700 shadow-sm'
                            : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 网格可视化 */}
                  <GridVisualizer
                    position={config.gridPosition}
                    onChange={updateGridPosition}
                    responsiveMode={responsiveMode}
                  />

                  {/* 手动输入 */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { key: 'colStart', label: '起始列', min: 1, max: 12 },
                      { key: 'colEnd', label: '结束列', min: 2, max: 13 },
                      { key: 'rowStart', label: '起始行', min: 1, max: 99 },
                      { key: 'rowEnd', label: '结束行', min: 2, max: 100 },
                    ].map(({ key, label, min, max }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                        <input
                          type="number"
                          min={min}
                          max={max}
                          value={config.gridPosition[key as keyof GridPosition]}
                          onChange={(e) =>
                            updateGridPosition({
                              ...config.gridPosition,
                              [key]: parseInt(e.target.value) || min,
                            })
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 层级设置 */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('layer')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-purple-500" />
              <span className="font-medium">层级设置</span>
            </div>
            {expandedSections.layer ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <AnimatePresence>
            {expandedSections.layer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* 层级选择 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {LAYER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setConfig({ ...config, layer: option.value })}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          config.layer === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        )}
                      >
                        <div className="font-medium mb-1">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* z-index 微调 */}
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                      Z-Index 微调 ({config.zIndex})
                    </label>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={config.zIndex}
                      onChange={(e) => setConfig({ ...config, zIndex: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>-50</span>
                      <span>0</span>
                      <span>+50</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 样式配置 */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('style')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-pink-500" />
              <span className="font-medium">样式配置</span>
            </div>
            {expandedSections.style ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <AnimatePresence>
            {expandedSections.style && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-6">
                  {/* 颜色设置 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">颜色</h4>
                    <ColorPicker
                      label="背景色"
                      value={config.styleConfig.colors?.background || ''}
                      onChange={(v) =>
                        updateStyleConfig({
                          colors: { ...config.styleConfig.colors, background: v },
                        })
                      }
                    />
                    <ColorPicker
                      label="文字色"
                      value={config.styleConfig.colors?.text || ''}
                      onChange={(v) =>
                        updateStyleConfig({
                          colors: { ...config.styleConfig.colors, text: v },
                        })
                      }
                    />
                    <ColorPicker
                      label="边框色"
                      value={config.styleConfig.colors?.border || ''}
                      onChange={(v) =>
                        updateStyleConfig({
                          colors: { ...config.styleConfig.colors, border: v },
                        })
                      }
                    />
                  </div>

                  {/* 透明度 */}
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                      透明度 ({Math.round((config.styleConfig.effects?.opacity || 1) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((config.styleConfig.effects?.opacity || 1) * 100)}
                      onChange={(e) =>
                        updateStyleConfig({
                          effects: {
                            ...config.styleConfig.effects,
                            opacity: parseInt(e.target.value) / 100,
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* 模糊度 */}
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                      模糊度 ({config.styleConfig.effects?.blur || 0}px)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={config.styleConfig.effects?.blur || 0}
                      onChange={(e) =>
                        updateStyleConfig({
                          effects: {
                            ...config.styleConfig.effects,
                            blur: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 交互配置 */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('interaction')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MousePointer className="w-5 h-5 text-green-500" />
              <span className="font-medium">交互配置</span>
            </div>
            {expandedSections.interaction ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <AnimatePresence>
            {expandedSections.interaction && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {[
                    { key: 'draggable', label: '可拖拽', icon: '↔️' },
                    { key: 'resizable', label: '可调整大小', icon: '⤡' },
                    { key: 'clickable', label: '可点击', icon: '👆' },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm">{label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.interactionConfig[key as keyof InteractionConfig] || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            interactionConfig: {
                              ...config.interactionConfig,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
