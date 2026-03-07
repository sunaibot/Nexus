export interface WidgetVisibility {
  systemMonitor?: boolean
  hardwareIdentity?: boolean
  vitalSigns?: boolean
  networkTelemetry?: boolean
  processMatrix?: boolean
  dockMiniMonitor?: boolean
  mobileTicker?: boolean
}

export interface MenuVisibility {
  languageToggle?: boolean
  themeToggle?: boolean
}

export interface WallpaperSettings {
  enabled?: boolean
  source?: 'upload' | 'url' | 'unsplash' | 'picsum' | 'pexels' | 'preset' | 'provider'
  imageData?: string
  imageUrl?: string
  presetId?: string
  blur?: number
  overlay?: number
}

export interface ThemeColors {
  iconPrimary?: string
  iconSecondary?: string
  iconMuted?: string
  buttonPrimaryBg?: string
  buttonPrimaryText?: string
  buttonSecondaryBg?: string
  buttonSecondaryText?: string
  // 文字颜色
  textPrimary?: string      // 主要文字颜色（分类名称、标题等）
  textSecondary?: string    // 次要文字颜色
  textMuted?: string        // 淡化文字颜色
}

export interface NetworkEnvConfig {
  internalSuffixes: string[]
  internalIPs: string[]
  localhostNames: string[]
}

export interface SiteSettings {
  siteName?: string
  siteTitle?: string
  siteDescription?: string
  siteFavicon?: string
  logo?: string
  favicon?: string
  theme?: 'light' | 'dark' | 'auto'
  themeId?: string
  primaryColor?: string
  enableRegistration?: boolean
  enablePrivateMode?: boolean
  enableBeamAnimation?: boolean
  enableLiteMode?: boolean
  enableWeather?: boolean
  enableLunar?: boolean
  footerText?: string
  widgetVisibility?: WidgetVisibility
  menuVisibility?: MenuVisibility
  wallpaper?: WallpaperSettings
  themeColors?: ThemeColors
  networkEnv?: NetworkEnvConfig
}

export interface ServiceMonitor {
  id: string
  name: string
  url: string
  type: 'http' | 'tcp' | 'ping'
  interval: number
  timeout: number
  expectedStatus?: number
  isActive: boolean
  lastCheckAt?: string
  lastStatus?: 'up' | 'down' | 'unknown'
  lastResponseTime?: number
}

export interface Notepad {
  id: string
  title: string
  content: string
  isEncrypted?: boolean
  expireAt?: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  createdAt: string
}

export interface RssFeed {
  id: string
  title: string
  url: string
  description?: string
  lastFetchedAt?: string
  isActive: boolean
}

export interface CustomMetric {
  id: string
  name: string
  value: number
  unit?: string
  labels?: Record<string, string>
  timestamp: string
}

export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  userId?: string
  username?: string
  ip?: string
  userAgent?: string
  details?: Record<string, unknown>
  createdAt: string
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

export interface SystemStats {
  bookmarks: number
  categories: number
  users: number
}

export interface HealthStatus {
  status: 'ok' | 'error'
  version: string
  timestamp?: string
}
