import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { SortableBookmarkCard } from '../../SortableBookmarkCard'
import { BookmarkCard, BookmarkCardSkeleton } from './BookmarkCard'
import { Bookmark, Category } from '../../../types/bookmark'
import { Folder, Clock } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { IconRenderer } from '../../IconRenderer'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  categories: Category[]
  isLoading?: boolean
  newlyAddedId?: string | null
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onToggleReadLater?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  onReorder?: (bookmarks: Bookmark[]) => void
  onChangeCategory?: (bookmarkId: string, categoryId: string) => void
  isLoggedIn?: boolean
  isEditMode?: boolean
}

export function BookmarkGrid({
  bookmarks,
  categories,
  isLoading = false,
  newlyAddedId,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onMarkAsRead,
  onReorder,
  onChangeCategory,
  isLoggedIn = false,
  isEditMode = false,
}: BookmarkGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 按分类分组书签
  const groupedBookmarks = useMemo(() => {
    const groups: Record<string, Bookmark[]> = {}
    
    categories.forEach(cat => {
      groups[cat.id] = []
    })
    groups['uncategorized'] = []

    bookmarks.forEach(bookmark => {
      const catId = bookmark.category || 'uncategorized'
      if (!groups[catId]) groups[catId] = []
      groups[catId].push(bookmark)
    })

    return groups
  }, [bookmarks, categories])

  // 稍后阅读书签
  const readLaterBookmarks = useMemo(() => {
    return bookmarks.filter(b => b.isReadLater && !b.isRead)
  }, [bookmarks])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    
    // VIBE CODING: 触觉反馈 - 让用户"感觉到"卡片被抓起
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeBookmark = bookmarks.find(b => b.id === active.id)
    if (!activeBookmark) return

    // 检查是否拖放到分类标题上
    const overId = over.id as string
    const targetCategory = categories.find(c => c.id === overId)

    if (targetCategory) {
      // 拖放到分类上 - 更改分类
      const currentCategory = activeBookmark.category || 'uncategorized'
      if (currentCategory !== targetCategory.id) {
        onChangeCategory?.(activeBookmark.id, targetCategory.id)

        // VIBE CODING: 落地触觉反馈
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([5, 30, 5])
        }
      }
    } else if (active.id !== over.id) {
      // 同分类内排序 - 获取同一分类的书签
      const activeCategory = activeBookmark.category || 'uncategorized'
      const categoryBookmarks = bookmarks.filter(b => (b.category || 'uncategorized') === activeCategory)

      const oldIndex = categoryBookmarks.findIndex(b => b.id === active.id)
      const newIndex = categoryBookmarks.findIndex(b => b.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        // 只重新排序该分类内的书签
        const reorderedCategoryBookmarks = arrayMove(categoryBookmarks, oldIndex, newIndex)

        // 合并其他分类的书签（保持原有顺序）
        const otherBookmarks = bookmarks.filter(b => (b.category || 'uncategorized') !== activeCategory)
        const newOrder = [...otherBookmarks, ...reorderedCategoryBookmarks]

        onReorder?.(newOrder)

        // VIBE CODING: 落地触觉反馈
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([5, 30, 5])
        }
      }
    }
  }

  const activeBookmark = activeId
    ? bookmarks.find(b => b.id === activeId)
    : null

  // 可拖拽的分类标题组件
  function DroppableCategory({ category, children }: { category: Category; children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({
      id: category.id,
      disabled: !isEditMode,
    })

    return (
      <div
        ref={setNodeRef}
        className={cn(
          'flex items-center gap-3 mb-5 p-2 rounded-xl transition-all',
          isOver && isEditMode && 'bg-purple-500/20 ring-2 ring-purple-500/50'
        )}
      >
        {children}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookmarkCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 1
      }
    },
  }

  const renderBookmarkCard = (bookmark: Bookmark) => (
    <SortableBookmarkCard
      key={bookmark.id}
      bookmark={bookmark}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePin={onTogglePin}
      onToggleReadLater={onToggleReadLater}
      onMarkAsRead={onMarkAsRead}
      isNew={bookmark.id === newlyAddedId}
      isLoggedIn={isLoggedIn}
      isEditMode={isEditMode}
    />
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10">
        {/* 稍后阅读区域 */}
        {readLaterBookmarks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div 
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <motion.div 
                className="p-2 rounded-lg glass"
                style={{ color: '#f97316' }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <h2 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                稍后阅读
              </h2>
              <span 
                className="text-sm px-2 py-0.5 rounded-full glass"
                style={{ color: 'var(--text-muted)' }}
              >
                {readLaterBookmarks.length}
              </span>
            </motion.div>

            <SortableContext
              items={readLaterBookmarks.map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {readLaterBookmarks.map(renderBookmarkCard)}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </motion.section>
        )}

        {/* 分类区域 */}
        {categories.map(category => {
          const categoryBookmarks = (groupedBookmarks[category.id] || [])
            .filter(b => !b.isReadLater || b.isRead)
          if (categoryBookmarks.length === 0) return null

          return (
            <motion.section
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <DroppableCategory category={category}>
                <motion.div
                  className={cn('p-2 rounded-lg glass')}
                  style={{ color: category.color }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {(() => {
                    return <IconRenderer icon={category.icon} className="w-4 h-4" />
                  })()}
                </motion.div>
                <h2
                  className="text-lg font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {category.name}
                </h2>
                <span
                  className="text-sm px-2 py-0.5 rounded-full glass"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {categoryBookmarks.length}
                </span>
              </DroppableCategory>

              <SortableContext
                items={categoryBookmarks.map(b => b.id)}
                strategy={rectSortingStrategy}
              >
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <AnimatePresence mode="popLayout">
                    {categoryBookmarks.map(renderBookmarkCard)}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>
            </motion.section>
          )
        })}

        {/* 未分类书签 */}
        {groupedBookmarks['uncategorized']?.filter(b => !b.isReadLater || b.isRead).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div 
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <motion.div 
                className="p-2 rounded-lg glass" 
                style={{ color: 'var(--text-muted)' }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Folder className="w-4 h-4" />
              </motion.div>
              <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                未分类
              </h2>
              <span 
                className="text-sm px-2 py-0.5 rounded-full glass"
                style={{ color: 'var(--text-muted)' }}
              >
                {groupedBookmarks['uncategorized'].filter(b => !b.isReadLater || b.isRead).length}
              </span>
            </motion.div>

            <SortableContext
              items={groupedBookmarks['uncategorized'].filter(b => !b.isReadLater || b.isRead).map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {groupedBookmarks['uncategorized']
                    .filter(b => !b.isReadLater || b.isRead)
                    .map(renderBookmarkCard)}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </motion.section>
        )}
      </div>

      {/* 拖拽覆盖层 */}
      <DragOverlay>
        {activeBookmark && (
          <BookmarkCard
            bookmark={activeBookmark}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
