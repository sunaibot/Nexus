/**
 * Settings Tabs 管理页面
 * 提供设置页面标签的增删改查功能
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  Shield,
  User,
  Globe,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import {
  settingsTabsApi,
  type SettingsTab,
  type CreateSettingsTabRequest,
  type UpdateSettingsTabRequest,
} from '../../../lib/api-client/settings-tabs'

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  Settings: <Settings className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  EyeOff: <EyeOff className="h-4 w-4" />,
}

// 可见性选项
const visibilityOptions = [
  { value: 'public', label: '公开', description: '所有用户可见' },
  { value: 'user', label: '用户', description: '登录用户可见' },
  { value: 'admin', label: '管理员', description: '仅管理员可见' },
  { value: 'super_admin', label: '超级管理员', description: '仅超级管理员可见' },
]

// 图标类型选项
const iconTypeOptions = [
  { value: 'lucide', label: 'Lucide图标' },
  { value: 'custom', label: '自定义图标' },
  { value: 'url', label: 'URL图标' },
]

export default function SettingsTabsPage() {
  const [tabs, setTabs] = useState<SettingsTab[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTab, setEditingTab] = useState<SettingsTab | null>(null)
  const [deletingTab, setDeletingTab] = useState<SettingsTab | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draggedItem, setDraggedItem] = useState<SettingsTab | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [stats, setStats] = useState({ total: 0, enabled: 0, visible: 0 })

  const { showToast } = useToast()

  // 表单数据
  const [formData, setFormData] = useState<CreateSettingsTabRequest>({
    tabId: '',
    name: '',
    labelKey: '',
    descriptionKey: '',
    icon: '',
    iconType: 'lucide',
    gradient: '',
    orderIndex: 0,
    isEnabled: true,
    isVisible: true,
    visibility: 'admin',
    allowedRoles: [],
    component: '',
  })

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      const [tabsData, statsData] = await Promise.all([
        settingsTabsApi.getAllSettingsTabs(),
        settingsTabsApi.getSettingsTabsStats(),
      ])
      setTabs(tabsData)
      setStats(statsData)
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast('error', '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 过滤标签
  const filteredTabs = tabs.filter(
    (tab) =>
      tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.tabId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.labelKey.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 打开创建对话框
  const handleCreate = () => {
    setEditingTab(null)
    setFormData({
      tabId: '',
      name: '',
      labelKey: '',
      descriptionKey: '',
      icon: '',
      iconType: 'lucide',
      gradient: '',
      orderIndex: tabs.length,
      isEnabled: true,
      isVisible: true,
      visibility: 'admin',
      allowedRoles: [],
      component: '',
    })
    setIsDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (tab: SettingsTab) => {
    setEditingTab(tab)
    setFormData({
      tabId: tab.tabId,
      name: tab.name,
      labelKey: tab.labelKey,
      descriptionKey: tab.descriptionKey || '',
      icon: tab.icon || '',
      iconType: tab.iconType || 'lucide',
      gradient: tab.gradient || '',
      orderIndex: tab.orderIndex,
      isEnabled: tab.isEnabled === 1,
      isVisible: tab.isVisible === 1,
      visibility: tab.visibility as any,
      allowedRoles: tab.allowedRoles || [],
      component: tab.component || '',
    })
    setIsDialogOpen(true)
  }

  // 打开删除对话框
  const handleDeleteClick = (tab: SettingsTab) => {
    setDeletingTab(tab)
    setIsDeleteDialogOpen(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.tabId || !formData.name || !formData.labelKey) {
      showToast('error', '请填写必填字段')
      return
    }

    try {
      setSubmitting(true)
      if (editingTab) {
        await settingsTabsApi.updateSettingsTab(editingTab.id, formData as UpdateSettingsTabRequest)
        showToast('success', '更新成功')
      } else {
        await settingsTabsApi.createSettingsTab(formData)
        showToast('success', '创建成功')
      }
      setIsDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('保存失败:', error)
      showToast('error', error instanceof Error ? error.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingTab) return

    try {
      setSubmitting(true)
      await settingsTabsApi.deleteSettingsTab(deletingTab.id)
      showToast('success', '删除成功')
      setIsDeleteDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('error', error instanceof Error ? error.message : '删除失败')
    } finally {
      setSubmitting(false)
      setDeletingTab(null)
    }
  }

  // 切换启用状态
  const handleToggleEnabled = async (tab: SettingsTab) => {
    try {
      await settingsTabsApi.updateSettingsTab(tab.id, {
        isEnabled: tab.isEnabled !== 1,
      })
      showToast('success', '状态更新成功')
      await loadData()
    } catch (error) {
      console.error('更新状态失败:', error)
      showToast('error', '更新状态失败')
    }
  }

  // 切换可见状态
  const handleToggleVisible = async (tab: SettingsTab) => {
    try {
      await settingsTabsApi.updateSettingsTab(tab.id, {
        isVisible: tab.isVisible !== 1,
      })
      showToast('success', '状态更新成功')
      await loadData()
    } catch (error) {
      console.error('更新状态失败:', error)
      showToast('error', '更新状态失败')
    }
  }

  // 拖拽排序
  const handleDragStart = (tab: SettingsTab) => {
    setDraggedItem(tab)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedItem) return

    const dragIndex = tabs.findIndex((t) => t.id === draggedItem.id)
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const newTabs = [...tabs]
    const [removed] = newTabs.splice(dragIndex, 1)
    newTabs.splice(dropIndex, 0, removed)

    // 更新orderIndex
    const reorderItems = newTabs.map((tab, index) => ({
      id: tab.id,
      orderIndex: index,
    }))

    setTabs(newTabs)
    setDraggedItem(null)
    setDragOverIndex(null)

    try {
      await settingsTabsApi.reorderSettingsTabs(reorderItems)
    } catch (error) {
      console.error('更新排序失败:', error)
      showToast('error', '更新排序失败')
      await loadData()
    }
  }

  // 获取可见性标签
  const getVisibilityBadge = (visibility: string) => {
    const config = visibilityOptions.find((v) => v.value === visibility)
    return config?.label || visibility
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">总标签数</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Settings className="h-8 w-8 text-cyan-400/60" />
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">已启用</p>
              <p className="text-2xl font-bold text-white">{stats.enabled}</p>
            </div>
            <Eye className="h-8 w-8 text-green-400/60" />
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">可见</p>
              <p className="text-2xl font-bold text-white">{stats.visible}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-400/60" />
          </div>
        </div>
      </div>

      {/* 主卡片 */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">设置标签管理</h2>
              <p className="text-sm text-white/60">管理设置页面的标签配置</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新建标签
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 搜索 */}
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* 标签列表 */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredTabs.map((tab, index) => (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                draggable
                onDragStart={() => handleDragStart(tab)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-move',
                  dragOverIndex === index && 'border-cyan-500/50 bg-cyan-500/5',
                  draggedItem?.id === tab.id && 'opacity-50'
                )}
              >
                <div className="flex items-center space-x-4">
                  <GripVertical className="h-5 w-5 text-white/40" />
                  <div className="flex items-center space-x-3">
                    {iconMap[tab.icon] || <Settings className="h-5 w-5 text-white/60" />}
                    <div>
                      <div className="font-medium text-white">{tab.name}</div>
                      <div className="text-sm text-white/60">
                        {tab.tabId} · {tab.labelKey}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/80">
                    {getVisibilityBadge(tab.visibility)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleEnabled(tab)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title={tab.isEnabled === 1 ? '已启用' : '已禁用'}
                    >
                      {tab.isEnabled === 1 ? (
                        <Eye className="h-4 w-4 text-green-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-white/40" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleVisible(tab)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title={tab.isVisible === 1 ? '可见' : '隐藏'}
                    >
                      {tab.isVisible === 1 ? (
                        <Globe className="h-4 w-4 text-blue-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-white/40" />
                      )}
                    </button>
                  </div>
                  <div className="relative group">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-white/60" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 py-1 rounded-lg bg-gray-900 border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => handleEdit(tab)}
                        className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tab)}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 创建/编辑对话框 */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsDialogOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {editingTab ? '编辑标签' : '新建标签'}
                  </h3>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </button>
                </div>
                <p className="text-sm text-white/60 mt-1">
                  {editingTab ? '修改标签配置' : '创建一个新的设置标签'}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">
                      Tab ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.tabId}
                      onChange={(e) => setFormData({ ...formData, tabId: e.target.value })}
                      placeholder="例如: general"
                      disabled={!!editingTab}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">
                      名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如: 常规设置"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">
                      标签键 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.labelKey}
                      onChange={(e) => setFormData({ ...formData, labelKey: e.target.value })}
                      placeholder="例如: settings.general"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">描述键</label>
                    <input
                      type="text"
                      value={formData.descriptionKey}
                      onChange={(e) => setFormData({ ...formData, descriptionKey: e.target.value })}
                      placeholder="例如: settings.general.description"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">图标</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="例如: Settings"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">图标类型</label>
                    <select
                      value={formData.iconType}
                      onChange={(e) => setFormData({ ...formData, iconType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {iconTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/80">渐变背景</label>
                  <input
                    type="text"
                    value={formData.gradient}
                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                    placeholder="例如: from-blue-500 to-purple-500"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/80">组件</label>
                  <input
                    type="text"
                    value={formData.component}
                    onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                    placeholder="例如: GeneralSettings"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/80">可见性</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {visibilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="text-sm text-white/80">启用</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="text-sm text-white/80">可见</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTab ? '保存' : '创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认对话框 */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-2">确认删除</h3>
              <p className="text-white/60 mb-6">
                确定要删除标签 "{deletingTab?.name}" 吗？此操作无法撤销。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
