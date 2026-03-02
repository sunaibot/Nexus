import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Cloud,
  Save,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  FolderSync,
  Settings,
  AlertCircle
} from 'lucide-react'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'

interface WebDAVConfig {
  id?: string
  serverUrl: string
  username: string
  password: string
  remotePath: string
  syncInterval: number
  autoSync: boolean
  lastSyncAt?: string
  isEnabled: boolean
}

interface SyncLog {
  id: string
  action: string
  status: 'success' | 'failed'
  message: string
  createdAt: string
}

interface WebDAVManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate?: (plugin: UnifiedPlugin) => void
}

// API 函数
async function fetchWebDAVConfig(): Promise<WebDAVConfig | null> {
  const res = await fetch('/api/v2/webdav/config', {
    credentials: 'include'
  })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('获取配置失败')
  }
  const data = await res.json()
  return data.data
}

async function saveWebDAVConfig(config: Partial<WebDAVConfig>): Promise<void> {
  const res = await fetch('/api/v2/webdav/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(config)
  })
  if (!res.ok) throw new Error('保存配置失败')
}

async function testWebDAVConnection(config: Partial<WebDAVConfig>): Promise<boolean> {
  const res = await fetch('/api/v2/webdav/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(config)
  })
  return res.ok
}

async function syncWebDAV(): Promise<void> {
  const res = await fetch('/api/v2/webdav/sync', {
    method: 'POST',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('同步失败')
}

async function fetchSyncLogs(): Promise<SyncLog[]> {
  const res = await fetch('/api/v2/webdav/logs', {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取日志失败')
  const data = await res.json()
  return data.data || []
}

export default function WebDAVManager({ plugin, onPluginUpdate }: WebDAVManagerProps) {
  const { showToast } = useToast()
  const [config, setConfig] = useState<WebDAVConfig>({
    serverUrl: '',
    username: '',
    password: '',
    remotePath: '/nexus-sync',
    syncInterval: 30,
    autoSync: false,
    isEnabled: false
  })
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config')

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      const data = await fetchWebDAVConfig()
      if (data) {
        setConfig(data)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }, [])

  // 加载日志
  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchSyncLogs()
      setLogs(data)
    } catch (error) {
      console.error('加载日志失败:', error)
    }
  }, [])

  useEffect(() => {
    loadConfig()
    loadLogs()
  }, [loadConfig, loadLogs])

  // 保存配置
  const handleSave = async () => {
    if (!config.serverUrl || !config.username || !config.password) {
      showToast('error', '请填写完整的WebDAV配置信息')
      return
    }

    setLoading(true)
    try {
      await saveWebDAVConfig(config)
      showToast('success', '配置保存成功')
    } catch (error: any) {
      showToast('error', error.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 测试连接
  const handleTest = async () => {
    if (!config.serverUrl || !config.username || !config.password) {
      showToast('error', '请填写完整的WebDAV配置信息')
      return
    }

    setTesting(true)
    try {
      const success = await testWebDAVConnection({
        serverUrl: config.serverUrl,
        username: config.username,
        password: config.password
      })
      if (success) {
        showToast('success', '连接测试成功')
      } else {
        showToast('error', '连接测试失败')
      }
    } catch (error: any) {
      showToast('error', error.message || '测试失败')
    } finally {
      setTesting(false)
    }
  }

  // 手动同步
  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncWebDAV()
      showToast('success', '同步成功')
      loadLogs()
      loadConfig()
    } catch (error: any) {
      showToast('error', error.message || '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'config'
              ? 'bg-white dark:bg-gray-800 shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
          }`}
          style={{ color: activeTab === 'config' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <Settings className="w-4 h-4" />
          配置
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-gray-800 shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
          }`}
          style={{ color: activeTab === 'logs' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <FolderSync className="w-4 h-4" />
          同步日志
        </button>
      </div>

      {activeTab === 'config' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 配置表单 */}
          <div
            className="p-6 rounded-2xl border"
            style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              WebDAV 服务器配置
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  服务器地址
                </label>
                <input
                  type="url"
                  value={config.serverUrl}
                  onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                  placeholder="https://dav.example.com"
                  className="w-full px-4 py-2 rounded-xl border bg-transparent"
                  style={{ borderColor: 'var(--color-glass-border)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    用户名
                  </label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    placeholder="username"
                    className="w-full px-4 py-2 rounded-xl border bg-transparent"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    密码
                  </label>
                  <input
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    placeholder="password"
                    className="w-full px-4 py-2 rounded-xl border bg-transparent"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  远程路径
                </label>
                <input
                  type="text"
                  value={config.remotePath}
                  onChange={(e) => setConfig({ ...config, remotePath: e.target.value })}
                  placeholder="/nexus-sync"
                  className="w-full px-4 py-2 rounded-xl border bg-transparent"
                  style={{ borderColor: 'var(--color-glass-border)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    同步间隔（分钟）
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={config.syncInterval}
                    onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2 rounded-xl border bg-transparent"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoSync}
                      onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      启用自动同步
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all disabled:opacity-50"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              测试连接
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all disabled:opacity-50"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderSync className="w-4 h-4" />
              )}
              立即同步
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-white transition-all disabled:opacity-50"
              style={{ background: 'var(--color-primary)' }}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存配置
            </button>
          </div>

          {/* 状态信息 */}
          {config.lastSyncAt && (
            <div
              className="p-4 rounded-xl border flex items-center gap-3"
              style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                上次同步时间: {new Date(config.lastSyncAt).toLocaleString()}
              </span>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 同步日志 */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <h3 className="font-semibold">同步日志</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
              {logs.length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  暂无同步记录
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center gap-4">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {log.message}
                      </p>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
