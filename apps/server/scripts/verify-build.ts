/**
 * 构建验证脚本
 * 验证第二阶段架构优化成果
 */

import * as utils from '../src/utils/index.js'
import * as middleware from '../src/middleware/index.js'
import { CacheManager } from '../src/utils/cache.js'
import { apiCache, cacheConfigs } from '../src/middleware/apiCache.js'
import { sqlInjectionDetector } from '../src/middleware/securityValidator.js'
import { doubleSubmitCsrf, refererCheck } from '../src/middleware/csrf.js'
import { autoAuditMiddleware, audit, auditBatch } from '../src/middleware/auditAuto.js'
import { logger, LogLevel } from '../src/utils/logger.js'
import { INDEXES } from '../src/db/migrations/addIndexes.js'

// 验证结果
interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: any
}

const results: VerificationResult[] = []

/**
 * 运行验证
 */
async function verify(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn()
    results.push({ name, status: 'pass', message: '验证通过' })
  } catch (error: any) {
    results.push({ name, status: 'fail', message: error.message })
  }
}

console.log('========================================')
console.log('  NOWEN Server - 第二阶段验证')
console.log('========================================\n')

async function runVerifications() {
  // 1. 验证模块化重构
  await verify('模块化重构 - 工具函数导出', () => {
    if (!utils.logger) throw new Error('logger未导出')
    if (!utils.CacheManager) throw new Error('CacheManager未导出')
    if (!utils.queryAll) throw new Error('queryAll未导出')
  })

  await verify('模块化重构 - 中间件导出', () => {
    if (!middleware.errorHandler) throw new Error('errorHandler未导出')
    if (!middleware.apiCacheMiddleware) throw new Error('apiCacheMiddleware未导出')
    if (!middleware.sqlInjectionDetector) throw new Error('sqlInjectionDetector未导出')
    if (!middleware.csrfProtection) throw new Error('csrfProtection未导出')
    if (!middleware.autoAuditMiddleware) throw new Error('autoAuditMiddleware未导出')
  })

  // 2. 验证性能优化
  await verify('性能优化 - 缓存系统', () => {
    const cache = new CacheManager()
    cache.set('test', { data: 'value' }, 1000)
    const value = cache.get('test')
    if (!value || value.data !== 'value') {
      throw new Error('缓存读写失败')
    }
  })

  await verify('性能优化 - API缓存中间件', () => {
    if (!apiCache) throw new Error('apiCache未初始化')
    if (!cacheConfigs.bookmarks) throw new Error('cacheConfigs.bookmarks未配置')
  })

  // 3. 验证安全加固
  await verify('安全加固 - SQL注入检测', () => {
    if (typeof sqlInjectionDetector !== 'function') {
      throw new Error('sqlInjectionDetector不是函数')
    }
  })

  await verify('安全加固 - CSRF防护', () => {
    if (typeof doubleSubmitCsrf !== 'function') {
      throw new Error('doubleSubmitCsrf不是函数')
    }
    if (typeof refererCheck !== 'function') {
      throw new Error('refererCheck不是函数')
    }
  })

  await verify('安全加固 - 审计日志', () => {
    if (typeof autoAuditMiddleware !== 'function') {
      throw new Error('autoAuditMiddleware不是函数')
    }
  })

  // 4. 验证代码规范
  await verify('代码规范 - 日志系统', () => {
    if (!logger) throw new Error('logger未初始化')
    if (typeof logger.info !== 'function') throw new Error('logger.info不是函数')
    if (typeof logger.error !== 'function') throw new Error('logger.error不是函数')

    // 测试日志功能
    logger.info('测试日志', { test: true })
  })

  // 5. 验证数据库索引
  await verify('数据库索引 - 索引定义', () => {
    if (!INDEXES || INDEXES.length === 0) {
      throw new Error('索引定义为空')
    }

    const requiredIndexes = ['idx_bookmarks_user_visibility', 'idx_audit_logs_createdAt']
    for (const indexName of requiredIndexes) {
      const exists = INDEXES.some((idx: any) => idx.name === indexName)
      if (!exists) {
        throw new Error(`缺少索引: ${indexName}`)
      }
    }
  })

  // 打印结果
  console.log('\n========================================')
  console.log('  验证结果')
  console.log('========================================\n')

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length

  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' :
                 result.status === 'fail' ? '❌' : '⏭️'
    console.log(`${index + 1}. ${icon} ${result.name}`)
    if (result.status === 'fail') {
      console.log(`   错误: ${result.message}`)
    }
  })

  console.log('\n========================================')
  console.log(`  总计: ${results.length} | 通过: ${passed} | 失败: ${failed} | 跳过: ${skipped}`)
  console.log('========================================')

  if (failed > 0) {
    console.log('\n❌ 验证失败，请修复上述问题')
    process.exit(1)
  } else {
    console.log('\n✅ 所有验证通过！第二阶段架构优化完成。')
    process.exit(0)
  }
}

runVerifications()
