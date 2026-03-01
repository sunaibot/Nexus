import { Category } from './bookmark'

export interface Tab {
  id: string
  name: string
  icon?: string
  color?: string
  orderIndex: number
  isDefault?: boolean
  userId?: string
  createdAt?: number
  updatedAt?: number
  categories?: Category[]
}

export interface CreateTabParams {
  name: string
  icon?: string
  color?: string
  categoryIds?: string[]
}

export interface UpdateTabParams {
  name?: string
  icon?: string
  color?: string
  categoryIds?: string[]
  isDefault?: boolean
}

export interface ReorderTabItem {
  id: string
  orderIndex: number
}
