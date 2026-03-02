/**
 * 数据库初始化模块
 * 统一数据库初始化逻辑
 */

import initSqlJs from 'sql.js'
import fs from 'fs'
import { setDatabase, forceSaveDatabase, getDbPath, hashPassword } from './core.js'
import type { Database as SqlJsDatabase } from 'sql.js'
import { createAllIndexes, analyzeQueries } from './migrations/addIndexes.js'
import { initBuiltinPlugins } from './init-plugins.js'

/**
 * 初始化数据库
 * 创建表结构、初始化默认数据
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs()
  const dbPath = getDbPath()
  const isNewDatabase = !fs.existsSync(dbPath)
  
  let db: SqlJsDatabase
  
  if (!isNewDatabase) {
    console.log('📖 Loading existing database...')
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
    checkAndAddColumns(db)
  } else {
    console.log('🆕 Creating new database...')
    db = new SQL.Database()
  }
  
  setDatabase(db)
  createTables(db)
  
  if (isNewDatabase) {
    console.log('📝 Initializing default data...')
    await initDefaultData(db)
  } else {
    await ensureDefaultSettings(db)
    await ensureDefaultUser(db)
    await ensureDefaultPluginsAndMenus(db)
    ensureDefaultTabs(db)
  }
  
  // 初始化所有内置插件（新的统一插件系统）
  initBuiltinPlugins(db)
  
  migrateDatabase(db)
  await initFileTransferSettings(db)
  cleanupExpiredFileTransfers(db)
  
  // 创建数据库索引
  createAllIndexes(db)
  
  // 分析查询性能（开发环境）
  if (process.env.NODE_ENV === 'development') {
    analyzeQueries(db)
  }
  
  forceSaveDatabase()
  return db
}

/**
 * 创建数据库表结构
 */
