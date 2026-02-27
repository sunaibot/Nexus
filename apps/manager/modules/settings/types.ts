/**
 * 系统设置模块类型定义
 * 高内聚：所有设置相关类型集中管理
 */

// 站点设置
export interface SiteSettings {
  siteTitle: string
  siteFavicon: string
  siteDescription?: string
  enableBeamAnimation: boolean
  language?: string
  timezone?: string
}

// 仪表显示设置
export interface WidgetVisibility {
  systemMonitor: boolean
  hardwareIdentity: boolean
  vitalSigns: boolean
  networkTelemetry: boolean
  processMatrix: boolean
  dockMiniMonitor: boolean
  mobileTicker: boolean
}

// 主题设置
export type ThemeId = 'default' | 'ocean' | 'sunset' | 'forest' | 'sakura' | 'midnight' | 'coffee' | 'aurora' | 'cyberpunk' | 'glass' | 'paper' | 'auto'

export interface ThemeSettings {
  themeId: ThemeId
  isDark: boolean
  autoMode: boolean
}

// 壁纸设置
export interface WallpaperSettings {
  enabled: boolean
  url: string
  blur: number
  opacity: number
  maskOpacity: number
  maskColor: string
}

// 安全设置
export interface SecuritySettings {
  passwordMinLength: number
  requireStrongPassword: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

// 数据管理设置
export interface DataManagementSettings {
  autoBackup: boolean
  backupInterval: number
  maxBackups: number
}

// 设置模块统一状态
export interface SettingsState {
  site: SiteSettings
  theme: ThemeSettings
  wallpaper: WallpaperSettings
  widget: WidgetVisibility
  security: SecuritySettings
  dataManagement: DataManagementSettings
}

// 设置操作结果
export interface SettingsOperationResult {
  success: boolean
  message?: string
  error?: string
}

// 设置标签页类型
export type SettingsTabType = 
  | 'site' 
  | 'theme' 
  | 'wallpaper' 
  | 'widget' 
  | 'security' 
  | 'data'

// 设置标签页配置
export interface SettingsTabConfig {
  id: SettingsTabType
  labelKey: string
  descriptionKey: string
  icon: string
  gradient: string
  requiredRole?: string[]
}
