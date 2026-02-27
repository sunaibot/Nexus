/**
 * 国际化内容管理路由
 * 提供多语言内容的CRUD管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 翻译内容接口
interface Translation {
  id: string
  key: string                    // 翻译键名，如 'home.title'
  namespace: string              // 命名空间，如 'common', 'bookmarks'
  locale: string                 // 语言代码，如 'zh', 'en'
  value: string                  // 翻译内容
  description?: string           // 描述/备注
  isSystem: boolean              // 是否系统预设
  createdAt: string
  updatedAt: string
}

// 语言配置接口
interface LocaleConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  isEnabled: boolean
  isDefault: boolean
  rtl: boolean                   // 是否从右到左
}

// 解析翻译数据
function parseTranslation(row: any): Translation {
  return {
    id: row.id,
    key: row.key,
    namespace: row.namespace,
    locale: row.locale,
    value: row.value,
    description: row.description,
    isSystem: Boolean(row.isSystem),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 解析语言配置
function parseLocaleConfig(row: any): LocaleConfig {
  return {
    code: row.code,
    name: row.name,
    nativeName: row.nativeName,
    flag: row.flag,
    isEnabled: Boolean(row.isEnabled),
    isDefault: Boolean(row.isDefault),
    rtl: Boolean(row.rtl),
  }
}

/**
 * 获取所有支持的语言列表（公开接口）
 * GET /api/v2/i18n/locales
 */
router.get('/locales', (req: Request, res: Response) => {
  try {
    const { enabledOnly = 'true' } = req.query
    
    let sql = 'SELECT * FROM locales'
    if (enabledOnly === 'true') {
      sql += ' WHERE isEnabled = 1'
    }
    sql += ' ORDER BY isDefault DESC, name ASC'
    
    const locales = queryAll(sql).map(parseLocaleConfig)
    
    return successResponse(res, locales)
  } catch (error) {
    console.error('获取语言列表失败:', error)
    return errorResponse(res, '获取语言列表失败')
  }
})

/**
 * 获取当前语言配置（公开接口）
 * GET /api/v2/i18n/config
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    const defaultLocale = queryOne('SELECT * FROM locales WHERE isDefault = 1')
    const enabledLocales = queryAll('SELECT * FROM locales WHERE isEnabled = 1 ORDER BY name ASC')
    
    return successResponse(res, {
      defaultLocale: defaultLocale?.code || 'zh',
      supportedLocales: enabledLocales.map((l: any) => l.code),
      locales: enabledLocales.map(parseLocaleConfig),
    })
  } catch (error) {
    console.error('获取语言配置失败:', error)
    return errorResponse(res, '获取语言配置失败')
  }
})

/**
 * 获取翻译内容（公开接口）
 * GET /api/v2/i18n/translations/:locale
 */
router.get('/translations/:locale', (req: Request, res: Response) => {
  try {
    const locale = Array.isArray(req.params.locale) ? req.params.locale[0] : req.params.locale
    const { namespace = 'all' } = req.query
    
    let sql = 'SELECT * FROM translations WHERE locale = ?'
    const params: any[] = [locale]
    
    if (namespace !== 'all') {
      sql += ' AND namespace = ?'
      params.push(namespace)
    }
    
    sql += ' ORDER BY namespace, key'
    
    const translations = queryAll(sql, params).map(parseTranslation)
    
    // 转换为嵌套对象格式
    const result: Record<string, any> = {}
    for (const t of translations) {
      if (!result[t.namespace]) {
        result[t.namespace] = {}
      }
      result[t.namespace][t.key] = t.value
    }
    
    return successResponse(res, {
      locale,
      translations: result,
    })
  } catch (error) {
    console.error('获取翻译失败:', error)
    return errorResponse(res, '获取翻译失败')
  }
})

/**
 * 获取所有翻译（管理接口）
 * GET /api/v2/i18n/translations
 */
router.get('/translations', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { locale, namespace, search, page = 1, limit = 50 } = req.query
    
    let sql = 'SELECT * FROM translations WHERE 1=1'
    const params: any[] = []
    
    if (locale) {
      sql += ' AND locale = ?'
      params.push(locale)
    }
    
    if (namespace) {
      sql += ' AND namespace = ?'
      params.push(namespace)
    }
    
    if (search) {
      sql += ' AND (key LIKE ? OR value LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    
    // 获取总数
    const countResult = queryOne(`SELECT COUNT(*) as count FROM (${sql})`, params) as { count: number }
    
    sql += ' ORDER BY namespace, key'
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(limit as string) || 50, ((parseInt(page as string) || 1) - 1) * (parseInt(limit as string) || 50))
    
    const translations = queryAll(sql, params).map(parseTranslation)
    
    return successResponse(res, {
      translations,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 50,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / (parseInt(limit as string) || 50)),
      },
    })
  } catch (error) {
    console.error('获取翻译列表失败:', error)
    return errorResponse(res, '获取翻译列表失败')
  }
})

/**
 * 创建或更新翻译（需要管理员权限）
 * POST /api/v2/i18n/translations
 */
