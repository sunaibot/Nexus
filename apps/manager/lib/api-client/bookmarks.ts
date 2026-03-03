import { request, invalidateCache } from './client'
import type {
  Bookmark,
  CreateBookmarkParams,
  UpdateBookmarkParams,
  MetadataResponse,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
  ReorderItem,
} from '../../types'

export async function fetchAllBookmarks(): Promise<Bookmark[]> {
  const response = await request<ApiResponse<Bookmark[]>>(
    '/v2/bookmarks/admin/all',
    { requireAuth: true }
  )
  return response.data || []
}

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const response = await request<ApiResponse<Bookmark[]>>(
    '/v2/bookmarks',
    { requireAuth: false }
  )
  return response.data || []
}

export async function fetchBookmarksPaginated(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Bookmark>> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.category) searchParams.set('category', params.category)
  if (typeof params.isPinned === 'boolean')
    searchParams.set('isPinned', params.isPinned.toString())
  if (typeof params.isReadLater === 'boolean')
    searchParams.set('isReadLater', params.isReadLater.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const queryString = searchParams.toString()
  const endpoint = `/v2/bookmarks/paginated${queryString ? `?${queryString}` : ''}`

  const response = await request<ApiResponse<PaginatedResponse<Bookmark>>>(endpoint, { requireAuth: true })
  return response.data || { 
    items: [], 
    pagination: { 
      page: 1, 
      pageSize: 20, 
      total: 0, 
      totalPages: 0, 
      hasMore: false 
    } 
  }
}

export async function fetchBookmarkById(id: string): Promise<Bookmark | null> {
  const response = await request<ApiResponse<Bookmark>>(`/v2/bookmarks/${id}`, {
    requireAuth: false,
  })
  return response.data || null
}

export async function createBookmark(
  data: CreateBookmarkParams
): Promise<Bookmark> {
  const response = await request<ApiResponse<Bookmark>>('/v2/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  invalidateCache('bookmarks:*')
  return response.data!
}

export async function updateBookmark(
  id: string,
  data: UpdateBookmarkParams
): Promise<Bookmark> {
  const response = await request<ApiResponse<Bookmark>>(`/v2/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  invalidateCache('bookmarks:*')
  return response.data!
}

export async function deleteBookmark(id: string): Promise<void> {
  await request<ApiResponse<void>>(`/v2/bookmarks/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('bookmarks:*')
}

export async function changeBookmarkVisibility(
  id: string,
  visibility: 'public' | 'personal' | 'private'
): Promise<Bookmark> {
  const response = await request<ApiResponse<Bookmark>>(
    `/v2/bookmarks/${id}/visibility`,
    {
      method: 'PATCH',
      body: JSON.stringify({ visibility }),
      requireAuth: true,
    }
  )
  invalidateCache('bookmarks:*')
  return response.data!
}

export async function reorderBookmarks(
  items: ReorderItem[]
): Promise<void> {
  await request<ApiResponse<void>>('/v2/bookmarks/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
    requireAuth: true,
  })
  invalidateCache('bookmarks:*')
}

export async function fetchMetadata(url: string): Promise<MetadataResponse> {
  const response = await request<ApiResponse<MetadataResponse>>(
    '/v2/metadata',
    {
      method: 'POST',
      body: JSON.stringify({ url }),
      requireAuth: false,
    }
  )
  return response.data || {}
}

export const bookmarksApi = {
  getAll: fetchAllBookmarks,
  getBookmarks: fetchBookmarks,
  getPaginated: fetchBookmarksPaginated,
  getById: fetchBookmarkById,
  create: createBookmark,
  update: updateBookmark,
  delete: deleteBookmark,
  changeVisibility: changeBookmarkVisibility,
  reorder: reorderBookmarks,
}

export const metadataApi = {
  fetch: fetchMetadata,
}

export default bookmarksApi
