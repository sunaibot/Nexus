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
  Users,
  Shield,
  Globe,
  Bookmark,
  Folder,
  FolderOpen,
  BarChart3,
  Puzzle,
  Settings,
  ClipboardList,
  Palette,
  Image,
  X,
  Check,
  type LucideIcon
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import { 
  fetchAdminMenus, 
  createAdminMenu, 
  updateAdminMenu, 
  deleteAdminMenu,
  reorderAdminMenus,
  type AdminMenu,
  type CreateAdminMenuData,
  type UpdateAdminMenuData,
  type ReorderMenuItem
} from '../../../lib/api-client'

// 图标映射表 - 从后端获取的图标名称映射到实际组件
const iconMap: Record<string, LucideIcon> = {
  Layout,
  Bookmark,
  BookMarked: Bookmark,
  Folder,
  FolderOpen,
  BarChart3,
  Puzzle,
  Users,
  Settings,
  ClipboardList,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Palette,
  Image,
}

// 所有可用图标列表（用于选择）
const availableIcons = [
  { name: 'Layout', label: '布局' },
  { name: 'Bookmark', label: '书签' },
  { name: 'Folder', label: '文件夹' },
  { name: 'BarChart3', label: '图表' },
  { name: 'Puzzle', label: '插件' },
  { name: 'Users', label: '用户' },
  { name: 'Settings', label: '设置' },
  { name: 'ClipboardList', label: '列表' },
  { name: 'Shield', label: '安全' },
  { name: 'Globe', label: '公开' },
  { name: 'Palette', label: '主题' },
  { name: 'Image', label: '图片' },
]

