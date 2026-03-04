import { request, invalidateCache } from './client'
import type {
  Category,
  ApiResponse,
  ReorderItem,
} from '../../types'

export interface CreateCategoryParams {
  name: string
  icon?: string
  color?: string
  parentId?: string | null
  description?: string
  isVisible?: boolean
}

export interface UpdateCategoryParams {
  name?: string
  icon?: string
  color?: string
  parentId?: string | null
  description?: string
  isVisible?: boolean
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await request<ApiResponse<Category[]>>(
    '/v2/categories',
    { requireAuth: true }
  )
  return response.data || []
}

export async function fetchAllCategories(): Promise<Category[]> {
  const response = await request<ApiResponse<Category[]>>(
    '/v2/categories/all',
    { requireAuth: true }
  )
  return response.data || []
}

export async function fetchAllCategoriesWithTabs(): Promise<Category[]> {
  const response = await request<ApiResponse<Category[]>>(
    '/v2/categories/admin/all-with-tabs',
    { requireAuth: true }
  )
  return response.data || []
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  const response = await request<ApiResponse<Category>>(
    `/v2/categories/${id}`,
    { requireAuth: false }
  )
  return response.data || null
}

export async function createCategory(
  data: CreateCategoryParams
): Promise<Category> {
  const response = await request<ApiResponse<Category>>('/v2/categories', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  invalidateCache('categories:*')
  return response.data!
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryParams
): Promise<Category> {
  const response = await request<ApiResponse<Category>>(
    `/v2/categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    }
  )
  invalidateCache('categories:*')
  return response.data!
}

export async function deleteCategory(id: string): Promise<void> {
  await request<ApiResponse<void>>(`/v2/categories/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('categories:*')
}

export async function reorderCategories(
  items: ReorderItem[]
): Promise<void> {
  await request<ApiResponse<void>>('/v2/categories/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
    requireAuth: true,
  })
  invalidateCache('categories:*')
}

export async function batchMoveCategories(
  categoryIds: string[],
  targetParentId: string | null
): Promise<void> {
  await request<ApiResponse<void>>('/v2/categories/batch-move', {
    method: 'POST',
    body: JSON.stringify({ categoryIds, targetParentId }),
    requireAuth: true,
  })
  invalidateCache('categories:*')
}

export async function batchMergeCategories(
  sourceIds: string[],
  targetId: string
): Promise<void> {
  await request<ApiResponse<void>>('/v2/categories/batch-merge', {
    method: 'POST',
    body: JSON.stringify({ sourceIds, targetId }),
    requireAuth: true,
  })
  invalidateCache('categories:*')
}

export const categoriesApi = {
  getAll: fetchCategories,
  getAllAdmin: fetchAllCategories,
  getById: fetchCategoryById,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
  reorder: reorderCategories,
  batchMove: batchMoveCategories,
  batchMerge: batchMergeCategories,
}

export default categoriesApi
