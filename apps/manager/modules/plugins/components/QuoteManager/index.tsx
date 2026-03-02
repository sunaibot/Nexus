import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Quote,
  User,
  Calendar,
  Tag,
  X,
  Settings,
  Eye,
  Play,
  Code,
  Copy,
  Check,
  Power,
  Database,
  Globe,
  Sparkles
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'
import { getCurrentUserRole } from '../../../../lib/api-client/client'

// 名言数据类型
interface Quote {
  id: string
  content: string
  author?: string
  source?: string
  category?: string
  tags?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface QuoteFormData {
  content: string
  author: string
  source: string
  category: string
  tags: string
  isActive: boolean
}

// 插件配置类型
interface QuotePluginConfig {
  apiEnabled: boolean
  apiEndpoint: string
  apiAuth: 'none' | 'token' | 'key'
  apiRateLimit: number
  defaultCategory: string
  showAuthor: boolean
  showSource: boolean
  randomEnabled: boolean
  dailyQuoteEnabled: boolean
}

interface QuoteManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate?: (plugin: UnifiedPlugin) => void
}

const defaultConfig: QuotePluginConfig = {
  apiEnabled: true,
  apiEndpoint: '/api/quotes',
  apiAuth: 'none',
  apiRateLimit: 100,
  defaultCategory: 'inspiration',
  showAuthor: true,
  showSource: true,
  randomEnabled: true,
  dailyQuoteEnabled: true
}

