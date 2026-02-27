/**
 * Frontend NavItems 管理页面
 * 提供前端导航项的增删改查功能
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
  Globe,
  Loader2,
  ChevronRight,
  ChevronDown,
  Folder,
  Link,
  Home,
  Layout,
  Settings,
  Shield,
  User,
  X,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import {
  frontendNavApi,
  type NavItem,
  type CreateNavItemRequest,
  type UpdateNavItemRequest,
} from '../../../lib/api-client/frontend-nav'

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  Layout: <Layout className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Folder: <Folder className="h-4 w-4" />,
  Link: <Link className="h-4 w-4" />,
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

export default function NavItemsPage() {
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NavItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<NavItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draggedItem, setDraggedItem] = useState<NavItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ total: 0, enabled: 0, visible: 0, topLevel: 0 })

  const { showToast } = useToast()

  // 表单数据
  const [formData, setFormData] = useState<CreateNavItemRequest>({
    name: '',
    path: '',
    icon: '',
    iconType: 'lucide',
    description: '',
    orderIndex: 0,
    isEnabled: true,
    isVisible: true,
    visibility: 'public',
    allowedRoles: [],
    parentId: undefined,
  })

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, statsData] = await Promise.all([
        frontendNavApi.getAllNavItems(),
        frontendNavApi.getNavItemsStats(),
      ])
      setNavItems(itemsData)
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

  // 过滤导航项
  const filteredItems = navItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 获取顶级导航项
  const topLevelItems = filteredItems.filter((item) => !item.parentId)

  // 获取子导航项
  const getChildItems = (parentId: string) => {
    return filteredItems.filter((item) => item.parentId === parentId)
  }

  // 切换展开状态
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 打开创建对话框
  const handleCreate = (parentId?: string) => {
    setEditingItem(null)
    setFormData({
      name: '',
      path: '',
      icon: '',
      iconType: 'lucide',
      description: '',
      orderIndex: navItems.length,
      isEnabled: true,
      isVisible: true,
      visibility: 'public',
      allowedRoles: [],
      parentId: parentId,
    })
    setIsDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (item: NavItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      path: item.path,
      icon: item.icon || '',
      iconType: item.iconType || 'lucide',
      description: item.description || '',
      orderIndex: item.orderIndex,
      isEnabled: item.isEnabled === 1,
      isVisible: item.isVisible === 1,
      visibility: item.visibility as any,
      allowedRoles: item.allowedRoles || [],
      parentId: item.parentId,
    })
    setIsDialogOpen(true)
  }

  // 打开删除对话框
  const handleDeleteClick = (item: NavItem) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name || !formData.path) {
      showToast('error', '请填写必填字段')
      return
    }

    try {
      setSubmitting(true)
      if (editingItem) {
        await frontendNavApi.updateNavItem(editingItem.id, formData as UpdateNavItemRequest)
        showToast('success', '更新成功')
      } else {
        await frontendNavApi.createNavItem(formData)
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
    if (!deletingItem) return

    try {
      setSubmitting(true)
      await frontendNavApi.deleteNavItem(deletingItem.id)
      showToast('success', '删除成功')
      setIsDeleteDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('error', error instanceof Error ? error.message : '删除失败')
    } finally {
      setSubmitting(false)
      setDeletingItem(null)
    }
  }

  // 切换启用状态
  const handleToggleEnabled = async (item: NavItem) => {
    try {
      await frontendNavApi.updateNavItem(item.id, {
        isEnabled: item.isEnabled !== 1,
      })
      showToast('success', '状态更新成功')
      await loadData()
    } catch (error) {
      console.error('更新状态失败:', error)
      showToast('error', '更新状态失败')
    }
  }

  // 切换可见状态
  const handleToggleVisible = async (item: NavItem) => {
    try {
      await frontendNavApi.updateNavItem(item.id, {
        isVisible: item.isVisible !== 1,
      })
      showToast('success', '状态更新成功')
      await loadData()
    } catch (error) {
      console.error('更新状态失败:', error)
      showToast('error', '更新状态失败')
    }
  }

  // 拖拽排序
  const handleDragStart = (item: NavItem) => {
    setDraggedItem(item)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number, parentId?: string) => {
    e.preventDefault()
    if (!draggedItem) return

    const sameParentItems = navItems.filter((item) => item.parentId === parentId)
    const dragIndex = sameParentItems.findIndex((item) => item.id === draggedItem.id)

    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const newItems = [...sameParentItems]
    const [removed] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, removed)

    // 更新orderIndex
    const reorderItems = newItems.map((item, index) => ({
      id: item.id,
      orderIndex: index,
      parentId: item.parentId,
    }))

    // 更新本地状态
    const updatedNavItems = navItems.map((item) => {
      const reorderItem = reorderItems.find((r) => r.id === item.id)
      if (reorderItem) {
        return { ...item, orderIndex: reorderItem.orderIndex }
      }
      return item
    })
    setNavItems(updatedNavItems)

    setDraggedItem(null)
    setDragOverIndex(null)

    try {
      await frontendNavApi.reorderNavItems(reorderItems)
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

  // 渲染导航项
  const renderNavItem = (item: NavItem, index: number, level: number = 0) => {
    const childItems = getChildItems(item.id)
    const hasChildren = childItems.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          draggable
          onDragStart={() => handleDragStart(item)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index, item.parentId)}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-move',
            dragOverIndex === index && 'border-cyan-500/50 bg-cyan-500/5',
            draggedItem?.id === item.id && 'opacity-50',
            level > 0 && 'ml-8'
          )}
        >
          <div className="flex items-center space-x-3">
            <GripVertical className="h-4 w-4 text-white/40" />
            {hasChildren && (
              <button
                onClick={() => toggleExpand(item.id)}
                className="p-1 rounded hover:bg-white/10"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-white/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/60" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            {iconMap[item.icon] || <Link className="h-4 w-4 text-white/60" />}
            <div>
              <div className="font-medium text-white">{item.name}</div>
              <div className="text-sm text-white/60">{item.path}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/80">
              {getVisibilityBadge(item.visibility)}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleToggleEnabled(item)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={item.isEnabled === 1 ? '已启用' : '已禁用'}
              >
                {item.isEnabled === 1 ? (
                  <Eye className="h-4 w-4 text-green-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-white/40" />
                )}
              </button>
              <button
                onClick={() => handleToggleVisible(item)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={item.isVisible === 1 ? '可见' : '隐藏'}
              >
                {item.isVisible === 1 ? (
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
                  onClick={() => handleEdit(item)}
                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  编辑
                </button>
                <button
                  onClick={() => handleCreate(item.id)}
                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加子项
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 子项 */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mt-2"
            >
              {childItems.map((child, childIndex) =>
                renderNavItem(child, childIndex, level + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
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
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">总导航项</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Layout className="h-8 w-8 text-cyan-400/60" />
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
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">顶级菜单</p>
              <p className="text-2xl font-bold text-white">{stats.topLevel}</p>
            </div>
            <Folder className="h-8 w-8 text-purple-400/60" />
          </div>
        </div>
      </div>

      {/* 主卡片 */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">前端导航管理</h2>
              <p className="text-sm text-white/60">管理前端导航菜单配置</p>
            </div>
            <button
              onClick={() => handleCreate()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新建导航项
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 搜索 */}
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="搜索导航项..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* 导航项列表 */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {topLevelItems.map((item, index) => renderNavItem(item, index))}
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
                    {editingItem ? '编辑导航项' : '新建导航项'}
                  </h3>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </button>
                </div>
                <p className="text-sm text-white/60 mt-1">
                  {editingItem ? '修改导航项配置' : '创建一个新的导航项'}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">
                      名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如: 首页"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">
                      路径 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      placeholder="例如: /home"
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
                      placeholder="例如: Home"
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
                  <label className="text-sm text-white/80">描述</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="导航项描述"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/80">父级导航项</label>
                  <select
                    value={formData.parentId || 'none'}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value === 'none' ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="none">无（顶级菜单）</option>
                    {navItems
                      .filter((item) => !item.parentId && item.id !== editingItem?.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
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
                  {editingItem ? '保存' : '创建'}
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
              <p className="text-white/60 mb-2">
                确定要删除导航项 "{deletingItem?.name}" 吗？此操作无法撤销。
              </p>
              {deletingItem && getChildItems(deletingItem.id).length > 0 && (
                <p className="text-red-400 text-sm mb-6">
                  警告：此导航项包含 {getChildItems(deletingItem.id).length} 个子项，删除后将一并删除。
                </p>
              )}
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
