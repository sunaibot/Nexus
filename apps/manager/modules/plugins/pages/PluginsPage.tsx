import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Database,
  ArrowLeft,
  LayoutGrid,
  Settings2,
  Puzzle,
  Hammer,
  Construction,
  Store,
  Box,
  Edit,
  Trash2,
  Play,
  MoreVertical,
  Power
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import type { UnifiedPlugin } from '../api-unified'
import type { BuildingPlugin } from '../types/builder'
import QuoteManager from '../components/QuoteManager/index'
import FileTransferManager from '../components/FileTransferManager/index'
import NotesManager from '../components/NotesManager/index'
import RssManager from '../components/RssManager/index'
import VisitsManager from '../components/VisitsManager/index'
import WebDAVManager from '../components/WebDAVManager/index'
import NotificationManager from '../components/NotificationManager/index'
import SlotConfigManager from '../components/SlotConfigManager/index'
import PluginDisplayConfigManager from '../components/PluginDisplayConfigManager'
import { UnifiedPluginManager } from '../components/UnifiedPluginManager'
import PartWorkshop from '../components/PartWorkshop'
import PluginBuilder from '../components/PluginBuilder'
import { 
  getCustomPlugins, 
  deleteCustomPlugin, 
  updateCustomPlugin,
  type CustomPlugin 
} from '@/lib/api-client/custom-plugins'

