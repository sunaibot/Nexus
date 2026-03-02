/**
 * 插槽配置管理组件
 * 管理插件在前台的显示位置
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Save,
  RefreshCw,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'

// 插槽定义
interface SlotConfig {
  id: string
  name: string
  description: string
  maxPlugins?: number
}

const PREDEFINED_SLOTS: SlotConfig[] = [
  { id: 'header-left', name: 'Header 左侧', description: 'Logo旁边，适合小图标', maxPlugins: 2 },
  { id: 'header-center', name: 'Header 中间', description: '中间区域', maxPlugins: 1 },
  { id: 'header-right', name: 'Header 右侧', description: '主题切换按钮旁边', maxPlugins: 3 },
  { id: 'hero-before', name: 'Hero 区域前', description: '时间搜索区域之前', maxPlugins: 2 },
  { id: 'hero-after', name: 'Hero 区域后', description: '时间搜索区域之后', maxPlugins: 3 },
  { id: 'content-sidebar', name: '内容侧边栏', description: '内容区域侧边' },
  { id: 'content-before', name: '内容区前', description: '主要内容之前', maxPlugins: 2 },
  { id: 'content-after', name: '内容区后', description: '主要内容之后', maxPlugins: 2 },
  { id: 'floating', name: '浮动按钮', description: '页面角落浮动', maxPlugins: 4 },
  { id: 'modal', name: '弹窗层', description: '点击后弹窗显示' }
]

// 插件插槽配置
interface PluginSlotAssignment {
  pluginId: string
  pluginName: string
  slot: string
  order: number
  isEnabled: boolean
}

interface SlotConfigManagerProps {
  plugin: UnifiedPlugin
}

export default function SlotConfigManager({ plugin }: SlotConfigManagerProps) {
  const { showToast } = useToast()
  const [assignments, setAssignments] = useState<PluginSlotAssignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // 加载插槽配置
  const loadAssignments = useCallback(async () => {
    setIsLoading(true)
    try {
      // 获取所有插件的插槽配置
      const res = await fetch(`/api/v2/plugin-slots`, {
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('获取配置失败')
      
      const data = await res.json()
      if (data.success) {
        setAssignments(data.data || [])
      }
    } catch (err) {
      showToast('error', '获取插槽配置失败')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  // 获取当前插件的配置
  const currentAssignment = assignments.find(a => a.pluginId === plugin.id)

  // 保存插槽配置
  const handleSave = async (slotId: string) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/v2/plugin-slots/${plugin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slot: slotId,
          order: assignments.filter(a => a.slot === slotId).length
        })
      })

      if (!res.ok) throw new Error('保存失败')

      showToast('success', '插槽配置已保存')
      loadAssignments()
      setSelectedSlot(null)
    } catch (err) {
      showToast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 切换启用状态
  const handleToggle = async (enabled: boolean) => {
    try {
      const res = await fetch(`/api/v2/plugin-slots/${plugin.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled })
      })

      if (!res.ok) throw new Error('操作失败')

      showToast('success', enabled ? '插件已启用' : '插件已禁用')
      loadAssignments()
    } catch (err) {
      showToast('error', '操作失败')
    }
  }

  // 获取插槽中已分配的插件数量
  const getSlotCount = (slotId: string) => {
    return assignments.filter(a => a.slot === slotId && a.isEnabled).length
  }

  // 检查插槽是否已满
  const isSlotFull = (slot: SlotConfig) => {
    if (!slot.maxPlugins) return false
    return getSlotCount(slot.id) >= slot.maxPlugins
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 当前状态 */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              当前配置
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {currentAssignment?.isEnabled 
                ? `显示在: ${PREDEFINED_SLOTS.find(s => s.id === currentAssignment.slot)?.name || currentAssignment.slot}`
                : '当前未在前台显示'
              }
            </p>
          </div>
          <button
            onClick={() => handleToggle(!currentAssignment?.isEnabled)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              currentAssignment?.isEnabled
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            )}
          >
            {currentAssignment?.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {currentAssignment?.isEnabled ? '已启用' : '已禁用'}
          </button>
        </div>
      </div>

      {/* 插槽选择 */}
      <div>
        <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
          选择显示位置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PREDEFINED_SLOTS.map((slot) => {
            const isSelected = currentAssignment?.slot === slot.id
            const isFull = isSlotFull(slot)
            const count = getSlotCount(slot.id)

            return (
              <motion.button
                key={slot.id}
                onClick={() => !isFull && setSelectedSlot(slot.id)}
                disabled={isFull && !isSelected}
                className={cn(
                  'p-4 rounded-xl text-left transition-all relative',
                  isSelected 
                    ? 'ring-2 ring-blue-500'
                    : 'hover:scale-[1.02]',
                  isFull && !isSelected && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  background: isSelected ? 'var(--color-glass)' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-glass-border)'}`
                }}
                whileHover={!isFull || isSelected ? { scale: 1.02 } : {}}
                whileTap={!isFull || isSelected ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {slot.name}
                    </h4>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {slot.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-blue-500">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      background: 'var(--color-glass)',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {count}{slot.maxPlugins ? `/${slot.maxPlugins}` : ''} 个插件
                  </span>
                  {isFull && !isSelected && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500">
                      已满
                    </span>
                  )}
                </div>

                {selectedSlot === slot.id && !isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSave(slot.id)
                      }}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      保存到此处
                    </button>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* 说明 */}
      <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--color-glass)' }}>
        <h4 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          说明
        </h4>
        <ul className="space-y-1" style={{ color: 'var(--color-text-muted)' }}>
          <li>• 每个插槽都有最大插件数量限制</li>
          <li>• 插件可以拖拽排序（即将支持）</li>
          <li>• 禁用后插件将不会在前台显示</li>
          <li>• 更改将在保存后立即生效</li>
        </ul>
      </div>
    </div>
  )
}
