'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Bookmark,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  GripVertical,
} from 'lucide-react'
import { Category } from '../../../types/bookmark'
import { cn, getIconComponent } from '../../../lib/utils'

// 树节点数据结构
interface TreeNode {
  category: Category
  children: TreeNode[]
  level: number
}

interface CategoryTreeProps {
  categories: Category[]
  bookmarks: { categoryId: string; count: number }[]
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
  onAddSub?: (parentId: string) => void
  onReorder?: (draggedId: string, targetId: string, parentId?: string) => void
}

// 构建树形结构
function buildTree(categories: Category[]): TreeNode[] {
  const categoryMap = new Map<string, TreeNode>()
  const rootNodes: TreeNode[] = []

  // 首先创建所有节点
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      category: cat,
      children: [],
      level: 0,
    })
  })

  // 构建父子关系
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!
      node.level = parent.level + 1
      parent.children.push(node)
    } else {
      rootNodes.push(node)
    }
  })

  // 按 orderIndex 排序
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.category.orderIndex - b.category.orderIndex)
    nodes.forEach((node) => sortNodes(node.children))
  }
  sortNodes(rootNodes)

  return rootNodes
}

// 单个树节点组件
interface TreeNodeItemProps {
  node: TreeNode
  bookmarkCount: number
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
  onAddSub?: (parentId: string) => void
}

function TreeNodeItem({
  node,
  bookmarkCount,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSub,
}: TreeNodeItemProps) {
  const { category, children, level } = node
  const isExpanded = expandedIds.has(category.id)
  const hasChildren = children.length > 0
  const Icon = getIconComponent(category.icon || undefined)
  const isRoot = level === 0

  // 计算缩进
  const indent = level * 24

  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'group flex items-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer',
          'hover:bg-[var(--color-bg-tertiary)]',
          isRoot && 'bg-[var(--color-glass)] border border-[var(--color-glass-border)]'
        )}
        style={{ marginLeft: `${indent}px` }}
      >
        {/* 展开/折叠按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand(category.id)
          }}
          className={cn(
            'w-5 h-5 flex items-center justify-center rounded transition-colors',
            hasChildren ? 'hover:bg-[var(--color-bg-primary)]' : 'invisible'
          )}
        >
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            </motion.div>
          )}
        </button>

        {/* 图标 */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${category.color || '#667eea'}20`,
            color: category.color || '#667eea',
          }}
        >
          {hasChildren && isExpanded ? (
            <FolderOpen className="w-4 h-4" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-sm truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {category.name}
            </span>
            {category.description && (
              <span
                className="text-xs truncate max-w-[150px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {category.description}
              </span>
            )}
          </div>
        </div>

        {/* 书签数量 */}
        <span
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-muted)',
          }}
        >
          <Bookmark className="w-3 h-3" />
          {bookmarkCount}
        </span>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddSub?.(category.id)
            }}
            className="p-1.5 rounded-md hover:bg-[var(--color-primary)]/10 transition-colors"
            title="添加子分类"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(category)
            }}
            className="p-1.5 rounded-md hover:bg-[var(--color-primary)]/10 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(category)
            }}
            className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-error)' }} />
          </button>
        </div>
      </motion.div>

      {/* 子节点 */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* 连接线 */}
            <div className="relative">
              <div
                className="absolute left-[19px] top-0 bottom-0 w-px"
                style={{ background: 'var(--color-glass-border)' }}
              />
              {children.map((child) => (
                <TreeNodeItem
                  key={child.category.id}
                  node={child}
                  bookmarkCount={bookmarkCount}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSub={onAddSub}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 主组件
export function CategoryTree({
  categories,
  bookmarks,
  onEdit,
  onDelete,
  onAddSub,
}: CategoryTreeProps) {
  // 默认展开所有节点
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(categories.map((c) => c.id))
  })

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 构建树
  const tree = buildTree(categories)

  // 获取书签数量
  const getBookmarkCount = useCallback(
    (categoryId: string) => {
      return bookmarks.find((b) => b.categoryId === categoryId)?.count || 0
    },
    [bookmarks]
  )

  if (tree.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>暂无分类</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.category.id}
          node={node}
          bookmarkCount={getBookmarkCount(node.category.id)}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSub={onAddSub}
        />
      ))}
    </div>
  )
}
