import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Database,
  ArrowLeft,
  LayoutGrid,
  Settings2,
  Puzzle
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import type { UnifiedPlugin } from '../api-unified'
import QuoteManager from '../components/QuoteManager/index'
import FileTransferManager from '../components/FileTransferManager/index'
import SlotConfigManager from '../components/SlotConfigManager/index'
import PluginDisplayConfigManager from '../components/PluginDisplayConfigManager'
import { UnifiedPluginManager } from '../components/UnifiedPluginManager'

export default function PluginsPage() {
  const { showToast } = useToast()

  const [managingPlugin, setManagingPlugin] = useState<UnifiedPlugin | null>(null)
  const [activeTab, setActiveTab] = useState<'data' | 'slot' | 'display'>('data')

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
          {activeTab === 'data' && managingPlugin.id !== 'quotes' && managingPlugin.id !== 'file-transfer' && (
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

  // 主页面：只显示新的统一插件管理器
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>插件中心</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              管理和配置所有插件
            </p>
          </div>
        </div>
      </div>

      <UnifiedPluginManager onManagePlugin={setManagingPlugin} />
    </div>
  )
}
