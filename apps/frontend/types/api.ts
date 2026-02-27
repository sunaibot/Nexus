export interface SuccessResponse {
  success: boolean
  message?: string
}

export interface ReorderItem {
  id: string
  orderIndex: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  isPinned?: boolean
  isReadLater?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
