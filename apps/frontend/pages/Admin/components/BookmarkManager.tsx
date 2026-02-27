import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Search, Plus, Trash2, Pin, BookMarked } from 'lucide-react'
import { Bookmark } from '../../../types/bookmark'
import { cn } from '../../../lib/utils'
import { useAdmin, useBookmarkActions } from '../../../contexts/AdminContext'
import { useToast } from '../../../components/admin/Toast'
import { VirtualBookmarkList } from '../../../components/VirtualBookmarkList'

const VIRTUAL_SCROLL_THRESHOLD = 50

export function BookmarkManager() {
  const { t } = useTranslation()
  const { bookmarks, categories } = useAdmin()
  const { 
    addBookmark, 
    editBookmark, 
    deleteBookmark, 
    togglePin, 
    toggleReadLater,
    updateBookmark 
  } = useBookmarkActions()
  const { showToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 筛选书签
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const matchesSearch = searchQuery === '' || 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = filterCategory === 'all' || 
        (filterCategory === 'uncategorized' ? !bookmark.category : bookmark.category === filterCategory)
      
      return matchesSearch && matchesCategory
    })
  }, [bookmarks, searchQuery, filterCategory])

  // 选择操作
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredBookmarks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredBookmarks.map(b => b.id)))
    }
  }

  const deleteSelected = () => {
    if (confirm(t('admin.bookmark.batch_delete_confirm', { count: selectedIds.size }))) {
      selectedIds.forEach(id => deleteBookmark(id))
      setSelectedIds(new Set())
      showToast('success', t('admin.bookmark.deleted_count', { count: selectedIds.size }))
    }
  }

  const handleTogglePin = (id: string) => {
    togglePin(id)
    const bookmark = bookmarks.find(b => b.id === id)
    showToast('success', bookmark?.isPinned 
      ? t('admin.bookmark.unpinned') 
      : t('admin.bookmark.pinned')
    )
  }

  const handleToggleReadLater = (id: string) => {
    toggleReadLater(id)
    const bookmark = bookmarks.find(b => b.id === id)
    showToast('success', bookmark?.isReadLater 
      ? t('admin.bookmark.removed_from_read_later') 
      : t('admin.bookmark.added_to_read_later')
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('admin.bookmark.title')}
        </h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('admin.bookmark.delete_selected', { count: selectedIds.size })}
            </button>
          )}
          <button
            onClick={addBookmark}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('admin.bookmark.add')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.bookmark.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
            style={{ 
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border transition-colors"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <option value="all">{t('admin.bookmark.all_categories')}</option>
          <option value="uncategorized">{t('admin.bookmark.uncategorized')}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Select All */}
      {filteredBookmarks.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0}
            onChange={selectAll}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {t('admin.bookmark.select_all', { count: filteredBookmarks.length })}
          </span>
        </div>
      )}

      {/* Bookmark List */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('admin.bookmark.empty')}</p>
        </div>
      ) : filteredBookmarks.length > VIRTUAL_SCROLL_THRESHOLD ? (
        <VirtualBookmarkList
          bookmarks={filteredBookmarks}
          categories={categories}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onTogglePin={handleTogglePin}
          onToggleReadLater={handleToggleReadLater}
          onUpdateBookmark={updateBookmark}
          onEditBookmark={editBookmark}
          onDeleteBookmark={deleteBookmark}
          showToast={showToast}
        />
      ) : (
        <div className="grid gap-4">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkListItem
              key={bookmark.id}
              bookmark={bookmark}
              isSelected={selectedIds.has(bookmark.id)}
              onToggleSelect={() => toggleSelect(bookmark.id)}
              onEdit={() => editBookmark(bookmark)}
              onDelete={() => deleteBookmark(bookmark.id)}
              onTogglePin={() => handleTogglePin(bookmark.id)}
              onToggleReadLater={() => handleToggleReadLater(bookmark.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface BookmarkListItemProps {
  bookmark: Bookmark
  isSelected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onToggleReadLater: () => void
}

function BookmarkListItem({
  bookmark,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
}: BookmarkListItemProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        isSelected && "ring-2 ring-blue-500"
      )}
      style={{
        backgroundColor: 'var(--color-glass)',
        borderColor: 'var(--color-glass-border)',
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="w-4 h-4 rounded"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {bookmark.title}
        </h3>
        <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
          {bookmark.url}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePin}
          className={cn(
            "p-2 rounded-lg transition-colors",
            bookmark.isPinned ? "text-yellow-400 bg-yellow-400/10" : "hover:bg-white/5"
          )}
          style={{ color: bookmark.isPinned ? undefined : 'var(--color-text-muted)' }}
          title={t('admin.bookmark.pin')}
        >
          <Pin className={cn("w-4 h-4", bookmark.isPinned && "fill-current")} />
        </button>
        
        <button
          onClick={onToggleReadLater}
          className={cn(
            "p-2 rounded-lg transition-colors",
            bookmark.isReadLater ? "text-blue-400 bg-blue-400/10" : "hover:bg-white/5"
          )}
          style={{ color: bookmark.isReadLater ? undefined : 'var(--color-text-muted)' }}
          title={t('admin.bookmark.read_later')}
        >
          <BookMarked className={cn("w-4 h-4", bookmark.isReadLater && "fill-current")} />
        </button>

        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          title={t('admin.bookmark.edit')}
        >
          <span className="sr-only">{t('admin.bookmark.edit')}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          title={t('admin.bookmark.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