function createTables(db: SqlJsDatabase): void {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      isActive INTEGER DEFAULT 1,
      isDefaultPassword INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 令牌表
  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 书签表
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      favicon TEXT,
      ogImage TEXT,
      icon TEXT,
      iconUrl TEXT,
      category TEXT,
      tags TEXT,
      orderIndex INTEGER DEFAULT 0,
      isPinned INTEGER DEFAULT 0,
      isReadLater INTEGER DEFAULT 0,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      userId TEXT,
      internalUrl TEXT,
      notes TEXT,
      visibility TEXT DEFAULT 'personal',
      visitCount INTEGER DEFAULT 0
    )
  `)

  // 分类表
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      orderIndex INTEGER DEFAULT 0,
      userId TEXT,
      parentId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tab 表（快速导航标签）
  db.run(`
    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      orderIndex INTEGER DEFAULT 0,
      isDefault INTEGER DEFAULT 0,
      userId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tab 和分类的关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS tab_categories (
      tabId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tabId, categoryId),
      FOREIGN KEY (tabId) REFERENCES tabs(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  // 设置表
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      userId TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 访问记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      bookmarkId TEXT,
      userId TEXT,
      visitedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      ip TEXT,
      userAgent TEXT
    )
  `)

  // 审计日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      username TEXT,
      action TEXT NOT NULL,
      resourceType TEXT,
      resourceId TEXT,
      details TEXT,
      ip TEXT,
      userAgent TEXT,
      sessionId TEXT,
      deviceInfo TEXT,
      riskLevel TEXT DEFAULT 'low',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 文件快传表
  db.run(`
    CREATE TABLE IF NOT EXISTS file_transfers (
      id TEXT PRIMARY KEY,
      userId TEXT,
      fileName TEXT NOT NULL,
      fileSize INTEGER,
      fileType TEXT,
      filePath TEXT,
      extractCode TEXT UNIQUE,
      extractPassword TEXT,
      deleteCode TEXT UNIQUE,
      deletePassword TEXT,
      downloadToken TEXT UNIQUE,
      maxDownloads INTEGER DEFAULT 0,
      downloadCount INTEGER DEFAULT 0,
      expiryHours INTEGER DEFAULT 24,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      expiresAt INTEGER
    )
  `)

  // 文件传输每日配额表
  db.run(`
    CREATE TABLE IF NOT EXISTS file_transfer_daily_quota (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      total_size INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, date)
    )
  `)

  // RSS订阅表
  db.run(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      url TEXT NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      lastFetchAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // RSS文章表
  db.run(`
    CREATE TABLE IF NOT EXISTS rss_articles (
      id TEXT PRIMARY KEY,
      feedId TEXT NOT NULL,
      title TEXT,
      link TEXT,
      description TEXT,
      content TEXT,
      publishedAt TEXT,
      isRead INTEGER DEFAULT 0,
      isStarred INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 标签表
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      userId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 书签标签关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmarkId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (bookmarkId, tagId)
    )
  `)

  // 分享表
  db.run(`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      bookmarkId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      userId TEXT,
      expiresAt INTEGER,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 名言表
  db.run(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      source TEXT,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 便签表
  db.run(`
    CREATE TABLE IF NOT EXISTS notepads (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT,
      content TEXT,
      history TEXT,
      files TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 自定义指标表
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_metrics (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      script TEXT,
      unit TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 自定义指标历史表
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_metric_history (
      id TEXT PRIMARY KEY,
      metricId TEXT NOT NULL,
      value REAL,
      recordedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 服务监控表
  db.run(`
    CREATE TABLE IF NOT EXISTS service_monitors (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 小部件表
  db.run(`
    CREATE TABLE IF NOT EXISTS widgets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      orderIndex INTEGER DEFAULT 0,
      isVisible INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 笔记表（富文本笔记）
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT,
      content TEXT,
      isMarkdown INTEGER DEFAULT 1,
      tags TEXT,
      folderId TEXT,
      isPinned INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 笔记文件夹表
  db.run(`
    CREATE TABLE IF NOT EXISTS note_folders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      parentId TEXT,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 书签备注表
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmark_notes (
      bookmarkId TEXT PRIMARY KEY,
      content TEXT,
      isMarkdown INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 私密书签密码表（书签维度 - 保留兼容）
  db.run(`
    CREATE TABLE IF NOT EXISTS private_bookmark_passwords (
      id TEXT PRIMARY KEY,
      bookmarkId TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 用户私密密码表（用户维度 - 新）
  db.run(`
    CREATE TABLE IF NOT EXISTS user_private_passwords (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      isEnabled INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // IP过滤表
  db.run(`
    CREATE TABLE IF NOT EXISTS ip_filters (
      id TEXT PRIMARY KEY,
      ip TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 插件表
  db.run(`
    CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT DEFAULT '1.0.0',
      author TEXT,
      icon TEXT,
      isEnabled INTEGER DEFAULT 1,
      isInstalled INTEGER DEFAULT 1,
      config TEXT,
      orderIndex INTEGER DEFAULT 0,
      visibility TEXT DEFAULT 'public',
      allowedRoles TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 用户-插件关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_plugins (
      userId TEXT NOT NULL,
      pluginId TEXT NOT NULL,
      isEnabled INTEGER DEFAULT 1,
      config TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, pluginId)
    )
  `)

  // 角色-插件关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS role_plugins (
      role TEXT NOT NULL,
      pluginId TEXT NOT NULL,
      isEnabled INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role, pluginId)
    )
  `)

  // 后台菜单表
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_menus (
      id TEXT PRIMARY KEY,
      parentId TEXT,
      name TEXT NOT NULL,
      labelKey TEXT,
      icon TEXT,
      path TEXT,
      pluginId TEXT,
      isVisible INTEGER DEFAULT 1,
      isEnabled INTEGER DEFAULT 1,
      orderIndex INTEGER DEFAULT 0,
      visibility TEXT DEFAULT 'public',
      allowedRoles TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 用户-菜单关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_menus (
      userId TEXT NOT NULL,
      menuId TEXT NOT NULL,
      isVisible INTEGER DEFAULT 1,
      isEnabled INTEGER DEFAULT 1,
      orderIndex INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, menuId)
    )
  `)

  // 角色-菜单关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS role_menus (
      role TEXT NOT NULL,
      menuId TEXT NOT NULL,
      isVisible INTEGER DEFAULT 1,
      isEnabled INTEGER DEFAULT 1,
      orderIndex INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role, menuId)
    )
  `)

  // 插件前台显示配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS plugin_display_configs (
      id TEXT PRIMARY KEY,
      pluginId TEXT NOT NULL UNIQUE,
      -- 网格定位 (12列网格系统)
      gridPosition TEXT DEFAULT '{"colStart":1,"colEnd":13,"rowStart":1,"rowEnd":2}',
      -- 层级系统
      layer TEXT DEFAULT 'content',
      zIndex INTEGER DEFAULT 0,
      -- 显示配置
      displayConfig TEXT DEFAULT '{"visible":true,"responsive":{"mobile":{"colStart":1,"colEnd":13},"tablet":{"colStart":1,"colEnd":13},"desktop":{"colStart":1,"colEnd":13}}}',
      -- 样式配置
      styleConfig TEXT DEFAULT '{"colors":{"background":"transparent","text":"","border":""},"typography":{"fontSize":"","fontFamily":"","fontWeight":""},"spacing":{"padding":"","margin":""},"effects":{"opacity":1,"blur":0,"shadow":"","animation":""}}',
      -- 交互配置
      interactionConfig TEXT DEFAULT '{"draggable":false,"resizable":false,"clickable":true}',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pluginId) REFERENCES plugins(id) ON DELETE CASCADE
    )
  `)

  // 插件插槽配置表 - 管理插件在前台的显示位置
  db.run(`
    CREATE TABLE IF NOT EXISTS plugin_slot_configs (
      id TEXT PRIMARY KEY,
      pluginId TEXT NOT NULL UNIQUE,
      slot TEXT NOT NULL DEFAULT 'hero-after',
      orderIndex INTEGER DEFAULT 0,
      isEnabled INTEGER DEFAULT 1,
      config TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pluginId) REFERENCES plugins(id) ON DELETE CASCADE
    )
  `)

  // 系统配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 主题表 - 支持系统默认和用户自定义主题
  db.run(`
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      isDark INTEGER DEFAULT 0,
      colors TEXT, -- JSON: { primary, secondary, accent, background, foreground, border, muted, card, hover, active }
      layout TEXT, -- JSON: { maxWidth, padding, gridColumns, gridGap, borderRadius, shadow }
      font TEXT, -- JSON: { family, headingFamily, baseSize, lineHeight, smallSize, largeSize }
      animation TEXT, -- JSON: { enabled, duration, easing, hoverDuration }
      components TEXT, -- JSON: { button, card, input }
      customCSS TEXT,
      isSystem INTEGER DEFAULT 0, -- 1=系统内置主题, 0=用户自定义
      isActive INTEGER DEFAULT 0,
      createdBy TEXT, -- 创建者用户ID, null表示系统主题
      visibility TEXT DEFAULT 'private', -- public(所有人可见), role(指定角色), private(仅自己)
      allowedRoles TEXT, -- JSON数组, visibility=role时使用
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 用户主题偏好表 - 记录用户当前使用的主题
  db.run(`
    CREATE TABLE IF NOT EXISTS user_theme_preferences (
      userId TEXT PRIMARY KEY,
      themeId TEXT NOT NULL,
      isAutoMode INTEGER DEFAULT 0, -- 是否自动切换深浅模式
      customOverrides TEXT, -- JSON: 用户对当前主题的自定义覆盖
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (themeId) REFERENCES themes(id) ON DELETE CASCADE
    )
  `)

  // 角色默认主题表 - 为不同角色设置默认主题
  db.run(`
    CREATE TABLE IF NOT EXISTS role_default_themes (
      role TEXT PRIMARY KEY,
      themeId TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (themeId) REFERENCES themes(id) ON DELETE CASCADE
    )
  `)

  // Dock配置表 - 存储Dock导航项配置
  db.run(`
    CREATE TABLE IF NOT EXISTS dock_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      items TEXT NOT NULL, -- JSON: [{ id, title, icon, iconType, href, action, orderIndex, isEnabled, isVisible }]
      scope TEXT DEFAULT 'global', -- global(全局), user(用户), role(角色)
      userId TEXT, -- scope=user时使用
      role TEXT, -- scope=role时使用
      isDefault INTEGER DEFAULT 0, -- 1=默认配置
      isEnabled INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Settings Tabs配置表 - 存储设置页面标签配置
  db.run(`
    CREATE TABLE IF NOT EXISTS settings_tabs (
      id TEXT PRIMARY KEY,
      tabId TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      labelKey TEXT NOT NULL,
      descriptionKey TEXT,
      icon TEXT,
      iconType TEXT DEFAULT 'lucide', -- lucide, custom, url
      gradient TEXT,
      orderIndex INTEGER DEFAULT 0,
      isEnabled INTEGER DEFAULT 1,
      isVisible INTEGER DEFAULT 1,
      visibility TEXT DEFAULT 'public', -- public, role, admin, super_admin
      allowedRoles TEXT, -- JSON数组
      component TEXT, -- 对应的组件名称
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Frontend导航配置表 - 存储前端导航项配置
  db.run(`
    CREATE TABLE IF NOT EXISTS frontend_nav_items (
      id TEXT PRIMARY KEY,
      navId TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      labelKey TEXT,
      icon TEXT,
      iconType TEXT DEFAULT 'lucide',
      href TEXT,
      orderIndex INTEGER DEFAULT 0,
      isEnabled INTEGER DEFAULT 1,
      isVisible INTEGER DEFAULT 1,
      visibility TEXT DEFAULT 'public', -- public, role, admin, user
      allowedRoles TEXT, -- JSON数组
      requireAuth INTEGER DEFAULT 0, -- 是否需要登录
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 书签卡片样式配置表 - 支持全局、角色、用户级别配置
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmark_card_styles (
      id TEXT PRIMARY KEY,
      -- 基础样式
      backgroundColor TEXT DEFAULT 'rgba(255, 255, 255, 0.1)',
      backgroundGradient TEXT, -- JSON: { from, to, angle }
      borderRadius TEXT DEFAULT '12px',
      borderWidth TEXT DEFAULT '1px',
      borderColor TEXT DEFAULT 'rgba(255, 255, 255, 0.1)',
      borderStyle TEXT DEFAULT 'solid',
      
      -- 阴影效果
      shadowColor TEXT DEFAULT 'rgba(0, 0, 0, 0.1)',
      shadowBlur TEXT DEFAULT '10px',
      shadowSpread TEXT DEFAULT '0px',
      shadowX TEXT DEFAULT '0px',
      shadowY TEXT DEFAULT '4px',
      
      -- 间距
      padding TEXT DEFAULT '16px',
      margin TEXT DEFAULT '8px',
      gap TEXT DEFAULT '12px',
      
      -- 字体样式
      titleFontSize TEXT DEFAULT '16px',
      titleFontWeight TEXT DEFAULT '600',
      titleColor TEXT DEFAULT 'inherit',
      descriptionFontSize TEXT DEFAULT '14px',
      descriptionFontWeight TEXT DEFAULT '400',
      descriptionColor TEXT DEFAULT 'inherit',
      
      -- 效果
      opacity REAL DEFAULT 1.0,
      backdropBlur TEXT DEFAULT '10px',
      backdropSaturate TEXT DEFAULT '180%',
      
      -- 悬停效果
      hoverBackgroundColor TEXT,
      hoverBorderColor TEXT,
      hoverShadowBlur TEXT,
      hoverScale REAL DEFAULT 1.02,
      hoverTransition TEXT DEFAULT 'all 0.3s ease',
      
      -- 图标样式
      iconSize TEXT DEFAULT '24px',
      iconColor TEXT,
      iconBackgroundColor TEXT,
      iconBorderRadius TEXT DEFAULT '8px',
      
      -- 图片样式
      imageHeight TEXT DEFAULT '120px',
      imageBorderRadius TEXT DEFAULT '8px',
      imageObjectFit TEXT DEFAULT 'cover',
      
      -- 标签样式
      tagBackgroundColor TEXT DEFAULT 'rgba(0, 0, 0, 0.1)',
      tagTextColor TEXT,
      tagBorderRadius TEXT DEFAULT '4px',
      tagFontSize TEXT DEFAULT '12px',
      
      -- 配置范围
      scope TEXT DEFAULT 'global', -- global(全局), role(角色), user(用户)
      userId TEXT, -- scope=user时使用
      role TEXT, -- scope=role时使用
      
      -- 优先级和启用状态
      priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高
      isEnabled INTEGER DEFAULT 1,
      isDefault INTEGER DEFAULT 0, -- 1=默认配置
      
      -- 元数据
      name TEXT, -- 配置名称
      description TEXT, -- 配置描述
      previewImage TEXT, -- 预览图URL
      
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // 自定义图标表
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_icons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      userId TEXT,
      isPublic INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // 公告表
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'announcement',
      priority TEXT DEFAULT 'normal',
      targetRoles TEXT DEFAULT '["all"]',
      targetUsers TEXT,
      startAt TEXT DEFAULT CURRENT_TIMESTAMP,
      endAt TEXT,
      isPublished INTEGER DEFAULT 0,
      publishedAt TEXT,
      publishedBy TEXT,
      readCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 通知表
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      isRead INTEGER DEFAULT 0,
      readAt TEXT,
      data TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // 通知配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS notification_configs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      config TEXT DEFAULT '{}',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, channel)
    )
  `)

  // WebDAV配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS webdav_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      protocol TEXT DEFAULT 'webdav',
      serverUrl TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      remotePath TEXT DEFAULT '/bookmarks',
      syncDirection TEXT DEFAULT 'bidirectional',
      autoSync INTEGER DEFAULT 0,
      syncInterval INTEGER DEFAULT 60,
      enabled INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // WebDAV同步历史表
  db.run(`
    CREATE TABLE IF NOT EXISTS webdav_sync_history (
      id TEXT PRIMARY KEY,
      configId TEXT NOT NULL,
      direction TEXT,
      status TEXT,
      totalItems INTEGER DEFAULT 0,
      syncedItems INTEGER DEFAULT 0,
      errors TEXT,
      startedAt TEXT,
      completedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (configId) REFERENCES webdav_configs(id) ON DELETE CASCADE
    )
  `)

  // 公告阅读记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS announcement_reads (
      id TEXT PRIMARY KEY,
      announcementId TEXT NOT NULL,
      userId TEXT NOT NULL,
      readAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (announcementId) REFERENCES announcements(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(announcementId, userId)
    )
  `)
}

/**
 * 检查并添加缺失的列
 */
function checkAndAddColumns(db: SqlJsDatabase): void {
  try {
    // 检查 bookmarks 表是否有 visibility 列
    const result = db.exec("PRAGMA table_info(bookmarks)")
    if (result.length > 0) {
      const columns = result[0].values.map((row: any[]) => row[1])
      if (!columns.includes('visibility')) {
        console.log('Adding visibility column to bookmarks table...')
        db.run("ALTER TABLE bookmarks ADD COLUMN visibility TEXT DEFAULT 'personal'")
      }
      if (!columns.includes('visitCount')) {
        console.log('Adding visitCount column to bookmarks table...')
        db.run("ALTER TABLE bookmarks ADD COLUMN visitCount INTEGER DEFAULT 0")
      }
    }
    
    // 检查 audit_logs 表是否有 sessionId、deviceInfo 和 riskLevel 列
    const auditResult = db.exec("PRAGMA table_info(audit_logs)")
    if (auditResult.length > 0) {
      const auditColumns = auditResult[0].values.map((row: any[]) => row[1])
      if (!auditColumns.includes('sessionId')) {
        console.log('Adding sessionId column to audit_logs table...')
        db.run('ALTER TABLE audit_logs ADD COLUMN sessionId TEXT')
      }
      if (!auditColumns.includes('deviceInfo')) {
        console.log('Adding deviceInfo column to audit_logs table...')
        db.run('ALTER TABLE audit_logs ADD COLUMN deviceInfo TEXT')
      }
      if (!auditColumns.includes('riskLevel')) {
        console.log('Adding riskLevel column to audit_logs table...')
        db.run("ALTER TABLE audit_logs ADD COLUMN riskLevel TEXT DEFAULT 'low'")
      }
    }

    // 检查 file_transfers 表结构
    const fileTransferResult = db.exec("PRAGMA table_info(file_transfers)")
    if (fileTransferResult.length > 0) {
      const fileTransferColumns = fileTransferResult[0].values.map((row: any[]) => row[1])
      
      // 检查是否需要重建表（列顺序不正确或缺少必要列）
      const requiredColumns = ['filePath', 'extractPassword', 'deletePassword', 'downloadToken']
      const needsRebuild = fileTransferColumns.includes('fileData') || 
                           requiredColumns.some(col => !fileTransferColumns.includes(col))
      
      if (needsRebuild) {
        console.log('Rebuilding file_transfers table with correct schema...')
        
        // 备份旧数据
        const oldData = db.exec('SELECT * FROM file_transfers')
        
        // 删除旧表并创建新表
        db.run('DROP TABLE file_transfers')
        db.run(`
          CREATE TABLE file_transfers (
            id TEXT PRIMARY KEY,
            userId TEXT,
            fileName TEXT NOT NULL,
            fileSize INTEGER,
            fileType TEXT,
            filePath TEXT,
            extractCode TEXT UNIQUE,
            extractPassword TEXT,
            deleteCode TEXT UNIQUE,
            deletePassword TEXT,
            downloadToken TEXT,
            maxDownloads INTEGER DEFAULT 0,
            downloadCount INTEGER DEFAULT 0,
            expiryHours INTEGER DEFAULT 24,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            expiresAt INTEGER
          )
        `)
        
        // 恢复数据（如果存在）
        if (oldData.length > 0 && oldData[0].values.length > 0) {
          const oldColumns = fileTransferResult[0].values.map((row: any[]) => row[1])
          console.log(`Migrating ${oldData[0].values.length} existing records...`)
          
          for (const row of oldData[0].values) {
            const id = row[0]
            const userId = row[1]
            const fileName = row[2]
            const fileSize = row[3]
            const fileType = row[4]
            // 根据旧列顺序获取数据
            const extractCode = oldColumns.includes('extractCode') ? row[oldColumns.indexOf('extractCode')] : null
            const deleteCode = oldColumns.includes('deleteCode') ? row[oldColumns.indexOf('deleteCode')] : null
            const maxDownloads = oldColumns.includes('maxDownloads') ? row[oldColumns.indexOf('maxDownloads')] : 10
            const downloadCount = oldColumns.includes('downloadCount') ? row[oldColumns.indexOf('downloadCount')] : 0
            const expiryHours = oldColumns.includes('expiryHours') ? row[oldColumns.indexOf('expiryHours')] : 72
            const createdAt = oldColumns.includes('createdAt') ? row[oldColumns.indexOf('createdAt')] : new Date().toISOString()
            const expiresAt = oldColumns.includes('expiresAt') ? row[oldColumns.indexOf('expiresAt')] : null
            
            db.run(
              'INSERT INTO file_transfers (id, userId, fileName, fileSize, fileType, filePath, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, maxDownloads, downloadCount, expiryHours, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [id, userId, fileName, fileSize, fileType, null, extractCode, null, deleteCode, null, null, maxDownloads, downloadCount, expiryHours, createdAt, expiresAt]
            )
          }
          console.log('Migration completed')
        }
      }
    }
    // 检查 plugins 表是否有所有需要的列
    const pluginsResult = db.exec("PRAGMA table_info(plugins)")
    if (pluginsResult.length > 0) {
      const pluginsColumns = pluginsResult[0].values.map((row: any[]) => row[1])
      if (!pluginsColumns.includes('visibility')) {
        console.log('Adding visibility column to plugins table...')
        db.run("ALTER TABLE plugins ADD COLUMN visibility TEXT DEFAULT 'public'")
      }
      if (!pluginsColumns.includes('allowedRoles')) {
        console.log('Adding allowedRoles column to plugins table...')
        db.run("ALTER TABLE plugins ADD COLUMN allowedRoles TEXT")
      }
    }

    // 检查 admin_menus 表是否有所有需要的列
    const adminMenusResult = db.exec("PRAGMA table_info(admin_menus)")
    if (adminMenusResult.length > 0) {
      const adminMenusColumns = adminMenusResult[0].values.map((row: any[]) => row[1])
      if (!adminMenusColumns.includes('visibility')) {
        console.log('Adding visibility column to admin_menus table...')
        db.run("ALTER TABLE admin_menus ADD COLUMN visibility TEXT DEFAULT 'public'")
      }
      if (!adminMenusColumns.includes('allowedRoles')) {
        console.log('Adding allowedRoles column to admin_menus table...')
        db.run("ALTER TABLE admin_menus ADD COLUMN allowedRoles TEXT")
      }
    }

    // 检查 private_bookmark_passwords 表是否存在
    const tableResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='private_bookmark_passwords'")
    if (tableResult.length === 0) {
      console.log('Creating private_bookmark_passwords table...')
      db.run(`
        CREATE TABLE IF NOT EXISTS private_bookmark_passwords (
          id TEXT PRIMARY KEY,
          bookmarkId TEXT NOT NULL,
          passwordHash TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
    }
  } catch (error) {
    console.error('Error checking/adding columns:', error)
  }
}

/**
 * 初始化默认数据
 */
async function initDefaultData(db: SqlJsDatabase): Promise<void> {
  // 创建默认管理员用户 - 使用默认密码 admin123
  // 首次登录后系统会强制要求修改密码
  const defaultPassword = 'admin123'
  const adminPasswordHash = await hashPassword(defaultPassword)
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO users (id, username, password, email, role, isActive, isDefaultPassword, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    ['admin', 'admin', adminPasswordHash, 'admin@example.com', 'admin', now, now]
  )

  console.log('✅ Default admin user created')
  console.log('⚠️  IMPORTANT: First login requires password change')
  console.log('🔑  Default password: admin123')

  // 初始化默认插件
  const defaultPlugins = [
    {
      id: 'quotes',
      name: '名言管理',
      description: '名言管理插件，提供名言的增删改查功能',
      version: '1.0.0',
      author: 'Nexus Team',
      icon: '',
      isEnabled: 1,
      isInstalled: 1,
      visibility: 'public',
      orderIndex: 1
    }
  ]

  for (const plugin of defaultPlugins) {
    db.run(
      `INSERT INTO plugins (id, name, description, version, author, icon, isEnabled, isInstalled, visibility, orderIndex, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [plugin.id, plugin.name, plugin.description, plugin.version, plugin.author, plugin.icon, plugin.isEnabled, plugin.isInstalled, plugin.visibility, plugin.orderIndex, now, now]
    )
  }

  console.log('✅ Default plugins created')

  // 初始化默认菜单
  const defaultMenus = [
    {
      id: 'bookmarks',
      name: '书签管理',
      icon: 'BookMarked',
      path: 'bookmarks',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 1,
      visibility: 'public'
    },
    {
      id: 'categories',
      name: '分类管理',
      icon: 'Folder',
      path: 'categories',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 2,
      visibility: 'public'
    },
    {
      id: 'analytics',
      name: '数据分析',
      icon: 'BarChart3',
      path: 'analytics',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 3,
      visibility: 'public'
    },
    {
      id: 'theme',
      name: '主题管理',
      icon: 'Palette',
      path: 'theme',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 4,
      visibility: 'public'
    },
    {
      id: 'wallpaper',
      name: '壁纸设置',
      icon: 'Image',
      path: 'wallpaper',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 5,
      visibility: 'public'
    },
    {
      id: 'bookmark-card-styles',
      name: '书签样式',
      icon: 'LayoutGrid',
      path: 'bookmark-card-styles',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 6,
      visibility: 'public'
    },
    {
      id: 'plugins',
      name: '插件中心',
      icon: 'Puzzle',
      path: 'plugins',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 7,
      visibility: 'public'
    },
    {
      id: 'menus',
      name: '菜单管理',
      icon: 'Layout',
      path: 'menus',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 8,
      visibility: 'public'
    },
    {
      id: 'users',
      name: '用户管理',
      icon: 'Users',
      path: 'users',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 9,
      visibility: 'public'
    },
    {
      id: 'settings',
      name: '系统设置',
      icon: 'Settings',
      path: 'settings',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 10,
      visibility: 'public'
    },
    // 注意: 审计中心菜单已移除，审计日志功能合并到安全管理 - 安全日志中
    {
      id: 'security',
      name: '安全管理',
      icon: 'Shield',
      path: 'security',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 11,
      visibility: 'public'
    }
  ]

  for (const menu of defaultMenus) {
    db.run(
      `INSERT INTO admin_menus (id, name, icon, path, isVisible, isEnabled, orderIndex, visibility, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [menu.id, menu.name, menu.icon, menu.path, menu.isVisible, menu.isEnabled, menu.orderIndex, menu.visibility, now, now]
    )
  }

  console.log('✅ Default admin menus created')

  // 初始化默认分类
  const defaultCategories = [
    {
      id: 'cat-tools',
      name: '常用工具',
      icon: 'Wrench',
      color: '#3B82F6',
      orderIndex: 0,
      userId: 'admin'
    },
    {
      id: 'cat-dev',
      name: '开发资源',
      icon: 'Code',
      color: '#10B981',
      orderIndex: 1,
      userId: 'admin'
    },
    {
      id: 'cat-design',
      name: '设计灵感',
      icon: 'Palette',
      color: '#F59E0B',
      orderIndex: 2,
      userId: 'admin'
    },
    {
      id: 'cat-learn',
      name: '学习资料',
      icon: 'BookOpen',
      color: '#8B5CF6',
      orderIndex: 3,
      userId: 'admin'
    },
    {
      id: 'cat-entertainment',
      name: '娱乐休闲',
      icon: 'Gamepad2',
      color: '#EC4899',
      orderIndex: 4,
      userId: 'admin'
    }
  ]

  for (const category of defaultCategories) {
    db.run(
      `INSERT INTO categories (id, name, icon, color, orderIndex, userId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category.id, category.name, category.icon, category.color, category.orderIndex, category.userId, now, now]
    )
  }

  console.log('✅ Default categories created')

  // 初始化默认 Tab（快速导航）
  const defaultTabs = [
    {
      id: 'tab-home',
      name: '主页',
      icon: 'Home',
      color: '#3B82F6',
      orderIndex: 0,
      isDefault: 1,
      userId: 'admin'
    },
    {
      id: 'tab-dev',
      name: '编程',
      icon: 'Code',
      color: '#10B981',
      orderIndex: 1,
      isDefault: 0,
      userId: 'admin'
    },
    {
      id: 'tab-ai',
      name: 'AI',
      icon: 'Bot',
      color: '#8B5CF6',
      orderIndex: 2,
      isDefault: 0,
      userId: 'admin'
    },
    {
      id: 'tab-knowledge',
      name: '知识',
      icon: 'BookOpen',
      color: '#F59E0B',
      orderIndex: 3,
      isDefault: 0,
      userId: 'admin'
    },
    {
      id: 'tab-tools',
      name: '工具',
      icon: 'Wrench',
      color: '#EC4899',
      orderIndex: 4,
      isDefault: 0,
      userId: 'admin'
    }
  ]

  for (const tab of defaultTabs) {
    db.run(
      `INSERT INTO tabs (id, name, icon, color, orderIndex, isDefault, userId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tab.id, tab.name, tab.icon, tab.color, tab.orderIndex, tab.isDefault, tab.userId, now, now]
    )
  }

  console.log('✅ Default tabs created')

  // 初始化 Tab 和分类的关联
  const defaultTabCategories = [
    // 主页 Tab - 包含所有分类
    { tabId: 'tab-home', categoryId: 'cat-tools', orderIndex: 0 },
    { tabId: 'tab-home', categoryId: 'cat-dev', orderIndex: 1 },
    { tabId: 'tab-home', categoryId: 'cat-design', orderIndex: 2 },
    { tabId: 'tab-home', categoryId: 'cat-learn', orderIndex: 3 },
    { tabId: 'tab-home', categoryId: 'cat-entertainment', orderIndex: 4 },
    // 编程 Tab - 只包含开发资源
    { tabId: 'tab-dev', categoryId: 'cat-dev', orderIndex: 0 },
    // AI Tab - 包含工具和学习资料
    { tabId: 'tab-ai', categoryId: 'cat-tools', orderIndex: 0 },
    { tabId: 'tab-ai', categoryId: 'cat-learn', orderIndex: 1 },
    // 知识 Tab - 包含学习资料和设计灵感
    { tabId: 'tab-knowledge', categoryId: 'cat-learn', orderIndex: 0 },
    { tabId: 'tab-knowledge', categoryId: 'cat-design', orderIndex: 1 },
    // 工具 Tab - 只包含常用工具
    { tabId: 'tab-tools', categoryId: 'cat-tools', orderIndex: 0 }
  ]

  for (const tc of defaultTabCategories) {
    db.run(
      `INSERT INTO tab_categories (tabId, categoryId, orderIndex, createdAt)
       VALUES (?, ?, ?, ?)`,
      [tc.tabId, tc.categoryId, tc.orderIndex, now]
    )
  }

  console.log('✅ Default tab categories created')

  // 初始化默认审计日志
  const defaultAuditLogs = [
    {
      id: 'audit-1',
      userId: 'admin',
      username: 'admin',
      action: 'LOGIN',
      resourceType: 'auth',
      resourceId: 'admin',
      details: JSON.stringify({ method: 'password' }),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-1',
      deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows' }),
      riskLevel: 'low',
      createdAt: now
    },
    {
      id: 'audit-2',
      userId: 'admin',
      username: 'admin',
      action: 'CREATE_CATEGORY',
      resourceType: 'category',
      resourceId: 'cat-tools',
      details: JSON.stringify({ name: '常用工具' }),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-1',
      deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows' }),
      riskLevel: 'low',
      createdAt: now
    },
    {
      id: 'audit-3',
      userId: 'admin',
      username: 'admin',
      action: 'CREATE_CATEGORY',
      resourceType: 'category',
      resourceId: 'cat-dev',
      details: JSON.stringify({ name: '开发资源' }),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-1',
      deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows' }),
      riskLevel: 'low',
      createdAt: now
    },
    {
      id: 'audit-4',
      userId: 'admin',
      username: 'admin',
      action: 'CREATE_CATEGORY',
      resourceType: 'category',
      resourceId: 'cat-design',
      details: JSON.stringify({ name: '设计灵感' }),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-1',
      deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows' }),
      riskLevel: 'low',
      createdAt: now
    },
    {
      id: 'audit-5',
      userId: 'admin',
      username: 'admin',
      action: 'CREATE_CATEGORY',
      resourceType: 'category',
      resourceId: 'cat-learn',
      details: JSON.stringify({ name: '学习资料' }),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-1',
      deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows' }),
      riskLevel: 'low',
      createdAt: now
    },
    {
      id: 'audit-6',
      userId: 'admin',
      username: 'admin',
      action: 'CREATE_CATEGORY',
      resourceType: 'category',
      resourceId: 'cat-entertainment',
      details: JSON.stringify({ name: '娱乐休闲' }),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-1',
      deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows' }),
      riskLevel: 'low',
      createdAt: now
    }
  ]

  for (const log of defaultAuditLogs) {
    db.run(
      `INSERT INTO audit_logs (id, userId, username, action, resourceType, resourceId, details, ip, userAgent, sessionId, deviceInfo, riskLevel, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.userId, log.username, log.action, log.resourceType, log.resourceId, log.details, log.ip, log.userAgent, log.sessionId, log.deviceInfo, log.riskLevel, log.createdAt]
    )
  }

  console.log('✅ Default audit logs created')

  // 初始化默认书签（国内可访问网站）
  const defaultBookmarks = [
    {
      id: 'bookmark-1',
      url: 'https://www.baidu.com',
      internalUrl: '',
      title: '百度',
      description: '百度一下，你就知道',
      favicon: 'https://www.baidu.com/favicon.ico',
      ogImage: '',
      icon: 'Search',
      iconUrl: '',
      category: 'cat-tools',
      tags: null,
      notes: null,
      orderIndex: 0,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-2',
      url: 'https://www.bing.com',
      internalUrl: '',
      title: '必应',
      description: '微软必应搜索引擎',
      favicon: 'https://www.bing.com/favicon.ico',
      ogImage: '',
      icon: 'Search',
      iconUrl: '',
      category: 'cat-tools',
      tags: null,
      notes: null,
      orderIndex: 1,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-3',
      url: 'https://yiyan.baidu.com',
      internalUrl: '',
      title: '文心一言',
      description: '百度AI对话助手',
      favicon: 'https://yiyan.baidu.com/favicon.ico',
      ogImage: '',
      icon: 'MessageSquare',
      iconUrl: '',
      category: 'cat-tools',
      tags: null,
      notes: null,
      orderIndex: 2,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-4',
      url: 'https://gitee.com',
      internalUrl: '',
      title: 'Gitee',
      description: '国内领先的代码托管平台',
      favicon: 'https://gitee.com/favicon.ico',
      ogImage: '',
      icon: 'GitBranch',
      iconUrl: '',
      category: 'cat-dev',
      tags: null,
      notes: null,
      orderIndex: 3,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-5',
      url: 'https://juejin.cn',
      internalUrl: '',
      title: '掘金',
      description: '程序员技术社区',
      favicon: 'https://juejin.cn/favicon.ico',
      ogImage: '',
      icon: 'Code',
      iconUrl: '',
      category: 'cat-dev',
      tags: null,
      notes: null,
      orderIndex: 4,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-6',
      url: 'https://www.zhihu.com',
      internalUrl: '',
      title: '知乎',
      description: '中文互联网问答社区',
      favicon: 'https://www.zhihu.com/favicon.ico',
      ogImage: '',
      icon: 'HelpCircle',
      iconUrl: '',
      category: 'cat-learn',
      tags: null,
      notes: null,
      orderIndex: 5,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-7',
      url: 'https://www.bilibili.com',
      internalUrl: '',
      title: '哔哩哔哩',
      description: '国内知名的视频弹幕网站',
      favicon: 'https://www.bilibili.com/favicon.ico',
      ogImage: '',
      icon: 'Play',
      iconUrl: '',
      category: 'cat-ent',
      tags: null,
      notes: null,
      orderIndex: 6,
      isPinned: 1,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    },
    {
      id: 'bookmark-8',
      url: 'https://www.doubao.com',
      internalUrl: '',
      title: '豆包',
      description: '字节跳动AI助手',
      favicon: 'https://www.doubao.com/favicon.ico',
      ogImage: '',
      icon: 'Bot',
      iconUrl: '',
      category: 'cat-tools',
      tags: null,
      notes: null,
      orderIndex: 7,
      isPinned: 0,
      isReadLater: 0,
      isRead: 0,
      visibility: 'public',
      userId: 'admin',
      createdAt: now,
      updatedAt: now,
      visitCount: 0
    }
  ]

  for (const bookmark of defaultBookmarks) {
    db.run(
      `INSERT INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, notes, orderIndex, isPinned, isReadLater, isRead, visibility, userId, createdAt, updatedAt, visitCount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookmark.id, bookmark.url, bookmark.internalUrl, bookmark.title, bookmark.description, bookmark.favicon, bookmark.ogImage, bookmark.icon, bookmark.iconUrl, bookmark.category, bookmark.tags, bookmark.notes, bookmark.orderIndex, bookmark.isPinned, bookmark.isReadLater, bookmark.isRead, bookmark.visibility, bookmark.userId, bookmark.createdAt, bookmark.updatedAt, bookmark.visitCount]
    )
  }

  console.log('✅ Default bookmarks created')

  // 初始化默认系统主题
  const defaultThemes = [
    {
      id: 'default-light',
      name: '默认浅色',
      description: '系统默认浅色主题',
      isDark: 0,
      isSystem: 1,
      isActive: 1,
      visibility: 'public',
      colors: JSON.stringify({
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        background: '#ffffff',
        foreground: '#0f172a',
        border: '#e2e8f0',
        muted: '#f1f5f9',
        card: '#ffffff',
        hover: '#f8fafc',
        active: '#eff6ff',
      }),
      layout: JSON.stringify({
        maxWidth: '1400px',
        padding: '1.5rem',
        gridColumns: 4,
        gridGap: '1rem',
        borderRadius: '0.5rem',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      }),
      font: JSON.stringify({
        family: 'system-ui, -apple-system, sans-serif',
        headingFamily: 'system-ui, -apple-system, sans-serif',
        baseSize: '1rem',
        lineHeight: 1.5,
        smallSize: '0.875rem',
        largeSize: '1.125rem',
      }),
      animation: JSON.stringify({
        enabled: true,
        duration: '0.2s',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        hoverDuration: '0.15s',
      }),
      components: JSON.stringify({
        button: {
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        },
        card: {
          borderRadius: '0.5rem',
          padding: '1rem',
          shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
        input: {
          borderRadius: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderWidth: '1px',
        },
      }),
    },
    {
      id: 'default-dark',
      name: '默认深色',
      description: '系统默认深色主题',
      isDark: 1,
      isSystem: 1,
      isActive: 0,
      visibility: 'public',
      colors: JSON.stringify({
        primary: '#60a5fa',
        secondary: '#94a3b8',
        accent: '#a78bfa',
        background: '#0f172a',
        foreground: '#f8fafc',
        border: '#1e293b',
        muted: '#1e293b',
        card: '#1e293b',
        hover: '#334155',
        active: '#1e3a8a',
      }),
      layout: JSON.stringify({
        maxWidth: '1400px',
        padding: '1.5rem',
        gridColumns: 4,
        gridGap: '1rem',
        borderRadius: '0.5rem',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
      }),
      font: JSON.stringify({
        family: 'system-ui, -apple-system, sans-serif',
        headingFamily: 'system-ui, -apple-system, sans-serif',
        baseSize: '1rem',
        lineHeight: 1.5,
        smallSize: '0.875rem',
        largeSize: '1.125rem',
      }),
      animation: JSON.stringify({
        enabled: true,
        duration: '0.2s',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        hoverDuration: '0.15s',
      }),
      components: JSON.stringify({
        button: {
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        },
        card: {
          borderRadius: '0.5rem',
          padding: '1rem',
          shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
        },
        input: {
          borderRadius: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderWidth: '1px',
        },
      }),
    },
  ]

  for (const theme of defaultThemes) {
    db.run(
      `INSERT INTO themes (id, name, description, isDark, isSystem, isActive, visibility, colors, layout, font, animation, components, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [theme.id, theme.name, theme.description, theme.isDark, theme.isSystem, theme.isActive, theme.visibility, theme.colors, theme.layout, theme.font, theme.animation, theme.components, now, now]
    )
  }

  // 为管理员用户设置默认主题偏好
  db.run(
    `INSERT INTO user_theme_preferences (userId, themeId, isAutoMode, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`,
    ['admin', 'default-light', 0, now, now]
  )

  // 设置角色默认主题
  db.run(
    `INSERT INTO role_default_themes (role, themeId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)`,
    ['admin', 'default-light', now, now]
  )
  db.run(
    `INSERT INTO role_default_themes (role, themeId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)`,
    ['user', 'default-light', now, now]
  )

  console.log('✅ Default themes created')
}

/**
 * 确保默认设置存在
 */
async function ensureDefaultSettings(db: SqlJsDatabase): Promise<void> {
  // 确保默认设置项存在
  const defaultSettings = [
    { key: 'siteTitle', value: 'Nexus' },
    { key: 'enableBeamAnimation', value: 'true' },
    { key: 'enableLiteMode', value: 'false' },
    { key: 'enableWeather', value: 'true' },
    { key: 'enableLunar', value: 'true' }
  ]
  
  for (const setting of defaultSettings) {
    const existing = db.exec('SELECT 1 FROM settings WHERE key = ?', [setting.key])
    if (existing.length === 0) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [setting.key, setting.value])
    }
  }
}

/**
 * 确保默认用户存在
 */
async function ensureDefaultUser(db: SqlJsDatabase): Promise<void> {
  const result = db.exec('SELECT 1 FROM users WHERE username = ?', ['admin'])
  if (result.length === 0) {
    // 使用默认密码 admin123，首次登录强制修改
    const defaultPassword = 'admin123'
    const adminPasswordHash = await hashPassword(defaultPassword)
    const now = new Date().toISOString()
    db.run(
      `INSERT INTO users (id, username, password, email, role, isActive, isDefaultPassword, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      ['admin', 'admin', adminPasswordHash, 'admin@example.com', 'admin', now, now]
    )
    console.log('✅ Default admin user created')
    console.log('⚠️  IMPORTANT: First login requires password change')
    console.log('🔑  Default password: admin123')
  }
}

/**
 * 确保默认插件和菜单存在
 */
async function ensureDefaultPluginsAndMenus(db: SqlJsDatabase): Promise<void> {
  const now = new Date().toISOString()

  // 删除已废弃的审计日志菜单
  // 审计日志功能已合并到安全管理 - 安全日志中
  try {
    const auditMenuExists = db.exec('SELECT 1 FROM admin_menus WHERE id = ?', ['audit'])
    if (auditMenuExists.length > 0) {
      db.run('DELETE FROM admin_menus WHERE id = ? OR parentId = ?', ['audit', 'audit'])
      db.run('DELETE FROM user_menus WHERE menuId = ?', ['audit'])
      db.run('DELETE FROM role_menus WHERE menuId = ?', ['audit'])
      console.log('🗑️ 已删除废弃的审计中心菜单')
    }
  } catch (error) {
    console.error('删除审计中心菜单时出错:', error)
  }

  // 确保默认插件存在
  const defaultPlugins = [
    {
      id: 'quotes',
      name: '名言管理',
      description: '名言管理插件，提供名言的增删改查功能',
      version: '1.0.0',
      author: 'Nexus Team',
      icon: '',
      isEnabled: 1,
      isInstalled: 1,
      visibility: 'public',
      orderIndex: 1
    },
    {
      id: 'file-transfer',
      name: '文件快传',
      description: '文件快传插件，提供临时文件上传和分享功能',
      version: '1.0.0',
      author: 'Nexus Team',
      icon: '',
      isEnabled: 1,
      isInstalled: 1,
      visibility: 'public',
      orderIndex: 2
    },
    {
      id: 'webdav',
      name: 'WebDAV同步',
      description: 'WebDAV同步插件，支持书签数据同步到WebDAV服务器',
      version: '1.0.0',
      author: 'Nexus Team',
      icon: '',
      isEnabled: 1,
      isInstalled: 1,
      visibility: 'public',
      orderIndex: 3
    },
    {
      id: 'notifications',
      name: '通知中心',
      description: '通知中心插件，提供系统通知和公告管理功能',
      version: '1.0.0',
      author: 'Nexus Team',
      icon: '',
      isEnabled: 1,
      isInstalled: 1,
      visibility: 'public',
      orderIndex: 4
    }
  ]

  for (const plugin of defaultPlugins) {
    const existing = db.exec('SELECT 1 FROM plugins WHERE id = ?', [plugin.id])
    if (existing.length === 0) {
      db.run(
        `INSERT INTO plugins (id, name, description, version, author, icon, isEnabled, isInstalled, visibility, orderIndex, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [plugin.id, plugin.name, plugin.description, plugin.version, plugin.author, plugin.icon, plugin.isEnabled, plugin.isInstalled, plugin.visibility, plugin.orderIndex, now, now]
      )
      console.log(`✅ Plugin "${plugin.name}" created`)
    }
  }

  // 确保默认菜单存在
  const defaultMenus = [
    {
      id: 'bookmarks',
      name: '书签管理',
      icon: 'BookMarked',
      path: 'bookmarks',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 1,
      visibility: 'public'
    },
    {
      id: 'categories',
      name: '分类管理',
      icon: 'Folder',
      path: 'categories',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 2,
      visibility: 'public'
    },
    {
      id: 'analytics',
      name: '数据分析',
      icon: 'BarChart3',
      path: 'analytics',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 3,
      visibility: 'public'
    },
    {
      id: 'plugins',
      name: '插件中心',
      icon: 'Puzzle',
      path: 'plugins',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 4,
      visibility: 'public'
    },
    {
      id: 'menus',
      name: '菜单管理',
      icon: 'Layout',
      path: 'menus',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 5,
      visibility: 'public'
    },
    {
      id: 'users',
      name: '用户管理',
      icon: 'Users',
      path: 'users',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 6,
      visibility: 'public'
    },
    {
      id: 'settings',
      name: '系统设置',
      icon: 'Settings',
      path: 'settings',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 7,
      visibility: 'public'
    },
    // 注意: 审计中心菜单已移除，审计日志功能合并到安全管理 - 安全日志中
    {
      id: 'security',
      name: '安全管理',
      icon: 'Shield',
      path: 'security',
      isVisible: 1,
      isEnabled: 1,
      orderIndex: 8,
      visibility: 'public'
    }
    // 注意: 系统配置菜单已移除，功能合并到系统设置 - 高级配置中
  ]

  for (const menu of defaultMenus) {
    const existing = db.exec('SELECT 1 FROM admin_menus WHERE id = ?', [menu.id])
    if (existing.length === 0) {
      db.run(
        `INSERT INTO admin_menus (id, name, icon, path, isVisible, isEnabled, orderIndex, visibility, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [menu.id, menu.name, menu.icon, menu.path, menu.isVisible, menu.isEnabled, menu.orderIndex, menu.visibility, now, now]
      )
      console.log(`✅ Admin menu "${menu.name}" created`)
    }
  }

  // 迁移：添加书签样式菜单（如果不存在）
  const bookmarkCardStylesMenuExists = db.exec('SELECT 1 FROM admin_menus WHERE id = ?', ['bookmark-card-styles'])
  if (bookmarkCardStylesMenuExists.length === 0) {
    db.run(
      `INSERT INTO admin_menus (id, name, icon, path, isVisible, isEnabled, orderIndex, visibility, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['bookmark-card-styles', '书签样式', 'LayoutGrid', 'bookmark-card-styles', 1, 1, 6, 'public', now, now]
    )
    console.log('✅ Admin menu "书签样式" created')
    
    // 更新其他菜单的顺序
    db.run("UPDATE admin_menus SET orderIndex = 7 WHERE id = 'plugins'")
    db.run("UPDATE admin_menus SET orderIndex = 8 WHERE id = 'menus'")
    db.run("UPDATE admin_menus SET orderIndex = 9 WHERE id = 'users'")
    db.run("UPDATE admin_menus SET orderIndex = 10 WHERE id = 'settings'")
    db.run("UPDATE admin_menus SET orderIndex = 11 WHERE id = 'security'")
    console.log('✅ Admin menu order indexes updated')
  }

  // 迁移：删除系统配置的独立菜单（已合并到系统设置中）
  try {
    const systemConfigsMenuExists = db.exec('SELECT 1 FROM admin_menus WHERE id = ?', ['system-configs'])
    if (systemConfigsMenuExists.length > 0) {
      db.run('DELETE FROM admin_menus WHERE id = ?', ['system-configs'])
      db.run('DELETE FROM user_menus WHERE menuId = ?', ['system-configs'])
      db.run('DELETE FROM role_menus WHERE menuId = ?', ['system-configs'])
      console.log('🗑️ 已删除系统配置的独立菜单（已合并到系统设置）')
    }
  } catch (error) {
    console.error('删除系统配置菜单时出错:', error)
  }

  // 确保默认主题存在
  const themeExists = db.exec('SELECT 1 FROM themes WHERE id = ?', ['default-light'])
  if (themeExists.length === 0) {
    // 重新创建默认主题
    const defaultThemes = [
      {
        id: 'default-light',
        name: '默认浅色',
        description: '系统默认浅色主题',
        isDark: 0,
        isSystem: 1,
        isActive: 1,
        visibility: 'public',
        colors: JSON.stringify({
          primary: '#3b82f6', secondary: '#64748b', accent: '#8b5cf6',
          background: '#ffffff', foreground: '#0f172a', border: '#e2e8f0',
          muted: '#f1f5f9', card: '#ffffff', hover: '#f8fafc', active: '#eff6ff',
        }),
        layout: JSON.stringify({ maxWidth: '1400px', padding: '1.5rem', gridColumns: 4, gridGap: '1rem', borderRadius: '0.5rem', shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }),
        font: JSON.stringify({ family: 'system-ui, -apple-system, sans-serif', headingFamily: 'system-ui, -apple-system, sans-serif', baseSize: '1rem', lineHeight: 1.5, smallSize: '0.875rem', largeSize: '1.125rem' }),
        animation: JSON.stringify({ enabled: true, duration: '0.2s', easing: 'cubic-bezier(0.4, 0, 0.2, 1)', hoverDuration: '0.15s' }),
        components: JSON.stringify({ button: { borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }, card: { borderRadius: '0.5rem', padding: '1rem', shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }, input: { borderRadius: '0.375rem', padding: '0.5rem 0.75rem', borderWidth: '1px' } }),
      },
      {
        id: 'default-dark',
        name: '默认深色',
        description: '系统默认深色主题',
        isDark: 1,
        isSystem: 1,
        isActive: 0,
        visibility: 'public',
        colors: JSON.stringify({
          primary: '#60a5fa', secondary: '#94a3b8', accent: '#a78bfa',
          background: '#0f172a', foreground: '#f8fafc', border: '#1e293b',
          muted: '#1e293b', card: '#1e293b', hover: '#334155', active: '#1e3a8a',
        }),
        layout: JSON.stringify({ maxWidth: '1400px', padding: '1.5rem', gridColumns: 4, gridGap: '1rem', borderRadius: '0.5rem', shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)' }),
        font: JSON.stringify({ family: 'system-ui, -apple-system, sans-serif', headingFamily: 'system-ui, -apple-system, sans-serif', baseSize: '1rem', lineHeight: 1.5, smallSize: '0.875rem', largeSize: '1.125rem' }),
        animation: JSON.stringify({ enabled: true, duration: '0.2s', easing: 'cubic-bezier(0.4, 0, 0.2, 1)', hoverDuration: '0.15s' }),
        components: JSON.stringify({ button: { borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }, card: { borderRadius: '0.5rem', padding: '1rem', shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)' }, input: { borderRadius: '0.375rem', padding: '0.5rem 0.75rem', borderWidth: '1px' } }),
      },
    ]

    for (const theme of defaultThemes) {
      db.run(
        `INSERT INTO themes (id, name, description, isDark, isSystem, isActive, visibility, colors, layout, font, animation, components, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [theme.id, theme.name, theme.description, theme.isDark, theme.isSystem, theme.isActive, theme.visibility, theme.colors, theme.layout, theme.font, theme.animation, theme.components, now, now]
      )
    }
    console.log('✅ Default themes created')
  }

  // 确保角色默认主题存在
  const roleThemesExist = db.exec('SELECT 1 FROM role_default_themes LIMIT 1')
  if (roleThemesExist.length === 0) {
    db.run(`INSERT INTO role_default_themes (role, themeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)`, ['admin', 'default-light', now, now])
    db.run(`INSERT INTO role_default_themes (role, themeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)`, ['user', 'default-light', now, now])
    console.log('✅ Role default themes created')
  }

  // 确保默认Dock配置存在
  ensureDefaultDockConfigs(db, now)

  // 确保默认Settings Tabs存在
  ensureDefaultSettingsTabs(db, now)

  // 确保默认Frontend NavItems存在
  ensureDefaultFrontendNavItems(db, now)

  // 确保默认书签卡片样式预设存在
  ensureDefaultBookmarkCardStyles(db, now)

  // 确保默认Tab存在
  ensureDefaultTabs(db)
}

/**
 * 确保默认Tab存在
 */
function ensureDefaultTabs(db: SqlJsDatabase): void {
  const now = new Date().toISOString()

  // 检查是否已有Tab
  const tabsExist = db.exec('SELECT 1 FROM tabs LIMIT 1')
  if (tabsExist.length > 0) {
    return
  }

  console.log('📝 Creating default tabs...')

  // 初始化默认 Tab（快速导航）
  const defaultTabs = [
    {
      id: 'tab-home',
      name: '主页',
      icon: 'Home',
      color: '#3B82F6',
      orderIndex: 0,
      isDefault: 1,
      userId: 'admin'
    },
    {
      id: 'tab-dev',
      name: '编程',
      icon: 'Code',
      color: '#10B981',
      orderIndex: 1,
      isDefault: 0,
      userId: 'admin'
    },
    {
      id: 'tab-ai',
      name: 'AI',
      icon: 'Bot',
      color: '#8B5CF6',
      orderIndex: 2,
      isDefault: 0,
      userId: 'admin'
    },
    {
      id: 'tab-knowledge',
      name: '知识',
      icon: 'BookOpen',
      color: '#F59E0B',
      orderIndex: 3,
      isDefault: 0,
      userId: 'admin'
    },
    {
      id: 'tab-tools',
      name: '工具',
      icon: 'Wrench',
      color: '#EC4899',
      orderIndex: 4,
      isDefault: 0,
      userId: 'admin'
    }
  ]

  for (const tab of defaultTabs) {
    db.run(
      `INSERT INTO tabs (id, name, icon, color, orderIndex, isDefault, userId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tab.id, tab.name, tab.icon, tab.color, tab.orderIndex, tab.isDefault, tab.userId, now, now]
    )
  }

  console.log('✅ Default tabs created')

  // 获取所有分类
  const categoriesResult = db.exec('SELECT id FROM categories')
  const categoryIds: string[] = []
  if (categoriesResult.length > 0 && categoriesResult[0].values) {
    for (const row of categoriesResult[0].values) {
      categoryIds.push(row[0] as string)
    }
  }

  // 如果没有分类，则不创建关联
  if (categoryIds.length === 0) {
    return
  }

  // 初始化 Tab 和分类的关联 - 主页 Tab 包含所有分类
  let orderIndex = 0
  for (const categoryId of categoryIds) {
    db.run(
      `INSERT INTO tab_categories (tabId, categoryId, orderIndex, createdAt)
       VALUES (?, ?, ?, ?)`,
      ['tab-home', categoryId, orderIndex++, now]
    )
  }

  console.log('✅ Default tab-category associations created')
}

/**
 * 确保默认Dock配置存在
 */
function ensureDefaultDockConfigs(db: SqlJsDatabase, now: string): void {
  const dockExists = db.exec('SELECT 1 FROM dock_configs LIMIT 1')
  if (dockExists.length === 0) {
    const defaultDockItems = JSON.stringify([
      { id: 'home', title: '首页', icon: 'Home', iconType: 'lucide', orderIndex: 1, isEnabled: 1, isVisible: 1 },
      { id: 'search', title: '搜索', icon: 'Search', iconType: 'lucide', orderIndex: 2, isEnabled: 1, isVisible: 1 },
      { id: 'add', title: '添加书签', icon: 'Plus', iconType: 'lucide', orderIndex: 3, isEnabled: 1, isVisible: 1 },
      { id: 'language', title: '切换语言', icon: 'Languages', iconType: 'lucide', action: 'toggleLanguage', orderIndex: 4, isEnabled: 1, isVisible: 1 },
      { id: 'theme', title: '切换主题', icon: 'Sun', iconType: 'lucide', action: 'toggleTheme', orderIndex: 5, isEnabled: 1, isVisible: 1 },
      { id: 'admin', title: '管理后台', icon: 'LayoutDashboard', iconType: 'lucide', href: '/admin', orderIndex: 6, isEnabled: 1, isVisible: 1 },
      { id: 'github', title: 'GitHub', icon: 'Github', iconType: 'lucide', href: 'https://github.com/sunaibot/Nexus', orderIndex: 7, isEnabled: 1, isVisible: 1 }
    ])

    db.run(
      `INSERT INTO dock_configs (id, name, description, items, scope, isDefault, isEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['default', '默认Dock配置', '系统默认Dock导航配置', defaultDockItems, 'global', 1, 1, now, now]
    )
    console.log('✅ Default dock config created')
  }
}

/**
 * 确保默认Settings Tabs存在
 */
function ensureDefaultSettingsTabs(db: SqlJsDatabase, now: string): void {
  const tabsExist = db.exec('SELECT 1 FROM settings_tabs LIMIT 1')
  if (tabsExist.length === 0) {
    const defaultTabs = [
      { id: 'tab-site', tabId: 'site', name: '站点配置', labelKey: 'admin.settings.tabs.site', descriptionKey: 'admin.settings.tabs.site_desc', icon: 'Globe', gradient: 'from-cyan-500/20 to-blue-500/20', orderIndex: 1, visibility: 'admin' },
      { id: 'tab-theme', tabId: 'theme', name: '主题配色', labelKey: 'admin.settings.tabs.theme', descriptionKey: 'admin.settings.tabs.theme_desc', icon: 'Palette', gradient: 'from-purple-500/20 to-pink-500/20', orderIndex: 2, visibility: 'admin' },
      { id: 'tab-wallpaper', tabId: 'wallpaper', name: '壁纸设置', labelKey: 'admin.settings.tabs.wallpaper', descriptionKey: 'admin.settings.tabs.wallpaper_desc', icon: 'Image', gradient: 'from-emerald-500/20 to-teal-500/20', orderIndex: 3, visibility: 'admin' },
      { id: 'tab-widget', tabId: 'widget', name: '系统状态', labelKey: 'admin.settings.tabs.widget', descriptionKey: 'admin.settings.tabs.widget_desc', icon: 'Gauge', gradient: 'from-amber-500/20 to-orange-500/20', orderIndex: 4, visibility: 'admin' },
      { id: 'tab-security', tabId: 'security', name: '安全设置', labelKey: 'admin.settings.tabs.security', descriptionKey: 'admin.settings.tabs.security_desc', icon: 'Shield', gradient: 'from-red-500/20 to-rose-500/20', orderIndex: 5, visibility: 'admin' },
      { id: 'tab-data', tabId: 'data', name: '数据管理', labelKey: 'admin.settings.tabs.data', descriptionKey: 'admin.settings.tabs.data_desc', icon: 'Database', gradient: 'from-indigo-500/20 to-violet-500/20', orderIndex: 6, visibility: 'admin' }
    ]

    for (const tab of defaultTabs) {
      db.run(
        `INSERT INTO settings_tabs (id, tabId, name, labelKey, descriptionKey, icon, gradient, orderIndex, visibility, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tab.id, tab.tabId, tab.name, tab.labelKey, tab.descriptionKey, tab.icon, tab.gradient, tab.orderIndex, tab.visibility, now, now]
      )
    }
    console.log('✅ Default settings tabs created')
  }
}

/**
 * 确保默认Frontend NavItems存在
 */
function ensureDefaultFrontendNavItems(db: SqlJsDatabase, now: string): void {
  const navItemsExist = db.exec('SELECT 1 FROM frontend_nav_items LIMIT 1')
  if (navItemsExist.length === 0) {
    const defaultNavItems = [
      { id: 'nav-bookmarks', navId: 'bookmarks', name: '书签管理', labelKey: 'admin.nav.bookmarks', icon: 'Bookmark', orderIndex: 1, visibility: 'admin' },
      { id: 'nav-categories', navId: 'categories', name: '分类管理', labelKey: 'admin.nav.categories', icon: 'FolderOpen', orderIndex: 2, visibility: 'admin' },
      { id: 'nav-quotes', navId: 'quotes', name: '名言管理', labelKey: 'admin.nav.quotes', icon: 'Quote', orderIndex: 3, visibility: 'admin' },
      { id: 'nav-theme', navId: 'theme', name: '主题管理', labelKey: 'admin.nav.theme', icon: 'Palette', orderIndex: 4, visibility: 'admin' },
      { id: 'nav-wallpaper', navId: 'wallpaper', name: '壁纸设置', labelKey: 'admin.nav.wallpaper', icon: 'Image', orderIndex: 5, visibility: 'admin' },
      { id: 'nav-plugins', navId: 'plugins', name: '插件中心', labelKey: 'admin.nav.plugins', icon: 'Puzzle', orderIndex: 6, visibility: 'admin' },
      { id: 'nav-menus', navId: 'menus', name: '菜单管理', labelKey: 'admin.nav.menus', icon: 'Menu', orderIndex: 7, visibility: 'admin' },
      { id: 'nav-users', navId: 'users', name: '用户管理', labelKey: 'admin.nav.users', icon: 'Users', orderIndex: 8, visibility: 'admin' },
      { id: 'nav-settings', navId: 'settings', name: '系统设置', labelKey: 'admin.nav.settings', icon: 'Settings', orderIndex: 9, visibility: 'admin' },
      { id: 'nav-audit', navId: 'audit', name: '审计中心', labelKey: 'admin.nav.audit', icon: 'ClipboardList', orderIndex: 10, visibility: 'admin' },
      { id: 'nav-security', navId: 'security', name: '安全管理', labelKey: 'admin.nav.security', icon: 'Shield', orderIndex: 11, visibility: 'admin' }
    ]

    for (const item of defaultNavItems) {
      db.run(
        `INSERT INTO frontend_nav_items (id, navId, name, labelKey, icon, orderIndex, visibility, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.navId, item.name, item.labelKey, item.icon, item.orderIndex, item.visibility, now, now]
      )
    }
    console.log('✅ Default frontend nav items created')
  }
}

/**
 * 确保默认书签卡片样式预设存在
 */
function ensureDefaultBookmarkCardStyles(db: SqlJsDatabase, now: string): void {
  const stylesExist = db.exec('SELECT 1 FROM bookmark_card_styles LIMIT 1')
  if (stylesExist.length === 0) {
    const defaultStyles = [
      {
        id: 'preset-glassmorphism',
        name: '玻璃拟态',
        description: '现代毛玻璃效果，适合深色背景',
        scope: 'global',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropBlur: '20px',
        backdropSaturate: '180%',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: '20px',
        hoverScale: 1.03,
        isEnabled: 1,
        isDefault: 0,
        priority: 10,
      },
      {
        id: 'preset-minimal',
        name: '极简卡片',
        description: '简洁干净的设计风格',
        scope: 'global',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: '1px',
        borderRadius: '8px',
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowBlur: '4px',
        backdropBlur: '0px',
        hoverScale: 1.01,
        isEnabled: 1,
        isDefault: 0,
        priority: 10,
      },
      {
        id: 'preset-dark-elegant',
        name: '深色优雅',
        description: '深色主题，适合夜间模式',
        scope: 'global',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowBlur: '15px',
        titleColor: '#ffffff',
        descriptionColor: '#a1a1aa',
        hoverScale: 1.02,
        isEnabled: 1,
        isDefault: 0,
        priority: 10,
      },
      {
        id: 'preset-gradient',
        name: '渐变炫彩',
        description: '活泼的渐变背景效果',
        scope: 'global',
        backgroundGradient: JSON.stringify({ from: '#667eea', to: '#764ba2', angle: 135 }),
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        shadowColor: 'rgba(102, 126, 234, 0.4)',
        shadowBlur: '25px',
        titleColor: '#ffffff',
        descriptionColor: 'rgba(255, 255, 255, 0.9)',
        hoverScale: 1.05,
        isEnabled: 1,
        isDefault: 0,
        priority: 10,
      },
      {
        id: 'preset-soft-shadow',
        name: '柔和阴影',
        description: '柔和的阴影效果，增加层次感',
        scope: 'global',
        backgroundColor: '#ffffff',
        borderColor: 'transparent',
        borderRadius: '12px',
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowBlur: '24px',
        shadowSpread: '4px',
        shadowY: '8px',
        hoverScale: 1.02,
        hoverTransition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        isEnabled: 1,
        isDefault: 0,
        priority: 10,
      },
      {
        id: 'preset-bordered',
        name: '边框强调',
        description: '醒目的边框设计',
        scope: 'global',
        backgroundColor: 'transparent',
        borderColor: '#3b82f6',
        borderWidth: '2px',
        borderRadius: '10px',
        shadowColor: 'rgba(59, 130, 246, 0.2)',
        shadowBlur: '0px',
        hoverScale: 1.02,
        isEnabled: 1,
        isDefault: 0,
        priority: 10,
      },
      {
        id: 'default-system',
        name: '系统默认',
        description: '系统默认样式配置',
        scope: 'global',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        borderWidth: '1px',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: '10px',
        shadowSpread: '0px',
        shadowX: '0px',
        shadowY: '4px',
        padding: '16px',
        margin: '8px',
        gap: '12px',
        titleFontSize: '16px',
        titleFontWeight: '600',
        titleColor: 'inherit',
        descriptionFontSize: '14px',
        descriptionFontWeight: '400',
        descriptionColor: 'inherit',
        opacity: 1.0,
        backdropBlur: '10px',
        backdropSaturate: '180%',
        hoverScale: 1.02,
        hoverTransition: 'all 0.3s ease',
        iconSize: '24px',
        iconBorderRadius: '8px',
        imageHeight: '120px',
        imageBorderRadius: '8px',
        imageObjectFit: 'cover',
        tagBackgroundColor: 'rgba(0, 0, 0, 0.1)',
        tagBorderRadius: '4px',
        tagFontSize: '12px',
        isEnabled: 1,
        isDefault: 1,
        priority: 0,
      },
    ]

    for (const style of defaultStyles) {
      db.run(
        `INSERT INTO bookmark_card_styles (
          id, name, description, scope, backgroundColor, backgroundGradient,
          borderRadius, borderWidth, borderColor, shadowColor, shadowBlur,
          shadowSpread, shadowX, shadowY, padding, margin, gap,
          titleFontSize, titleFontWeight, titleColor, descriptionFontSize,
          descriptionFontWeight, descriptionColor, opacity, backdropBlur,
          backdropSaturate, hoverScale, hoverTransition, iconSize, iconBorderRadius,
          imageHeight, imageBorderRadius, imageObjectFit, tagBackgroundColor,
          tagBorderRadius, tagFontSize, isEnabled, isDefault, priority, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          style.id, style.name, style.description, style.scope,
          style.backgroundColor || 'rgba(255, 255, 255, 0.1)',
          style.backgroundGradient || null,
          style.borderRadius || '12px', style.borderWidth || '1px',
          style.borderColor || 'rgba(255, 255, 255, 0.1)',
          style.shadowColor || 'rgba(0, 0, 0, 0.1)',
          style.shadowBlur || '10px', style.shadowSpread || '0px',
          style.shadowX || '0px', style.shadowY || '4px',
          style.padding || '16px', style.margin || '8px', style.gap || '12px',
          style.titleFontSize || '16px', style.titleFontWeight || '600',
          style.titleColor || 'inherit', style.descriptionFontSize || '14px',
          style.descriptionFontWeight || '400', style.descriptionColor || 'inherit',
          style.opacity || 1.0, style.backdropBlur || '10px',
          style.backdropSaturate || '180%', style.hoverScale || 1.02,
          style.hoverTransition || 'all 0.3s ease', style.iconSize || '24px',
          style.iconBorderRadius || '8px', style.imageHeight || '120px',
          style.imageBorderRadius || '8px', style.imageObjectFit || 'cover',
          style.tagBackgroundColor || 'rgba(0, 0, 0, 0.1)',
          style.tagBorderRadius || '4px', style.tagFontSize || '12px',
          style.isEnabled, style.isDefault, style.priority, now, now
        ]
      )
    }
    console.log('✅ Default bookmark card styles created')
  }
}

/**
 * 数据库迁移
 */
async function migrateDatabase(db: SqlJsDatabase): Promise<void> {
  // 迁移逻辑 - 处理数据库版本升级
  try {
    // 示例：添加索引
    db.run('CREATE INDEX IF NOT EXISTS idx_bookmarks_userId ON bookmarks(userId)')
    db.run('CREATE INDEX IF NOT EXISTS idx_bookmarks_visibility ON bookmarks(visibility)')
    db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt)')
    db.run('CREATE INDEX IF NOT EXISTS idx_file_transfers_expiresAt ON file_transfers(expiresAt)')

    // 迁移：为 categories 表添加 description 字段
    try {
      db.run('ALTER TABLE categories ADD COLUMN description TEXT')
      console.log('✅ Migrated: Added description column to categories table')
    } catch (e: any) {
      // 字段已存在时会报错，忽略
      if (!e.message?.includes('duplicate column')) {
        console.error('Migration error (description):', e)
      }
    }

    // 迁移：添加默认书签卡片样式预设
    try {
      const now = new Date().toISOString()
      const presetIds = [
        'preset-glassmorphism',
        'preset-minimal', 
        'preset-dark-elegant',
        'preset-gradient',
        'preset-soft-shadow',
        'preset-bordered',
        'default-system'
      ]
      
      // 检查是否已存在预设样式
      const existingPresets = db.exec(`SELECT id FROM bookmark_card_styles WHERE id IN (${presetIds.map(() => '?').join(',')})`, presetIds)
      const existingIds = new Set(existingPresets.length > 0 ? existingPresets[0].values.map((row: any[]) => row[0]) : [])
      
      const defaultStyles = [
        {
          id: 'preset-glassmorphism',
          name: '玻璃拟态',
          description: '现代毛玻璃效果，适合深色背景',
          scope: 'global',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropBlur: '20px',
          backdropSaturate: '180%',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: '20px',
          hoverScale: 1.03,
          isEnabled: 1,
          isDefault: 0,
          priority: 10,
        },
        {
          id: 'preset-minimal',
          name: '极简卡片',
          description: '简洁干净的设计风格',
          scope: 'global',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: '1px',
          borderRadius: '8px',
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: '4px',
          backdropBlur: '0px',
          hoverScale: 1.01,
          isEnabled: 1,
          isDefault: 0,
          priority: 10,
        },
        {
          id: 'preset-dark-elegant',
          name: '深色优雅',
          description: '深色主题，适合夜间模式',
          scope: 'global',
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          shadowColor: 'rgba(0, 0, 0, 0.4)',
          shadowBlur: '15px',
          titleColor: '#ffffff',
          descriptionColor: '#a1a1aa',
          hoverScale: 1.02,
          isEnabled: 1,
          isDefault: 0,
          priority: 10,
        },
        {
          id: 'preset-gradient',
          name: '渐变炫彩',
          description: '活泼的渐变背景效果',
          scope: 'global',
          backgroundGradient: JSON.stringify({ from: '#667eea', to: '#764ba2', angle: 135 }),
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          shadowColor: 'rgba(102, 126, 234, 0.4)',
          shadowBlur: '25px',
          titleColor: '#ffffff',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          hoverScale: 1.05,
          isEnabled: 1,
          isDefault: 0,
          priority: 10,
        },
        {
          id: 'preset-soft-shadow',
          name: '柔和阴影',
          description: '柔和的阴影效果，增加层次感',
          scope: 'global',
          backgroundColor: '#ffffff',
          borderColor: 'transparent',
          borderRadius: '12px',
          shadowColor: 'rgba(0, 0, 0, 0.08)',
          shadowBlur: '24px',
          shadowSpread: '4px',
          shadowY: '8px',
          hoverScale: 1.02,
          hoverTransition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          isEnabled: 1,
          isDefault: 0,
          priority: 10,
        },
        {
          id: 'preset-bordered',
          name: '边框强调',
          description: '醒目的边框设计',
          scope: 'global',
          backgroundColor: 'transparent',
          borderColor: '#3b82f6',
          borderWidth: '2px',
          borderRadius: '10px',
          shadowColor: 'rgba(59, 130, 246, 0.2)',
          shadowBlur: '0px',
          hoverScale: 1.02,
          isEnabled: 1,
          isDefault: 0,
          priority: 10,
        },
        {
          id: 'default-system',
          name: '系统默认',
          description: '系统默认样式配置',
          scope: 'global',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          borderWidth: '1px',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: '10px',
          shadowSpread: '0px',
          shadowX: '0px',
          shadowY: '4px',
          padding: '16px',
          margin: '8px',
          gap: '12px',
          titleFontSize: '16px',
          titleFontWeight: '600',
          titleColor: 'inherit',
          descriptionFontSize: '14px',
          descriptionFontWeight: '400',
          descriptionColor: 'inherit',
          opacity: 1.0,
          backdropBlur: '10px',
          backdropSaturate: '180%',
          hoverScale: 1.02,
          hoverTransition: 'all 0.3s ease',
          iconSize: '24px',
          iconBorderRadius: '8px',
          imageHeight: '120px',
          imageBorderRadius: '8px',
          imageObjectFit: 'cover',
          tagBackgroundColor: 'rgba(0, 0, 0, 0.1)',
          tagBorderRadius: '4px',
          tagFontSize: '12px',
          isEnabled: 1,
          isDefault: 1,
          priority: 0,
        },
      ]

      let addedCount = 0
      for (const style of defaultStyles) {
        if (!existingIds.has(style.id)) {
          db.run(
            `INSERT INTO bookmark_card_styles (
              id, name, description, scope, backgroundColor, backgroundGradient,
              borderRadius, borderWidth, borderColor, shadowColor, shadowBlur,
              shadowSpread, shadowX, shadowY, padding, margin, gap,
              titleFontSize, titleFontWeight, titleColor, descriptionFontSize,
              descriptionFontWeight, descriptionColor, opacity, backdropBlur,
              backdropSaturate, hoverScale, hoverTransition, iconSize, iconBorderRadius,
              imageHeight, imageBorderRadius, imageObjectFit, tagBackgroundColor,
              tagBorderRadius, tagFontSize, isEnabled, isDefault, priority, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              style.id, style.name, style.description, style.scope,
              style.backgroundColor || 'rgba(255, 255, 255, 0.1)',
              style.backgroundGradient || null,
              style.borderRadius || '12px', style.borderWidth || '1px',
              style.borderColor || 'rgba(255, 255, 255, 0.1)',
              style.shadowColor || 'rgba(0, 0, 0, 0.1)',
              style.shadowBlur || '10px', style.shadowSpread || '0px',
              style.shadowX || '0px', style.shadowY || '4px',
              style.padding || '16px', style.margin || '8px', style.gap || '12px',
              style.titleFontSize || '16px', style.titleFontWeight || '600',
              style.titleColor || 'inherit', style.descriptionFontSize || '14px',
              style.descriptionFontWeight || '400', style.descriptionColor || 'inherit',
              style.opacity || 1.0, style.backdropBlur || '10px',
              style.backdropSaturate || '180%', style.hoverScale || 1.02,
              style.hoverTransition || 'all 0.3s ease', style.iconSize || '24px',
              style.iconBorderRadius || '8px', style.imageHeight || '120px',
              style.imageBorderRadius || '8px', style.imageObjectFit || 'cover',
              style.tagBackgroundColor || 'rgba(0, 0, 0, 0.1)',
              style.tagBorderRadius || '4px', style.tagFontSize || '12px',
              style.isEnabled, style.isDefault, style.priority, now, now
            ]
          )
          addedCount++
        }
      }
      
      if (addedCount > 0) {
        console.log(`✅ Migrated: Added ${addedCount} default bookmark card styles`)
      }
    } catch (e: any) {
      console.error('Migration error (bookmark card styles):', e)
    }

    // 迁移：创建系统配置表（如果不存在）
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS system_configs (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✅ Migrated: Ensured system_configs table exists')
    } catch (e: any) {
      console.error('Migration error (system_configs):', e)
    }

    // 迁移：初始化默认系统配置
    try {
      const { DEFAULT_SYSTEM_CONFIG } = await import('../core/config/index.js')
      const defaultConfigs = [
        { key: 'security', value: JSON.stringify(DEFAULT_SYSTEM_CONFIG.security) },
        { key: 'fileTransfer', value: JSON.stringify(DEFAULT_SYSTEM_CONFIG.fileTransfer) },
        { key: 'upload', value: JSON.stringify(DEFAULT_SYSTEM_CONFIG.upload) },
        { key: 'notification', value: JSON.stringify(DEFAULT_SYSTEM_CONFIG.notification) },
        { key: 'healthCheck', value: JSON.stringify(DEFAULT_SYSTEM_CONFIG.healthCheck) },
        { key: 'rateLimit', value: JSON.stringify(DEFAULT_SYSTEM_CONFIG.rateLimit) }
      ]

      let initCount = 0
      for (const config of defaultConfigs) {
        const existing = db.exec('SELECT 1 FROM system_configs WHERE key = ?', [config.key])
        if (existing.length === 0 || existing[0].values.length === 0) {
          db.run(
            'INSERT INTO system_configs (key, value, updatedAt) VALUES (?, ?, ?)',
            [config.key, config.value, new Date().toISOString()]
          )
          initCount++
        }
      }

      if (initCount > 0) {
        console.log(`✅ Migrated: Initialized ${initCount} default system configs`)
      }
    } catch (e: any) {
      console.error('Migration error (default system configs):', e)
    }
  } catch (error) {
    console.error('Migration error:', error)
  }
}

/**
 * 初始化文件快传设置
 */
async function initFileTransferSettings(db: SqlJsDatabase): Promise<void> {
  // 确保文件快传目录存在
  const filesDir = './files'
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true })
  }
}

/**
 * 清理过期的文件快传
 */
export function cleanupExpiredFileTransfers(db?: SqlJsDatabase): void {
  const database = db || require('./core.js').getDatabase()
  if (!database) return

  const now = Date.now()

  // 先查询要删除的文件路径
  const queryResult = database.exec('SELECT filePath FROM file_transfers WHERE expiresAt < ?', [now])
  if (queryResult.length > 0 && queryResult[0].values.length > 0) {
    queryResult[0].values.forEach((row: any[]) => {
      const filePath = row[0] as string
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (error) {
          console.error('Failed to delete expired file:', filePath, error)
        }
      }
    })
  }

  database.run('DELETE FROM file_transfers WHERE expiresAt < ?', [now])
  console.log('🧹 Cleaned up expired file transfers')
}
