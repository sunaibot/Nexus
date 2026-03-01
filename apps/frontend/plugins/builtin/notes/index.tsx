/**
 * 笔记/便签插件
 * 快速记录和管理笔记
 */

import { useEffect, useState } from 'react'
import { StickyNote, Plus, X, Edit2, Check, Trash2 } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface Note {
  id: string
  title: string
  content: string
  color: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

const COLORS = [
  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200' },
  { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-200' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200' },
]

export default function NotesPlugin({ config }: PluginComponentProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null)

  const maxNotes = config?.maxNotes || 5
  const showPinnedOnly = config?.showPinnedOnly || false

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v2/notes', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        let notesData = data.data || []
        if (showPinnedOnly) {
          notesData = notesData.filter((n: Note) => n.isPinned)
        }
        setNotes(notesData.slice(0, maxNotes))
      }
    } catch (error) {
      console.error('获取笔记失败:', error)
    } finally {
      setLoading(false)
    }
  }

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
        }),
        credentials: 'include'
      })

      if (res.ok) {
        setIsEditing(false)
        setEditingNote(null)
        fetchNotes()
      }
    } catch (error) {
      console.error('保存笔记失败:', error)
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return

    try {
      const res = await fetch(`/api/v2/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        fetchNotes()
      }
    } catch (error) {
      console.error('删除笔记失败:', error)
    }
  }

  const togglePin = async (note: Note) => {
    try {
      const res = await fetch(`/api/v2/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
        credentials: 'include'
      })
      if (res.ok) {
        fetchNotes()
      }
    } catch (error) {
      console.error('更新笔记失败:', error)
    }
  }

  const startEditing = (note?: Note) => {
    setEditingNote(note || { title: '', content: '', color: 'yellow', isPinned: false })
    setIsEditing(true)
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

        <input
          type="text"
          placeholder="标题"
          value={editingNote?.title || ''}
          onChange={e => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 mb-2 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />

        <textarea
          placeholder="内容"
          rows={3}
          value={editingNote?.content || ''}
          onChange={e => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
          className="w-full px-3 py-2 mb-3 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30"
        />

        {/* 颜色选择 */}
        <div className="flex items-center gap-2 mb-3">
          {COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => setEditingNote(prev => ({ ...prev, color: ['yellow', 'blue', 'green', 'pink', 'purple'][index] }))}
              className={`w-6 h-6 rounded-full ${color.bg} border-2 ${
                editingNote?.color === ['yellow', 'blue', 'green', 'pink', 'purple'][index]
                  ? 'border-white'
                  : 'border-transparent'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={editingNote?.isPinned || false}
              onChange={e => setEditingNote(prev => ({ ...prev, isPinned: e.target.checked }))}
              className="rounded border-white/30"
            />
            置顶
          </label>

          <div className="flex items-center gap-2">
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
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white/5 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-white">便签</span>
          {notes.length > 0 && (
            <span className="text-xs text-white/40">({notes.length})</span>
          )}
        </div>
        <button
          onClick={() => startEditing()}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          新建
        </button>
      </div>

      {/* 笔记列表 */}
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-6">
            <StickyNote className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">暂无笔记</p>
            <button
              onClick={() => startEditing()}
              className="mt-2 text-xs text-yellow-400 hover:text-yellow-300"
            >
              创建第一条笔记
            </button>
          </div>
        ) : (
          notes.map(note => {
            const colorScheme = COLORS.find((_, i) => 
              ['yellow', 'blue', 'green', 'pink', 'purple'][i] === note.color
            ) || COLORS[0]

            return (
              <div
                key={note.id}
                className={`p-3 rounded-lg ${colorScheme.bg} border ${colorScheme.border} group`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {note.title && (
                      <h4 className={`text-sm font-medium ${colorScheme.text} truncate`}>
                        {note.isPinned && '【置顶】'}{note.title}
                      </h4>
                    )}
                    <p className={`text-xs ${colorScheme.text} opacity-80 mt-1 line-clamp-3`}>
                      {note.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePin(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title={note.isPinned ? '取消置顶' : '置顶'}
                    >
                      <span className={`text-xs ${note.isPinned ? 'text-yellow-400' : 'text-white/40'}`}>📌</span>
                    </button>
                    <button
                      onClick={() => startEditing(note)}
                      className="p-1 rounded hover:bg-white/10"
                      title="编辑"
                    >
                      <Edit2 className="w-3 h-3 text-white/40" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 rounded hover:bg-white/10"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
