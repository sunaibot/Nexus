import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Plus,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Megaphone,
  Settings,
  History,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'medium' | 'high'
  targetRoles: string[]
  isPublished: boolean
  publishedAt?: string
  readCount: number
  createdAt: string
}

interface Notification {
  id: string
  title: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

interface NotificationManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate?: (plugin: UnifiedPlugin) => void
}

// API 函数
async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch('/api/v2/announcements', {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取公告失败')
  const data = await res.json()
  return data.data || []
}

async function createAnnouncement(announcement: Partial<Announcement>): Promise<void> {
  const res = await fetch('/api/v2/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(announcement)
  })
  if (!res.ok) throw new Error('创建公告失败')
}

async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  const res = await fetch(`/api/v2/announcements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates)
  })
  if (!res.ok) throw new Error('更新公告失败')
}

async function deleteAnnouncement(id: string): Promise<void> {
  const res = await fetch(`/api/v2/announcements/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('删除公告失败')
}

async function publishAnnouncement(id: string): Promise<void> {
  const res = await fetch(`/api/v2/announcements/${id}/publish`, {
    method: 'POST',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('发布公告失败')
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch('/api/v2/notifications', {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取通知失败')
  const data = await res.json()
  return data.data || []
}

async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/v2/notifications/${id}/read`, {
    method: 'PATCH',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('标记已读失败')
}

async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(`/api/v2/notifications/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('删除通知失败')
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
}

const typeColors: Record<string, string> = {
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red'
}

const priorityColors: Record<string, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'red'
}

export default function NotificationManager({ plugin, onPluginUpdate }: NotificationManagerProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    content: string
    type: 'info' | 'success' | 'warning' | 'error'
    priority: 'low' | 'medium' | 'high'
    targetRoles: string[]
  }>({
    title: '',
    content: '',
    type: 'info',
    priority: 'medium',
    targetRoles: ['all']
  })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'announcements') {
        const data = await fetchAnnouncements()
        setAnnouncements(data)
      } else {
        const data = await fetchNotifications()
        setNotifications(data)
      }
    } catch (error: any) {
      showToast('error', error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      showToast('error', '请填写标题和内容')
      return
    }

    try {
      if (editingId) {
        await updateAnnouncement(editingId, formData)
        showToast('success', '公告更新成功')
      } else {
        await createAnnouncement(formData)
        showToast('success', '公告创建成功')
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ title: '', content: '', type: 'info', priority: 'medium', targetRoles: ['all'] })
      loadData()
    } catch (error: any) {
      showToast('error', error.message || '保存失败')
    }
  }

  // 删除公告
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return
    try {
      await deleteAnnouncement(id)
      showToast('success', '删除成功')
      loadData()
    } catch (error: any) {
      showToast('error', error.message || '删除失败')
    }
  }

  // 发布公告
  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement(id)
      showToast('success', '发布成功')
      loadData()
    } catch (error: any) {
      showToast('error', error.message || '发布失败')
    }
  }

  // 标记通知已读
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      loadData()
    } catch (error: any) {
      showToast('error', error.message || '操作失败')
    }
  }

  // 删除通知
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id)
      showToast('success', '删除成功')
      loadData()
    } catch (error: any) {
      showToast('error', error.message || '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'announcements'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
            style={{ color: activeTab === 'announcements' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Megaphone className="w-4 h-4" />
            公告管理
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
            style={{ color: activeTab === 'notifications' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Bell className="w-4 h-4" />
            通知列表
          </button>
        </div>

        {activeTab === 'announcements' && (
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({ title: '', content: '', type: 'info', priority: 'medium', targetRoles: ['all'] })
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="w-4 h-4" />
            新建公告
          </button>
        )}
      </div>

      {activeTab === 'announcements' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 公告表单 */}
          {showForm && (
            <div
              className="p-6 rounded-2xl border"
              style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
            >
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? '编辑公告' : '新建公告'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入公告标题"
                    className="w-full px-4 py-2 rounded-xl border bg-transparent"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="请输入公告内容"
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border bg-transparent resize-none"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">类型</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'success' | 'warning' | 'error' })}
                      className="w-full px-4 py-2 rounded-xl border bg-transparent"
                      style={{ borderColor: 'var(--color-glass-border)' }}
                    >
                      <option value="info">信息</option>
                      <option value="success">成功</option>
                      <option value="warning">警告</option>
                      <option value="error">错误</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">优先级</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full px-4 py-2 rounded-xl border bg-transparent"
                      style={{ borderColor: 'var(--color-glass-border)' }}
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl text-white"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 rounded-xl border"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 公告列表 */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <h3 className="font-semibold">公告列表</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
              {loading ? (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  加载中...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  暂无公告
                </div>
              ) : (
                announcements.map((item) => {
                  const Icon = typeIcons[item.type]
                  return (
                    <div key={item.id} className="p-4 flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg bg-${typeColors[item.type]}-500/20`}
                      >
                        <Icon className={`w-5 h-5 text-${typeColors[item.type]}-500`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{item.title}</h4>
                          {item.isPublished ? (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-500">
                              已发布
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-500">
                              草稿
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full bg-${priorityColors[item.priority]}-500/20 text-${priorityColors[item.priority]}-500`}>
                            {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                          {item.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>创建时间: {new Date(item.createdAt).toLocaleString()}</span>
                          {item.publishedAt && (
                            <span>发布时间: {new Date(item.publishedAt).toLocaleString()}</span>
                          )}
                          <span>阅读: {item.readCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.isPublished && (
                          <button
                            onClick={() => handlePublish(item.id)}
                            className="p-2 rounded-lg hover:bg-white/10"
                            title="发布"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingId(item.id)
                            setFormData({
                              title: item.title,
                              content: item.content,
                              type: item.type as 'info' | 'success' | 'warning' | 'error',
                              priority: item.priority as 'low' | 'medium' | 'high',
                              targetRoles: item.targetRoles
                            })
                            setShowForm(true)
                          }}
                          className="p-2 rounded-lg hover:bg-white/10"
                          title="编辑"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-red-500"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 通知列表 */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <h3 className="font-semibold">通知列表</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
              {loading ? (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  加载中...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  暂无通知
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = typeIcons[item.type]
                  return (
                    <div
                      key={item.id}
                      className={`p-4 flex items-start gap-4 ${item.isRead ? 'opacity-60' : ''}`}
                    >
                      <div className={`p-2 rounded-lg bg-${typeColors[item.type]}-500/20`}>
                        <Icon className={`w-5 h-5 text-${typeColors[item.type]}-500`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {item.content}
                        </p>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <button
                            onClick={() => handleMarkRead(item.id)}
                            className="p-2 rounded-lg hover:bg-white/10"
                            title="标记已读"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(item.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-red-500"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
