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
  FileText,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle
} from 'lucide-react'
import type { PluginComponentProps } from '../../types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import TiptapEditor from './TiptapEditor'

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
  // 待办事项增强字段
  isTodo?: boolean
  priority?: number
  dueDate?: string
  completedAt?: string
  tagColors?: string
  createdAt: string
  updatedAt: string
}

interface Folder {
  id: string
  name: string
  parentId: string | null
  orderIndex: number
  color?: string
}

interface NoteFilters {
  search: string
  folderId: string | null
  showArchived: boolean
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'priority' | 'dueDate'
  sortOrder: 'desc' | 'asc'
  // 待办事项筛选
  showTodoOnly?: boolean
  priorityFilter?: number | null
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200', hover: 'hover:bg-yellow-500/30' },
  { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200', hover: 'hover:bg-blue-500/30' },
  { name: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-200', hover: 'hover:bg-green-500/30' },
  { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200', hover: 'hover:bg-pink-500/30' },
  { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200', hover: 'hover:bg-purple-500/30' },
  { name: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200', hover: 'hover:bg-orange-500/30' },
]

// 优先级配置
const PRIORITIES = [
  { level: 0, name: '无', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Circle },
  { level: 1, name: '低', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Flag },
  { level: 2, name: '中', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Flag },
  { level: 3, name: '高', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
]

// 文件夹颜色选项
const FOLDER_COLORS = [
  { name: '默认', value: '', bg: 'bg-white/10', border: 'border-white/20' },
  { name: '红色', value: 'red', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  { name: '橙色', value: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { name: '黄色', value: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { name: '绿色', value: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  { name: '蓝色', value: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { name: '紫色', value: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { name: '粉色', value: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
]

// 标签颜色选项
const TAG_COLORS = [
  { name: 'red', bg: 'bg-red-500' },
  { name: 'orange', bg: 'bg-orange-500' },
  { name: 'yellow', bg: 'bg-yellow-500' },
  { name: 'green', bg: 'bg-green-500' },
  { name: 'blue', bg: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-500' },
  { name: 'pink', bg: 'bg-pink-500' },
  { name: 'cyan', bg: 'bg-cyan-500' },
  { name: 'gray', bg: 'bg-gray-500' },
]

// 获取优先级配置
function getPriorityConfig(level: number = 0) {
  return PRIORITIES.find(p => p.level === level) || PRIORITIES[0]
}

// 获取文件夹颜色配置
function getFolderColorConfig(colorValue?: string) {
  return FOLDER_COLORS.find(c => c.value === colorValue) || FOLDER_COLORS[0]
}

// 格式化日期
function formatDate(dateString?: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isOverdue = date < now && !isToday

  if (isToday) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${isOverdue ? '(已逾期)' : ''}`
}

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
  return (
    <TiptapEditor
      content={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight="200px"
    />
  )
}

// HTML转义函数 - 防止XSS攻击
function escapeHtml(text: string): string {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 渲染笔记内容 - 支持 HTML (Tiptap) 和 Markdown
function renderMarkdown(text: string): string {
  if (!text) return ''

  // 如果内容已经是 HTML（以 < 开头），直接返回
  if (text.trim().startsWith('<')) {
    return text
  }

  // 否则按 Markdown 处理
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
  const [creatingSubfolderOf, setCreatingSubfolderOf] = useState<string | null>(null)

  // 筛选状态
  const [filters, setFilters] = useState<NoteFilters>({
    search: '',
    folderId: null,
    showArchived: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    showTodoOnly: false,
    priorityFilter: null
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
      const searchTerms = filters.search.toLowerCase().split(' ').filter(Boolean)
      result = result.filter(note => {
        return searchTerms.every(term => {
          // 标签筛选: tag:xxx
          if (term.startsWith('tag:')) {
            const tagName = term.slice(4)
            return note.tags.toLowerCase().includes(tagName)
          }
          // 普通搜索
          return (
            note.title.toLowerCase().includes(term) ||
            note.content.toLowerCase().includes(term) ||
            note.tags.toLowerCase().includes(term)
          )
        })
      })
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

    // 待办事项筛选
    if (filters.showTodoOnly) {
      result = result.filter(note => note.isTodo)
    }

    // 优先级筛选
    if (filters.priorityFilter !== undefined && filters.priorityFilter !== null) {
      result = result.filter(note => note.priority === filters.priorityFilter)
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
        case 'priority':
          comparison = (b.priority || 0) - (a.priority || 0)
          break
        case 'dueDate':
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          comparison = aDue - bDue
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
          tags: editingNote.tags || '',
          // 待办事项字段
          isTodo: editingNote.isTodo || false,
          priority: editingNote.priority || 0,
          dueDate: editingNote.dueDate || null,
          // 标签颜色
          tagColors: editingNote.tagColors || null
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

  // 切换待办事项完成状态
  const toggleTodoComplete = async (note: Note) => {
    try {
      const isCompleted = !!note.completedAt
      const res = await fetch(`/api/v2/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedAt: isCompleted ? null : new Date().toISOString()
        }),
        credentials: 'include'
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('更新待办事项失败:', error)
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
        body: JSON.stringify({
          name: newFolderName,
          parentId: creatingSubfolderOf
        }),
        credentials: 'include'
      })
      if (res.ok) {
        setNewFolderName('')
        setCreatingSubfolderOf(null)
        // 自动展开父文件夹
        if (creatingSubfolderOf) {
          setExpandedFolders(prev => new Set([...prev, creatingSubfolderOf]))
        }
        fetchData()
      }
    } catch (error) {
      console.error('创建文件夹失败:', error)
    }
  }

  // 切换文件夹展开状态
  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // 开始创建子文件夹
  const startCreateSubfolder = (parentId: string) => {
    setCreatingSubfolderOf(parentId)
    // 自动展开父文件夹
    setExpandedFolders(prev => new Set([...prev, parentId]))
  }

  // 获取文件夹颜色样式
  const getFolderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'text-red-400',
      orange: 'text-orange-400',
      yellow: 'text-yellow-400',
      green: 'text-green-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      pink: 'text-pink-400',
      gray: 'text-gray-400'
    }
    return colorMap[color] || 'text-yellow-400'
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

  // 获取标签颜色样式
  const getTagColor = (tagColorsJson: string | null | undefined, tagName: string): string => {
    if (!tagColorsJson) return 'bg-white/10 text-white/60'
    try {
      const tagColors = JSON.parse(tagColorsJson)
      const color = tagColors[tagName]
      if (!color) return 'bg-white/10 text-white/60'

      const colorStyles: Record<string, string> = {
        red: 'bg-red-500/20 text-red-300 border border-red-500/30',
        orange: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
        yellow: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        green: 'bg-green-500/20 text-green-300 border border-green-500/30',
        blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        purple: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        pink: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        cyan: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        gray: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
      }
      return colorStyles[color] || 'bg-white/10 text-white/60'
    } catch {
      return 'bg-white/10 text-white/60'
    }
  }

  // 添加标签筛选
  const addTagFilter = (tagName: string) => {
    const currentSearch = filters.search
    const tagFilter = `tag:${tagName}`
    if (currentSearch.includes(tagFilter)) return
    setFilters(prev => ({
      ...prev,
      search: currentSearch ? `${currentSearch} ${tagFilter}` : tagFilter
    }))
  }

  // 处理标签变化
  const handleTagsChange = (value: string) => {
    setEditingNote(prev => ({ ...prev, tags: value }))
  }

  // 从当前编辑状态获取标签颜色
  const getTagColorFromState = (tagName: string): string | null => {
    if (!editingNote?.tagColors) return null
    try {
      const colors = JSON.parse(editingNote.tagColors)
      return colors[tagName] || null
    } catch {
      return null
    }
  }

  // 设置标签颜色
  const setTagColor = (tagName: string, color: string | null) => {
    setEditingNote(prev => {
      let colors: Record<string, string> = {}
      if (prev?.tagColors) {
        try {
          colors = JSON.parse(prev.tagColors)
        } catch {
          colors = {}
        }
      }
      if (color) {
        colors[tagName] = color
      } else {
        delete colors[tagName]
      }
      return {
        ...prev,
        tagColors: Object.keys(colors).length > 0 ? JSON.stringify(colors) : undefined
      }
    })
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
        <div className="mt-3">
          <input
            type="text"
            placeholder="标签，用逗号分隔"
            value={editingNote?.tags || ''}
            onChange={e => handleTagsChange(e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />
          {/* 标签颜色选择 */}
          {editingNote?.tags && editingNote.tags.split(',').some(t => t.trim()) && (
            <div className="mt-2 space-y-1">
              {editingNote.tags.split(',').map((tag, idx) => {
                const tagName = tag.trim()
                if (!tagName) return null
                const currentColor = getTagColorFromState(tagName)
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-white/60">#{tagName}</span>
                    <div className="flex items-center gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setTagColor(tagName, color.name)}
                          className={cn(
                            "w-4 h-4 rounded-full border transition-all",
                            color.bg,
                            currentColor === color.name ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                          )}
                          title={color.name}
                        />
                      ))}
                      <button
                        onClick={() => setTagColor(tagName, null)}
                        className="text-xs text-white/40 hover:text-white/70 ml-1"
                      >
                        清除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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

        {/* 待办事项选项 */}
        <div className="mt-3 p-3 rounded bg-white/5 border border-white/10">
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={editingNote?.isTodo || false}
              onChange={e => setEditingNote(prev => ({ ...prev, isTodo: e.target.checked }))}
              className="rounded border-white/30"
            />
            <CheckCircle2 className="w-3.5 h-3.5" />
            设为待办事项
          </label>

          {editingNote?.isTodo && (
            <div className="space-y-2 pl-6">
              {/* 优先级选择 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">优先级:</span>
                <div className="flex items-center gap-1">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority.level}
                      onClick={() => setEditingNote(prev => ({ ...prev, priority: priority.level }))}
                      className={cn(
                        "px-2 py-1 rounded text-xs transition-all flex items-center gap-1",
                        editingNote?.priority === priority.level
                          ? cn(priority.bg, priority.color, "ring-1 ring-white/30")
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      )}
                    >
                      {(() => {
                        const PriorityIcon = priority.icon
                        return <PriorityIcon className="w-3 h-3" />
                      })()}
                      {priority.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 截止日期 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">截止日期:</span>
                <input
                  type="datetime-local"
                  value={editingNote?.dueDate ? new Date(editingNote.dueDate).toISOString().slice(0, 16) : ''}
                  onChange={e => setEditingNote(prev => ({
                    ...prev,
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  }))}
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                />
                {editingNote?.dueDate && (
                  <button
                    onClick={() => setEditingNote(prev => ({ ...prev, dueDate: undefined }))}
                    className="text-xs text-white/40 hover:text-white/70"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          )}
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
    // 递归渲染文件夹树
    const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
      const childFolders = folders.filter(f => f.parentId === parentId)

      return childFolders.map(folder => {
        const hasChildren = folders.some(f => f.parentId === folder.id)
        const isExpanded = expandedFolders.has(folder.id)
        const noteCount = notes.filter(n => n.folderId === folder.id).length
        const childCount = folders.filter(f => f.parentId === folder.id).length

        return (
          <div key={folder.id}>
            <div
              className={cn(
                "flex items-center justify-between rounded cursor-pointer transition-colors group",
                filters.folderId === folder.id ? 'bg-white/10' : 'hover:bg-white/5'
              )}
              style={{ paddingLeft: `${12 + level * 20}px`, paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {hasChildren ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFolderExpand(folder.id) }}
                    className="p-0.5 rounded hover:bg-white/10 flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                    )}
                  </button>
                ) : (
                  <span className="w-5 flex-shrink-0" />
                )}
                <Folder className={cn("w-4 h-4 flex-shrink-0", folder.color ? getFolderColor(folder.color) : "text-yellow-400")} />
                <span
                  className="text-sm text-white truncate flex-1"
                  onClick={() => { setFilters(prev => ({ ...prev, folderId: folder.id })); setShowFolderManager(false) }}
                >
                  {folder.name}
                </span>
                <span className="text-xs text-white/40 flex-shrink-0">
                  {noteCount > 0 && `(${noteCount})`}
                  {childCount > 0 && ` +${childCount}`}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); startCreateSubfolder(folder.id) }}
                  className="p-1 rounded hover:bg-white/10"
                  title="新建子文件夹"
                >
                  <Plus className="w-3.5 h-3.5 text-white/50" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id) }}
                  className="p-1 rounded hover:bg-red-500/20"
                  title="删除文件夹"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
            {isExpanded && hasChildren && renderFolderTree(folder.id, level + 1)}
          </div>
        )
      })
    }

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
              placeholder={creatingSubfolderOf ? `在 "${getFolderName(creatingSubfolderOf)}" 下新建子文件夹` : "新文件夹名称"}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && createFolder()}
              className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
            {creatingSubfolderOf && (
              <button
                onClick={() => setCreatingSubfolderOf(null)}
                className="px-2 py-2 rounded bg-white/5 hover:bg-white/10 text-xs text-white/60"
              >
                取消
              </button>
            )}
            <button
              onClick={createFolder}
              disabled={!newFolderName.trim()}
              className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 文件夹列表 */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
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

            {/* 树形文件夹列表 */}
            {renderFolderTree(null)}
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
            <option value="priority">优先级</option>
            <option value="dueDate">截止日期</option>
          </select>

          <button
            onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' }))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
          >
            {filters.sortOrder === 'desc' ? '↓' : '↑'}
          </button>

          <button
            onClick={() => setFilters(prev => ({ ...prev, showTodoOnly: !prev.showTodoOnly }))}
            className={cn(
              "px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors",
              filters.showTodoOnly
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            待办
          </button>

          <select
            value={filters.priorityFilter ?? ''}
            onChange={e => setFilters(prev => ({
              ...prev,
              priorityFilter: e.target.value ? parseInt(e.target.value) : null
            }))}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="">全部优先级</option>
            <option value="3">🔴 紧急</option>
            <option value="2">🟠 高</option>
            <option value="1">🟡 中</option>
            <option value="0">🟢 低</option>
          </select>

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {note.isTodo && (
                        <button
                          onClick={() => toggleTodoComplete(note)}
                          className="flex-shrink-0"
                          title={note.completedAt ? '标记为未完成' : '标记为已完成'}
                        >
                          {note.completedAt ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-white/40 hover:text-white/60" />
                          )}
                        </button>
                      )}
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      )}
                      {note.isArchived && (
                        <Archive className="w-3 h-3 text-white/40 flex-shrink-0" />
                      )}
                      {note.priority && note.priority > 0 && (
                        <span className={cn("text-xs px-1.5 py-0.5 rounded flex items-center gap-1", getPriorityConfig(note.priority).bg)}>
                          {(() => {
                            const PriorityIcon = getPriorityConfig(note.priority).icon
                            return <PriorityIcon className={cn("w-3 h-3", getPriorityConfig(note.priority).color)} />
                          })()}
                          <span className={getPriorityConfig(note.priority).color}>{getPriorityConfig(note.priority).name}</span>
                        </span>
                      )}
                      {note.dueDate && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded flex items-center gap-1",
                          new Date(note.dueDate) < new Date() && !note.completedAt
                            ? "bg-red-500/20 text-red-300"
                            : "bg-blue-500/20 text-blue-300"
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.dueDate)}
                        </span>
                      )}
                      {note.title && (
                        <h4 className={cn("text-sm font-medium truncate", colorScheme.text, note.completedAt && "line-through opacity-60")}>
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
                    {note.tags.split(',').map((tag, idx) => {
                      const tagName = tag.trim()
                      if (!tagName) return null
                      const tagColor = getTagColor(note.tagColors, tagName)
                      return (
                        <span
                          key={idx}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer hover:opacity-80",
                            tagColor
                          )}
                          onClick={(e) => { e.stopPropagation(); addTagFilter(tagName) }}
                          title={`筛选标签: ${tagName}`}
                        >
                          #{tagName}
                        </span>
                      )
                    })}
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
