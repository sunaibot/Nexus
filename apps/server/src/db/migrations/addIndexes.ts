/**
 * 数据库索引优化
 * 为频繁查询的字段添加索引，提升查询性能
 */

import type { Database as SqlJsDatabase } from 'sql.js'

/**
 * 索引定义
 */
interface IndexDefinition {
  name: string
  table: string
  columns: string
  unique?: boolean
}

/**
 * 需要创建的索引列表
 */
export const INDEXES: IndexDefinition[] = [
  // 书签表索引
  { name: 'idx_bookmarks_userId', table: 'bookmarks', columns: 'userId' },
  { name: 'idx_bookmarks_category', table: 'bookmarks', columns: 'category' },
  { name: 'idx_bookmarks_visibility', table: 'bookmarks', columns: 'visibility' },
  { name: 'idx_bookmarks_isPinned', table: 'bookmarks', columns: 'isPinned' },
  { name: 'idx_bookmarks_createdAt', table: 'bookmarks', columns: 'createdAt' },
  { name: 'idx_bookmarks_user_visibility', table: 'bookmarks', columns: 'userId, visibility' },
  { name: 'idx_bookmarks_visitCount', table: 'bookmarks', columns: 'visitCount' },
  { name: 'idx_bookmarks_user_category', table: 'bookmarks', columns: 'userId, category' },

  // 分类表索引
  { name: 'idx_categories_userId', table: 'categories', columns: 'userId' },
  { name: 'idx_categories_parentId', table: 'categories', columns: 'parentId' },

  // 访问记录表索引
  { name: 'idx_visits_bookmarkId', table: 'visits', columns: 'bookmarkId' },
  { name: 'idx_visits_userId', table: 'visits', columns: 'userId' },
  { name: 'idx_visits_visitedAt', table: 'visits', columns: 'visitedAt' },
  { name: 'idx_visits_ip', table: 'visits', columns: 'ip' },
  { name: 'idx_visits_user_visitedAt', table: 'visits', columns: 'userId, visitedAt' },
  { name: 'idx_visits_bookmark_visitedAt', table: 'visits', columns: 'bookmarkId, visitedAt' },

  // 审计日志表索引
  { name: 'idx_audit_logs_userId', table: 'audit_logs', columns: 'userId' },
  { name: 'idx_audit_logs_action', table: 'audit_logs', columns: 'action' },
  { name: 'idx_audit_logs_createdAt', table: 'audit_logs', columns: 'createdAt' },
  { name: 'idx_audit_logs_user_created', table: 'audit_logs', columns: 'userId, createdAt' },

  // 文件快传表索引
  { name: 'idx_file_transfers_extractCode', table: 'file_transfers', columns: 'extractCode' },
  { name: 'idx_file_transfers_deleteCode', table: 'file_transfers', columns: 'deleteCode' },
  { name: 'idx_file_transfers_userId', table: 'file_transfers', columns: 'userId' },
  { name: 'idx_file_transfers_expiresAt', table: 'file_transfers', columns: 'expiresAt' },

  // RSS文章表索引
  { name: 'idx_rss_articles_feedId', table: 'rss_articles', columns: 'feedId' },
  { name: 'idx_rss_articles_isRead', table: 'rss_articles', columns: 'isRead' },
  { name: 'idx_rss_articles_publishedAt', table: 'rss_articles', columns: 'publishedAt' },

  // 书签标签关联表索引
  { name: 'idx_bookmark_tags_bookmarkId', table: 'bookmark_tags', columns: 'bookmarkId' },
  { name: 'idx_bookmark_tags_tagId', table: 'bookmark_tags', columns: 'tagId' },

  // 分享表索引
  { name: 'idx_shares_token', table: 'shares', columns: 'token' },
  { name: 'idx_shares_bookmarkId', table: 'shares', columns: 'bookmarkId' },

  // 设置表索引
  { name: 'idx_settings_key', table: 'settings', columns: 'key' },
  { name: 'idx_settings_userId', table: 'settings', columns: 'userId' },

  // 令牌表索引
  { name: 'idx_tokens_userId', table: 'tokens', columns: 'userId' },
  { name: 'idx_tokens_expiresAt', table: 'tokens', columns: 'expiresAt' },

  // 便签表索引
  { name: 'idx_notepads_userId', table: 'notepads', columns: 'userId' },

  // 自定义指标历史表索引
  { name: 'idx_metric_history_metricId', table: 'custom_metric_history', columns: 'metricId' },
  { name: 'idx_metric_history_recordedAt', table: 'custom_metric_history', columns: 'recordedAt' },
]

/**
 * 检查索引是否存在
 */
function indexExists(db: SqlJsDatabase, indexName: string): boolean {
  try {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
      [indexName]
    )
    return result.length > 0 && result[0].values.length > 0
  } catch {
    return false
  }
}

/**
 * 创建单个索引
 */
function createIndex(db: SqlJsDatabase, index: IndexDefinition): void {
  if (indexExists(db, index.name)) {
    console.log(`  ↪️ 索引已存在: ${index.name}`)
    return
  }

  const uniqueClause = index.unique ? 'UNIQUE' : ''
  const sql = `CREATE ${uniqueClause} INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.columns})`

  try {
    db.run(sql)
    console.log(`  ✅ 创建索引: ${index.name} ON ${index.table}(${index.columns})`)
  } catch (error) {
    console.error(`  ❌ 创建索引失败: ${index.name}`, error)
  }
}

/**
 * 创建所有索引
 */
export function createAllIndexes(db: SqlJsDatabase): void {
  console.log('\n📊 创建数据库索引...')
  let created = 0
  let skipped = 0

  for (const index of INDEXES) {
    if (indexExists(db, index.name)) {
      skipped++
    } else {
      createIndex(db, index)
      created++
    }
  }

  console.log(`📊 索引创建完成: ${created} 个新建, ${skipped} 个已存在\n`)
}

/**
 * 删除所有索引（用于重置）
 */
export function dropAllIndexes(db: SqlJsDatabase): void {
  console.log('\n🗑️ 删除数据库索引...')

  for (const index of INDEXES) {
    try {
      db.run(`DROP INDEX IF EXISTS ${index.name}`)
      console.log(`  🗑️ 删除索引: ${index.name}`)
    } catch (error) {
      console.error(`  ❌ 删除索引失败: ${index.name}`, error)
    }
  }

  console.log('🗑️ 索引删除完成\n')
}

/**
 * 分析查询性能
 */
export function analyzeQueries(db: SqlJsDatabase): void {
  console.log('\n📈 分析数据库查询性能...')

  try {
    // 运行ANALYZE更新统计信息
    db.run('ANALYZE')
    console.log('  ✅ 统计信息已更新')

    // 显示表大小信息
    const tables = [
      'bookmarks', 'categories', 'visits', 'audit_logs',
      'file_transfers', 'rss_articles', 'users'
    ]

    console.log('\n  📋 表记录数:')
    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) FROM ${table}`)
        const count = result[0]?.values[0]?.[0] || 0
        console.log(`    - ${table}: ${count} 条记录`)
      } catch {
        console.log(`    - ${table}: 无法获取`)
      }
    }
  } catch (error) {
    console.error('  ❌ 分析失败:', error)
  }

  console.log('')
}
