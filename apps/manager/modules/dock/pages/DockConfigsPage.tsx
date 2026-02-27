import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  Layout,
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  User,
  Users,
  Check,
  X,
  Home,
  Search,
  Sun,
  Moon,
  Languages,
  Github,
  LayoutDashboard,
  type LucideIcon
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import {
  fetchDockConfigs,
  createDockConfig,
  updateDockConfig,
  deleteDockConfig,
  reorderDockItems,
  type DockConfig,
  type DockItem,
  type CreateDockConfigData,
  type UpdateDockConfigData
} from '../../../lib/api-client/dock-configs'

// 图标映射表
const iconMap: Record<string, LucideIcon> = {
  Home,
  Search,
  Sun,
  Moon,
  Languages,
  Github,
  LayoutDashboard,
  Plus: Plus,
  Globe,
  User,
  Users,
  Eye,
  EyeOff,
  Layout,
}

// 所有可用图标列表
const availableIcons = [
  { name: 'Home', label: '首页' },
  { name: 'Search', label: '搜索' },
  { name: 'Plus', label: '添加' },
  { name: 'Languages', label: '语言' },
  { name: 'Sun', label: '浅色' },
  { name: 'Moon', label: '深色' },
  { name: 'LayoutDashboard', label: '管理' },
  { name: 'Github', label: 'GitHub' },
  { name: 'Globe', label: '全局' },
  { name: 'User', label: '用户' },
  { name: 'Users', label: '用户组' },
]

// 可用操作列表
const availableActions = [
  { value: '', label: '无操作' },
  { value: 'toggleTheme', label: '切换主题' },
  { value: 'toggleLanguage', label: '切换语言' },
  { value: 'openSearch', label: '打开搜索' },
  { value: 'addBookmark', label: '添加书签' },
]

