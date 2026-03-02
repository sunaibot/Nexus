/**
 * 笔记/便签插件 - 增强版
 * 快速记录和管理笔记，支持文件夹、搜索、富文本编辑
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  StickyNote,
  Plus,
  X,
  Edit2,
  Check,
  Trash2,
  Search,
  Folder,
  Pin,
  Archive,
  Download,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Filter,
  FileText
} from 'lucide-react'
import type { PluginComponentProps } from '../../types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 工具函数
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 类型定义
interface Note {
  id: string
  title: string
  content: string
  color: string
  isPinned: boolean
  isArchived: boolean
  folderId: string | null
  tags: string
  createdAt: string
  updatedAt: string
}

interface Folder {
  id: string
  name: string
  parentId: string | null
  orderIndex: number
}

interface NoteFilters {
  search: string
  folderId: string | null
  showArchived: boolean
  sortBy: 'updatedAt' | 'createdAt' | 'title'
  sortOrder: 'desc' | 'asc'
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200', hover: 'hover:bg-yellow-500/30' },
  { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200', hover: 'hover:bg-blue-500/30' },
  { name: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-200', hover: 'hover:bg-green-500/30' },
  { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200', hover: 'hover:bg-pink-500/30' },
  { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200', hover: 'hover:bg-purple-500/30' },
  { name: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200', hover: 'hover:bg-orange-500/30' },
]

// 简单的富文本编辑器组件
function RichTextEditor({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [isMarkdown, setIsMarkdown] = useState(false)

  const toolbarButtons = [
    { icon: 'B', title: '粗体', action: () => insertText('**', '**') },
    { icon: 'I', title: '斜体', action: () => insertText('*', '*') },
    { icon: 'H1', title: '标题1', action: () => insertText('# ', '') },
    { icon: 'H2', title: '标题2', action: () => insertText('## ', '') },
    { icon: '-', title: '列表', action: () => insertText('- ', '') },
    { icon: '[]', title: '任务', action: () => insertText('- [ ] ', '') },
    { icon: '```', title: '代码', action: () => insertText('```\n', '\n```') },
    { icon: '>', title: '引用', action: () => insertText('> ', '') },
  ]

  function insertText(before: string, after: string) {
    const textarea = document.getElementById('note-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <div className="space-y-2">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 rounded bg-white/5 border border-white/10">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.action}
            title={btn.title}
            className="px-2 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            {btn.icon}
          </button>
        ))}
        <div className="w-px h-4 bg-white/20 mx-1" />
        <button
          onClick={() => setIsMarkdown(!isMarkdown)}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            isMarkdown ? "bg-white/20 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          Markdown
        </button>
      </div>

      {/* 编辑器 */}
      <textarea
        id="note-editor"
        placeholder={placeholder}
        rows={8}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 font-mono leading-relaxed"
      />

      {/* 预览 */}
      {isMarkdown && value && (
        <div className="p-3 rounded bg-white/5 border border-white/10">
          <div className="text-xs text-white/40 mb-2">预览</div>
          <div
            className="text-sm text-white/80 prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        </div>
      )}
    </div>
  )
}

