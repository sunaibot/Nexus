export interface BookmarksModuleConfig {
  enabled: boolean
  showHealthCheck: boolean
  showIconManagement: boolean
  pageSize: number
}

export const defaultBookmarksConfig: BookmarksModuleConfig = {
  enabled: true,
  showHealthCheck: true,
  showIconManagement: true,
  pageSize: 20,
}
