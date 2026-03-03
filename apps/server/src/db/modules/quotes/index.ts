/**
 * 名言模块
 * 提供名言警句的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface Quote {
  id: string
  content: string
  author: string
  source: string
  category: string
  tags: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 获取所有名言
 */
export function getQuotes(options?: {
  search?: string
  category?: string
  author?: string
  isActive?: boolean
}): Quote[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM quotes WHERE 1=1'
  const params: any[] = []

  if (options?.search) {
    query += ' AND (content LIKE ? OR author LIKE ? OR source LIKE ?)'
    const searchTerm = `%${options.search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (options?.category) {
    query += ' AND category = ?'
    params.push(options.category)
  }

  if (options?.author) {
    query += ' AND author = ?'
    params.push(options.author)
  }

  if (options?.isActive !== undefined) {
    query += ' AND isActive = ?'
    params.push(options.isActive ? 1 : 0)
  }

  query += ' ORDER BY createdAt DESC'

  const result = db.exec(query, params)
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    content: row[1],
    author: row[2] || '',
    source: row[3] || '',
    category: row[4] || '',
    tags: row[5] || '',
    isActive: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }))
}

/**
 * 获取启用的名言
 */
export function getActiveQuotes(): Quote[] {
  return getQuotes({ isActive: true })
}

/**
 * 获取单个名言
 */
export function getQuoteById(id: string): Quote | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM quotes WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    content: row[1],
    author: row[2] || '',
    source: row[3] || '',
    category: row[4] || '',
    tags: row[5] || '',
    isActive: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }
}

/**
 * 获取随机名言
 */
export function getRandomQuote(): Quote | null {
  const quotes = getActiveQuotes()
  if (quotes.length === 0) {
    // 返回默认名言
    return {
      id: 'default-1',
      content: '学而时习之，不亦说乎',
      author: '孔子',
      source: '论语',
      category: '',
      tags: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  return quotes[Math.floor(Math.random() * quotes.length)]
}

/**
 * 获取每日名言
 */
export function getDailyQuote(): Quote | null {
  const quotes = getActiveQuotes()
  if (quotes.length === 0) {
    return {
      id: 'daily',
      content: '学而时习之，不亦说乎',
      author: '孔子',
      source: '论语',
      category: '',
      tags: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // 使用日期作为种子选择名言
  const today = new Date().toDateString()
  const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const index = seed % quotes.length

  return quotes[index]
}

/**
 * 创建名言
 */
export function createQuote(
  content: string,
  author?: string,
  source?: string,
  category?: string,
  tags?: string
): Quote | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO quotes (id, content, author, source, category, tags, isActive, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, content, author || '', source || '', category || '', tags || '', 1, now, now]
  )
  saveDatabase()

  return {
    id,
    content,
    author: author || '',
    source: source || '',
    category: category || '',
    tags: tags || '',
    isActive: true,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 更新名言
 */
export function updateQuote(
  id: string,
  updates: Partial<Quote>
): Quote | null {
  const db = getDatabase()
  if (!db) return null

  const existing = getQuoteById(id)
  if (!existing) return null

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.content !== undefined) {
    fields.push('content = ?')
    values.push(updates.content)
  }
  if (updates.author !== undefined) {
    fields.push('author = ?')
    values.push(updates.author)
  }
  if (updates.source !== undefined) {
    fields.push('source = ?')
    values.push(updates.source)
  }
  if (updates.category !== undefined) {
    fields.push('category = ?')
    values.push(updates.category)
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?')
    values.push(updates.tags)
  }
  if (updates.isActive !== undefined) {
    fields.push('isActive = ?')
    values.push(updates.isActive ? 1 : 0)
  }

  if (fields.length === 0) return existing

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.run(`UPDATE quotes SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()

  return getQuoteById(id)
}

/**
 * 删除名言
 */
export function deleteQuote(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM quotes WHERE id = ?', [id])
  saveDatabase()
  return true
}

/**
 * 切换名言状态
 */
export function toggleQuoteStatus(id: string): Quote | null {
  const existing = getQuoteById(id)
  if (!existing) return null

  return updateQuote(id, { isActive: !existing.isActive })
}

/**
 * 获取分类列表
 */
export function getQuoteCategories(): string[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    'SELECT DISTINCT category FROM quotes WHERE category IS NOT NULL AND category != ""'
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => row[0]).filter(Boolean)
}

/**
 * 获取作者列表
 */
export function getQuoteAuthors(): string[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    'SELECT DISTINCT author FROM quotes WHERE author IS NOT NULL AND author != ""'
  )

  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => row[0]).filter(Boolean)
}
