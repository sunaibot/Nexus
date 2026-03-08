import { useMemo, useState, useCallback } from 'react'
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
import { SortableBookmarkCard } from '../../SortableBookmarkCard'
import { BookmarkCard, BookmarkCardSkeleton } from './BookmarkCard'
import { Bookmark, Category } from '../../../types/bookmark'
import { Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { IconRenderer } from '../../IconRenderer'
import { useBookmarkCardStyle } from '../../../hooks/useBookmarkCardStyle'
import { buildCategoryTree, CategoryNode, getAllChildrenIds } from '../../../lib/category-tree'

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const { style } = useBookmarkCardStyle()

  // 切换分类展开/折叠状态
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  // 构建分类树
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

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

  // 按分类分组书签（包含子分类的书签）
  const groupedBookmarks = useMemo(() => {
    const groups: Record<string, Bookmark[]> = {}

    // 初始化所有分类
    categories.forEach(cat => {
      groups[cat.id] = []
    })
    groups['uncategorized'] = []

    // 将书签分配到对应分类
    bookmarks.forEach(bookmark => {
      const catId = bookmark.category || 'uncategorized'
      if (!groups[catId]) groups[catId] = []
      groups[catId].push(bookmark)
    })

    return groups
  }, [bookmarks, categories])

  // 获取分类及其所有子分类的书签
  const getCategoryBookmarks = useCallback((categoryId: string): Bookmark[] => {
    const result: Bookmark[] = [...(groupedBookmarks[categoryId] || [])]
    const childrenIds = getAllChildrenIds(categories, categoryId)
    childrenIds.forEach(childId => {
      result.push(...(groupedBookmarks[childId] || []))
    })
    return result.filter(b => !b.isReadLater)
  }, [groupedBookmarks, categories])

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
      <motion.div
        ref={setNodeRef}
        className={cn(
          'flex items-center gap-3 mb-5 p-3 rounded-xl transition-all duration-200 cursor-pointer',
          // 编辑模式下的基础样式
          isEditMode && 'hover:bg-[var(--hover)]',
          // 拖拽悬停时的样式 - 更明显的视觉反馈
          isOver && isEditMode && [
            'bg-gradient-to-r from-purple-500/30 to-blue-500/30',
            'ring-2 ring-purple-500/70 ring-offset-2 ring-offset-[var(--card)]',
            'shadow-lg shadow-purple-500/20',
            'scale-[1.02]',
          ],
          // 编辑模式下的提示样式
          isEditMode && !isOver && 'border border-dashed border-transparent hover:border-[var(--border)]'
        )}
        animate={{
          scale: isOver && isEditMode ? 1.02 : 1,
          x: isOver && isEditMode ? 8 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* 拖拽指示器图标 */}
        {isEditMode && (
          <motion.div
            className={cn(
              'absolute left-1 w-1 h-8 rounded-full transition-all',
              isOver ? 'bg-purple-500 opacity-100' : 'bg-[var(--border)] opacity-0'
            )}
            animate={{ opacity: isOver ? 1 : 0 }}
          />
        )}
        {children}

        {/* 拖拽提示文字 */}
        {isOver && isEditMode && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-auto text-sm text-purple-400 font-medium"
          >
            放置到此处
          </motion.span>
        )}
      </motion.div>
    )
  }

  // 从样式获取间距
  const gapValue = style?.gap || '12px'

  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        style={{ gap: gapValue }}
      >
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

  // 递归渲染分类节点
  const renderCategoryNode = (node: CategoryNode, depth: number = 0) => {
    const categoryBookmarks = getCategoryBookmarks(node.id)
    const hasChildren = node.children.length > 0
    const isExpanded = expandedCategories.has(node.id)
    const hasBookmarks = categoryBookmarks.length > 0

    // 如果没有书签且没有子分类，不显示
    if (!hasBookmarks && !hasChildren) return null

    return (
      <div key={node.id} className={depth > 0 ? 'ml-6 border-l-2 border-[var(--border)] pl-4' : ''}>
        {/* 分类标题 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={depth > 0 ? 'mt-6' : 'mb-8'}
        >
          <DroppableCategory category={node}>
            {/* 展开/折叠按钮 */}
            {hasChildren && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCategory(node.id)
                }}
                className="p-1 rounded hover:bg-[var(--hover)] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </motion.button>
            )}

            <motion.div
              className={cn('p-2 rounded-lg glass')}
              style={{ color: node.color }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <IconRenderer icon={node.icon} className="w-4 h-4" />
            </motion.div>

            <h2
              className={cn(
                'font-medium',
                depth === 0 ? 'text-lg' : 'text-base'
              )}
              style={{ color: 'var(--text-primary)' }}
            >
              {node.name}
            </h2>

            <span
              className="text-sm px-2 py-0.5 rounded-full glass"
              style={{ color: 'var(--text-muted)' }}
            >
              {categoryBookmarks.length}
            </span>
          </DroppableCategory>

          {/* 当前分类的书签 */}
          {hasBookmarks && (
            <SortableContext
              items={categoryBookmarks.map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                style={{ gap: gapValue }}
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {categoryBookmarks.map(renderBookmarkCard)}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          )}
        </motion.section>

        {/* 子分类 */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {node.children.map(child => renderCategoryNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10">
        {/* 分类区域 - 使用树形结构渲染 */}
        {categoryTree.map(node => renderCategoryNode(node))}

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
                {groupedBookmarks['uncategorized'].filter(b => !b.isReadLater).length}
              </span>
            </motion.div>

            <SortableContext
              items={groupedBookmarks['uncategorized'].filter(b => !b.isReadLater).map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                style={{ gap: gapValue }}
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {groupedBookmarks['uncategorized']
                    .filter(b => !b.isReadLater)
                    .map(renderBookmarkCard)}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </motion.section>
        )}
      </div>

      {/* 拖拽覆盖层 - 增强视觉效果 */}
      <DragOverlay dropAnimation={{
        duration: 250,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeBookmark && (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ 
              scale: 1.1, 
              rotate: 3,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(99, 102, 241, 0.5)'
            }}
            style={{
              cursor: 'grabbing',
              zIndex: 9999,
            }}
          >
            {/* 拖拽提示标签 */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs rounded-full whitespace-nowrap shadow-lg">
              拖拽中...
            </div>
            <BookmarkCard
              bookmark={activeBookmark}
              isDragging
            />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