router.post('/translations', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { key, namespace = 'common', locale, value, description } = req.body
    
    if (!key || !locale || value === undefined) {
      return errorResponse(res, '键名、语言和值不能为空', 400)
    }
    
    const now = new Date().toISOString()
    
    // 检查是否已存在
    const existing = queryOne(
      'SELECT * FROM translations WHERE key = ? AND namespace = ? AND locale = ?',
      [key, namespace, locale]
    )
    
    if (existing) {
      // 更新
      run(
        'UPDATE translations SET value = ?, description = ?, updatedAt = ? WHERE id = ?',
        [value, description || null, now, existing.id]
      )
      
      const updated = queryOne('SELECT * FROM translations WHERE id = ?', [existing.id])
      return successResponse(res, parseTranslation(updated))
    } else {
      // 创建
      const id = generateId()
      run(
        'INSERT INTO translations (id, key, namespace, locale, value, description, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, key, namespace, locale, value, description || null, 0, now, now]
      )
      
      const created = queryOne('SELECT * FROM translations WHERE id = ?', [id])
      return successResponse(res, parseTranslation(created))
    }
  } catch (error) {
    console.error('保存翻译失败:', error)
    return errorResponse(res, '保存翻译失败')
  }
})

/**
 * 批量更新翻译（需要管理员权限）
 * POST /api/v2/i18n/translations/batch
 */
router.post('/translations/batch', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { locale, namespace, translations } = req.body
    
    if (!locale || !namespace || !translations || typeof translations !== 'object') {
      return errorResponse(res, '参数错误', 400)
    }
    
    const now = new Date().toISOString()
    const results: Translation[] = []
    
    for (const [key, value] of Object.entries(translations)) {
      const existing = queryOne(
        'SELECT * FROM translations WHERE key = ? AND namespace = ? AND locale = ?',
        [key, namespace, locale]
      )
      
      if (existing) {
        run(
          'UPDATE translations SET value = ?, updatedAt = ? WHERE id = ?',
          [value, now, existing.id]
        )
        const updated = queryOne('SELECT * FROM translations WHERE id = ?', [existing.id])
        results.push(parseTranslation(updated))
      } else {
        const id = generateId()
        run(
          'INSERT INTO translations (id, key, namespace, locale, value, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, key, namespace, locale, value, 0, now, now]
        )
        const created = queryOne('SELECT * FROM translations WHERE id = ?', [id])
        results.push(parseTranslation(created))
      }
    }
    
    return successResponse(res, {
      updated: results.length,
      translations: results,
    })
  } catch (error) {
    console.error('批量保存翻译失败:', error)
    return errorResponse(res, '批量保存翻译失败')
  }
})

/**
 * 删除翻译（需要管理员权限）
 * DELETE /api/v2/i18n/translations/:id
 */
router.delete('/translations/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const existing = queryOne('SELECT * FROM translations WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '翻译不存在', 404)
    }
    
    if (existing.isSystem) {
      return errorResponse(res, '系统预设翻译不能删除', 403)
    }
    
    run('DELETE FROM translations WHERE id = ?', [id])
    
    return successResponse(res, { deleted: true })
  } catch (error) {
    console.error('删除翻译失败:', error)
    return errorResponse(res, '删除翻译失败')
  }
})

/**
 * 添加新语言（需要管理员权限）
 * POST /api/v2/i18n/locales
 */
router.post('/locales', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { code, name, nativeName, flag, rtl = false } = req.body
    
    if (!code || !name || !nativeName) {
      return errorResponse(res, '语言代码、名称和本地名称不能为空', 400)
    }
    
    // 检查是否已存在
    const existing = queryOne('SELECT * FROM locales WHERE code = ?', [code])
    if (existing) {
      return errorResponse(res, '语言已存在', 400)
    }
    
    run(
      'INSERT INTO locales (code, name, nativeName, flag, isEnabled, isDefault, rtl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, name, nativeName, flag || '🌐', 1, 0, rtl ? 1 : 0]
    )
    
    // 复制默认语言的翻译作为模板
    const defaultLocale = queryOne('SELECT code FROM locales WHERE isDefault = 1')
    if (defaultLocale) {
      const defaultTranslations = queryAll(
        'SELECT key, namespace, value, description FROM translations WHERE locale = ?',
        [defaultLocale.code]
      )
      
      const now = new Date().toISOString()
      for (const t of defaultTranslations) {
        const id = generateId()
        run(
          'INSERT INTO translations (id, key, namespace, locale, value, description, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, t.key, t.namespace, code, t.value, t.description, 0, now, now]
        )
      }
    }
    
    const locale = queryOne('SELECT * FROM locales WHERE code = ?', [code])
    return successResponse(res, parseLocaleConfig(locale))
  } catch (error) {
    console.error('添加语言失败:', error)
    return errorResponse(res, '添加语言失败')
  }
})

/**
 * 更新语言配置（需要管理员权限）
 * PATCH /api/v2/i18n/locales/:code
 */
