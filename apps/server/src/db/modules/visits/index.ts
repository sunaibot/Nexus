/**
 * 访问统计模块
 * 提供访问记录和统计数据的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface Visit {
  id: string
  bookmarkId: string
  userId: string | null
  visitedAt: string
  ip: string
  userAgent: string | null
}

export interface VisitStats {
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  weekVisits: number
  monthVisits: number
  avgDuration: number
  bounceRate: number
}

/**
 * 记录访问
 */
export function recordVisit(
  bookmarkId: string,
  userId: string | null,
  ip: string,
  userAgent: string | null
): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO visits (id, bookmarkId, userId, visitedAt, ip, userAgent) VALUES (?, ?, ?, ?, ?, ?)',
    [id, bookmarkId, userId, now, ip, userAgent]
  )

  // 更新书签访问计数
  db.run(
    'UPDATE bookmarks SET visitCount = COALESCE(visitCount, 0) + 1, lastVisitedAt = ? WHERE id = ?',
    [now, bookmarkId]
  )

  saveDatabase()
  return id
}

/**
 * 获取热门书签排行
 */
export function getTopBookmarks(limit: number = 10, period: string = 'all'): any[] {
  const db = getDatabase()
  if (!db) return []

  let dateFilter = ''
  const params: any[] = []

  if (period === 'day') {
    dateFilter = "WHERE v.visitedAt >= date('now', '-1 day')"
  } else if (period === 'week') {
    dateFilter = "WHERE v.visitedAt >= date('now', '-7 days')"
  } else if (period === 'month') {
    dateFilter = "WHERE v.visitedAt >= date('now', '-30 days')"
  }

  const result = db.exec(
    `SELECT 
      b.id, b.title, b.url, b.category, b.favicon,
      COUNT(v.id) as visitCount,
      MAX(v.visitedAt) as lastVisitedAt
    FROM bookmarks b
    LEFT JOIN visits v ON b.id = v.bookmarkId ${dateFilter}
    GROUP BY b.id
    ORDER BY visitCount DESC
    LIMIT ?`,
    [...params, limit]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    title: row[1],
    url: row[2],
    category: row[3],
    favicon: row[4],
    visitCount: row[5],
    lastVisitedAt: row[6]
  }))
}

/**
 * 获取访问趋势
 */
export function getVisitTrend(days: number = 7): any[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    `SELECT 
      date(visitedAt) as date,
      COUNT(*) as count
    FROM visits
    WHERE visitedAt >= date('now', '-' || ? || ' days')
    GROUP BY date(visitedAt)
    ORDER BY date ASC`,
    [days]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    date: row[0],
    count: row[1]
  }))
}

/**
 * 获取最近访问记录
 */
export function getRecentVisits(limit: number = 20): any[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    `SELECT 
      v.id,
      v.bookmarkId,
      v.userId,
      v.visitedAt,
      v.ip,
      v.userAgent,
      b.title as bookmarkTitle,
      b.url as bookmarkUrl
    FROM visits v
    LEFT JOIN bookmarks b ON v.bookmarkId = b.id
    ORDER BY v.visitedAt DESC
    LIMIT ?`,
    [limit]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    bookmarkId: row[1],
    userId: row[2],
    visitedAt: row[3],
    ip: row[4],
    userAgent: row[5],
    bookmarkTitle: row[6],
    bookmarkUrl: row[7]
  }))
}

/**
 * 获取书签统计
 */
