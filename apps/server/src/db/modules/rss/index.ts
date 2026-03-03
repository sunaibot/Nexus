/**
 * RSS订阅模块
 * 提供RSS订阅源和文章的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface RssFeed {
  id: string
  userId: string
  title: string
  url: string
  description: string
  active: boolean
  lastFetchAt: string | null
  createdAt: string
}

export interface RssArticle {
  id: string
  feedId: string
  title: string
  link: string
  description: string
  content: string
  publishedAt: string
  isRead: boolean
  isStarred: boolean
  createdAt: string
}

export function createRssFeed(userId: string, title: string, url: string, description?: string): string | null {
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

export function getRssFeeds(activeOnly: boolean = false, userId?: string): RssFeed[] {
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

export function getRssFeed(id: string): RssFeed | null {
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

export function updateRssFeed(id: string, updates: Partial<RssFeed>): boolean {
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

export function deleteRssFeed(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM rss_feeds WHERE id = ?', [id])
  db.run('DELETE FROM rss_articles WHERE feedId = ?', [id])
  saveDatabase()
  return true
}

export function getRssArticles(feedId?: string, unreadOnly: boolean = false): RssArticle[] {
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

export function getUnreadCount(feedId?: string): number {
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

export function markArticleRead(articleId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('UPDATE rss_articles SET isRead = 1 WHERE id = ?', [articleId])
  saveDatabase()
  return true
}

export function markAllRead(feedId?: string): boolean {
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

export function starArticle(articleId: string, isStarred: boolean): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('UPDATE rss_articles SET isStarred = ? WHERE id = ?', [isStarred ? 1 : 0, articleId])
  saveDatabase()
  return true
}

export function createRssArticle(feedId: string, data: Partial<RssArticle>): string | null {
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