router.patch('/locales/:code', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code
    const { name, nativeName, flag, isEnabled, isDefault, rtl } = req.body
    
    const existing = queryOne('SELECT * FROM locales WHERE code = ?', [code])
    if (!existing) {
      return errorResponse(res, '语言不存在', 404)
    }
    
    const updates: string[] = []
    const params: any[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (nativeName !== undefined) {
      updates.push('nativeName = ?')
      params.push(nativeName)
    }
    if (flag !== undefined) {
      updates.push('flag = ?')
      params.push(flag)
    }
    if (isEnabled !== undefined) {
      updates.push('isEnabled = ?')
      params.push(isEnabled ? 1 : 0)
    }
    if (isDefault !== undefined && isDefault) {
      // 取消其他默认语言
      run('UPDATE locales SET isDefault = 0 WHERE isDefault = 1')
      updates.push('isDefault = 1')
    }
    if (rtl !== undefined) {
      updates.push('rtl = ?')
      params.push(rtl ? 1 : 0)
    }
    
    if (updates.length > 0) {
      params.push(code)
      run(`UPDATE locales SET ${updates.join(', ')} WHERE code = ?`, params)
    }
    
    const locale = queryOne('SELECT * FROM locales WHERE code = ?', [code])
    return successResponse(res, parseLocaleConfig(locale))
  } catch (error) {
    console.error('更新语言配置失败:', error)
    return errorResponse(res, '更新语言配置失败')
  }
})

/**
 * 删除语言（需要管理员权限）
 * DELETE /api/v2/i18n/locales/:code
 */
router.delete('/locales/:code', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code
    
    const existing = queryOne('SELECT * FROM locales WHERE code = ?', [code])
    if (!existing) {
      return errorResponse(res, '语言不存在', 404)
    }
    
    if (existing.isDefault) {
      return errorResponse(res, '默认语言不能删除', 400)
    }
    
    // 删除该语言的所有翻译
    run('DELETE FROM translations WHERE locale = ?', [code])
    
    // 删除语言配置
    run('DELETE FROM locales WHERE code = ?', [code])
    
    return successResponse(res, { deleted: true })
  } catch (error) {
    console.error('删除语言失败:', error)
    return errorResponse(res, '删除语言失败')
  }
})

/**
 * 导出翻译（需要管理员权限）
 * GET /api/v2/i18n/export
 */
router.get('/export', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { format = 'json', locale } = req.query
    
    let sql = 'SELECT * FROM translations'
    const params: any[] = []
    
    if (locale) {
      sql += ' WHERE locale = ?'
      params.push(locale)
    }
    
    sql += ' ORDER BY locale, namespace, key'
    
    const translations = queryAll(sql, params)
    
    if (format === 'json') {
      // 按语言分组
      const result: Record<string, Record<string, Record<string, string>>> = {}
      for (const t of translations) {
        if (!result[t.locale]) {
          result[t.locale] = {}
        }
        if (!result[t.locale][t.namespace]) {
          result[t.locale][t.namespace] = {}
        }
        result[t.locale][t.namespace][t.key] = t.value
      }
      
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename="translations.json"')
      return res.send(JSON.stringify(result, null, 2))
    } else {
      // CSV 格式
      let csv = 'locale,namespace,key,value,description\n'
      for (const t of translations) {
        csv += `${t.locale},${t.namespace},${t.key},"${t.value.replace(/"/g, '""')}",${t.description || ''}\n`
      }
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="translations.csv"')
      return res.send(csv)
    }
  } catch (error) {
    console.error('导出翻译失败:', error)
    return errorResponse(res, '导出翻译失败')
  }
})

/**
 * 导入翻译（需要管理员权限）
 * POST /api/v2/i18n/import
 */
router.post('/import', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { translations, overwrite = false } = req.body
    
    if (!translations || typeof translations !== 'object') {
      return errorResponse(res, '无效的翻译数据', 400)
    }
    
    const now = new Date().toISOString()
    let imported = 0
    let skipped = 0
    
    for (const [locale, namespaces] of Object.entries(translations)) {
      for (const [namespace, keys] of Object.entries(namespaces as Record<string, Record<string, string>>)) {
        for (const [key, value] of Object.entries(keys)) {
          const existing = queryOne(
            'SELECT * FROM translations WHERE key = ? AND namespace = ? AND locale = ?',
            [key, namespace, locale]
          )
          
          if (existing) {
            if (overwrite) {
              run(
                'UPDATE translations SET value = ?, updatedAt = ? WHERE id = ?',
                [value, now, existing.id]
              )
              imported++
            } else {
              skipped++
            }
          } else {
            const id = generateId()
            run(
              'INSERT INTO translations (id, key, namespace, locale, value, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [id, key, namespace, locale, value, 0, now, now]
            )
            imported++
          }
        }
      }
    }
    
    return successResponse(res, {
      imported,
      skipped,
      message: `成功导入 ${imported} 条翻译，跳过 ${skipped} 条`,
    })
  } catch (error) {
    console.error('导入翻译失败:', error)
    return errorResponse(res, '导入翻译失败')
  }
})

export default router