export function getBookmarkStats(bookmarkId: string): any {
  const db = getDatabase()
  if (!db) return null

  const today = new Date().toISOString().split('T')[0]

  // 总访问次数
  const totalResult = db.exec(
    'SELECT COUNT(*) as count FROM visits WHERE bookmarkId = ?',
    [bookmarkId]
  )
  const totalVisits = totalResult[0]?.values[0][0] || 0

  // 独立访客数
  const uniqueResult = db.exec(
    'SELECT COUNT(DISTINCT COALESCE(userId, ip)) as count FROM visits WHERE bookmarkId = ?',
    [bookmarkId]
  )
  const uniqueVisitors = uniqueResult[0]?.values[0][0] || 0

  // 今日访问次数
  const todayResult = db.exec(
    'SELECT COUNT(*) as count FROM visits WHERE bookmarkId = ? AND date(visitedAt) = date(?)',
    [bookmarkId, today]
  )
  const todayVisits = todayResult[0]?.values[0][0] || 0

  // 最近访问记录
  const recentResult = db.exec(
    `SELECT * FROM visits 
     WHERE bookmarkId = ? 
     ORDER BY visitedAt DESC 
     LIMIT 10`,
    [bookmarkId]
  )

  const recentVisits = recentResult[0]?.values.map((row: any[]) => ({
    id: row[0],
    bookmarkId: row[1],
    userId: row[2],
    visitedAt: row[3],
    ip: row[4],
    userAgent: row[5]
  })) || []

  return {
    bookmarkId,
    totalVisits,
    uniqueVisitors,
    todayVisits,
    recentVisits
  }
}

/**
 * 获取分类统计
 */
export function getCategoryStats(period: string = 'all'): any {
  const db = getDatabase()
  if (!db) return { totalVisits: 0, categories: [], period }

  let dateFilter = ''

  if (period === 'day') {
    dateFilter = "WHERE v.visitedAt >= date('now', '-1 day')"
  } else if (period === 'week') {
    dateFilter = "WHERE v.visitedAt >= date('now', '-7 days')"
  } else if (period === 'month') {
    dateFilter = "WHERE v.visitedAt >= date('now', '-30 days')"
  }

  const result = db.exec(
    `SELECT 
      c.id,
      c.name,
      c.icon,
      c.color,
      COUNT(v.id) as visitCount,
      COUNT(DISTINCT b.id) as bookmarkCount,
      COUNT(DISTINCT COALESCE(v.userId, v.ip)) as uniqueVisitors,
      MAX(v.visitedAt) as lastVisitedAt
    FROM categories c
    LEFT JOIN bookmarks b ON c.id = b.category
    LEFT JOIN visits v ON b.id = v.bookmarkId ${dateFilter}
    GROUP BY c.id
    ORDER BY visitCount DESC`
  )

  const categories = result[0]?.values.map((row: any[]) => ({
    id: row[0],
    name: row[1],
    icon: row[2],
    color: row[3],
    visitCount: row[4] || 0,
    bookmarkCount: row[5] || 0,
    uniqueVisitors: row[6] || 0,
    lastVisitedAt: row[7]
  })) || []

  const totalVisits = categories.reduce((sum, cat) => sum + cat.visitCount, 0)

  const statsWithPercent = categories.map(cat => ({
    ...cat,
    percentage: totalVisits > 0 ? Math.round((cat.visitCount / totalVisits) * 100) : 0
  }))

  return {
    totalVisits,
    categories: statsWithPercent,
    period
  }
}

/**
 * 获取分类趋势
 */
export function getCategoryTrend(categoryId: string, days: number = 7): any[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    `SELECT 
      date(v.visitedAt) as date,
      COUNT(*) as count,
      COUNT(DISTINCT b.id) as bookmarkCount
    FROM visits v
    JOIN bookmarks b ON v.bookmarkId = b.id
    WHERE b.category = ?
      AND v.visitedAt >= date('now', '-' || ? || ' days')
    GROUP BY date(v.visitedAt)
    ORDER BY date ASC`,
    [categoryId, days]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    date: row[0],
    count: row[1],
    bookmarkCount: row[2]
  }))
}

/**
 * 获取访问记录列表
 */
export function getVisitRecords(limit: number = 100): any[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    `SELECT 
      v.id,
      v.bookmarkId,
      b.title as bookmarkTitle,
      v.ip,
      v.userAgent,
      v.visitedAt
    FROM visits v
    LEFT JOIN bookmarks b ON v.bookmarkId = b.id
    ORDER BY v.visitedAt DESC
    LIMIT ?`,
    [limit]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    bookmarkId: row[1],
    bookmarkTitle: row[2],
    ip: row[3],
    userAgent: row[4],
    visitedAt: row[5]
  }))
}

