/**
 * 分类数据库模块
 * 提供分类相关的数据库操作
 */

import { queryAll, queryOne, run } from '../../../utils/index.js'
import { generateId } from '../../index.js'

export interface Category {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex: number
  userId?: string | null
  parentId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateCategoryInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
  parentId?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
  parentId?: string | null
}

export interface ReorderItem {
  id: string
  orderIndex: number
}

/**
 * 获取所有分类（管理员）
 */
export function getAllCategories(): Category[] {
  return queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
}

/**
 * 获取公共分类
 */
export function getPublicCategories(): Category[] {
  return queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
}

/**
 * 获取用户分类列表
 */
export function getCategories(user: any): Category[] {
  // 管理员返回所有分类
  if (user?.role === 'admin') {
    return queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
  }

  // 如果用户已登录，返回该用户的分类和公共分类（userId IS NULL）
  if (user) {
    return queryAll('SELECT * FROM categories WHERE userId = ? OR userId IS NULL ORDER BY orderIndex ASC', [user.id])
  }

  // 未登录用户返回所有分类
  return queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
}

/**
 * 根据ID获取分类
 */
export function getCategoryById(id: string, userId: string): Category | null {
  return queryOne('SELECT * FROM categories WHERE id = ? AND userId = ?', [id, userId])
}

/**
 * 根据ID获取分类（不限制用户）
 */
export function getCategoryByIdOnly(id: string): Category | null {
  return queryOne('SELECT * FROM categories WHERE id = ?', [id])
}

/**
 * 检查父级分类是否存在
 */
export function checkParentExists(parentId: string): boolean {
  const parent = queryOne('SELECT id FROM categories WHERE id = ?', [parentId])
  return !!parent
}

/**
 * 检查是否会导致循环引用
 */
export function checkCircularReference(categoryId: string, parentId: string): boolean {
  const checkCircular = (catId: string): boolean => {
    if (catId === categoryId) return true
    const cat = queryOne('SELECT parentId FROM categories WHERE id = ?', [catId])
    if (!cat?.parentId) return false
    return checkCircular(cat.parentId)
  }
  return checkCircular(parentId)
}

/**
 * 创建分类
 */
export function createCategory(userId: string, input: CreateCategoryInput): Category {
  // 如果提供了 orderIndex，使用提供的值；否则自动计算
  let newOrderIndex = input.orderIndex
  if (typeof newOrderIndex !== 'number') {
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM categories WHERE userId = ? AND parentId IS ?', [userId, input.parentId ?? null])
    newOrderIndex = (maxOrder?.max ?? -1) + 1
  }

  const id = generateId()

  run(`
    INSERT INTO categories (id, name, description, icon, color, orderIndex, userId, parentId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, input.name, input.description ?? null, input.icon ?? null, input.color ?? null, newOrderIndex, userId, input.parentId ?? null])

  return getCategoryById(id, userId)!
}

/**
 * 重排序分类
 */
export function reorderCategories(items: ReorderItem[], userId: string): void {
  for (const item of items) {
    if (item.id && typeof item.orderIndex === 'number') {
      run('UPDATE categories SET orderIndex = ? WHERE id = ? AND userId = ?', [item.orderIndex, item.id, userId])
    }
  }
}

/**
 * 更新分类
 */
export function updateCategory(
  id: string,
  userId: string,
  input: UpdateCategoryInput,
  current: Category
): Category | null {
  const merged = {
    name: input.name ?? current.name,
    description: input.description !== undefined ? input.description : current.description,
    icon: input.icon ?? current.icon,
    color: input.color ?? current.color,
    orderIndex: input.orderIndex ?? current.orderIndex,
    parentId: input.parentId !== undefined ? input.parentId : current.parentId,
  }

  run(`
    UPDATE categories SET name = ?, description = ?, icon = ?, color = ?, orderIndex = ?, parentId = ?
    WHERE id = ? AND userId = ?
  `, [merged.name, merged.description, merged.icon, merged.color, merged.orderIndex, merged.parentId, id, userId])

  return getCategoryById(id, userId)
}

/**
 * 删除分类
 */
export function deleteCategory(id: string, userId: string): { success: boolean; category?: Category } {
  const category = getCategoryById(id, userId)

  if (!category) {
    return { success: false }
  }

  // 将该分类下的书签设为未分类
  run('UPDATE bookmarks SET category = NULL WHERE category = ? AND userId = ?', [id, userId])

  // 删除分类
  run('DELETE FROM categories WHERE id = ? AND userId = ?', [id, userId])

  return { success: true, category }
}