export default function PluginsPage() {
  const { showToast } = useToast()

  const [managingPlugin, setManagingPlugin] = useState<UnifiedPlugin | null>(null)
  const [activeTab, setActiveTab] = useState<'data' | 'slot' | 'display'>('data')
  
  // 自定义插件管理状态
  const [customPlugins, setCustomPlugins] = useState<CustomPlugin[]>([])
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const [editingPlugin, setEditingPlugin] = useState<BuildingPlugin | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  
  // 主页面状态 - 必须放在所有条件逻辑之前
  const [mainTab, setMainTab] = useState<'plugins' | 'market' | 'workshop' | 'custom'>('plugins')
  
  // 加载自定义插件列表
  const loadCustomPlugins = useCallback(async () => {
    setIsLoadingCustom(true)
    try {
      const plugins = await getCustomPlugins()
      setCustomPlugins(plugins)
    } catch (error) {
      console.error('加载自定义插件失败:', error)
      showToast('error', '加载自定义插件失败')
    } finally {
      setIsLoadingCustom(false)
    }
  }, [showToast])
  
  useEffect(() => {
    loadCustomPlugins()
  }, [loadCustomPlugins])
  
  // 删除自定义插件
  const handleDeleteCustomPlugin = async (id: string) => {
    if (!confirm('确定要删除这个插件吗？此操作不可撤销。')) return
    
    try {
      await deleteCustomPlugin(id)
      setCustomPlugins(prev => prev.filter(p => p.id !== id))
      showToast('success', '插件已删除')
    } catch (error) {
      console.error('删除插件失败:', error)
      showToast('error', '删除插件失败')
    }
  }
  
  // 切换插件启用状态
  const handleTogglePlugin = async (plugin: CustomPlugin) => {
    try {
      await updateCustomPlugin(plugin.id, { isEnabled: !plugin.isEnabled })
      setCustomPlugins(prev => prev.map(p => 
        p.id === plugin.id ? { ...p, isEnabled: !p.isEnabled } : p
      ))
      showToast('success', plugin.isEnabled ? '插件已禁用' : '插件已启用')
    } catch (error) {
      console.error('切换插件状态失败:', error)
      showToast('error', '操作失败')
    }
  }
  
  // 编辑自定义插件
  const handleEditPlugin = (plugin: CustomPlugin) => {
    setEditingPlugin({
      ...plugin.builderData,
      id: plugin.id,
    })
    setShowBuilder(true)
  }
  
  // 创建新插件
  const handleCreatePlugin = () => {
    setEditingPlugin(null)
    setShowBuilder(true)
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
            onClick={() => setActiveTab('slot')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'slot'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: activeTab === 'slot' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <LayoutGrid className="w-4 h-4" />
            插槽位置
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
            <Settings2 className="w-4 h-4" />
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
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id === 'file-transfer' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FileTransferManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id === 'notes' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <NotesManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id === 'rss' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RssManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id === 'visits' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VisitsManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id === 'webdav' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WebDAVManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id === 'notifications' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <NotificationManager
                plugin={managingPlugin}
                onPluginUpdate={(updated) => {
                  setManagingPlugin(updated)
                }}
              />
            </motion.div>
          )}
          {activeTab === 'data' && managingPlugin.id !== 'quotes' && managingPlugin.id !== 'file-transfer' && managingPlugin.id !== 'notes' && managingPlugin.id !== 'rss' && managingPlugin.id !== 'visits' && managingPlugin.id !== 'webdav' && managingPlugin.id !== 'notifications' && (
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
          {activeTab === 'slot' && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SlotConfigManager plugin={managingPlugin} />
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
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // 主页面
  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>插件中心</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              管理插件、制造零件、构建应用
            </p>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
          <button
            onClick={() => setMainTab('plugins')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'plugins'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: mainTab === 'plugins' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Box className="w-4 h-4" />
            我的插件
          </button>
          <button
            onClick={() => setMainTab('market')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'market'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: mainTab === 'market' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Store className="w-4 h-4" />
            插件市场
          </button>
          <button
            onClick={() => setMainTab('workshop')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'workshop'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: mainTab === 'workshop' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Hammer className="w-4 h-4" />
            零件工坊
          </button>
          <button
            onClick={() => setMainTab('custom')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'custom'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            )}
            style={{ color: mainTab === 'custom' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Construction className="w-4 h-4" />
            自定义插件
            {customPlugins.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {customPlugins.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mainTab === 'plugins' && (
            <motion.div
              key="plugins"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full p-4"
            >
              <UnifiedPluginManager onManagePlugin={setManagingPlugin} />
            </motion.div>
          )}
          {mainTab === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center" style={{ color: 'var(--color-text-muted)' }}>
                <Store className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">插件市场</p>
                <p className="text-sm">敬请期待...</p>
              </div>
            </motion.div>
          )}
          {mainTab === 'workshop' && (
            <motion.div
              key="workshop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <PartWorkshop />
            </motion.div>
          )}
          {mainTab === 'custom' && !showBuilder && (
            <motion.div
              key="custom-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full p-4 overflow-auto"
            >
              {/* 自定义插件列表 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    自定义插件
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    通过可视化构建器创建的插件
                  </p>
                </div>
                <button
                  onClick={handleCreatePlugin}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  新建插件
                </button>
              </div>

              {isLoadingCustom ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : customPlugins.length === 0 ? (
                <div className="text-center py-16 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--color-glass-border)' }}>
                  <Construction className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    还没有自定义插件
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                    点击"新建插件"开始创建你的第一个插件
                  </p>
                  <button
                    onClick={handleCreatePlugin}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    新建插件
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customPlugins.map(plugin => (
                    <div
                      key={plugin.id}
                      className="p-4 rounded-xl border transition-all hover:shadow-lg"
                      style={{ 
                        background: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-glass-border)'
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-3xl">{plugin.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {plugin.name}
                          </h3>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {plugin.description || '暂无描述'}
                          </p>
                        </div>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          plugin.isEnabled ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{plugin.builderData?.components?.length || 0} 个组件</span>
                        <span>•</span>
                        <span>v{plugin.version}</span>
                        <span>•</span>
                        <span>{new Date(plugin.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePlugin(plugin)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            plugin.isEnabled 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          <Power className="w-4 h-4" />
                          {plugin.isEnabled ? '已启用' : '已禁用'}
                        </button>
                        <button
                          onClick={() => handleEditPlugin(plugin)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomPlugin(plugin.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {mainTab === 'custom' && showBuilder && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <PluginBuilder
                initialPlugin={editingPlugin || undefined}
                onSave={(plugin) => {
                  console.log('保存插件:', plugin)
                }}
                onSaved={() => {
                  loadCustomPlugins()
                  setShowBuilder(false)
                  setEditingPlugin(null)
                }}
                onCancel={() => {
                  setShowBuilder(false)
                  setEditingPlugin(null)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