/**
 * 获取热门书签（按访问计数）
 */
export function getPopularBookmarks(limit: number = 20): any[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    `SELECT 
      b.id,
      b.title,
      b.url,
      COALESCE(b.visitCount, 0) as visitCount,
      b.lastVisitedAt
    FROM bookmarks b
    WHERE b.visitCount > 0
    ORDER BY b.visitCount DESC
    LIMIT ?`,
    [limit]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    title: row[1],
    url: row[2],
    visitCount: row[3],
    lastVisitedAt: row[4]
  }))
}

/**
 * 获取访问时间线
 */
export function getVisitTimeline(days: number = 7): any[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    `SELECT 
      date(visitedAt) as date,
      COUNT(*) as count
    FROM visits
    WHERE visitedAt >= date('now', '-' || ? || ' days')
    GROUP BY date(visitedAt)
    ORDER BY date ASC`,
    [days]
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    date: row[0],
    count: row[1]
  }))
}

/**
 * 获取访问统计摘要
 */
export function getVisitStatsSummary(): VisitStats {
  const db = getDatabase()
  if (!db) {
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      todayVisits: 0,
      weekVisits: 0,
      monthVisits: 0,
      avgDuration: 0,
      bounceRate: 0
    }
  }

  const today = new Date().toISOString().split('T')[0]

  // 总访问量
  const totalResult = db.exec('SELECT COUNT(*) as count FROM visits')
  const totalVisits = totalResult[0]?.values[0][0] || 0

  // 独立访客数
  const uniqueResult = db.exec(
    'SELECT COUNT(DISTINCT COALESCE(userId, ip)) as count FROM visits'
  )
  const uniqueVisitors = uniqueResult[0]?.values[0][0] || 0

  // 今日访问量
  const todayResult = db.exec(
    'SELECT COUNT(*) as count FROM visits WHERE date(visitedAt) = date(?)',
    [today]
  )
  const todayVisits = todayResult[0]?.values[0][0] || 0

  // 本周访问量
  const weekResult = db.exec(
    "SELECT COUNT(*) as count FROM visits WHERE visitedAt >= date('now', '-7 days')"
  )
  const weekVisits = weekResult[0]?.values[0][0] || 0

  // 本月访问量
  const monthResult = db.exec(
    "SELECT COUNT(*) as count FROM visits WHERE visitedAt >= date('now', '-30 days')"
  )
  const monthVisits = monthResult[0]?.values[0][0] || 0

  // 平均停留时间（ visits 表没有 duration 字段，返回 0）
  const avgDuration = 0

  // 跳出率（简化计算：单页访问占总访问的比例）
  const singleVisitsResult = db.exec(
    `SELECT COUNT(*) as count FROM (
      SELECT ip, COUNT(*) as visitCount 
      FROM visits 
      GROUP BY ip 
      HAVING visitCount = 1
    )`
  )
  const singleVisits = singleVisitsResult[0]?.values[0][0] || 0

  const bounceRate = totalVisits > 0 ? Math.round((singleVisits / totalVisits) * 100) : 0

  return {
    totalVisits,
    uniqueVisitors,
    todayVisits,
    weekVisits,
    monthVisits,
    avgDuration,
    bounceRate
  }
}

/**
 * 清除所有访问记录
 */
export function clearAllVisits(): { deletedCount: number } {
  const db = getDatabase()
  if (!db) return { deletedCount: 0 }

  // 获取清除前的记录数
  const countResult = db.exec('SELECT COUNT(*) as count FROM visits')
  const deletedCount = countResult[0]?.values[0][0] || 0

  // 清空访问记录表
  db.run('DELETE FROM visits')

  // 重置所有书签的访问计数
  db.run('UPDATE bookmarks SET visitCount = 0, lastVisitedAt = NULL')

  saveDatabase()
  return { deletedCount }
}
