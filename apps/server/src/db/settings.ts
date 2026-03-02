import { getDatabase, saveDatabase, getCache, setCache, clearCache, generateId } from './core.js'

// ========== 自定义小部件 ==========
export function createCustomWidget(type: string, title: string, config: any, userId: string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO custom_widgets (id, userId, type, title, config, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, type, title, JSON.stringify(config || {}), now, now]
  )
  saveDatabase()
  return id
}

export function getCustomWidgetsByUser(userId: string, activeOnly: boolean = false) {
  const db = getDatabase()
  if (!db) return []
  
  let query = 'SELECT * FROM custom_widgets WHERE userId = ?'
  if (activeOnly) {
    query += ' AND active = 1'
  }
  query += ' ORDER BY createdAt DESC'
  
  const result = db.exec(query, [userId])
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    type: row[2],
    title: row[3],
    config: JSON.parse(row[4] || '{}'),
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }))
}

export function getCustomWidgetById(id: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM custom_widgets WHERE id = ?', [id])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    type: row[2],
    title: row[3],
    config: JSON.parse(row[4] || '{}'),
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }
}

export function updateCustomWidget(id: string, updates: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(JSON.stringify(updates.config))
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.run(`UPDATE custom_widgets SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteCustomWidget(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM custom_widgets WHERE id = ?', [id])
  saveDatabase()
  return true
}

export function getUserSettings(userId: string) {
  const db = getDatabase()
  if (!db) return {}
  
  const cacheKey = `settings:${userId}`
  const cached = getCache(cacheKey) as Record<string, string> | undefined
  if (cached) return cached
  
  const result = db.exec('SELECT key, value FROM settings WHERE userId = ?', [userId])
  const settings: Record<string, string> = {}
  
  if (result.length > 0) {
    result[0].values.forEach((row: any[]) => {
      settings[row[0]] = row[1]
    })
  }
  
  setCache(cacheKey, settings, 300000)
  return settings
}

export function setUserSettings(updates: Record<string, string>, userId: string) {
  const db = getDatabase()
  if (!db) return
  
  const now = new Date().toISOString()
  
  for (const [key, value] of Object.entries(updates)) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, userId, value, updatedAt) VALUES (?, ?, ?, ?)',
      [key, userId, value, now]
    )
  }
  
  saveDatabase()
  clearCache(`settings:${userId}`)
}

export function getGlobalSetting(key: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT value FROM settings WHERE key = ? AND userId IS NULL', [key])
  if (result.length === 0) return null
  return result[0].values[0][0]
}

export function setGlobalSetting(key: string, value: string) {
  const db = getDatabase()
  if (!db) return
  
  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, userId, value, updatedAt) VALUES (?, NULL, ?, ?)',
    [key, value, now]
  )
  saveDatabase()
}

// ========== 通知配置 ==========
export function getNotificationConfig() {
  const db = getDatabase()
  if (!db) return {}
  
  const result = db.exec('SELECT key, value FROM settings WHERE key LIKE ?', ['notification_%'])
  const config: Record<string, any> = {}
  
  if (result.length > 0) {
    result[0].values.forEach((row: any[]) => {
      try {
        config[row[0].replace('notification_', '')] = JSON.parse(row[1])
      } catch {
        config[row[0].replace('notification_', '')] = row[1]
      }
    })
  }
  
  return config
}

export function saveNotificationConfig(config: Record<string, any>) {
  const db = getDatabase()
  if (!db) return
  
  const now = new Date().toISOString()
  
  for (const [key, value] of Object.entries(config)) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
      [`notification_${key}`, JSON.stringify(value), now]
    )
  }
  
  saveDatabase()
}

export function getNotificationHistory(limit: number = 100) {
  const db = getDatabase()
  if (!db) return []
  
  const result = db.exec('SELECT * FROM notification_history ORDER BY createdAt DESC LIMIT ?', [limit])
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    type: row[1],
    title: row[2],
    content: row[3],
    level: row[4],
    isRead: row[5] === 1,
    createdAt: row[6]
  }))
}

export function clearNotificationHistory() {
  const db = getDatabase()
  if (!db) return
  
  db.run('DELETE FROM notification_history')
  saveDatabase()
}

export function createNotificationHistory(data: { configId?: string | null; type: string; title: string; content: string; level: string }) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO notification_history (id, configId, type, title, content, level, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
    [id, data.configId || null, data.type, data.title, data.content, data.level, now]
  )
  
  saveDatabase()
  return id
}

// ========== 私密模式 ==========
export function getPrivatePassword() {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT value FROM settings WHERE key = ?', ['private_password'])
  if (result.length === 0) return null
  return result[0].values[0][0]
}

export function setPrivatePassword(passwordHash: string) {
  const db = getDatabase()
  if (!db) return
  
  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
    ['private_password', passwordHash, now]
  )
  saveDatabase()
}

export function verifyPrivatePassword(password: string) {
  const db = getDatabase()
  if (!db) return false
  
  const result = db.exec('SELECT value FROM settings WHERE key = ?', ['private_password'])
  if (result.length === 0) return false
  
  const storedHash = result[0].values[0][0]
  // 简化的密码验证，实际应该使用 bcrypt
  return storedHash === password
}

export function hasPrivatePassword() {
  const db = getDatabase()
  if (!db) return false
  
  const result = db.exec('SELECT 1 FROM settings WHERE key = ?', ['private_password'])
  return result.length > 0
}

// ========== IP过滤 ==========
export function addIpFilter(ip: string, type: 'whitelist' | 'blacklist', description?: string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO ip_filters (id, ip, type, description, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, ip, type, description || '', now]
  )
  
  saveDatabase()
  return id
}

export function removeIpFilter(ip: string, type: 'whitelist' | 'blacklist') {
  const db = getDatabase()
  if (!db) return
  
  db.run('DELETE FROM ip_filters WHERE ip = ? AND type = ?', [ip, type])
  saveDatabase()
}

export function getIpFilters(type?: 'whitelist' | 'blacklist') {
  const db = getDatabase()
  if (!db) return []
  
  let query = 'SELECT * FROM ip_filters'
  const params: any[] = []
  
  if (type) {
    query += ' WHERE type = ?'
    params.push(type)
  }
  
  query += ' ORDER BY createdAt DESC'
  
  const result = db.exec(query, params)
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    ip: row[1],
    type: row[2],
    description: row[3],
    createdAt: row[4]
  }))
}

export function checkIpAccess(ip: string): { allowed: boolean; reason?: string } {
  const db = getDatabase()
  if (!db) return { allowed: true }
  
  // 检查白名单
  const whitelist = db.exec('SELECT 1 FROM ip_filters WHERE type = ? AND ip = ?', ['whitelist', ip])
  if (whitelist.length > 0) {
    return { allowed: true }
  }
  
  // 检查是否有白名单规则（如果有白名单，不在白名单中的都被拒绝）
  const hasWhitelist = db.exec('SELECT 1 FROM ip_filters WHERE type = ? LIMIT 1', ['whitelist'])
  if (hasWhitelist.length > 0) {
    return { allowed: false, reason: 'IP not in whitelist' }
  }
  
  // 检查黑名单
  const blacklist = db.exec('SELECT 1 FROM ip_filters WHERE type = ? AND ip = ?', ['blacklist', ip])
  if (blacklist.length > 0) {
    return { allowed: false, reason: 'IP in blacklist' }
  }
  
  return { allowed: true }
}

// ========== 分类折叠状态 ==========
export function getAllCategoryCollapseStates(): Record<string, boolean> {
  const db = getDatabase()
  if (!db) return {}
  
  const result = db.exec('SELECT key, value FROM settings WHERE key LIKE ?', ['category_collapse_%'])
  const states: Record<string, boolean> = {}
  
  if (result.length > 0) {
    result[0].values.forEach((row: any[]) => {
      const categoryId = row[0].replace('category_collapse_', '')
      states[categoryId] = row[1] === 'true'
    })
  }
  
  return states
}

export function setCategoryCollapseState(categoryId: string, collapsed: boolean) {
  const db = getDatabase()
  if (!db) return
  
  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
    [`category_collapse_${categoryId}`, collapsed ? 'true' : 'false', now]
  )
  saveDatabase()
}

// ========== RSS订阅 ==========
export function createRssFeed(userId: string, title: string, url: string, description?: string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO rss_feeds (id, userId, title, url, description, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [id, userId, title, url, description || '', now]
  )
  
  saveDatabase()
  return id
}

export function getRssFeeds(activeOnly: boolean = false, userId?: string) {
  const db = getDatabase()
  if (!db) return []
  
  let query = 'SELECT * FROM rss_feeds'
  const params: any[] = []
  const conditions: string[] = []
  
  if (userId) {
    conditions.push('userId = ?')
    params.push(userId)
  }
  
  if (activeOnly) {
    conditions.push('active = 1')
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  
  query += ' ORDER BY createdAt DESC'
  
  const result = db.exec(query, params)
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    title: row[2],
    url: row[3],
    description: row[4],
    active: row[5] === 1,
    lastFetchAt: row[6],
    createdAt: row[7]
  }))
}

export function getRssFeed(id: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM rss_feeds WHERE id = ?', [id])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    title: row[2],
    url: row[3],
    description: row[4],
    active: row[5] === 1,
    lastFetchAt: row[6],
    createdAt: row[7]
  }
}

export function updateRssFeed(id: string, updates: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.url !== undefined) {
    fields.push('url = ?')
    values.push(updates.url)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }
  if (updates.lastFetchAt !== undefined) {
    fields.push('lastFetchAt = ?')
    values.push(updates.lastFetchAt)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.run(`UPDATE rss_feeds SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteRssFeed(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM rss_feeds WHERE id = ?', [id])
  db.run('DELETE FROM rss_articles WHERE feedId = ?', [id])
  saveDatabase()
  return true
}

export function getRssArticles(feedId?: string, unreadOnly: boolean = false) {
  try {
    const db = getDatabase()
    if (!db) {
      console.warn('Database not available in getRssArticles')
      return []
    }
    
    let query = 'SELECT * FROM rss_articles'
    const params: any[] = []
    const conditions: string[] = []
    
    if (feedId) {
      conditions.push('feedId = ?')
      params.push(feedId)
    }
    
    if (unreadOnly) {
      conditions.push('isRead = 0')
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY publishedAt DESC'
    
    const result = db.exec(query, params)
    if (!result || result.length === 0 || !result[0].values) return []
    
    return result[0].values.map((row: any[]) => ({
      id: row[0],
      feedId: row[1],
      title: row[2],
      link: row[3],
      description: row[4],
      content: row[5],
      publishedAt: row[6],
      isRead: row[7] === 1,
      isStarred: row[8] === 1,
      createdAt: row[9]
    }))
  } catch (error: any) {
    console.error('Error in getRssArticles:', error)
    return []
  }
}

export function getUnreadCount(feedId?: string) {
  const db = getDatabase()
  if (!db) return 0
  
  let query = 'SELECT COUNT(*) as count FROM rss_articles WHERE isRead = 0'
  const params: any[] = []
  
  if (feedId) {
    query += ' AND feedId = ?'
    params.push(feedId)
  }
  
  const result = db.exec(query, params)
  if (result.length === 0) return 0
  
  return result[0].values[0][0] as number
}

export function markArticleRead(articleId: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('UPDATE rss_articles SET isRead = 1 WHERE id = ?', [articleId])
  saveDatabase()
  return true
}

export function markAllRead(feedId?: string) {
  const db = getDatabase()
  if (!db) return false
  
  if (feedId) {
    db.run('UPDATE rss_articles SET isRead = 1 WHERE feedId = ?', [feedId])
  } else {
    db.run('UPDATE rss_articles SET isRead = 1')
  }
  
  saveDatabase()
  return true
}

export function starArticle(articleId: string, isStarred: boolean) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('UPDATE rss_articles SET isStarred = ? WHERE id = ?', [isStarred ? 1 : 0, articleId])
  saveDatabase()
  return true
}

export function createRssArticle(feedId: string, data: any) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO rss_articles (id, feedId, title, link, description, content, publishedAt, isRead, isStarred, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)',
    [id, feedId, data.title || '', data.link || '', data.description || '', data.content || '', data.publishedAt || now, now]
  )
  
  saveDatabase()
  return id
}

