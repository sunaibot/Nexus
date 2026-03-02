import { motion } from 'framer-motion'
import { Folder, Bookmark, GripVertical, MoreHorizontal, Edit2, Trash2, Eye, LucideIcon } from 'lucide-react'
import { Category } from '../../../types/bookmark'
import { cn, getIconComponent } from '../../../lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CategoryCardProps {
  category: Category
  bookmarkCount: number
  isActive?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  dragHandle?: boolean
}

export function CategoryCard({
  category,
  bookmarkCount,
  isActive = false,
  onEdit,
  onDelete,
  onView,
  dragHandle = false
}: CategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1
  }

  const Icon = getIconComponent(category.icon || undefined)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'relative p-4 rounded-xl border transition-all group',
        isActive 
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
          : 'border-[var(--color-glass-border)] bg-[var(--color-glass)]',
        isDragging && 'opacity-50 shadow-xl'
      )}
    >
      <div className="flex items-center gap-4">
        {/* 拖拽手柄 */}
        {dragHandle && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--color-bg-tertiary)]"
          >
            <GripVertical className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}

        {/* 图标 */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: `${category.color || '#667eea'}20`,
            color: category.color || '#667eea'
          }}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-base truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {category.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span 
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Bookmark className="w-3 h-3" />
              {bookmarkCount} 个书签
            </span>
            {category.description && (
              <span 
                className="text-xs truncate max-w-[200px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {category.description}
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onView}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          )}
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-error)' }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* 选中指示器 */}
      {isActive && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
          style={{ background: 'var(--color-primary)' }}
        />
      )}
    </motion.div>
  )
}
