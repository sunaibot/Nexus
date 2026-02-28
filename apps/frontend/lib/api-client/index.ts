export {
  request,
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

// 主题 API
export {
  fetchCurrentTheme,
  fetchThemes,
  fetchThemeById,
  createTheme,
  updateTheme,
  deleteTheme,
  setThemePreference,
  themeApi,
  type Theme,
  type ThemeListItem,
  type ThemeColors,
  type ThemeLayout,
  type ThemeFont,
  type ThemeAnimation,
  type ThemeComponents,
  type CreateThemeRequest,
  type UpdateThemeRequest,
  type SetThemePreferenceRequest,
} from './theme'

// 小部件 API
export {
  fetchWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  widgetsApi,
  type Widget,
  type WidgetConfig,
  type CreateWidgetRequest,
  type UpdateWidgetRequest,
} from './widgets'

// 笔记 API
export {
  fetchNotes,
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
  fetchNoteFolders,
  createNoteFolder,
  updateNoteFolder,
  deleteNoteFolder,
  notesApi,
  type Note,
  type NoteFolder,
  type CreateNoteRequest,
  type UpdateNoteRequest,
  type CreateFolderRequest,
  type UpdateFolderRequest,
  type NotesQueryParams,
} from './notes'

// 标签 API
export {
  fetchTags,
  fetchTagById,
  createTag,
  updateTag,
  deleteTag,
  tagsApi,
  type Tag,
  type TagDetail,
  type BookmarkWithTag,
  type CreateTagRequest,
  type UpdateTagRequest,
} from './tags'

// 访问记录 API
export {
  trackVisit,
  fetchVisitStats,
  fetchTopBookmarks,
  fetchVisitTrends,
  fetchRecentVisits,
  fetchBookmarkStats,
  fetchCategoryStats,
  fetchCategoryTrend,
  visitsApi,
  type Visit,
  type BookmarkStats,
  type TopBookmark,
  type VisitTrend,
  type CategoryStat,
  type CategoryTrend,
  type VisitStats,
  type TrackVisitRequest,
} from './visits'

// 统计 API
export {
  fetchStatsOverview,
  fetchStatsTrends,
  fetchPopularBookmarks,
  fetchStatsHeatmap,
  fetchStatsCategories,
  fetchUserActivity,
  fetchStatsDuration,
  statsApi,
  type StatsOverview,
  type TrendData,
  type PopularBookmark,
  type HeatmapData,
  type HeatmapHourly,
  type HeatmapWeekday,
  type HeatmapCategory,
  type CategoryStats,
  type UserActivity,
  type VisitFrequency,
  type DurationStats,
} from './stats'

// 公告 API
export {
  fetchAnnouncements,
  fetchAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  announcementsApi,
  type Announcement,
  type NotificationType,
  type NotificationPriority,
  type CreateAnnouncementRequest,
  type UpdateAnnouncementRequest,
  type AnnouncementsQueryParams,
} from './announcements'

// 通知 API
export {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  fetchNotificationConfigs,
  saveNotificationConfig,
  fetchNotificationChannels,
  notificationsApi,
  type Notification,
  type NotificationConfig,
  type NotificationChannel,
  type NotificationChannelInfo,
  type CreateNotificationRequest,
  type SaveNotificationConfigRequest,
  type NotificationsQueryParams,
} from './notifications'

// 分享 API
export {
  createShare,
  fetchShareContent,
  sharesApi,
  type Share,
  type ShareType,
  type ShareContent,
  type CreateShareRequest,
} from './shares'

// 名言 API
export {
  fetchRandomQuote,
  fetchQuotes,
  quotesApi,
  type Quote,
} from './quotes'

// RSS订阅 API
export {
  fetchRssFeeds,
  fetchRssFeedById,
  createRssFeed,
  updateRssFeed,
  deleteRssFeed,
  fetchRssArticles,
  fetchRssUnreadCount,
  markRssArticleAsRead,
  markAllRssArticlesAsRead,
  starRssArticle,
  rssApi,
  type RssFeed,
  type RssArticle,
  type CreateRssFeedRequest,
  type UpdateRssFeedRequest,
} from './rss'

import { authApi } from './auth'
import { bookmarksApi } from './bookmarks'
import { categoriesApi } from './categories'
import { systemApi } from './system'
import { dockConfigsApi } from './dock-configs'
import { frontendNavApi } from './frontend-nav'
import { settingsTabsApi } from './settings-tabs'
import { privatePasswordApi } from './private-password'
import { themeApi } from './theme'
import { widgetsApi } from './widgets'
import { notesApi } from './notes'
import { tagsApi } from './tags'
import { visitsApi } from './visits'
import { statsApi } from './stats'
import { announcementsApi } from './announcements'
import { notificationsApi } from './notifications'
import { sharesApi } from './shares'
import { quotesApi } from './quotes'
import { rssApi } from './rss'

// 缓存管理
export {
  cacheManager,
  requestWithCache,
  invalidateCache,
  invalidateCacheByTags,
  getCacheStats,
} from './cache'

// 天气 API
export {
  fetchWeather,
  fetchWeatherByCity,
  type WeatherData,
} from './weather'

export default {
  auth: authApi,
  bookmarks: bookmarksApi,
  categories: categoriesApi,
  system: systemApi,
  dockConfigs: dockConfigsApi,
  frontendNav: frontendNavApi,
  settingsTabs: settingsTabsApi,
  privatePassword: privatePasswordApi,
  theme: themeApi,
  widgets: widgetsApi,
  notes: notesApi,
  tags: tagsApi,
  visits: visitsApi,
  stats: statsApi,
  announcements: announcementsApi,
  notifications: notificationsApi,
  shares: sharesApi,
  quotes: quotesApi,
  rss: rssApi,
}
