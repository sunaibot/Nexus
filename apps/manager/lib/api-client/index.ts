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

// 导出 plugins 模块（函数和API对象）
export {
  fetchPlugins,
  fetchPlugin,
  createPlugin,
  updatePlugin,
  deletePlugin,
  installPlugin,
  addUserPlugin,
  removeUserPlugin,
  addRolePlugin,
  removeRolePlugin,
  pluginsApi,
} from './plugins'
export type { Plugin, CreatePluginData, UpdatePluginData } from './plugins'

// 导出 admin-menus 模块（函数和API对象）
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
  adminMenusApi,
} from './admin-menus'
export type { AdminMenu, CreateAdminMenuData, UpdateAdminMenuData, ReorderMenuItem, MenuStats } from './admin-menus'

// 导出 users 模块
export {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  batchUpdateUsers,
  fetchUserStats,
  usersApi,
} from './users'
export type { User, CreateUserData, UpdateUserData, UserStats } from './users'

// 导出 security 模块
export {
  getSecurityConfig,
  updateCsrfConfig,
  getSecurityLogs,
  getSecurityStats,
  securityApi,
} from './security'
export type { SecurityConfig, SecurityStats, SecurityLog } from './security'

// 导出 bookmark-card-styles 模块
export {
  fetchBookmarkCardStyles,
  fetchBookmarkCardStyle,
  createBookmarkCardStyle,
  updateBookmarkCardStyle,
  deleteBookmarkCardStyle,
  setDefaultBookmarkCardStyle,
  fetchCurrentBookmarkCardStyle,
  bookmarkCardStylesApi,
} from './bookmark-card-styles'
export type { BookmarkCardStyle, CreateBookmarkCardStyleData, UpdateBookmarkCardStyleData } from './bookmark-card-styles'

// 导出其他API模块
export { settingsTabsApi } from './settings-tabs'
export { dockConfigsApi } from './dock-configs'
export { frontendNavApi } from './frontend-nav'
export { systemConfigsApi } from './system-configs'
export type { SystemConfigs, FileTransferConfig, UploadConfig, NotificationConfig } from './system-configs'
