/**
 * 本地存储键名统一管理
 * 避免前后端使用不同的键名导致状态不同步
 */

export const STORAGE_KEYS = {
  // 认证相关
  AUTH: {
    TOKEN: 'admin_token',
    USERNAME: 'admin_username',
    ROLE: 'admin_role',
    IS_AUTHENTICATED: 'admin_authenticated',
    LOGIN_TIME: 'admin_login_time',
    REQUIRE_PASSWORD_CHANGE: 'admin_require_password_change',
  },
  
  // 用户相关（前端普通用户）
  USER: {
    TOKEN: 'token',
    USER_INFO: 'user',
  },
  
  // 主题设置
  THEME: {
    DARK_MODE: 'darkMode',
    CURRENT_THEME: 'currentTheme',
  },
  
  // 语言设置
  LANGUAGE: {
    CURRENT: 'i18nextLng',
  },
  
  // 自定义数据
  CUSTOM: {
    ICONS: 'zen-garden-custom-icons',
    BOOKMARKS_CACHE: 'bookmarks_cache',
    CATEGORIES_CACHE: 'categories_cache',
  },
  
  // UI 状态
  UI: {
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    COMMAND_PALETTE_OPEN: 'command_palette_open',
  }
} as const

// 便捷导出
export const { AUTH, USER, THEME, LANGUAGE, CUSTOM, UI } = STORAGE_KEYS