// ========== WebDAV配置 ==========
export function createWebdavConfig(userId: string, name: string, url: string, username: string, password: string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO webdav_configs (id, userId, name, url, username, password, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, url, username, password, now, now]
  )
  
  saveDatabase()
  return id
}

export function getWebdavConfigs(activeOnly: boolean = false) {
  const db = getDatabase()
  if (!db) return []
  
  let query = 'SELECT * FROM webdav_configs'
  if (activeOnly) {
    query += ' WHERE active = 1'
  }
  query += ' ORDER BY createdAt DESC'
  
  const result = db.exec(query)
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    username: row[4],
    password: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }))
}

export function getWebdavConfig(id: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM webdav_configs WHERE id = ?', [id])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    username: row[4],
    password: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }
}

export function updateWebdavConfig(id: string, updates: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.url !== undefined) {
    fields.push('url = ?')
    values.push(updates.url)
  }
  if (updates.username !== undefined) {
    fields.push('username = ?')
    values.push(updates.username)
  }
  if (updates.password !== undefined) {
    fields.push('password = ?')
    values.push(updates.password)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.run(`UPDATE webdav_configs SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteWebdavConfig(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM webdav_configs WHERE id = ?', [id])
  saveDatabase()
  return true
}

// ========== 文件快传 ==========
export function createFileTransfer(
  userId: string | undefined,
  fileName: string,
  fileSize: number,
  fileType: string,
  filePath: string,
  extractCode: string,
  extractPassword: string,
  deleteCode: string,
  deletePassword: string,
  downloadToken: string,
  maxDownloads: number,
  expiryHours: number
) {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()
  const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000

  db.run(
    'INSERT INTO file_transfers (id, userId, fileName, fileSize, fileType, filePath, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, maxDownloads, downloadCount, expiryHours, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
    [id, userId || null, fileName, fileSize, fileType, filePath, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, maxDownloads, expiryHours, now, expiresAt]
  )

  saveDatabase()
  return { id, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, expiresAt }
}

export function getFileTransferByExtractCode(extractCode: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM file_transfers WHERE extractCode = ?', [extractCode])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    currentDownloads: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15]
  }
}

export function getFileTransferByDeleteCode(deleteCode: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM file_transfers WHERE deleteCode = ?', [deleteCode])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    currentDownloads: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15]
  }
}

export function getFileTransferByDownloadToken(downloadToken: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM file_transfers WHERE downloadToken = ?', [downloadToken])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    currentDownloads: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15]
  }
}

export function incrementFileTransferDownload(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('UPDATE file_transfers SET downloadCount = downloadCount + 1 WHERE id = ?', [id])
  saveDatabase()
  return true
}

export function deleteFileTransferById(id: string): { success: boolean; filePath?: string } {
  const db = getDatabase()
  if (!db) return { success: false }

  // 先获取文件路径
  const result = db.exec('SELECT filePath FROM file_transfers WHERE id = ?', [id])
  let filePath: string | undefined
  if (result.length > 0) {
    filePath = result[0].values[0][0] as string
  }

  db.run('DELETE FROM file_transfers WHERE id = ?', [id])
  saveDatabase()
  return { success: true, filePath }
}

export function deleteFileTransfer(deleteCode: string): { success: boolean; filePath?: string } {
  const db = getDatabase()
  if (!db) return { success: false }

  // 先获取文件路径
  const result = db.exec('SELECT filePath FROM file_transfers WHERE deleteCode = ?', [deleteCode])
  let filePath: string | undefined
  if (result.length > 0) {
    filePath = result[0].values[0][0] as string
  }

  db.run('DELETE FROM file_transfers WHERE deleteCode = ?', [deleteCode])
  saveDatabase()
  return { success: true, filePath }
}

export function getUserFileTransfers(userId: string | null) {
  const db = getDatabase()
  if (!db) return []
  
  // 如果 userId 为 null，查询所有匿名上传的文件（userId IS NULL）
  // 如果 userId 有值，查询该用户的文件
  const query = userId 
    ? 'SELECT * FROM file_transfers WHERE userId = ? ORDER BY createdAt DESC'
    : 'SELECT * FROM file_transfers WHERE userId IS NULL ORDER BY createdAt DESC'
  const params = userId ? [userId] : []
  
  const result = db.exec(query, params)
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    currentDownloads: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15]
  }))
}

export function getAllFileTransfers() {
  const db = getDatabase()
  if (!db) return []
  
  const result = db.exec('SELECT * FROM file_transfers ORDER BY createdAt DESC')
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    currentDownloads: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15]
  }))
}

export function cleanupExpiredFileTransfers(): { count: number; filePaths: string[] } {
  const db = getDatabase()
  if (!db) return { count: 0, filePaths: [] }

  const now = Date.now()

  // 先查询要删除的记录，获取文件路径
  const queryResult = db.exec('SELECT filePath FROM file_transfers WHERE expiresAt < ?', [now])
  const filePaths: string[] = []
  if (queryResult.length > 0 && queryResult[0].values.length > 0) {
    queryResult[0].values.forEach((row: any[]) => {
      if (row[0]) filePaths.push(row[0] as string)
    })
  }

  // 查询记录数
  const countResult = db.exec('SELECT COUNT(*) as count FROM file_transfers WHERE expiresAt < ?', [now])
  const count = countResult.length > 0 && countResult[0].values.length > 0 ? countResult[0].values[0][0] : 0

  // 执行删除
  db.run('DELETE FROM file_transfers WHERE expiresAt < ?', [now])
  saveDatabase()
  return { count: count as number, filePaths }
}

export function getFileTransferSettings() {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT value FROM settings WHERE key = ?', ['file_transfer_settings'])
  
  // 默认设置 - 上传目录可配置，默认为 ./uploads
  const defaultSettings = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxExpiryHours: 72, // 默认72小时
    maxDownloads: 10,
    // 安全：默认只允许常见文档和图片类型，禁止可执行文件
    allowedFileTypes: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', // 图片
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', // 文档
      'zip', 'rar', '7z', 'tar', 'gz', // 压缩包
      'mp3', 'mp4', 'avi', 'mov', 'wmv', // 音视频
    ],
    uploadPath: './uploads' // 默认上传目录
  }
  
  if (result.length === 0) {
    return defaultSettings
  }
  
  try {
    const savedSettings = JSON.parse(result[0].values[0][0])
    // 合并默认设置，确保所有字段都存在
    return { ...defaultSettings, ...savedSettings }
  } catch {
    return defaultSettings
  }
}

export function updateFileTransferSettings(settings: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
    ['file_transfer_settings', JSON.stringify(settings), now]
  )
  
  saveDatabase()
  return true
}

export function getFileTransferStats() {
  const db = getDatabase()
  if (!db) return { total: 0, active: 0, expired: 0 }
  
  const total = db.exec('SELECT COUNT(*) FROM file_transfers')[0]?.values[0][0] || 0
  const active = db.exec('SELECT COUNT(*) FROM file_transfers WHERE expiresAt > ?', [Date.now()])[0]?.values[0][0] || 0
  const expired = db.exec('SELECT COUNT(*) FROM file_transfers WHERE expiresAt <= ?', [Date.now()])[0]?.values[0][0] || 0
  
  return { total, active, expired }
}

// ========== 自定义指标 ==========
export function createCustomMetric(userId: string, name: string, type: string, script: string, unit?: string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO custom_metrics (id, userId, name, type, script, unit, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, type, script, unit || '', now, now]
  )
  
  saveDatabase()
  return id
}

export function getCustomMetricsByUser(userId: string, activeOnly: boolean = false) {
  const db = getDatabase()
  if (!db) return []
  
  let query = 'SELECT * FROM custom_metrics WHERE userId = ?'
  if (activeOnly) {
    query += ' AND active = 1'
  }
  query += ' ORDER BY createdAt DESC'
  
  const result = db.exec(query, [userId])
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    type: row[3],
    script: row[4],
    unit: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }))
}

export function getCustomMetric(id: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM custom_metrics WHERE id = ?', [id])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    type: row[3],
    script: row[4],
    unit: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8],
    command: row[9],
    url: row[10],
    method: row[11],
    headers: row[12],
    body: row[13],
    timeout: row[14]
  }
}

export function updateCustomMetric(id: string, updates: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.script !== undefined) {
    fields.push('script = ?')
    values.push(updates.script)
  }
  if (updates.unit !== undefined) {
    fields.push('unit = ?')
    values.push(updates.unit)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.run(`UPDATE custom_metrics SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteCustomMetric(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM custom_metrics WHERE id = ?', [id])
  db.run('DELETE FROM custom_metric_history WHERE metricId = ?', [id])
  saveDatabase()
  return true
}

export function addCustomMetricHistory(metricId: string, value: number | string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO custom_metric_history (id, metricId, value, recordedAt) VALUES (?, ?, ?, ?)',
    [id, metricId, value, now]
  )
  
  saveDatabase()
  return id
}

export function getCustomMetricHistory(metricId: string, limit: number = 100) {
  const db = getDatabase()
  if (!db) return []
  
  const result = db.exec('SELECT * FROM custom_metric_history WHERE metricId = ? ORDER BY recordedAt DESC LIMIT ?', [metricId, limit])
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    metricId: row[1],
    value: row[2],
    recordedAt: row[3]
  }))
}

