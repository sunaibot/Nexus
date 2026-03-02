/**
 * 笔记管理模块 - 增强版
 * 支持文件夹、搜索、富文本编辑、归档等功能
 */

import { useState, useEffect, useMemo } from 'react'
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
  FileText,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import type { Module } from '@/core/module-system'

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

const API_BASE = 'http://localhost:8787'

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200' },
  { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200' },
  { name: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-200' },
  { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200' },
  { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200' },
  { name: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200' },
]

// API 函数
async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/api/v2/notes`, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取笔记失败')
  const data = await res.json()
  return data.data || []
}

async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch(`${API_BASE}/api/v2/notes/folders/list`, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取文件夹失败')
  const data = await res.json()
  return data.data || []
}

async function createNote(note: Partial<Note>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
    credentials: 'include'
  })
  if (!res.ok) throw new Error('创建笔记失败')
}

async function updateNote(id: string, note: Partial<Note>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
    credentials: 'include'
  })
  if (!res.ok) throw new Error('更新笔记失败')
}

async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/notes/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('删除笔记失败')
}

async function createFolder(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/notes/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    credentials: 'include'
  })
  if (!res.ok) throw new Error('创建文件夹失败')
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/notes/folders/${id}`, {
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

// 富文本编辑器组件
function RichTextEditor({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [showPreview, setShowPreview] = useState(false)

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
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2 py-1 text-xs rounded transition-colors ${showPreview ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          预览
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
      {showPreview && value && (
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

// 主组件
function NotesManager() {
  // 状态
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'folders'>('notes')
  const [newFolderName, setNewFolderName] = useState('')

  // 筛选状态
  const [filters, setFilters] = useState<NoteFilters>({
    search: '',
    folderId: null,
    showArchived: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      const [notesData, foldersData] = await Promise.all([
        fetchNotes(),
        fetchFolders()
      ])
      setNotes(notesData)
      setFolders(foldersData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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

    return result
  }, [notes, filters])

  // 保存笔记
  const handleSave = async () => {
    if (!editingNote) return
    try {
      if (editingNote.id) {
        await updateNote(editingNote.id, editingNote)
      } else {
        await createNote(editingNote)
      }
      setIsEditing(false)
      setEditingNote(null)
      loadData()
    } catch (error) {
      alert('保存失败')
    }
  }

  // 删除笔记
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return
    try {
      await deleteNote(id)
      loadData()
    } catch (error) {
      alert('删除失败')
    }
  }

  // 切换置顶
  const handleTogglePin = async (note: Note) => {
    try {
      await updateNote(note.id, { isPinned: !note.isPinned })
      loadData()
    } catch (error) {
      alert('更新失败')
    }
  }

  // 切换归档
  const handleToggleArchive = async (note: Note) => {
    try {
      await updateNote(note.id, { isArchived: !note.isArchived })
      loadData()
    } catch (error) {
      alert('归档失败')
    }
  }

  // 导出笔记
  const handleExport = (note: Note) => {
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
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await createFolder(newFolderName)
      setNewFolderName('')
      loadData()
    } catch (error) {
      alert('创建文件夹失败')
    }
  }

  // 删除文件夹
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('确定要删除这个文件夹吗？文件夹中的笔记将变为未分类。')) return
    try {
      await deleteFolder(id)
      loadData()
    } catch (error) {
      alert('删除文件夹失败')
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
    return <div className="text-center py-12 text-white/50">加载中...</div>
  }

  // 编辑模式
  if (isEditing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-yellow-400" />
            {editingNote?.id ? '编辑笔记' : '新建笔记'}
          </h1>
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="max-w-3xl space-y-4">
          {/* 标题 */}
          <input
            type="text"
            placeholder="标题"
            value={editingNote?.title || ''}
            onChange={e => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-lg focus:outline-none focus:border-white/30"
          />

          {/* 富文本编辑器 */}
          <RichTextEditor
            value={editingNote?.content || ''}
            onChange={value => setEditingNote(prev => ({ ...prev, content: value }))}
            placeholder="输入笔记内容，支持 Markdown 格式..."
          />

          {/* 标签 */}
          <input
            type="text"
            placeholder="标签，用逗号分隔"
            value={editingNote?.tags || ''}
            onChange={e => setEditingNote(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />

          {/* 文件夹选择 */}
          <select
            value={editingNote?.folderId || ''}
            onChange={e => setEditingNote(prev => ({ ...prev, folderId: e.target.value || null }))}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
          >
            <option value="">未分类</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>

          {/* 颜色选择 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">颜色:</span>
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => setEditingNote(prev => ({ ...prev, color: color.name }))}
                className={`w-8 h-8 rounded-full ${color.bg} border-2 transition-all ${
                  editingNote?.color === color.name ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                }`}
                title={color.name}
              />
            ))}
          </div>

          {/* 选项 */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={editingNote?.isPinned || false}
                onChange={e => setEditingNote(prev => ({ ...prev, isPinned: e.target.checked }))}
                className="rounded border-white/30 w-4 h-4"
              />
              <Pin className="w-4 h-4" />
              置顶显示
            </label>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-sm text-white transition-colors"
            >
              <Check className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <StickyNote className="w-6 h-6 text-yellow-400" />
          笔记管理
          <span className="text-sm font-normal text-white/40">({filteredNotes.length}/{notes.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            导出全部
          </button>
          <button
            onClick={() => startEditing()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建笔记
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'notes'
              ? 'text-yellow-400 border-yellow-400'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          笔记列表
        </button>
        <button
          onClick={() => setActiveTab('folders')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'folders'
              ? 'text-yellow-400 border-yellow-400'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          文件夹管理
        </button>
      </div>

      {/* 笔记列表 */}
      {activeTab === 'notes' && (
        <>
          {/* 搜索和筛选 */}
          <div className="mb-6 space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="搜索笔记标题、内容或标签..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* 筛选选项 */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filters.folderId || ''}
                onChange={e => setFilters(prev => ({ ...prev, folderId: e.target.value || null }))}
                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
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
                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
              >
                <option value="updatedAt">按更新时间</option>
                <option value="createdAt">按创建时间</option>
                <option value="title">按标题</option>
              </select>

              <button
                onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' }))}
                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10"
              >
                {filters.sortOrder === 'desc' ? '↓ 降序' : '↑ 升序'}
              </button>

              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showArchived}
                  onChange={e => setFilters(prev => ({ ...prev, showArchived: e.target.checked }))}
                  className="rounded border-white/30"
                />
                显示归档笔记
              </label>
            </div>
          </div>

          {/* 笔记网格 */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <StickyNote className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">
                {filters.search ? '没有找到匹配的笔记' : '暂无笔记'}
              </p>
              {!filters.search && (
                <button
                  onClick={() => startEditing()}
                  className="mt-4 text-yellow-400 hover:text-yellow-300"
                >
                  创建第一条笔记
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => {
                const colorScheme = getColorScheme(note.color)
                return (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg ${colorScheme.bg} border ${colorScheme.border} group transition-all ${note.isArchived ? 'opacity-50' : ''}`}
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
                          onClick={() => handleTogglePin(note)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title={note.isPinned ? '取消置顶' : '置顶'}
                        >
                          <Pin className={`w-4 h-4 ${note.isPinned ? 'text-yellow-400' : 'text-white/40'}`} />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(note)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title={note.isArchived ? '取消归档' : '归档'}
                        >
                          <Archive className={`w-4 h-4 ${note.isArchived ? 'text-blue-400' : 'text-white/40'}`} />
                        </button>
                        <button
                          onClick={() => handleExport(note)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title="导出"
                        >
                          <Download className="w-4 h-4 text-white/40" />
                        </button>
                        <button
                          onClick={() => startEditing(note)}
                          className="p-1.5 rounded hover:bg-white/10"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-white/40" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
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

                    {/* 时间 */}
                    <div className="flex items-center justify-between text-xs text-white/30">
                      <span>更新: {new Date(note.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 文件夹管理 */}
      {activeTab === 'folders' && (
        <div className="max-w-2xl">
          {/* 新建文件夹 */}
          <div className="flex items-center gap-3 mb-6">
            <input
              type="text"
              placeholder="新文件夹名称"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建文件夹
            </button>
          </div>

          {/* 文件夹列表 */}
          <div className="space-y-2">
            {/* 全部笔记 */}
            <div
              onClick={() => { setFilters(prev => ({ ...prev, folderId: null })); setActiveTab('notes') }}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-white/50" />
                <span className="text-white">全部笔记</span>
                <span className="text-sm text-white/40">({notes.length})</span>
              </div>
            </div>

            {/* 未分类 */}
            <div
              onClick={() => { setFilters(prev => ({ ...prev, folderId: 'null' })); setActiveTab('notes') }}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-white/50" />
                <span className="text-white">未分类</span>
                <span className="text-sm text-white/40">({notes.filter(n => !n.folderId).length})</span>
              </div>
            </div>

            {/* 自定义文件夹 */}
            {folders.map(folder => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
              >
                <div
                  className="flex items-center gap-3 flex-1"
                  onClick={() => { setFilters(prev => ({ ...prev, folderId: folder.id })); setActiveTab('notes') }}
                >
                  <Folder className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">{folder.name}</span>
                  <span className="text-sm text-white/40">
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
              <div className="text-center py-8 text-white/40">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>还没有创建文件夹</p>
                <p className="text-sm mt-1">创建文件夹来组织你的笔记</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NotesModule: Module = {
  id: 'notes',
  name: '笔记管理',
  description: '管理便签和笔记，支持文件夹分类、富文本编辑',
  version: '2.0.0',
  icon: StickyNote,
  enabled: true,
  routes: [
    {
      path: '/notes',
      component: NotesManager,
      exact: true
    }
  ],
  sidebarItem: {
    id: 'notes',
    label: '笔记管理',
    icon: StickyNote,
    order: 85
  }
}

export default NotesModule
