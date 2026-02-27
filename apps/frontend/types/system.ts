export interface SiteSettings {
  siteName: string
  siteDescription?: string
  logo?: string
  favicon?: string
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  enableRegistration?: boolean
  enablePrivateMode?: boolean
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