export function clearCustomMetricHistory(metricId: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM custom_metric_history WHERE metricId = ?', [metricId])
  saveDatabase()
  return true
}

// ========== 服务监控 ==========
export function createServiceMonitor(userId: string, name: string, url: string, method?: string, expectedStatus?: number, checkInterval?: number, timeout?: number) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO service_monitors (id, userId, name, url, method, expectedStatus, checkInterval, timeout, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, url, method || 'GET', expectedStatus || 200, checkInterval || 300, timeout || 30, now, now]
  )
  
  saveDatabase()
  return id
}

export function getServiceMonitorsByUser(userId: string, activeOnly: boolean = false) {
  const db = getDatabase()
  if (!db) return []
  
  let query = 'SELECT * FROM service_monitors WHERE userId = ?'
  if (activeOnly) {
    query += ' AND active = 1'
  }
  query += ' ORDER BY createdAt DESC'
  
  const result = db.exec(query, [userId])
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    type: row[4],
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }))
}

export function getServiceMonitorById(id: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM service_monitors WHERE id = ?', [id])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    type: row[4],
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }
}

export function updateServiceMonitor(id: string, updates: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.url !== undefined) {
    fields.push('url = ?')
    values.push(updates.url)
  }
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.run(`UPDATE service_monitors SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteServiceMonitor(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM service_monitors WHERE id = ?', [id])
  saveDatabase()
  return true
}

// ========== 便签管理 ==========
export function getNotepad(userId: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM notepads WHERE userId = ?', [userId])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    history: JSON.parse(row[4] || '[]'),
    files: JSON.parse(row[5] || '[]'),
    createdAt: row[6],
    updatedAt: row[7]
  }
}

export function saveNotepad(content: string, history: any[], files: any[], userId: string) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const existing = getNotepad(userId)
  
  if (existing) {
    db.run(
      'UPDATE notepads SET content = ?, history = ?, files = ?, updatedAt = ? WHERE userId = ?',
      [content, JSON.stringify(history), JSON.stringify(files), now, userId]
    )
  } else {
    const id = generateId()
    db.run(
      'INSERT INTO notepads (id, userId, content, history, files, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, content, JSON.stringify(history), JSON.stringify(files), now, now]
    )
  }
  
  saveDatabase()
  return true
}

export function getAllNotepads() {
  const db = getDatabase()
  if (!db) return []
  
  const result = db.exec('SELECT * FROM notepads ORDER BY updatedAt DESC')
  if (result.length === 0) return []
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    history: JSON.parse(row[4] || '[]'),
    files: JSON.parse(row[5] || '[]'),
    createdAt: row[6],
    updatedAt: row[7]
  }))
}

export function deleteNotepad(id: string) {
  const db = getDatabase()
  if (!db) return false
  
  db.run('DELETE FROM notepads WHERE id = ?', [id])
  saveDatabase()
  return true
}

export function createNotepad(userId: string, title: string, content: string) {
  const db = getDatabase()
  if (!db) return null
  
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    'INSERT INTO notepads (id, userId, title, content, history, files, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, title, content, '[]', '[]', now, now]
  )
  
  saveDatabase()
  return id
}

export function updateNotepad(id: string, updates: any) {
  const db = getDatabase()
  if (!db) return false
  
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.content !== undefined) {
    fields.push('content = ?')
    values.push(updates.content)
  }
  if (updates.history !== undefined) {
    fields.push('history = ?')
    values.push(JSON.stringify(updates.history))
  }
  if (updates.files !== undefined) {
    fields.push('files = ?')
    values.push(JSON.stringify(updates.files))
  }
  
  if (fields.length === 0) return false
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.run(`UPDATE notepads SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function getNotepadById(id: string) {
  const db = getDatabase()
  if (!db) return null
  
  const result = db.exec('SELECT * FROM notepads WHERE id = ?', [id])
  if (result.length === 0) return null
  
  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    history: JSON.parse(row[4] || '[]'),
    files: JSON.parse(row[5] || '[]'),
    createdAt: row[6],
    updatedAt: row[7]
  }
}