// HTML转义函数 - 防止XSS攻击
function escapeHtml(text: string): string {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 简单的 Markdown 渲染 - 安全的版本
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

// 主组件
export default function NotesPlugin({ config }: PluginComponentProps) {
  // 状态
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null)
  const [showFolderManager, setShowFolderManager] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 筛选状态
  const [filters, setFilters] = useState<NoteFilters>({
    search: '',
    folderId: null,
    showArchived: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  const maxNotes = config?.maxNotes || 10
  const showPinnedOnly = config?.showPinnedOnly || false

  // 获取数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // 获取笔记
      const notesRes = await fetch('/api/v2/notes', {
        credentials: 'include'
      })
      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData.data || [])
      }

      // 获取文件夹
      const foldersRes = await fetch('/api/v2/notes/folders/list', {
        credentials: 'include'
      })
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json()
        setFolders(foldersData.data || [])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 筛选和排序笔记
  const filteredNotes = useMemo(() => {
    let result = [...notes]

    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.toLowerCase().includes(searchLower)
      )
    }

    // 文件夹筛选
    if (filters.folderId) {
      result = result.filter(note => note.folderId === filters.folderId)
    }

    // 归档筛选
    if (!filters.showArchived) {
      result = result.filter(note => !note.isArchived)
    }

    // 只显示置顶
    if (showPinnedOnly) {
      result = result.filter(note => note.isPinned)
    }

    // 排序
    result.sort((a, b) => {
      let comparison = 0
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    // 置顶笔记始终在前
    result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))

    return result.slice(0, maxNotes)
  }, [notes, filters, showPinnedOnly, maxNotes])

  // 保存笔记
  const saveNote = async () => {
    if (!editingNote?.title?.trim() && !editingNote?.content?.trim()) return

    try {
      const isNew = !editingNote.id
      const url = isNew ? '/api/v2/notes' : `/api/v2/notes/${editingNote.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingNote.title,
          content: editingNote.content,
          color: editingNote.color || 'yellow',
          isPinned: editingNote.isPinned || false,
          folderId: editingNote.folderId || null,
          tags: editingNote.tags || ''
        }),
        credentials: 'include'
      })

      if (res.ok) {
        setIsEditing(false)
        setEditingNote(null)
        fetchData()
      }
    } catch (error) {
      console.error('保存笔记失败:', error)
    }
  }

  // 删除笔记
  const deleteNote = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return

    try {
      const res = await fetch(`/api/v2/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('删除笔记失败:', error)
    }
  }

  // 切换置顶
  const togglePin = async (note: Note) => {
    try {
      const res = await fetch(`/api/v2/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
        credentials: 'include'
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('更新笔记失败:', error)
    }
  }

  // 切换归档
  const toggleArchive = async (note: Note) => {
    try {
      const res = await fetch(`/api/v2/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !note.isArchived }),
        credentials: 'include'
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('归档笔记失败:', error)
    }
  }

  // 导出笔记
  const exportNote = (note: Note) => {
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
  const exportAllNotes = () => {
    const content = filteredNotes.map(note =>
      `# ${note.title}\n创建时间: ${note.createdAt}\n更新时间: ${note.updatedAt}\n\n${note.content}\n\n---\n`
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
  }

  // 创建文件夹
  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const res = await fetch('/api/v2/notes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
        credentials: 'include'
      })
      if (res.ok) {
        setNewFolderName('')
        fetchData()
      }
    } catch (error) {
      console.error('创建文件夹失败:', error)
    }
  }

  // 删除文件夹
  const deleteFolder = async (folderId: string) => {
    if (!confirm('确定要删除这个文件夹吗？文件夹中的笔记将变为未分类。')) return

    try {
      const res = await fetch(`/api/v2/notes/folders/${folderId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('删除文件夹失败:', error)
    }
  }

  // 开始编辑
  const startEditing = (note?: Note) => {
    setEditingNote(note || {
      title: '',
      content: '',
      color: 'yellow',
      isPinned: false,
      folderId: filters.folderId,
      tags: ''
    })
    setIsEditing(true)
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
      <div className="p-4 rounded-lg bg-white/5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-white/10" />
          <div className="w-20 h-4 rounded bg-white/10" />
        </div>
        <div className="h-20 rounded bg-white/5" />
      </div>
    )
  }

  // 编辑模式
  if (isEditing) {
    return (
      <div className="p-4 rounded-lg bg-white/10 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">
            {editingNote?.id ? '编辑笔记' : '新建笔记'}
          </span>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* 标题输入 */}
        <input
          type="text"
          placeholder="标题"
          value={editingNote?.title || ''}
          onChange={e => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 mb-3 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />

        {/* 富文本编辑器 */}
        <RichTextEditor
          value={editingNote?.content || ''}
          onChange={value => setEditingNote(prev => ({ ...prev, content: value }))}
          placeholder="输入笔记内容，支持 Markdown 格式..."
        />

        {/* 标签输入 */}
        <input
          type="text"
          placeholder="标签，用逗号分隔"
          value={editingNote?.tags || ''}
          onChange={e => setEditingNote(prev => ({ ...prev, tags: e.target.value }))}
          className="w-full px-3 py-2 mt-3 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />

        {/* 文件夹选择 */}
        <select
          value={editingNote?.folderId || ''}
          onChange={e => setEditingNote(prev => ({ ...prev, folderId: e.target.value || null }))}
          className="w-full px-3 py-2 mt-3 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="">未分类</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>

        {/* 颜色选择 */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-white/50">颜色:</span>
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setEditingNote(prev => ({ ...prev, color: color.name }))}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                color.bg,
                editingNote?.color === color.name ? 'border-white scale-110' : 'border-transparent hover:scale-105'
              )}
              title={color.name}
            />
          ))}
        </div>

        {/* 选项 */}
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={editingNote?.isPinned || false}
              onChange={e => setEditingNote(prev => ({ ...prev, isPinned: e.target.checked }))}
              className="rounded border-white/30"
            />
            <Pin className="w-3.5 h-3.5" />
            置顶
          </label>
        </div>

        {/* 按钮 */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={saveNote}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-sm text-white transition-colors"
          >
            <Check className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    )
  }

  // 文件夹管理模式
  if (showFolderManager) {
    return (
      <div className="rounded-lg bg-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-white">文件夹管理</span>
          </div>
          <button
            onClick={() => setShowFolderManager(false)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-4">
          {/* 新建文件夹 */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="新文件夹名称"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && createFolder()}
              className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={createFolder}
              disabled={!newFolderName.trim()}
              className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 文件夹列表 */}
          <div className="space-y-1">
            <div
              onClick={() => { setFilters(prev => ({ ...prev, folderId: null })); setShowFolderManager(false) }}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors",
                filters.folderId === null ? 'bg-white/10' : 'hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white">全部笔记</span>
                <span className="text-xs text-white/40">({notes.length})</span>
              </div>
            </div>

            <div
              onClick={() => { setFilters(prev => ({ ...prev, folderId: 'null' })); setShowFolderManager(false) }}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors",
                filters.folderId === 'null' ? 'bg-white/10' : 'hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white">未分类</span>
                <span className="text-xs text-white/40">({notes.filter(n => !n.folderId).length})</span>
              </div>
            </div>

            {folders.map(folder => (
              <div
                key={folder.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors",
                  filters.folderId === folder.id ? 'bg-white/10' : 'hover:bg-white/5'
                )}
              >
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => { setFilters(prev => ({ ...prev, folderId: folder.id })); setShowFolderManager(false) }}
                >
                  <Folder className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white">{folder.name}</span>
                  <span className="text-xs text-white/40">
                    ({notes.filter(n => n.folderId === folder.id).length})
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id) }}
                  className="p-1 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 主界面
  return (
    <div className="rounded-lg bg-white/5 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-white">便签笔记</span>
          <span className="text-xs text-white/40">({filteredNotes.length}/{notes.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFolderManager(true)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="文件夹管理"
          >
            <Folder className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={exportAllNotes}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="导出所有笔记"
          >
            <Download className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => startEditing()}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="px-3 py-2 border-b border-white/10 space-y-2">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* 筛选选项 */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.folderId || ''}
            onChange={e => setFilters(prev => ({ ...prev, folderId: e.target.value || null }))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="">全部文件夹</option>
            <option value="null">未分类</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="updatedAt">更新时间</option>
            <option value="createdAt">创建时间</option>
            <option value="title">标题</option>
          </select>

          <button
            onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' }))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
          >
            {filters.sortOrder === 'desc' ? '↓' : '↑'}
          </button>

          <label className="flex items-center gap-1 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showArchived}
              onChange={e => setFilters(prev => ({ ...prev, showArchived: e.target.checked }))}
              className="rounded border-white/30"
            />
            显示归档
          </label>
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-6">
            <StickyNote className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">
              {filters.search ? '没有找到匹配的笔记' : '暂无笔记'}
            </p>
            {!filters.search && (
              <button
                onClick={() => startEditing()}
                className="mt-2 text-xs text-yellow-400 hover:text-yellow-300"
              >
                创建第一条笔记
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map(note => {
            const colorScheme = getColorScheme(note.color)

            return (
              <div
                key={note.id}
                className={cn(
                  "p-3 rounded-lg border group transition-all",
                  colorScheme.bg,
                  colorScheme.border,
                  note.isArchived && "opacity-50"
                )}
              >
                {/* 标题栏 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      )}
                      {note.isArchived && (
                        <Archive className="w-3 h-3 text-white/40 flex-shrink-0" />
                      )}
                      {note.title && (
                        <h4 className={cn("text-sm font-medium truncate", colorScheme.text)}>
                          {note.title}
                        </h4>
                      )}
                    </div>
                    {note.folderId && (
                      <div className="flex items-center gap-1 mt-1">
                        <Folder className="w-3 h-3 text-white/40" />
                        <span className="text-xs text-white/40">{getFolderName(note.folderId)}</span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePin(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title={note.isPinned ? '取消置顶' : '置顶'}
                    >
                      <Pin className={cn("w-3.5 h-3.5", note.isPinned ? 'text-yellow-400' : 'text-white/40')} />
                    </button>
                    <button
                      onClick={() => toggleArchive(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title={note.isArchived ? '取消归档' : '归档'}
                    >
                      <Archive className={cn("w-3.5 h-3.5", note.isArchived ? 'text-blue-400' : 'text-white/40')} />
                    </button>
                    <button
                      onClick={() => exportNote(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title="导出"
                    >
                      <Download className="w-3.5 h-3.5 text-white/40" />
                    </button>
                    <button
                      onClick={() => startEditing(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white/40" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 rounded hover:bg-white/10"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* 内容 */}
                {note.content && (
                  <div
                    className={cn("text-xs line-clamp-4 mb-2", colorScheme.text, "opacity-80")}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                  />
                )}

                {/* 标签 */}
                {note.tags && (
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {note.tags.split(',').map((tag, idx) => (
                      tag.trim() && (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-white/10 text-xs text-white/60"
                        >
                          #{tag.trim()}
                        </span>
                      )
                    ))}
                  </div>
                )}

                {/* 时间 */}
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>更新: {new Date(note.updatedAt).toLocaleDateString('zh-CN')}</span>
                  <span>创建: {new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
