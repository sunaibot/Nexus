import { Bookmark, Category, CustomIcon } from '../../types/bookmark'
import { SiteSettings } from '../../lib/api'

export interface AdminProps {
  // 数据
  bookmarks: Bookmark[]
  categories: Category[]
  customIcons: CustomIcon[]
  username: string

  // 导航
  onBack: () => void
  onLogout: () => void

  // 书签操作
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void

  // 分类操作
  onAddCategory: (category: Omit<Category, 'id' | 'orderIndex'>) => void
  onUpdateCategory: (id: string, updates: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  onReorderCategories: (categories: Category[]) => void

  // 图标操作
  onAddCustomIcon: (icon: Omit<CustomIcon, 'id' | 'createdAt'>) => void
  onDeleteCustomIcon: (id: string) => void

  // 其他
  onRefreshData?: () => void
  onQuotesUpdate?: (quotes: string[], useDefault: boolean) => void
  onSettingsChange?: (settings: SiteSettings) => void
}

export type AdminTabType =
  | 'bookmarks'
  | 'categories'
  | 'quotes'
  | 'icons'
  | 'analytics'
  | 'health-check'
  | 'settings'
