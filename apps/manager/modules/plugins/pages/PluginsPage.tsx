import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Power, 
  Puzzle,
  EyeOff,
  Users,
  Shield,
  Globe,
  Database,
  ArrowLeft,
  LayoutGrid,
  Settings2,
  Download
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import { 
  fetchPlugins, 
  createPlugin, 
  updatePlugin, 
  deletePlugin,
  installPlugin,
  type Plugin,
  type CreatePluginData,
  type UpdatePluginData
} from '../../../lib/api-client'
import { getCurrentUserRole } from '../../../lib/api-client/client'
import QuoteManager from '../components/QuoteManager/index'
import PluginDisplayConfigManager from '../components/PluginDisplayConfigManager'

export default function PluginsPage() {
  const { showToast } = useToast()

  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null)
  const [managingPlugin, setManagingPlugin] = useState<Plugin | null>(null)
  const [configuringPlugin, setConfiguringPlugin] = useState<Plugin | null>(null)
  const [activeTab, setActiveTab] = useState<'data' | 'display'>('data')
  const [formData, setFormData] = useState<CreatePluginData & UpdatePluginData>({
    name: '',
    description: '',
    version: '1.0.0',
    author: '',
    icon: '',
    visibility: 'public',
    allowedRoles: [],
  })

  const loadPlugins = useCallback(async () => {
    setIsLoading(true)
    try {
      // 获取所有插件，包括已卸载的
      const data = await fetchPlugins(undefined, true)
      setPlugins(data)
    } catch (err: any) {
      showToast('error', err.message || '加载插件失败')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadPlugins()
  }, [loadPlugins])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPlugin) {
        await updatePlugin(editingPlugin.id, formData)
        showToast('success', '插件更新成功')
      } else {
        await createPlugin(formData)
        showToast('success', '插件创建成功')
      }
      setShowModal(false)
      setEditingPlugin(null)
      resetForm()
      await loadPlugins()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const handleEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin)
    setFormData({
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      icon: plugin.icon,
      isEnabled: plugin.isEnabled,
      visibility: plugin.visibility,
      allowedRoles: plugin.allowedRoles || [],
      config: plugin.config,
    })
    setShowModal(true)
  }

  const handleDelete = async (plugin: Plugin) => {
    if (!confirm(`确定要卸载插件 "${plugin.name}" 吗？卸载后可以重新安装。`)) return
    try {
      await deletePlugin(plugin.id)
      showToast('success', '插件卸载成功')
      await loadPlugins()
    } catch (err: any) {
      showToast('error', err.message || '卸载失败')
    }
  }

  const handleInstall = async (plugin: Plugin) => {
    try {
      await installPlugin(plugin.id)
      showToast('success', '插件安装成功')
      await loadPlugins()
    } catch (err: any) {
      showToast('error', err.message || '安装失败')
    }
  }

  const handleToggleEnabled = async (plugin: Plugin) => {
    const userRole = getCurrentUserRole()
    if (userRole !== 'admin') {
      showToast('error', '需要管理员权限才能启用/禁用插件')
      return
    }

    try {
      await updatePlugin(plugin.id, { isEnabled: !plugin.isEnabled })
      showToast('success', plugin.isEnabled ? '插件已禁用' : '插件已启用')
      await loadPlugins()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      version: '1.0.0',
      author: '',
      icon: '',
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

  // 渲染插件数据管理视图
  if (managingPlugin) {
    return (
      <div className="space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setManagingPlugin(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              background: 'var(--color-glass-hover)',
              color: 'var(--color-text-primary)'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            返回插件列表
          </button>
          <div>
            <h2 className="text-lg font-semibold">{managingPlugin.name}</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              管理插件数据和显示配置
            </p>
          </div>
        </div>

        {/* 标签页切换 */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'data'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: activeTab === 'data' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Database className="w-4 h-4" />
            数据管理
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'display'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: activeTab === 'display' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <LayoutGrid className="w-4 h-4" />
            显示配置
          </button>
        </div>

        {/* 根据标签页渲染对应内容 */}
        <AnimatePresence mode="wait">
          {activeTab === 'data' && managingPlugin.id === 'quotes' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QuoteManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                  loadPlugins()
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id !== 'quotes' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 text-center rounded-xl border"
              style={{ 
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-glass-border)'
              }}
            >
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                插件 "{managingPlugin.name}" 暂无数据管理功能
              </p>
            </motion.div>
          )}
          {activeTab === 'display' && (
            <motion.div
              key="display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PluginDisplayConfigManager
                plugin={managingPlugin}
                onConfigUpdate={() => {
                  loadPlugins()
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            共 {plugins.length} 个插件
          </p>
        </div>
        <motion.button
          onClick={() => {
            setEditingPlugin(null)
            resetForm()
            setShowModal(true)
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
        >
          <Plus className="w-4 h-4" />
          添加插件
        </motion.button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center">
          <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-current border-t-transparent rounded-full" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
        </div>
      ) : plugins.length === 0 ? (
        <div className="p-16 text-center" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: '1rem' }}>
          <Puzzle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-muted)' }}>暂无插件</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => {
            const visibilityInfo = getVisibilityInfo(plugin.visibility)
            const VisibilityIcon = visibilityInfo.icon
            return (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl"
                style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)' }}>
                      {plugin.icon ? (
                        <img src={plugin.icon} alt="" className="w-6 h-6" />
                      ) : (
                        <Puzzle className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {plugin.name}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        v{plugin.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: visibilityInfo.color + '20', color: visibilityInfo.color }}>
                      <VisibilityIcon className="w-3 h-3" />
                      {visibilityInfo.label}
                    </div>
                  </div>
                </div>

                {plugin.description && (
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {plugin.description}
                  </p>
                )}

                {plugin.author && (
                  <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    作者: {plugin.author}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                  <div className="flex items-center gap-2">
                    {/* 已安装的插件显示操作按钮 */}
                    {(plugin as any).isInstalled !== false ? (
                      <>
                        <button
                          onClick={() => handleToggleEnabled(plugin)}
                          className={cn(
                            'p-2 rounded-lg transition-all',
                            plugin.isEnabled
                              ? 'text-green-400 hover:bg-green-500/20'
                              : 'text-gray-400 hover:bg-gray-500/20'
                          )}
                          title={plugin.isEnabled ? '禁用' : '启用'}
                        >
                          {plugin.isEnabled ? <Power className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(plugin)}
                          className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plugin)}
                          className="p-2 rounded-lg hover:text-orange-400 hover:bg-orange-500/20 transition-all"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="卸载"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {/* 管理数据按钮 */}
                        <button
                          onClick={() => setManagingPlugin(plugin)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
                          style={{ 
                            background: 'var(--color-glass-hover)',
                            color: 'var(--color-text-primary)'
                          }}
                          title="管理插件数据"
                        >
                          <Database className="w-3.5 h-3.5" />
                          管理数据
                        </button>
                      </>
                    ) : (
                      /* 未安装的插件显示安装按钮 */
                      <button
                        onClick={() => handleInstall(plugin)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all bg-blue-500 hover:bg-blue-600 text-white"
                        title="安装插件"
                      >
                        <Download className="w-3.5 h-3.5" />
                        安装
                      </button>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    (plugin as any).isInstalled === false
                      ? 'bg-gray-500/20 text-gray-400'
                      : plugin.isEnabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  )}>
                    {(plugin as any).isInstalled === false ? '未安装' : plugin.isEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-2xl"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {editingPlugin ? '编辑插件' : '添加插件'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  插件名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  描述
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none resize-none"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    版本
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    作者
                  </label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  图标 URL
                </label>
                <input
                  type="url"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  可见性
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'role' | 'private' })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="public">公开 - 所有人可见</option>
                  <option value="role">角色 - 仅允许的角色可见</option>
                  <option value="private">私有 - 仅通过关联表配置的用户可见</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-white font-medium"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {editingPlugin ? '保存修改' : '创建'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