export default function MenusPage() {
  const { showToast } = useToast()

  const [menus, setMenus] = useState<AdminMenu[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<AdminMenu | null>(null)
  const [draggedItem, setDraggedItem] = useState<AdminMenu | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateAdminMenuData & UpdateAdminMenuData>({
    name: '',
    path: '',
    icon: '',
    orderIndex: 0,
    visibility: 'public',
    allowedRoles: [],
  })

  const loadMenus = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminMenus()
      // 按 orderIndex 排序
      const sorted = data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      setMenus(sorted)
    } catch (err: any) {
      showToast('error', err.message || '加载菜单失败')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  // 保存排序到后端
  const saveOrder = async (newMenus: AdminMenu[]) => {
    setIsSavingOrder(true)
    try {
      const items: ReorderMenuItem[] = newMenus.map((menu, index) => ({
        id: menu.id,
        orderIndex: index + 1,
      }))
      await reorderAdminMenus(items)
      showToast('success', '菜单排序已保存')
    } catch (err: any) {
      showToast('error', err.message || '保存排序失败')
    } finally {
      setIsSavingOrder(false)
    }
  }

  // 拖拽开始
  const handleDragStart = (menu: AdminMenu) => {
    setDraggedItem(menu)
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  // 放置
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedItem) return

    const dragIndex = menus.findIndex(m => m.id === draggedItem.id)
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    // 重新排序
    const newMenus = [...menus]
    const [removed] = newMenus.splice(dragIndex, 1)
    newMenus.splice(dropIndex, 0, removed)

    // 更新本地状态
    setMenus(newMenus)
    setDraggedItem(null)
    setDragOverIndex(null)

    // 保存到后端
    await saveOrder(newMenus)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMenu) {
        await updateAdminMenu(editingMenu.id, formData)
        showToast('success', '菜单更新成功')
      } else {
        await createAdminMenu({
          ...formData,
          orderIndex: formData.orderIndex || menus.length + 1,
        })
        showToast('success', '菜单创建成功')
      }
      setShowModal(false)
      setEditingMenu(null)
      resetForm()
      await loadMenus()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleEdit = (menu: AdminMenu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      path: menu.path || '',
      icon: menu.icon || '',
      orderIndex: menu.orderIndex || 0,
      parentId: menu.parentId,
      enabled: menu.isEnabled,
      visibility: menu.visibility,
      allowedRoles: menu.allowedRoles || [],
      pluginId: menu.pluginId,
    })
    setShowModal(true)
  }

  const handleDelete = async (menu: AdminMenu) => {
    if (!confirm(`确定要删除菜单 "${menu.name}" 吗？`)) return
    try {
      await deleteAdminMenu(menu.id)
      showToast('success', '菜单删除成功')
      await loadMenus()
    } catch (err: any) {
      showToast('error', err.message || '删除失败')
    }
  }

  const handleToggleEnabled = async (menu: AdminMenu) => {
    try {
      await updateAdminMenu(menu.id, { enabled: !menu.isEnabled })
      showToast('success', menu.isEnabled ? '菜单已禁用' : '菜单已启用')
      await loadMenus()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      icon: '',
      orderIndex: menus.length + 1,
      visibility: 'public',
      allowedRoles: [],
    })
  }

  const getVisibilityInfo = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return { icon: Globe, color: '#22c55e', label: '公开' }
      case 'role':
        return { icon: Shield, color: '#3b82f6', label: '角色' }
      default:
        return { icon: Users, color: '#f59e0b', label: '私有' }
    }
  }

  const renderMenuItem = (menu: AdminMenu, index: number) => {
    const visibilityInfo = getVisibilityInfo(menu.visibility)
    const VisibilityIcon = visibilityInfo.icon
    const IconComponent = menu.icon ? iconMap[menu.icon] : null
    const isDragging = draggedItem?.id === menu.id
    const isDragOver = dragOverIndex === index

    return (
      <motion.div
        key={menu.id}
        draggable
        onDragStart={() => handleDragStart(menu)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
        className={cn(
          'p-4 rounded-xl transition-all',
          isDragOver && 'border-t-2 border-primary'
        )}
        style={{ 
          background: isDragging ? 'var(--color-glass-hover)' : 'var(--color-glass)', 
          border: '1px solid var(--color-glass-border)',
          cursor: 'move',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GripVertical 
                className="w-4 h-4" 
                style={{ color: 'var(--color-text-muted)', cursor: 'grab' }} 
              />
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center" 
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                {IconComponent ? (
                  <IconComponent className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                ) : (
                  <Layout className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {menu.name}
              </h3>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>ID: {menu.id}</span>
                {menu.path && <span>· 路径: {menu.path}</span>}
                <span>· 排序: {menu.orderIndex}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" 
              style={{ background: visibilityInfo.color + '20', color: visibilityInfo.color }}
            >
              <VisibilityIcon className="w-3 h-3" />
              {visibilityInfo.label}
            </div>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              menu.isEnabled 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            )}>
              {menu.isEnabled ? '已启用' : '已禁用'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleEnabled(menu)}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  menu.isEnabled 
                    ? 'text-green-400 hover:bg-green-500/20' 
                    : 'text-gray-400 hover:bg-gray-500/20'
                )}
                title={menu.isEnabled ? '禁用' : '启用'}
              >
                {menu.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleEdit(menu)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                style={{ color: 'var(--color-text-muted)' }}
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(menu)}
                className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/20 transition-all"
                style={{ color: 'var(--color-text-muted)' }}
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            共 {menus.length} 个菜单 · 拖拽可排序
            {isSavingOrder && ' · 保存中...'}
          </p>
        </div>
        <motion.button
          onClick={() => {
            setEditingMenu(null)
            resetForm()
            setShowModal(true)
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
        >
          <Plus className="w-4 h-4" />
          添加菜单
        </motion.button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center">
          <div 
            className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-current border-t-transparent rounded-full" 
            style={{ color: 'var(--color-primary)' }} 
          />
          <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
        </div>
      ) : menus.length === 0 ? (
        <div 
          className="p-16 text-center" 
          style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: '1rem' }}
        >
          <Layout className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-muted)' }}>暂无菜单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu, index) => renderMenuItem(menu, index))}
        </div>
      )}

      {/* 编辑/创建弹窗 */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg p-6 rounded-2xl"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {editingMenu ? '编辑菜单' : '添加菜单'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 菜单ID */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  菜单ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingMenu?.id || formData.name?.toLowerCase().replace(/\s+/g, '-') || ''}
                  readOnly
                  disabled={!!editingMenu}
                  placeholder="唯一标识，如: bookmarks"
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent disabled:opacity-50"
                  style={{ 
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  菜单ID是系统的唯一标识，创建后不可修改
                </p>
              </div>

              {/* 菜单名称 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  菜单名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如: 书签管理"
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent"
                  style={{ 
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  required
                />
              </div>

              {/* 路径 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  路径
                </label>
                <input
                  type="text"
                  value={formData.path || ''}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="如: bookmarks"
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent"
                  style={{ 
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              {/* 图标选择 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  图标
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableIcons.map((icon) => {
                    const IconComp = iconMap[icon.name]
                    const isSelected = formData.icon === icon.name
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icon.name })}
                        className={cn(
                          'p-3 rounded-xl border transition-all flex flex-col items-center gap-1',
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : 'border-[var(--color-glass-border)] hover:border-primary/50'
                        )}
                        title={icon.label}
                      >
                        <IconComp className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{icon.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 可见性 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  可见性
                </label>
                <select
                  value={formData.visibility || 'public'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'role' | 'private' })}
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent"
                  style={{ 
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="public">公开（所有用户可见）</option>
                  <option value="role">角色（指定角色可见）</option>
                  <option value="private">私有（仅自己可见）</option>
                </select>
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  排序序号
                </label>
                <input
                  type="number"
                  value={formData.orderIndex || ''}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                  placeholder="数字越小越靠前"
                  className="w-full px-4 py-2.5 rounded-xl border bg-transparent"
                  style={{ 
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              {/* 启用状态 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled !== false}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="enabled" style={{ color: 'var(--color-text-secondary)' }}>
                  启用此菜单
                </label>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all"
                  style={{ 
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all"
                  style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
                >
                  {editingMenu ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
