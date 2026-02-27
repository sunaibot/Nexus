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
  fetchDockConfigs,
  fetchDockConfigById,
  createDockConfig,
  updateDockConfig,
  deleteDockConfig,
  reorderDockConfigs,
  dockConfigsApi,
  type DockConfig,
  type CreateDockConfigRequest,
  type UpdateDockConfigRequest,
} from './dock-configs'

export {
  fetchFrontendNavItems,
  fetchFrontendNavItemsFlat,
  fetchFrontendNavItemById,
  createFrontendNavItem,
  updateFrontendNavItem,
  deleteFrontendNavItem,
  reorderFrontendNavItems,
  frontendNavApi,
  type FrontendNavItem,
  type CreateFrontendNavItemRequest,
  type UpdateFrontendNavItemRequest,
} from './frontend-nav'

export {
  fetchSettingsTabs,
  fetchAllSettingsTabs,
  fetchSettingsTabById,
  createSettingsTab,
  updateSettingsTab,
  deleteSettingsTab,
  reorderSettingsTabs,
  settingsTabsApi,
  type SettingsTab,
  type CreateSettingsTabRequest,
  type UpdateSettingsTabRequest,
} from './settings-tabs'

export {
  getPrivatePasswordStatus,
  setPrivatePassword,
  verifyPrivatePassword,
  updatePrivatePassword,
  disablePrivatePassword,
  enablePrivatePassword,
  deletePrivatePassword,
  privatePasswordApi,
  type PrivatePasswordStatus,
  type VerifyPasswordResult,
} from './private-password'

import { authApi } from './auth'
import { bookmarksApi } from './bookmarks'
import { categoriesApi } from './categories'
import { systemApi } from './system'
import { dockConfigsApi } from './dock-configs'
import { frontendNavApi } from './frontend-nav'
import { settingsTabsApi } from './settings-tabs'
import { privatePasswordApi } from './private-password'

export default {
  auth: authApi,
  bookmarks: bookmarksApi,
  categories: categoriesApi,
  system: systemApi,
  dockConfigs: dockConfigsApi,
  frontendNav: frontendNavApi,
  settingsTabs: settingsTabsApi,
  privatePassword: privatePasswordApi,
}