// 内置名言数据
const builtInQuotes: Quote[] = [
  {
    id: 'builtin-1',
    content: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。',
    author: '维维安·格林',
    source: '',
    category: 'inspiration',
    tags: ['生活', '励志'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-2',
    content: '知之者不如好之者，好之者不如乐之者。',
    author: '孔子',
    source: '论语',
    category: 'wisdom',
    tags: ['学习', '智慧'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-3',
    content: '天行健，君子以自强不息。地势坤，君子以厚德载物。',
    author: '周易',
    source: '易经',
    category: 'wisdom',
    tags: ['励志', '传统文化'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-4',
    content: '路漫漫其修远兮，吾将上下而求索。',
    author: '屈原',
    source: '离骚',
    category: 'poetry',
    tags: ['诗词', '追求'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-5',
    content: '不积跬步，无以至千里；不积小流，无以成江海。',
    author: '荀子',
    source: '劝学',
    category: 'wisdom',
    tags: ['学习', '积累'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export default function QuoteManager({ plugin, onPluginUpdate }: QuoteManagerProps) {
  const { showToast } = useToast()

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'data' | 'config' | 'api' | 'preview'>('data')

  // 插件状态
  const [isPluginEnabled, setIsPluginEnabled] = useState<boolean>(!!plugin.isEnabled || false)
  const [config, setConfig] = useState<QuotePluginConfig>(() => {
    const pluginConfig = plugin.config
    return {
      ...defaultConfig,
      ...(pluginConfig ? (pluginConfig as unknown as QuotePluginConfig) : {})
    }
  })

  // 名言数据状态
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [formData, setFormData] = useState<QuoteFormData>({
    content: '',
    author: '',
    source: '',
    category: '',
    tags: '',
    isActive: true
  })

  // 预览状态
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null)
  const [copied, setCopied] = useState(false)

  // 加载名言列表
  const loadQuotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/quotes?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setQuotes(result.data)
      } else {
        setQuotes([])
      }
    } catch (err: any) {
      showToast('error', err.message || '加载名言失败')
      setQuotes([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, showToast])

  useEffect(() => {
    if (isPluginEnabled) {
      loadQuotes()
    }
  }, [loadQuotes, isPluginEnabled])

  // 切换插件启用状态
  const handleTogglePlugin = async () => {
    const userRole = getCurrentUserRole()
    if (userRole !== 'admin') {
      showToast('error', '需要管理员权限才能启用/禁用插件')
      return
    }

    try {
      const response = await fetch(`/api/v2/plugins/${plugin.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isEnabled: !isPluginEnabled })
      })

      if (response.ok) {
        setIsPluginEnabled(!isPluginEnabled)
        showToast('success', isPluginEnabled ? '插件已禁用' : '插件已启用')
        onPluginUpdate?.({ ...plugin, isEnabled: !isPluginEnabled ? 1 : 0 })
      } else if (response.status === 403) {
        showToast('error', '需要管理员权限')
      }
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const response = await fetch(`/api/v2/plugins/${plugin.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ config })
      })

      if (response.ok) {
        showToast('success', '配置保存成功')
        onPluginUpdate?.({ ...plugin, config: config as unknown as Record<string, unknown> })
      }
    } catch (err: any) {
      showToast('error', err.message || '保存失败')
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      content: '',
      author: '',
      source: '',
      category: '',
      tags: '',
      isActive: true
    })
    setEditingQuote(null)
  }

  // 打开添加弹窗
  const handleAdd = () => {
    resetForm()
    setShowModal(true)
  }

  // 打开编辑弹窗
  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote)
    setFormData({
      content: quote.content,
      author: quote.author || '',
      source: quote.source || '',
      category: quote.category || '',
      tags: quote.tags?.join(', ') || '',
      isActive: quote.isActive
    })
    setShowModal(true)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      showToast('error', '名言内容不能为空')
      return
    }

    const data = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    try {
      const url = editingQuote ? `/api/quotes/${editingQuote.id}` : '/api/quotes'
      const method = editingQuote ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', editingQuote ? '名言更新成功' : '名言创建成功')
        setShowModal(false)
        resetForm()
        loadQuotes()
      } else {
        showToast('error', result.error || '操作失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  // 删除名言
  const handleDelete = async (quote: Quote) => {
    if (!confirm(`确定要删除这条名言吗？\n\n"${quote.content.substring(0, 50)}..."`)) return

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', '名言删除成功')
        loadQuotes()
      } else {
        showToast('error', result.error || '删除失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '删除失败')
    }
  }

  // 切换启用状态
  const handleToggleActive = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !quote.isActive })
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', quote.isActive ? '名言已禁用' : '名言已启用')
        loadQuotes()
      } else {
        showToast('error', result.error || '操作失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 随机获取一条名言用于预览
  const handleRandomPreview = () => {
    const allQuotes = [...builtInQuotes, ...quotes].filter(q => q.isActive)
    if (allQuotes.length > 0) {
      const random = allQuotes[Math.floor(Math.random() * allQuotes.length)]
      setPreviewQuote(random)
    }
  }

  // 复制API代码
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('success', '代码已复制')
  }

  // API示例代码
  const apiExamples = {
    getAll: `// 获取所有名言
fetch('${config.apiEndpoint}')
  .then(res => res.json())
  .then(data => console.log(data))`,
    getRandom: `// 获取随机名言
fetch('${config.apiEndpoint}/random')
  .then(res => res.json())
  .then(data => console.log(data))`,
    getDaily: `// 获取每日名言
fetch('${config.apiEndpoint}/daily')
  .then(res => res.json())
  .then(data => console.log(data))`,
    getByCategory: `// 按分类获取名言
fetch('${config.apiEndpoint}?category=inspiration')
  .then(res => res.json())
  .then(data => console.log(data))`
  }

  if (!isPluginEnabled) {
    return (
      <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
        <Power className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          插件已禁用
        </h3>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          该插件当前处于禁用状态，无法管理数据。请先启用插件。
        </p>
        <button
          onClick={handleTogglePlugin}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium mx-auto"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
        >
          <Power className="w-4 h-4" />
          启用插件
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 插件状态栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border" style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Quote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{plugin.name}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>v{plugin.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-green-500/20 text-green-400">
            <Check className="w-3.5 h-3.5" />
            运行中
          </span>
          <button
            onClick={handleTogglePlugin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/20 hover:text-red-400"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Power className="w-4 h-4" />
            禁用
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        {[
          { id: 'data', label: '数据管理', icon: Database },
          { id: 'config', label: '插件配置', icon: Settings },
          { id: 'api', label: 'API接口', icon: Code },
          { id: 'preview', label: '效果预览', icon: Eye }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'text-white'
                : 'hover:bg-white/5'
            )}
            style={{
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)'
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 数据管理标签页 */}
      {activeTab === 'data' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{quotes.length}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>自定义名言</div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{builtInQuotes.length}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>内置名言</div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <div className="text-2xl font-bold text-green-400">
                {[...quotes, ...builtInQuotes].filter(q => q.isActive).length}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>已启用</div>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="搜索名言..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-48"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadQuotes}
                disabled={isLoading}
                className="p-2 rounded-lg border transition-colors"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
              >
                <Plus className="w-4 h-4" />
                添加名言
              </button>
            </div>
          </div>

          {/* 内置名言展示 */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-glass)' }}>
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-medium text-sm">内置名言（只读）</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
              {builtInQuotes.map((quote, index) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-white/5 transition-colors opacity-70"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-base leading-relaxed mb-2">"{quote.content}"</p>
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {quote.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{quote.author}</span>}
                        {quote.source && <span>《{quote.source}》</span>}
                        {quote.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{quote.category}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">内置</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 自定义名言列表 */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-glass)' }}>
              <Database className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-sm">自定义名言</span>
            </div>
            {isLoading ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                加载中...
              </div>
            ) : quotes.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                <Quote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                暂无自定义名言，点击"添加名言"创建
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
                {quotes.map((quote, index) => (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-base leading-relaxed mb-2">"{quote.content}"</p>
                        <div className="flex items-center gap-4 text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {quote.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{quote.author}</span>}
                          {quote.source && <span>《{quote.source}》</span>}
                          {quote.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{quote.category}</span>}
                        </div>
                        {quote.tags && quote.tags.length > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            {quote.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-muted)' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(quote.createdAt)}</span>
                          <span className={cn('px-2 py-0.5 rounded-full', quote.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400')}>{quote.isActive ? '已启用' : '已禁用'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleActive(quote)} className={cn('p-2 rounded-lg transition-colors', quote.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-400 hover:bg-gray-500/20')} title={quote.isActive ? '禁用' : '启用'}>
                          {quote.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(quote)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--color-text-muted)' }} title="编辑"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(quote)} className="p-2 rounded-lg hover:text-red-400 hover:bg-red-500/20 transition-colors" style={{ color: 'var(--color-text-muted)' }} title="删除"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 配置标签页 */}
      {activeTab === 'config' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-xl border space-y-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Settings className="w-5 h-5" />API设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>启用API接口</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>允许通过API获取名言数据</div>
                </div>
                <button onClick={() => setConfig({ ...config, apiEnabled: !config.apiEnabled })} className={cn('w-12 h-6 rounded-full transition-colors relative', config.apiEnabled ? 'bg-green-500' : 'bg-gray-500')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all', config.apiEnabled ? 'left-6' : 'left-0.5')} />
                </button>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>API端点</label>
                <input type="text" value={config.apiEndpoint} onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border outline-none" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>认证方式</label>
                <select value={config.apiAuth} onChange={(e) => setConfig({ ...config, apiAuth: e.target.value as any })} className="w-full px-4 py-2.5 rounded-lg border outline-none" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }}>
                  <option value="none">无需认证</option>
                  <option value="token">Token认证</option>
                  <option value="key">API Key认证</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>请求频率限制（次/小时）</label>
                <input type="number" value={config.apiRateLimit} onChange={(e) => setConfig({ ...config, apiRateLimit: parseInt(e.target.value) || 100 })} className="w-full px-4 py-2.5 rounded-lg border outline-none" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border space-y-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Eye className="w-5 h-5" />显示设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>显示作者</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>在展示名言时显示作者信息</div>
                </div>
                <button onClick={() => setConfig({ ...config, showAuthor: !config.showAuthor })} className={cn('w-12 h-6 rounded-full transition-colors relative', config.showAuthor ? 'bg-green-500' : 'bg-gray-500')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all', config.showAuthor ? 'left-6' : 'left-0.5')} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>显示来源</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>在展示名言时显示来源信息</div>
                </div>
                <button onClick={() => setConfig({ ...config, showSource: !config.showSource })} className={cn('w-12 h-6 rounded-full transition-colors relative', config.showSource ? 'bg-green-500' : 'bg-gray-500')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all', config.showSource ? 'left-6' : 'left-0.5')} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border space-y-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Sparkles className="w-5 h-5" />功能开关</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>随机名言</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>允许获取随机名言</div>
                </div>
                <button onClick={() => setConfig({ ...config, randomEnabled: !config.randomEnabled })} className={cn('w-12 h-6 rounded-full transition-colors relative', config.randomEnabled ? 'bg-green-500' : 'bg-gray-500')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all', config.randomEnabled ? 'left-6' : 'left-0.5')} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>每日名言</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>启用每日一言功能</div>
                </div>
                <button onClick={() => setConfig({ ...config, dailyQuoteEnabled: !config.dailyQuoteEnabled })} className={cn('w-12 h-6 rounded-full transition-colors relative', config.dailyQuoteEnabled ? 'bg-green-500' : 'bg-gray-500')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all', config.dailyQuoteEnabled ? 'left-6' : 'left-0.5')} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveConfig} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium" style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}>
              <Check className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </motion.div>
      )}

      {/* API标签页 */}
      {activeTab === 'api' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Globe className="w-5 h-5" />API端点信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400">GET</span>
                <code className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{config.apiEndpoint}</code>
                <span style={{ color: 'var(--color-text-muted)' }}>获取所有名言</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400">GET</span>
                <code className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{config.apiEndpoint}/random</code>
                <span style={{ color: 'var(--color-text-muted)' }}>获取随机名言</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400">GET</span>
                <code className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{config.apiEndpoint}/daily</code>
                <span style={{ color: 'var(--color-text-muted)' }}>获取每日名言</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400">GET</span>
                <code className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{config.apiEndpoint}?category=xxx</code>
                <span style={{ color: 'var(--color-text-muted)' }}>按分类筛选</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Code className="w-5 h-5" />调用示例</h3>
            {Object.entries(apiExamples).map(([key, code]) => (
              <div key={key} className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
                <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-glass)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {key === 'getAll' && '获取所有名言'}
                    {key === 'getRandom' && '获取随机名言'}
                    {key === 'getDaily' && '获取每日名言'}
                    {key === 'getByCategory' && '按分类获取'}
                  </span>
                  <button onClick={() => handleCopyCode(code)} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-white/10" style={{ color: 'var(--color-text-muted)' }}>
                    {copied ? <><Check className="w-3 h-3" />已复制</> : <><Copy className="w-3 h-3" />复制</>}
                  </button>
                </div>
                <pre className="p-4 text-sm overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}><code>{code}</code></pre>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 预览标签页 */}
      {activeTab === 'preview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-center">
            <button onClick={handleRandomPreview} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium" style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}>
              <Play className="w-4 h-4" />
              随机预览
            </button>
          </div>

          {previewQuote ? (
            <div className="max-w-2xl mx-auto">
              <div className="p-8 rounded-2xl border relative" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
                <Quote className="absolute top-4 left-4 w-8 h-8 opacity-20" style={{ color: 'var(--color-primary)' }} />
                <div className="text-center py-8">
                  <p className="text-xl leading-relaxed mb-6" style={{ color: 'var(--color-text-primary)' }}>"{previewQuote.content}"</p>
                  {(config.showAuthor || config.showSource) && (
                    <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {config.showAuthor && previewQuote.author && <span>—— {previewQuote.author}</span>}
                      {config.showSource && previewQuote.source && <span>《{previewQuote.source}》</span>}
                    </div>
                  )}
                  {previewQuote.tags && previewQuote.tags.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      {previewQuote.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full text-xs" style={{ background: 'var(--color-glass)', color: 'var(--color-text-muted)' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>这是名言在前台的展示效果预览</p>
            </div>
          ) : (
            <div className="p-16 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>点击"随机预览"查看名言展示效果</p>
            </div>
          )}
        </motion.div>
      )}

      {/* 添加/编辑弹窗 */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
                <h3 className="text-lg font-semibold">{editingQuote ? '编辑名言' : '添加名言'}</h3>
                <button onClick={() => { setShowModal(false); resetForm() }} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--color-text-muted)' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>名言内容 *</label>
                  <textarea required rows={4} value={formData.content} onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))} className="w-full px-3 py-2 rounded-lg border outline-none resize-none" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} placeholder="输入名言内容..." />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>作者</label>
                  <input type="text" value={formData.author} onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} placeholder="输入作者名称..." />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>来源</label>
                  <input type="text" value={formData.source} onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} placeholder="输入来源（如书籍、电影等）..." />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>分类</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} placeholder="输入分类..." />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>标签</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-glass-border)', color: 'var(--color-text-primary)' }} placeholder="输入标签，用逗号分隔..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                  <label htmlFor="isActive" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>立即启用</label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-primary)' }}>取消</button>
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}>{editingQuote ? '保存修改' : '创建名言'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
