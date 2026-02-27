export {
  request,
  requestWithCache,
  invalidateCache,
  getAuthToken,
  getCurrentUserId,
  setApiBaseUrl,
  ApiError,
} from './client'
export type { RequestOptions } from './client'

export {
  adminLogin,
  adminVerify,
  adminLogout,
  checkAuthStatus,
  clearAuthStatus,
  userRegister,
  userLogin,
  userLogout,
  changePassword,
  savePasswordHint,
  getPasswordHint,
  authApi,
} from './auth'

export {
  fetchAllBookmarks,
  fetchBookmarks,
  fetchBookmarksPaginated,
  fetchBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  changeBookmarkVisibility,
  toggleBookmarkPrivate,
  reorderBookmarks,
  fetchMetadata,
  bookmarksApi,
  metadataApi,
} from './bookmarks'

export {
  fetchCategories,
  fetchAllCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  batchMoveCategories,
  batchMergeCategories,
  categoriesApi,
} from './categories'

export {
  getHealth,
  getStats,
  getSiteSettings,
  updateSiteSettings,
  getSystemInfo,
  systemApi,
} from './system'

export {
  fetchPlugins,
  fetchPlugin,
  createPlugin,
  updatePlugin,
  deletePlugin,
  addUserPlugin,
  removeUserPlugin,
  addRolePlugin,
  removeRolePlugin,
} from './plugins'
export type { Plugin, CreatePluginData, UpdatePluginData } from './plugins'

export {
  fetchAdminMenus,
  fetchAdminMenu,
  createAdminMenu,
  updateAdminMenu,
  deleteAdminMenu,
  addUserMenu,
  removeUserMenu,
  addRoleMenu,
  removeRoleMenu,
  reorderAdminMenus,
  fetchMenuStats,
} from './admin-menus'
export type { AdminMenu, CreateAdminMenuData, UpdateAdminMenuData, ReorderMenuItem, MenuStats } from './admin-menus'

import { authApi } from './auth'
import { bookmarksApi } from './bookmarks'
import { categoriesApi } from './categories'
import { systemApi } from './system'

export default {
  auth: authApi,
  bookmarks: bookmarksApi,
  categories: categoriesApi,
  system: systemApi,
}
