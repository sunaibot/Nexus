/**
 * 笔记管理模块
 */

import { StickyNote, Plus, Trash2, Edit2, Pin } from 'lucide-react'
import type { Module } from '@/core/module-system'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

const API_BASE = 'http://localhost:8787'

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/api/v2/notes`, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取笔记失败')
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

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { name: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
  { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
]

function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await fetchNotes()
      setNotes(data)
    } catch (error) {
      console.error('加载笔记失败:', error)
    } finally {
      setLoading(false)
    }
  }

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
      loadNotes()
    } catch (error) {
      alert('保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return
    try {
      await deleteNote(id)
      loadNotes()
    } catch (error) {
      alert('删除失败')
    }
  }

  const handleTogglePin = async (note: Note) => {
    try {
      await updateNote(note.id, { isPinned: !note.isPinned })
      loadNotes()
    } catch (error) {
      alert('更新失败')
    }
  }

  const startEditing = (note?: Note) => {
    setEditingNote(note || { title: '', content: '', color: 'yellow', isPinned: false })
    setIsEditing(true)
  }

  if (loading) {
    return <div className="text-center py-12 text-white/50">加载中...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <StickyNote className="w-6 h-6 text-yellow-400" />
          笔记管理
        </h1>
        <button
          onClick={() => startEditing()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建笔记
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">
            {editingNote?.id ? '编辑笔记' : '新建笔记'}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="标题"
              value={editingNote?.title || ''}
              onChange={e => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-white/30"
            />
            <textarea
              placeholder="内容"
              rows={4}
              value={editingNote?.content || ''}
              onChange={e => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none"
            />
            <div className="flex items-center gap-2">
              {COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => setEditingNote(prev => ({ ...prev, color: color.name }))}
                  className={`w-8 h-8 rounded-full ${color.bg} border-2 ${
                    editingNote?.color === color.name ? 'border-white' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-sm text-white"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">暂无笔记</p>
          <button
            onClick={() => startEditing()}
            className="mt-4 text-yellow-400 hover:text-yellow-300"
          >
            创建第一条笔记
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => {
            const colorScheme = COLORS.find(c => c.name === note.color) || COLORS[0]
            return (
              <div
                key={note.id}
                className={`p-4 rounded-lg ${colorScheme.bg} border ${colorScheme.border} group`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-medium truncate">
                    {note.isPinned && <span className="text-yellow-400 mr-1">📌</span>}
                    {note.title || '无标题'}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title={note.isPinned ? '取消置顶' : '置顶'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'text-yellow-400' : 'text-white/40'}`} />
                    </button>
                    <button
                      onClick={() => startEditing(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white/40" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded hover:bg-white/10"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white/70 line-clamp-4 whitespace-pre-wrap">
                  {note.content}
                </p>
                <p className="text-xs text-white/40 mt-2">
                  {new Date(note.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'

const NotesModule: Module = {
  id: 'notes',
  name: '笔记管理',
  description: '管理便签和笔记',
  version: '1.0.0',
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