export default function DockConfigsPage() {
  const { showToast } = useToast()

  const [configs, setConfigs] = useState<DockConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DockConfig | null>(null)
  const [draggedItem, setDraggedItem] = useState<DockItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'global' | 'user' | 'role'>('global')

  const [formData, setFormData] = useState<CreateDockConfigData & UpdateDockConfigData>({
    name: '',
    description: '',
    items: [],
    scope: 'global',
    isDefault: 0,
    isEnabled: 1,
  })

  const [editingItem, setEditingItem] = useState<DockItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemFormData, setItemFormData] = useState<Partial<DockItem>>({
    id: '',
    title: '',
    icon: 'Home',
    iconType: 'lucide',
    href: '',
    action: '',
    orderIndex: 0,
    isEnabled: 1,
    isVisible: 1,
  })

  const loadConfigs = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchDockConfigs({ scope: activeTab })
      setConfigs(data)
    } catch (err: any) {
      showToast('error', err.message || '加载Dock配置失败')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, showToast])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingConfig) {
        await updateDockConfig(editingConfig.id, formData)
        showToast('success', 'Dock配置更新成功')
      } else {
        await createDockConfig({
          ...formData,
          scope: activeTab,
          items: formData.items || [],
        })
        showToast('success', 'Dock配置创建成功')
      }
      setShowModal(false)
      setEditingConfig(null)
      resetForm()
      await loadConfigs()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleEdit = (config: DockConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      description: config.description,
      items: config.items,
      scope: config.scope,
      isDefault: config.isDefault,
      isEnabled: config.isEnabled,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个Dock配置吗？')) return
    try {
      await deleteDockConfig(id)
      showToast('success', 'Dock配置已删除')
      await loadConfigs()
    } catch (err: any) {
      showToast('error', err.message || '删除失败')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      items: [],
      scope: activeTab,
      isDefault: 0,
      isEnabled: 1,
    })
  }

  // Dock项相关操作
  const handleAddItem = () => {
    setEditingItem(null)
    setItemFormData({
      id: `item-${Date.now()}`,
      title: '',
      icon: 'Home',
      iconType: 'lucide',
      href: '',
      action: '',
      orderIndex: (formData.items?.length || 0) + 1,
      isEnabled: 1,
      isVisible: 1,
    })
    setShowItemModal(true)
  }

  const handleEditItem = (item: DockItem) => {
    setEditingItem(item)
    setItemFormData({ ...item })
    setShowItemModal(true)
  }

  const handleDeleteItem = (itemId: string) => {
    const newItems = (formData.items || []).filter(item => item.id !== itemId)
    setFormData({ ...formData, items: newItems })
    showToast('success', 'Dock项已删除')
  }

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemFormData.id || !itemFormData.title) {
      showToast('error', '请填写完整信息')
      return
    }

    const newItem: DockItem = {
      id: itemFormData.id!,
      title: itemFormData.title!,
      icon: itemFormData.icon || 'Home',
      iconType: (itemFormData.iconType as 'lucide' | 'custom' | 'url') || 'lucide',
      href: itemFormData.href,
      action: itemFormData.action,
      orderIndex: itemFormData.orderIndex || 0,
      isEnabled: itemFormData.isEnabled ?? 1,
      isVisible: itemFormData.isVisible ?? 1,
    }

    const currentItems = formData.items || []
    if (editingItem) {
      const index = currentItems.findIndex(item => item.id === editingItem.id)
      if (index !== -1) {
        currentItems[index] = newItem
      }
    } else {
      currentItems.push(newItem)
    }

    setFormData({ ...formData, items: currentItems })
    setShowItemModal(false)
    showToast('success', editingItem ? 'Dock项已更新' : 'Dock项已添加')
  }

  // 拖拽排序
  const handleItemDragStart = (item: DockItem) => {
    setDraggedItem(item)
  }

  const handleItemDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedItem || !formData.items) return

    const dragIndex = formData.items.findIndex(item => item.id === draggedItem.id)
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const newItems = [...formData.items]
    const [removed] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, removed)

    // 更新orderIndex
    newItems.forEach((item, index) => {
      item.orderIndex = index + 1
    })

    setFormData({ ...formData, items: newItems })
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global': return Globe
      case 'user': return User
      case 'role': return Users
      default: return Globe
    }
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'global': return '全局'
      case 'user': return '用户'
      case 'role': return '角色'
      default: return scope
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dock配置</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理Dock导航栏配置</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingConfig(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建配置
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['global', 'user', 'role'] as const).map((tab) => {
          const Icon = getScopeIcon(tab)
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {getScopeLabel(tab)}
            </button>
          )
        })}
      </div>

      {/* 配置列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <Layout className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">暂无{getScopeLabel(activeTab)}配置</p>
          <button
            onClick={() => {
              resetForm()
              setEditingConfig(null)
              setShowModal(true)
            }}
            className="mt-4 text-blue-500 hover:text-blue-600 text-sm"
          >
            创建第一个配置
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => {
            const ScopeIcon = getScopeIcon(config.scope)
            return (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all',
                  config.isDefault
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-2 rounded-lg',
                      config.isDefault
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    )}>
                      <ScopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">{config.name}</h3>
                        {config.isDefault === 1 && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            默认
                          </span>
                        )}
                        {config.isEnabled === 0 && (
                          <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                            禁用
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {config.description || '无描述'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {config.items?.length || 0} 个Dock项
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(config)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dock项预览 */}
                {config.items && config.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {config.items
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((item) => {
                          const Icon = iconMap[item.icon] || Home
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
                                item.isEnabled
                                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{item.title}</span>
                              {item.action && (
                                <span className="text-slate-400">({item.action})</span>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 配置编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {editingConfig ? '编辑Dock配置' : '新建Dock配置'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      配置名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      描述
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* 选项 */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault === 1}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked ? 1 : 0 })}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">设为默认</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isEnabled === 1}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked ? 1 : 0 })}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">启用</span>
                  </label>
                </div>

                {/* Dock项列表 */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">Dock项</h3>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      添加项
                    </button>
                  </div>

                  {formData.items && formData.items.length > 0 ? (
                    <div className="space-y-2">
                      {formData.items
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((item, index) => {
                          const Icon = iconMap[item.icon] || Home
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => handleItemDragStart(item)}
                              onDragEnd={handleItemDragEnd}
                              onDragOver={(e) => handleItemDragOver(e, index)}
                              onDrop={(e) => handleItemDrop(e, index)}
                              className={cn(
                                'flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-move',
                                dragOverIndex === index && 'border-2 border-blue-300 dark:border-blue-700',
                                draggedItem?.id === item.id && 'opacity-50'
                              )}
                            >
                              <GripVertical className="w-4 h-4 text-slate-400" />
                              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              <div className="flex-1">
                                <span className="font-medium text-slate-800 dark:text-slate-100">{item.title}</span>
                                {item.href && (
                                  <span className="text-xs text-slate-500 ml-2">→ {item.href}</span>
                                )}
                                {item.action && (
                                  <span className="text-xs text-blue-500 ml-2">({item.action})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-blue-500 rounded transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">暂无Dock项</p>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                      >
                        添加第一个Dock项
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || !formData.items || formData.items.length === 0}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  {editingConfig ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dock项编辑模态框 */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {editingItem ? '编辑Dock项' : '添加Dock项'}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  标题 *
                </label>
                <input
                  type="text"
                  value={itemFormData.title}
                  onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  图标
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableIcons.map((icon) => {
                    const Icon = iconMap[icon.name]
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setItemFormData({ ...itemFormData, icon: icon.name })}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors',
                          itemFormData.icon === icon.name
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                      >
                        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-xs text-slate-500">{icon.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  链接 (href)
                </label>
                <input
                  type="text"
                  value={itemFormData.href || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, href: e.target.value })}
                  placeholder="例如: /admin 或 https://example.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  操作 (action)
                </label>
                <select
                  value={itemFormData.action || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, action: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {availableActions.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemFormData.isVisible === 1}
                    onChange={(e) => setItemFormData({ ...itemFormData, isVisible: e.target.checked ? 1 : 0 })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">可见</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemFormData.isEnabled === 1}
                    onChange={(e) => setItemFormData({ ...itemFormData, isEnabled: e.target.checked ? 1 : 0 })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">启用</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {editingItem ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
