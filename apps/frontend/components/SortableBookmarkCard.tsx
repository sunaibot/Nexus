import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { forwardRef } from 'react'
import { BookmarkCard } from './BookmarkCard'
import { Bookmark } from '../types/bookmark'

interface SortableBookmarkCardProps {
  bookmark: Bookmark
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onToggleReadLater?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  isNew?: boolean
  isLoggedIn?: boolean
  isEditMode?: boolean
}

export const SortableBookmarkCard = forwardRef<HTMLDivElement, SortableBookmarkCardProps>(
  function SortableBookmarkCardInner({
    bookmark,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleReadLater,
    onMarkAsRead,
    isNew,
    isLoggedIn,
    isEditMode = false,
  }, ref) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: bookmark.id,
      disabled: !isEditMode, // 仅在编辑模式下启用拖拽
    })

    // VIBE CODING: 拖拽时的"悬浮感" - 卡片上浮、变亮、提升层级
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
      // 拖拽时：不仅变透明，还要稍微放大，并提升层级
      opacity: isDragging ? 0.7 : 1,
      zIndex: isDragging ? 100 : 1,
      // 拖拽时稍微放大并旋转，增加"抓起"的感觉
      scale: isDragging ? 1.08 : 1,
      rotate: isDragging ? '2deg' : '0deg',
      // 光标样式：编辑模式下显示抓取光标，否则默认
      cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
      // 拖拽时添加多层阴影，增强悬浮感和发光效果
      filter: isDragging 
        ? 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' 
        : 'none',
      // 拖拽时添加边框发光
      boxShadow: isDragging 
        ? '0 0 0 2px rgba(99, 102, 241, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
        : 'none',
      // 拖拽时提升层级
      position: 'relative',
    }

    return (
      <div ref={setNodeRef} style={{ ...style, height: '100%' }} {...attributes} {...listeners}>
        <BookmarkCard
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onToggleReadLater={onToggleReadLater}
          onMarkAsRead={onMarkAsRead}
          isDragging={isDragging}
          isNew={isNew}
          isLoggedIn={isLoggedIn}
          isEditMode={isEditMode}
        />
      </div>
    )
  }
)
