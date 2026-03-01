/**
 * 分类操作 Hook
 * 封装分类的增删改查操作
 */

import { useCallback } from 'react'
import { useBookmarkStore } from '../useBookmarkStore'
import type { Category } from '../../types/bookmark'

export function useCategoryOperations() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useBookmarkStore()

  // 添加分类（带回调）
  const handleAddCategory = useCallback((category: Omit<Category, 'id' | 'orderIndex'>) => {
    addCategory(category)
  }, [addCategory])

  // 获取分类名称
  const getCategoryName = useCallback((categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '未分类'
  }, [categories])

  // 获取分类图标
  const getCategoryIcon = useCallback((categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.icon
  }, [categories])

  return {
    categories,
    addCategory: handleAddCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryName,
    getCategoryIcon,
  }
}
