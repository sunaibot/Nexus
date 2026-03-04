'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  LayoutGrid,
  X,
  Check,
  Star,
  FolderOpen,
} from 'lucide-react'
import { Tab, Category } from '../../../types'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import { IconRenderer } from '../../../components/IconRenderer'
import {
  fetchTabs,
  createTab,
  updateTab,
  deleteTab,
  reorderTabs,
} from '../../../lib/api-client'

const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7',
]

const presetTabIcons = [
  'home', 'bookmark', 'folder', 'star', 'heart',
  'code', 'music', 'video', 'book', 'briefcase',
  'gamepad', 'shopping', 'news', 'image', 'settings',
]

interface TabManagerProps {
  categories: Category[]
}

export function TabManager({ categories }: TabManagerProps) {
  const { showToast } = useToast()

  const [tabs, setTabs] = useState<Tab[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTab, setEditingTab] = useState<Tab | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'home',
    isDefault: false,
    categoryIds: [] as string[],
  })
  const [showIconPicker, setShowIconPicker] = useState(false)

  // 加载 Tabs
  const loadTabs = useCallback(async () => {
    setLoading(true)
    try {
      const tabsData = await fetchTabs()
      setTabs(tabsData)
    } catch (err) {
      console.error('加载 Tabs 失败:', err)
      showToast('error', '加载 Tabs 失败')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadTabs()
  }, [loadTabs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tabs.findIndex(t => t.id === active.id)
    const newIndex = tabs.findIndex(t => t.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(tabs, oldIndex, newIndex)
      setTabs(reordered)

      try {
        await reorderTabs(reordered.map((t, i) => ({ id: t.id, orderIndex: i })))
        showToast('success', 'Tab 顺序已更新')
      } catch (err) {
        console.error('更新 Tab 顺序失败:', err)
        showToast('error', '更新 Tab 顺序失败')
        loadTabs()
      }
    }
  }, [tabs, loadTabs, showToast])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('error', '请输入 Tab 名称')
      return
    }

    try {
      if (editingTab) {
        await updateTab(editingTab.id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          isDefault: formData.isDefault,
          categoryIds: formData.categoryIds,
        })
        showToast('success', 'Tab 已更新')
      } else {
        await createTab({
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          isDefault: formData.isDefault,
          categoryIds: formData.categoryIds,
        })
        showToast('success', 'Tab 已创建')
      }

      resetForm()
      loadTabs()
    } catch (err) {
      console.error('保存 Tab 失败:', err)
      showToast('error', editingTab ? '更新 Tab 失败' : '创建 Tab 失败')
    }
  }

  const handleEdit = (tab: Tab) => {
    setEditingTab(tab)
    setFormData({
      name: tab.name,
      color: tab.color || '#3b82f6',
      icon: tab.icon || 'home',
      isDefault: tab.isDefault || false,
      categoryIds: tab.categories?.map(c => c.id) || [],
    })
    setShowForm(true)
  }

  const handleDelete = async (tab: Tab) => {
    const message = `确定要删除 Tab "${tab.name}" 吗？`

    if (confirm(message)) {
      try {
        await deleteTab(tab.id)
        showToast('success', 'Tab 已删除')
        loadTabs()
      } catch (err) {
        console.error('删除 Tab 失败:', err)
        showToast('error', '删除 Tab 失败')
      }
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingTab(null)
    setFormData({ name: '', color: '#3b82f6', icon: 'home', isDefault: false, categoryIds: [] })
    setShowIconPicker(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Tab 管理
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            管理前台左侧导航 Tab，每个 Tab 可以包含多个分类
          </p>
        </div>
        <motion.button
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
        >
          <Plus className="w-4 h-4" />
          新建 Tab
        </motion.button>
      </div>

      {/* Tab Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-xl border space-y-4"
            style={{
              backgroundColor: 'var(--color-glass)',
              borderColor: 'var(--color-glass-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {editingTab ? '编辑 Tab' : '创建 Tab'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Tab 名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：常用工具"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-lg transition-all",
                        formData.color === color && "ring-2 ring-white scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  图标
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-white/5 transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <IconRenderer icon={formData.icon} className="w-5 h-5" />
                    <span className="text-sm">更换图标</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showIconPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="grid grid-cols-10 gap-2">
                        {presetTabIcons.map((iconKey) => (
                          <button
                            key={iconKey}
                            onClick={() => {
                              setFormData({ ...formData, icon: iconKey })
                              setShowIconPicker(false)
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              formData.icon === iconKey && "bg-blue-500/20 ring-1 ring-blue-500"
                            )}
                          >
                            <IconRenderer icon={iconKey} className="w-5 h-5 mx-auto" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Default Tab Toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded border"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    设为默认 Tab（首次访问时显示）
                  </span>
                </label>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    包含分类
                  </div>
                </label>
                {categories.length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    暂无分类，请先创建分类
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          const isSelected = formData.categoryIds.includes(category.id)
                          setFormData({
                            ...formData,
                            categoryIds: isSelected
                              ? formData.categoryIds.filter(id => id !== category.id)
                              : [...formData.categoryIds, category.id]
                          })
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                          formData.categoryIds.includes(category.id)
                            ? "bg-blue-500/20 border-blue-500 text-blue-400"
                            : "hover:bg-white/5"
                        )}
                        style={{
                          backgroundColor: formData.categoryIds.includes(category.id) ? undefined : 'var(--color-bg-secondary)',
                          borderColor: formData.categoryIds.includes(category.id) ? undefined : 'var(--color-border)',
                          color: formData.categoryIds.includes(category.id) ? undefined : 'var(--color-text-secondary)',
                        }}
                      >
                        <IconRenderer icon={category.icon} className="w-4 h-4" />
                        <span className="text-sm">{category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  选择该 Tab 要显示哪些分类（可多选）
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  取消
                </button>
                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
                  style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
                >
                  <Check className="w-4 h-4" />
                  保存
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab List */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          加载中...
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tabs.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tabs.map((tab) => (
                <SortableTabItem
                  key={tab.id}
                  tab={tab}
                  categories={categories}
                  onEdit={() => handleEdit(tab)}
                  onDelete={() => handleDelete(tab)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {tabs.length === 0 && !loading && (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无 Tab，点击上方按钮创建</p>
        </div>
      )}
    </div>
  )
}

interface SortableTabItemProps {
  tab: Tab
  categories: Category[]
  onEdit: () => void
  onDelete: () => void
}

function SortableTabItem({ tab, categories, onEdit, onDelete }: SortableTabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const tabCategories = tab.categories || []

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--color-glass)',
        borderColor: 'var(--color-glass-border)',
      }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-all group",
        isDragging ? "opacity-50 shadow-lg" : "hover:bg-[var(--color-glass-hover)]"
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: (tab.color || '#3b82f6') + '20',
          color: tab.color || '#3b82f6',
        }}
      >
        <IconRenderer icon={tab.icon} className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {tab.name}
          </h3>
          {tab.isDefault && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
              <Star className="w-3 h-3" />
              默认
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {tabCategories.length > 0
            ? `包含: ${tabCategories.map(c => c.name).join(', ')}`
            : '未分配分类'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
