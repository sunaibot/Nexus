import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Trash2, Edit2, GripVertical, FolderPlus, X, Check } from 'lucide-react'
import { Category } from '../../../types/bookmark'
import { cn, presetIcons } from '../../../lib/utils'
import { useAdmin, useCategoryActions } from '../../../contexts/AdminContext'
import { useToast } from '../../../components/admin/Toast'
import { IconRenderer } from '../../../components/IconRenderer'
import { IconifyPicker } from '../../../components/IconifyPicker'

const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7',
]

export function CategoryManager() {
  const { t } = useTranslation()
  const { categories, bookmarks } = useAdmin()
  const { addCategory, updateCategory, deleteCategory, reorderCategories } = useCategoryActions()
  const { showToast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'folder',
  })
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconTab, setIconTab] = useState<'preset' | 'iconify'>('preset')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(categories, oldIndex, newIndex)
      reorderCategories(reordered)
      showToast('success', t('admin.category.reordered'))
    }
  }, [categories, reorderCategories, showToast, t])

  const handleSave = () => {
    if (!formData.name.trim()) {
      showToast('error', t('admin.category.name_required'))
      return
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, formData)
      showToast('success', t('admin.category.updated'))
    } else {
      addCategory(formData)
      showToast('success', t('admin.category.created'))
    }

    resetForm()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color || '#3b82f6',
      icon: category.icon || 'folder',
    })
    setShowForm(true)
  }

  const handleDelete = (category: Category) => {
    const bookmarkCount = bookmarks.filter(b => b.category === category.id).length
    const message = bookmarkCount > 0
      ? t('admin.category.delete_with_bookmarks', { count: bookmarkCount })
      : t('admin.category.delete_confirm')

    if (confirm(message)) {
      deleteCategory(category.id)
      showToast('success', t('admin.category.deleted'))
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', color: '#3b82f6', icon: 'folder' })
    setShowIconPicker(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('admin.category.title')}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('admin.category.add')}
        </button>
      </div>

      {/* Category Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-xl border space-y-4"
            style={{
              backgroundColor: 'var(--color-glass)',
              borderColor: 'var(--color-glass-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {editingCategory ? t('admin.category.edit') : t('admin.category.create')}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('admin.category.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('admin.category.name_placeholder')}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('admin.category.color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-lg transition-all",
                        formData.color === color && "ring-2 ring-white scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('admin.category.icon')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-white/5 transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <IconRenderer icon={formData.icon} className="w-5 h-5" />
                    <span className="text-sm">{t('admin.category.change_icon')}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showIconPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="flex gap-4 mb-4">
                        <button
                          onClick={() => setIconTab('preset')}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm transition-colors",
                            iconTab === 'preset' && "bg-blue-500 text-white"
                          )}
                          style={{ color: iconTab !== 'preset' ? 'var(--color-text-secondary)' : undefined }}
                        >
                          {t('admin.icon.preset')}
                        </button>
                        <button
                          onClick={() => setIconTab('iconify')}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm transition-colors",
                            iconTab === 'iconify' && "bg-blue-500 text-white"
                          )}
                          style={{ color: iconTab !== 'iconify' ? 'var(--color-text-secondary)' : undefined }}
                        >
                          {t('admin.icon.iconify')}
                        </button>
                      </div>

                      {iconTab === 'preset' ? (
                        <div className="grid grid-cols-8 gap-2">
                          {Object.keys(presetIcons).map((iconKey) => (
                            <button
                              key={iconKey}
                              onClick={() => {
                                setFormData({ ...formData, icon: iconKey })
                                setShowIconPicker(false)
                              }}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                formData.icon === iconKey && "bg-blue-500/20 ring-1 ring-blue-500"
                              )}
                            >
                              <IconRenderer icon={iconKey} className="w-5 h-5 mx-auto" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <IconifyPicker
                          onSelect={(icon) => {
                            setFormData({ ...formData, icon: `iconify:${icon}` })
                            setShowIconPicker(false)
                          }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {t('common.save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {categories.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                bookmarkCount={bookmarks.filter(b => b.category === category.id).length}
                onEdit={() => handleEdit(category)}
                onDelete={() => handleDelete(category)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('admin.category.empty')}</p>
        </div>
      )}
    </div>
  )
}

interface SortableCategoryItemProps {
  category: Category
  bookmarkCount: number
  onEdit: () => void
  onDelete: () => void
}

function SortableCategoryItem({ category, bookmarkCount, onEdit, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--color-glass)',
        borderColor: 'var(--color-glass-border)',
      }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-all group",
        isDragging ? "opacity-50 shadow-lg" : "hover:bg-[var(--color-glass-hover)]"
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: (category.color || '#3b82f6') + '20',
          color: category.color || '#3b82f6',
        }}
      >
        <IconRenderer icon={category.icon} className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {category.name}
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {bookmarkCount} 个书签
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
