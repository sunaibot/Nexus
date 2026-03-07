'use client'

import { useState, useEffect, useCallback } from 'react'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Trash2,
  AlertTriangle,
  FolderOpen,
  ArrowUpDown,
  LayoutGrid
} from 'lucide-react'
import { Category } from '../../../types/bookmark'
import { Bookmark } from '../../../types/bookmark'
import { useToast } from '../../../components/admin/Toast'
import { cn } from '../../../lib/utils'
import { CategoryCard, CategoryStats, CategoryDetailStats, CategoryForm, CategoryTree, TabManager } from '../components'
import {
  fetchAllCategoriesWithTabs,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchBookmarks
} from '../../../lib/api'

// 视图模式
 type ViewMode = 'grid' | 'list' | 'tree'

// 排序方式
 type SortBy = 'order' | 'name' | 'count' | 'date'

// 管理标签页类型
 type ManagerTab = 'categories' | 'tabs'

export default function CategoriesPage() {
  // 状态
  const [categories, setCategories] = useState<Category[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [sortBy, setSortBy] = useState<SortBy>('order')
  const [activeTab, setActiveTab] = useState<ManagerTab>('categories')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null)
  const { showToast } = useToast()

  // 拖拽传感器
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

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [cats, bms] = await Promise.all([
        fetchAllCategoriesWithTabs(),
        fetchBookmarks()
      ])
      setCategories(cats)
      setBookmarks(bms)
    } catch (err) {
      console.error('Failed to load data:', err)
      showToast('error', '加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 获取分类书签数量
  const getBookmarkCount = useCallback((categoryId: string) => {
    return bookmarks.filter(b => b.category === categoryId).length
  }, [bookmarks])

  // 过滤和排序分类
  const filteredCategories = categories
    .filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'count':
          return getBookmarkCount(b.id) - getBookmarkCount(a.id)
        case 'date':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'order':
        default:
          return (a.orderIndex || 0) - (b.orderIndex || 0)
      }
    })

  // 处理拖拽结束
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCategories = arrayMove(categories, oldIndex, newIndex)
      setCategories(newCategories)
      
      // 更新排序到后端
      try {
        await Promise.all(
          newCategories.map((cat, index) => 
            updateCategory(cat.id, { orderIndex: index })
          )
        )
        showToast('success', '排序已保存')
      } catch (err) {
        showToast('error', '保存排序失败')
        loadData() // 恢复原始数据
      }
    }
  }, [categories, showToast, loadData])

  // 创建分类
  const handleCreateCategory = async (data: Partial<Category>) => {
    try {
      console.log('创建分类数据:', data)
      // 构建请求数据，只包含已定义的字段
      const requestData: any = {
        name: data.name!,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        parentId: data.parentId || null,
      }
      // 只有明确提供了 orderIndex 才添加
      if (data.orderIndex !== undefined) {
        requestData.orderIndex = data.orderIndex
      }
      await createCategory(requestData)
      showToast('success', '分类创建成功')
      setIsFormOpen(false)
      setParentCategoryId(null)
      loadData()
    } catch (err: any) {
      console.error('创建分类失败:', {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
        name: err.name,
        fullError: err
      })
      // 显示详细的验证错误
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const errorMsg = err.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
        showToast('error', `创建失败: ${errorMsg}`)
      } else if (err.message) {
        showToast('error', `创建失败: ${err.message}`)
      } else {
        showToast('error', '创建分类失败，请检查网络连接')
      }
    }
  }

  // 更新分类
  const handleUpdateCategory = async (data: Partial<Category>) => {
    if (!editingCategory) return
    try {
      // 提交所有支持的字段
      const updateData: { name?: string; description?: string | null; icon?: string | null; color?: string | null; orderIndex?: number } = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description || null
      if (data.icon !== undefined) updateData.icon = data.icon || null
      if (data.color !== undefined) updateData.color = data.color || null
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex
      
      await updateCategory(editingCategory.id, updateData)
      showToast('success', '分类更新成功')
      setIsFormOpen(false)
      setEditingCategory(null)
      loadData()
    } catch (err) {
      showToast('error', '更新分类失败')
    }
  }

  // 删除分类
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    try {
      await deleteCategory(categoryToDelete.id)
      showToast('success', '分类删除成功')
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null)
      }
      loadData()
    } catch (err) {
      showToast('error', '删除分类失败')
    }
  }

  // 打开编辑表单
  const openEditForm = (category: Category) => {
    setEditingCategory(category)
    setParentCategoryId(null)
    setIsFormOpen(true)
  }

  // 打开新建子分类表单
  const openAddSubForm = (parentId: string) => {
    setEditingCategory(null)
    setParentCategoryId(parentId)
    setIsFormOpen(true)
  }

  // 打开删除确认
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" 
          style={{ color: 'var(--color-primary)' }} 
        />
      </div>
    )
  }

  return (
    <div className="h-full flex gap-6">
      {/* 左侧主内容区 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 头部区域 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                分类管理
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                共 {categories.length} 个分类，{bookmarks.length} 个书签
              </p>
            </div>
            
            {/* Tab 切换按钮 */}
            <div 
              className="flex p-1 rounded-xl"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              <button
                onClick={() => setActiveTab('categories')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                  activeTab === 'categories' 
                    ? 'bg-[var(--color-primary)] text-white' 
                    : 'hover:bg-white/5'
                )}
                style={{ 
                  color: activeTab === 'categories' ? 'white' : 'var(--color-text-muted)' 
                }}
              >
                <FolderOpen className="w-4 h-4" />
                分类
              </button>
              <button
                onClick={() => setActiveTab('tabs')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                  activeTab === 'tabs' 
                    ? 'bg-[var(--color-primary)] text-white' 
                    : 'hover:bg-white/5'
                )}
                style={{ 
                  color: activeTab === 'tabs' ? 'white' : 'var(--color-text-muted)' 
                }}
              >
                <LayoutGrid className="w-4 h-4" />
                Tab 管理
              </button>
            </div>
          </div>

          {/* 统计卡片 - 只在分类标签显示 */}
          {activeTab === 'categories' && (
            <CategoryStats categories={categories} bookmarks={bookmarks} />
          )}
        </div>
        
        {/* Tab 内容区域 */}
        {activeTab === 'tabs' ? (
          <TabManager categories={categories} />
        ) : (
          <>
            {/* 工具栏 */}
        <div 
          className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
        >
          {/* 搜索 */}
          <div className="relative flex-1 max-w-md">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索分类..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-sm"
              style={{
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* 排序和视图 */}
          <div className="flex items-center gap-2 ml-4">
            {/* 新建分类按钮 */}
            <button
              onClick={() => {
                setEditingCategory(null)
                setParentCategoryId(null)
                setIsFormOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff'
              }}
            >
              <Plus className="w-4 h-4" />
              新建分类
            </button>

            {/* 排序 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm"
              style={{
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="order">默认排序</option>
              <option value="name">名称</option>
              <option value="count">书签数</option>
              <option value="date">创建时间</option>
            </select>

            {/* 视图切换 */}
            <div
              className="flex p-1 rounded-lg"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              <button
                onClick={() => setViewMode('tree')}
                className={cn(
                  'p-2 rounded transition-all',
                  viewMode === 'tree' && 'bg-[var(--color-primary)] text-white'
                )}
                style={{ color: viewMode === 'tree' ? 'white' : 'var(--color-text-muted)' }}
                title="树形视图"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-all',
                  viewMode === 'list' && 'bg-[var(--color-primary)] text-white'
                )}
                style={{ color: viewMode === 'list' ? 'white' : 'var(--color-text-muted)' }}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-all',
                  viewMode === 'grid' && 'bg-[var(--color-primary)] text-white'
                )}
                style={{ color: viewMode === 'grid' ? 'white' : 'var(--color-text-muted)' }}
                title="网格视图"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 分类列表 */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'tree' ? (
            // 树形视图
            <div className="p-2">
              <CategoryTree
                categories={filteredCategories}
                bookmarks={filteredCategories.map(c => ({ categoryId: c.id, count: getBookmarkCount(c.id) }))}
                onEdit={openEditForm}
                onDelete={openDeleteDialog}
                onAddSub={openAddSubForm}
              />
            </div>
          ) : (
            // 网格/列表视图
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredCategories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={cn(
                  'gap-3',
                  viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3' : 'flex flex-col'
                )}>
                  {filteredCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      bookmarkCount={getBookmarkCount(category.id)}
                      isActive={selectedCategory?.id === category.id}
                      onEdit={() => openEditForm(category)}
                      onDelete={() => openDeleteDialog(category)}
                      onView={() => setSelectedCategory(category)}
                      dragHandle={sortBy === 'order'}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* 空状态 */}
          {filteredCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-glass)' }}
              >
                <FolderOpen className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {searchQuery ? '未找到匹配的分类' : '暂无分类，点击上方按钮创建'}
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* 右侧详情面板 */}
      <AnimatePresence mode="wait">
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-80 flex-shrink-0"
          >
            <div 
              className="sticky top-0 p-5 rounded-2xl"
              style={{ 
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between mb-6">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  分类详情
                </h3>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>×</span>
                </button>
              </div>

              {/* 分类信息 */}
              <div className="mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ 
                    background: `${selectedCategory.color || '#8b5cf6'}20`,
                    color: selectedCategory.color || '#8b5cf6'
                  }}
                >
                  {(() => {
                    const Icon = selectedCategory.icon || FolderOpen
                    return <Icon className="w-8 h-8" />
                  })()}
                </div>
                <h4 
                  className="text-xl font-bold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {selectedCategory.name}
                </h4>
                {selectedCategory.description && (
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {selectedCategory.description}
                  </p>
                )}
              </div>

              {/* 统计 */}
              <CategoryDetailStats 
                category={selectedCategory} 
                bookmarks={bookmarks} 
              />

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-6">
                <motion.button
                  onClick={() => openEditForm(selectedCategory)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm"
                  style={{ 
                    background: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  编辑分类
                </motion.button>
                <motion.button
                  onClick={() => openDeleteDialog(selectedCategory)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 rounded-xl"
                  style={{ 
                    background: 'var(--color-error)20',
                    color: 'var(--color-error)'
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 表单弹窗 */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingCategory(null)
          setParentCategoryId(null)
        }}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        initialData={editingCategory}
        parentId={parentCategoryId}
        categories={categories}
      />

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {isDeleteDialogOpen && categoryToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDeleteDialogOpen(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl"
              style={{ 
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-error)20' }}
                >
                  <AlertTriangle className="w-6 h-6" style={{ color: 'var(--color-error)' }} />
                </div>
                <div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    确认删除
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    此操作不可撤销
                  </p>
                </div>
              </div>

              <p 
                className="mb-6"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                确定要删除分类 <strong style={{ color: 'var(--color-text-primary)' }}>"{categoryToDelete.name}"</strong> 吗？
                {getBookmarkCount(categoryToDelete.id) > 0 && (
                  <span style={{ color: 'var(--color-error)' }}>
                    <br />该分类下有 {getBookmarkCount(categoryToDelete.id)} 个书签，删除后这些书签将变为未分类。
                  </span>
                )}
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl font-medium"
                  style={{ 
                    background: 'var(--color-glass)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  取消
                </motion.button>
                <motion.button
                  onClick={handleDeleteCategory}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl font-medium text-white"
                  style={{ background: 'var(--color-error)' }}
                >
                  删除
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
