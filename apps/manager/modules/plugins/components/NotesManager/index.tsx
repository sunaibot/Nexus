/**
 * 便签笔记插件数据管理
 */

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  StickyNote,
  Plus,
  Trash2,
  Edit2,
  Pin,
  Search,
  Folder,
  Archive,
  Download,
  X,
  Check,
  FolderOpen,
  FileText
} from 'lucide-react'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'

interface Note {
  id: string
  title: string
  content: string
  color: string
  isPinned: boolean
  isArchived: boolean
  folderId: string | null
  tags: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface Folder {
  id: string
  name: string
  parentId: string | null
  orderIndex: number
}

interface NotesManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate: (plugin: UnifiedPlugin) => void
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200' },
  { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200' },
  { name: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-200' },
  { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200' },
  { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200' },
  { name: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200' },
]

// API 函数
async function fetchAllNotes(): Promise<Note[]> {
  const res = await fetch(`/api/v2/notes/all`, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取笔记失败')
  const data = await res.json()
  return data.data || []
}

async function fetchAllFolders(): Promise<Folder[]> {
  const res = await fetch(`/api/v2/notes/folders/all`, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取文件夹失败')
  const data = await res.json()
  return data.data || []
}

async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/v2/notes/admin/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('删除笔记失败')
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/api/v2/notes/folders/admin/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('删除文件夹失败')
}

// HTML转义函数 - 防止XSS攻击
function escapeHtml(text: string): string {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Markdown 渲染 - 安全的版本
function renderMarkdown(text: string): string {
  if (!text) return ''
  // 先转义HTML，防止XSS
  const escaped = escapeHtml(text)
  return escaped
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="px-1 py-0.5 bg-white/10 rounded text-sm">$1</code>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="p-2 bg-white/10 rounded overflow-x-auto"><code>$1</code></pre>')
    .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2"><input type="checkbox" disabled class="rounded" /><span>$1</span></div>')
    .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2"><input type="checkbox" checked disabled class="rounded" /><span class="line-through opacity-50">$1</span></div>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^> (.*$)/gim, '<blockquote class="pl-3 border-l-2 border-white/30 italic text-white/70">$1</blockquote>')
    .replace(/\n/gim, '<br />')
}

export default function NotesManager({ plugin, onPluginUpdate }: NotesManagerProps) {
  const { showToast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'notes' | 'folders'>('notes')
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      const [notesData, foldersData] = await Promise.all([
        fetchAllNotes(),
        fetchAllFolders()
      ])
      setNotes(notesData)
      setFolders(foldersData)
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

  // 筛选笔记
  const filteredNotes = useMemo(() => {
    let result = [...notes]

    // 搜索筛选
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      result = result.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.toLowerCase().includes(searchLower)
      )
    }

    // 文件夹筛选
    if (selectedFolder) {
      result = result.filter(note => note.folderId === selectedFolder)
    }

    // 归档筛选
    if (!showArchived) {
      result = result.filter(note => !note.isArchived)
    }

    // 置顶笔记在前
    result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))

    return result
  }, [notes, searchQuery, selectedFolder, showArchived])

  // 删除笔记
  const handleDeleteNote = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return
    try {
      await deleteNote(id)
      showToast('success', '笔记已删除')
      loadData()
    } catch (error) {
      showToast('error', '删除失败')
    }
  }

  // 删除文件夹
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('确定要删除这个文件夹吗？文件夹中的笔记将变为未分类。')) return
    try {
      await deleteFolder(id)
      showToast('success', '文件夹已删除')
      loadData()
    } catch (error) {
      showToast('error', '删除失败')
    }
  }

  // 导出笔记
  const handleExportNote = (note: Note) => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title || '未命名'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导出所有笔记
  const handleExportAll = () => {
    const content = filteredNotes.map(note =>
      `# ${note.title}\n用户: ${note.userId}\n创建时间: ${note.createdAt}\n更新时间: ${note.updatedAt}\n\n${note.content}\n\n---\n`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `笔记导出_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('success', '笔记已导出')
  }

  // 获取文件夹名称
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return '未分类'
    const folder = folders.find(f => f.id === folderId)
    return folder?.name || '未知文件夹'
  }

  // 获取颜色方案
  const getColorScheme = (colorName: string) => {
    return COLORS.find(c => c.name === colorName) || COLORS[0]
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notes.length}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>总笔记数</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{folders.length}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>文件夹数</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Pin className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notes.filter(n => n.isPinned).length}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>置顶笔记</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Archive className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notes.filter(n => n.isArchived).length}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>归档笔记</p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-gray-800 shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
          }`}
          style={{ color: activeTab === 'notes' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <StickyNote className="w-4 h-4" />
          笔记列表 ({filteredNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('folders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'folders'
              ? 'bg-white dark:bg-gray-800 shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
          }`}
          style={{ color: activeTab === 'folders' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <Folder className="w-4 h-4" />
          文件夹 ({folders.length})
        </button>
      </div>

      {/* 笔记列表 */}
      {activeTab === 'notes' && (
        <>
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
            <select
              value={selectedFolder || ''}
              onChange={e => setSelectedFolder(e.target.value || null)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ 
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">全部文件夹</option>
              <option value="null">未分类</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="rounded"
              />
              显示归档
            </label>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                background: 'var(--color-glass-hover)',
                color: 'var(--color-text-primary)'
              }}
            >
              <Download className="w-4 h-4" />
              导出全部
            </button>
          </div>

          {/* 笔记网格 */}
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                {searchQuery ? '没有找到匹配的笔记' : '暂无笔记'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => {
                const colorScheme = getColorScheme(note.color)
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${colorScheme.bg} border ${colorScheme.border} group relative ${note.isArchived ? 'opacity-50' : ''}`}
                  >
                    {/* 标题栏 */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {note.isPinned && <Pin className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                          {note.isArchived && <Archive className="w-4 h-4 text-white/40 flex-shrink-0" />}
                          <h3 className={`font-medium truncate ${colorScheme.text}`}>
                            {note.title || '无标题'}
                          </h3>
                        </div>
                        {note.folderId && (
                          <div className="flex items-center gap-1 mt-1">
                            <Folder className="w-3 h-3 text-white/40" />
                            <span className="text-xs text-white/40">{getFolderName(note.folderId)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleExportNote(note)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title="导出"
                        >
                          <Download className="w-4 h-4 text-white/40" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* 内容 */}
                    {note.content && (
                      <div
                        className={`text-sm ${colorScheme.text} opacity-80 line-clamp-4 mb-3`}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                      />
                    )}

                    {/* 标签 */}
                    {note.tags && (
                      <div className="flex items-center gap-1 flex-wrap mb-3">
                        {note.tags.split(',').map((tag, idx) => (
                          tag.trim() && (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60"
                            >
                              #{tag.trim()}
                            </span>
                          )
                        ))}
                      </div>
                    )}

                    {/* 用户信息和时间 */}
                    <div className="flex items-center justify-between text-xs text-white/30">
                      <span>用户: {note.userId}</span>
                      <span>{new Date(note.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 文件夹管理 */}
      {activeTab === 'folders' && (
        <div className="space-y-4">
          {/* 全部笔记 */}
          <div
            onClick={() => { setSelectedFolder(null); setActiveTab('notes') }}
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors hover:opacity-80"
            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ color: 'var(--color-text-primary)' }}>全部笔记</span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>({notes.length})</span>
            </div>
          </div>

          {/* 未分类 */}
          <div
            onClick={() => { setSelectedFolder('null'); setActiveTab('notes') }}
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors hover:opacity-80"
            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ color: 'var(--color-text-primary)' }}>未分类</span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>({notes.filter(n => !n.folderId).length})</span>
            </div>
          </div>

          {/* 自定义文件夹 */}
          {folders.map(folder => (
            <div
              key={folder.id}
              className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors hover:opacity-80 group"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
            >
              <div
                className="flex items-center gap-3 flex-1"
                onClick={() => { setSelectedFolder(folder.id); setActiveTab('notes') }}
              >
                <Folder className="w-5 h-5 text-yellow-400" />
                <span style={{ color: 'var(--color-text-primary)' }}>{folder.name}</span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  ({notes.filter(n => n.folderId === folder.id).length})
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }}
                className="p-2 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}

          {folders.length === 0 && (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>还没有创建文件夹</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
