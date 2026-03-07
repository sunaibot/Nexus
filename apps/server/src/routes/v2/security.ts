import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js'
import { queryOne, queryAll, run } from '../../utils/index.js'
import { getIPLocation, getIPLocationShort, getIPLocationFull } from '../../utils/ip-location.js'

const router = Router()

// CSRF 路径配置选项
interface CsrfPathOption {
  path: string
  description: string
  category: string
  reason: string
}

const CSRF_PATH_OPTIONS: CsrfPathOption[] = [
  // 健康检查
  {
    path: '/api/v2/health-check',
    description: '服务健康检查',
    category: '系统',
    reason: '健康检查需要公开访问，不需要 CSRF 保护'
  },
  // 认证相关
  {
    path: '/api/v2/auth/login',
    description: '用户登录',
    category: '认证',
    reason: '登录接口需要在未认证状态下访问'
  },
  {
    path: '/api/v2/auth/register',
    description: '用户注册',
    category: '认证',
    reason: '注册接口需要在未认证状态下访问'
  },
  {
    path: '/api/v2/users/login',
    description: '用户登录',
    category: '认证',
    reason: '登录接口需要在未认证状态下访问'
  },
  {
    path: '/api/v2/users/register',
    description: '用户注册',
    category: '认证',
    reason: '注册接口需要在未认证状态下访问'
  },
  {
    path: '/api/v2/admin/login',
    description: '管理员登录',
    category: '认证',
    reason: '登录接口需要在未认证状态下访问'
  },
  {
    path: '/api/v2/auth/admin/login',
    description: '管理员登录',
    category: '认证',
    reason: '登录接口需要在未认证状态下访问'
  },
  // API 路由
  {
    path: '/api/v2/users',
    description: '用户管理 API',
    category: '用户管理',
    reason: '用户管理 API 需要跳过 CSRF 以便前端正常调用'
  },
  {
    path: '/api/v2/plugins',
    description: '插件管理 API',
    category: '插件系统',
    reason: '插件 API 需要跳过 CSRF 以便前端正常调用'
  },
  {
    path: '/api/v2/system',
    description: '系统信息 API',
    category: '系统',
    reason: '系统 API 需要跳过 CSRF 以便前端正常调用'
  },
  {
    path: '/api/v2/security',
    description: '安全管理 API',
    category: '系统',
    reason: '安全配置 API 需要跳过 CSRF 以便前端正常调用'
  },
  {
    path: '/api/v2/bookmarks',
    description: '书签管理 API',
    category: '书签管理',
    reason: '书签 API 需要跳过 CSRF 以便前端正常调用'
  },
  {
    path: '/api/v2/categories',
    description: '分类管理 API',
    category: '书签管理',
    reason: '分类 API 需要跳过 CSRF 以便前端正常调用'
  }
]

// 默认忽略的 CSRF 路径
const DEFAULT_CSRF_IGNORE_PATHS = CSRF_PATH_OPTIONS.map(opt => opt.path)

// 获取安全配置
router.get('/config', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    // 从数据库读取自定义配置
    const csrfConfig = queryOne('SELECT * FROM system_config WHERE key = ?', ['csrf_ignore_paths']) as { value: string } | null
    const ipFilterConfig = queryOne('SELECT * FROM system_config WHERE key = ?', ['ip_filter_enabled']) as { value: string } | null
    const rateLimitConfig = queryOne('SELECT * FROM system_config WHERE key = ?', ['rate_limit_config']) as { value: string } | null

    const currentIgnorePaths = csrfConfig ? JSON.parse(csrfConfig.value) : DEFAULT_CSRF_IGNORE_PATHS

    // 将路径选项标记为是否已选中
    const pathOptions = CSRF_PATH_OPTIONS.map(opt => ({
      ...opt,
      selected: currentIgnorePaths.includes(opt.path)
    }))

    res.json({
      success: true,
      data: {
        csrf: {
          enabled: true,
          ignorePaths: currentIgnorePaths,
          defaultPaths: DEFAULT_CSRF_IGNORE_PATHS,
          pathOptions
        },
        ipFilter: {
          enabled: ipFilterConfig ? JSON.parse(ipFilterConfig.value) : false,
          whitelist: [],
          blacklist: []
        },
        rateLimit: {
          enabled: true,
          config: rateLimitConfig ? JSON.parse(rateLimitConfig.value) : {
            windowMs: 900000, // 15分钟
            maxRequests: 100
          }
        }
      }
    })
  } catch (error) {
    console.error('[Security] Get config error:', error)
    res.status(500).json({ success: false, error: '获取安全配置失败' })
  }
})

// 更新 CSRF 配置
router.put('/csrf', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { ignorePaths } = req.body

    if (!Array.isArray(ignorePaths)) {
      return res.status(400).json({ success: false, error: 'ignorePaths 必须是数组' })
    }

    // 保存到数据库
    const existing = queryOne('SELECT * FROM system_config WHERE key = ?', ['csrf_ignore_paths'])
    if (existing) {
      run('UPDATE system_config SET value = ?, updatedAt = ? WHERE key = ?', [
        JSON.stringify(ignorePaths),
        new Date().toISOString(),
        'csrf_ignore_paths'
      ])
    } else {
      run('INSERT INTO system_config (key, value, createdAt, updatedAt) VALUES (?, ?, ?, ?)', [
        'csrf_ignore_paths',
        JSON.stringify(ignorePaths),
        new Date().toISOString(),
        new Date().toISOString()
      ])
    }

    res.json({
      success: true,
      message: 'CSRF 配置已更新（重启服务后生效）',
      data: { ignorePaths }
    })
  } catch (error) {
    console.error('[Security] Update CSRF config error:', error)
    res.status(500).json({ success: false, error: '更新 CSRF 配置失败' })
  }
})

// 获取安全日志
router.get('/logs', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const type = req.query.type as string
    const offset = (page - 1) * limit

    let sql = 'SELECT * FROM audit_logs WHERE 1=1'
    const params: any[] = []

    if (type) {
      sql += ' AND action LIKE ?'
      params.push(`%${type}%`)
    }

    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const logs = queryAll(sql, params)
    const totalResult = queryOne('SELECT COUNT(*) as count FROM audit_logs', []) as { count: number } | null
    const total = totalResult?.count || 0

    // 处理日志数据，添加 IP 地理位置信息
    const processedLogs = logs.map((log: any) => {
      const details = log.details ? JSON.parse(log.details) : null
      const ipLocation = getIPLocation(log.ip)
      
      // 解析 userAgent 获取浏览器和操作系统信息
      const ua = log.userAgent || ''
      const browser = parseBrowser(ua)
      const os = parseOS(ua)
      const device = parseDevice(ua)

      return {
        id: log.id,
        action: log.action,
        actionType: getActionType(log.action),
        actionLabel: getActionLabel(log.action),
        severity: getActionSeverity(log.action),
        details,
        ip: log.ip,
        ipLocation: {
          country: ipLocation.country,
          region: ipLocation.region,
          city: ipLocation.city,
          isp: ipLocation.isp,
          display: getIPLocationShort(log.ip),
          fullDisplay: getIPLocationFull(log.ip)
        },
        userAgent: {
          raw: ua,
          browser,
          os,
          device
        },
        createdAt: log.createdAt,
        timeAgo: getTimeAgo(log.createdAt)
      }
    })

    res.json({
      success: true,
      data: {
        logs: processedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('[Security] Get logs error:', error)
    res.status(500).json({ success: false, error: '获取安全日志失败' })
  }
})

// 获取安全统计
router.get('/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 今日请求统计
    const todayResult = queryOne(
      'SELECT COUNT(*) as count FROM audit_logs WHERE createdAt LIKE ?',
      [`${today}%`]
    ) as { count: number } | null
    const todayRequests = todayResult?.count || 0

    // 登录失败统计
    const failedResult = queryOne(
      "SELECT COUNT(*) as count FROM audit_logs WHERE action = 'login_failed' AND createdAt > datetime('now', '-24 hours')",
      []
    ) as { count: number } | null
    const failedLogins = failedResult?.count || 0

    // 拦截的 CSRF 请求
    const csrfResult = queryOne(
      "SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%csrf%' AND createdAt > datetime('now', '-24 hours')",
      []
    ) as { count: number } | null
    const csrfBlocked = csrfResult?.count || 0

    // 最近的异常活动
    const recentAlerts = queryAll(
      "SELECT * FROM audit_logs WHERE action IN ('login_failed', 'unauthorized_access', 'csrf_violation') ORDER BY createdAt DESC LIMIT 5",
      []
    )

    res.json({
      success: true,
      data: {
        todayRequests,
        failedLogins,
        csrfBlocked,
        recentAlerts: recentAlerts.map((alert: any) => ({
          id: alert.id,
          action: alert.action,
          ip: alert.ip,
          createdAt: alert.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('[Security] Get stats error:', error)
    res.status(500).json({ success: false, error: '获取安全统计失败' })
  }
})

// 解析浏览器信息
function parseBrowser(ua: string): { name: string; version: string } {
  if (!ua) return { name: '未知', version: '' }
  
  // Chrome
  const chromeMatch = ua.match(/Chrome\/(\d+\.\d+)/)
  if (chromeMatch && !ua.includes('Edg')) {
    return { name: 'Chrome', version: chromeMatch[1] }
  }
  
  // Edge
  const edgeMatch = ua.match(/Edg\/(\d+\.\d+)/)
  if (edgeMatch) {
    return { name: 'Edge', version: edgeMatch[1] }
  }
  
  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+\.\d+)/)
  if (firefoxMatch) {
    return { name: 'Firefox', version: firefoxMatch[1] }
  }
  
  // Safari
  const safariMatch = ua.match(/Safari\/(\d+\.\d+)/)
  if (safariMatch && !ua.includes('Chrome')) {
    const versionMatch = ua.match(/Version\/(\d+\.\d+)/)
    return { name: 'Safari', version: versionMatch ? versionMatch[1] : '' }
  }
  
  // Opera
  const operaMatch = ua.match(/OPR\/(\d+\.\d+)/)
  if (operaMatch) {
    return { name: 'Opera', version: operaMatch[1] }
  }
  
  return { name: '未知浏览器', version: '' }
}

// 解析操作系统信息
function parseOS(ua: string): { name: string; version: string } {
  if (!ua) return { name: '未知', version: '' }
  
  // Windows
  if (ua.includes('Windows NT 10.0')) return { name: 'Windows', version: '10/11' }
  if (ua.includes('Windows NT 6.3')) return { name: 'Windows', version: '8.1' }
  if (ua.includes('Windows NT 6.2')) return { name: 'Windows', version: '8' }
  if (ua.includes('Windows NT 6.1')) return { name: 'Windows', version: '7' }
  
  // macOS
  const macMatch = ua.match(/Mac OS X (\d+[._]\d+)/)
  if (macMatch) {
    return { name: 'macOS', version: macMatch[1].replace('_', '.') }
  }
  
  // iOS
  const iosMatch = ua.match(/iPhone OS (\d+[._]\d+)/)
  if (iosMatch) {
    return { name: 'iOS', version: iosMatch[1].replace('_', '.') }
  }
  
  // Android
  const androidMatch = ua.match(/Android (\d+\.\d+)/)
  if (androidMatch) {
    return { name: 'Android', version: androidMatch[1] }
  }
  
  // Linux
  if (ua.includes('Linux')) return { name: 'Linux', version: '' }
  
  return { name: '未知系统', version: '' }
}

// 解析设备类型
function parseDevice(ua: string): string {
  if (!ua) return '未知设备'
  
  if (ua.includes('iPhone')) return 'iPhone'
  if (ua.includes('iPad')) return 'iPad'
  if (ua.includes('Android')) {
    if (ua.includes('Mobile')) return 'Android 手机'
    return 'Android 平板'
  }
  if (ua.includes('Windows Phone')) return 'Windows Phone'
  
  return '桌面设备'
}

// 获取操作类型
function getActionType(action: string): string {
  const typeMap: Record<string, string> = {
    'LOGIN_SUCCESS': 'login',
    'LOGIN_FAILED': 'login',
    'LOGOUT': 'login',
    'REGISTER': 'auth',
    'PASSWORD_CHANGE': 'auth',
    'CHANGE_PASSWORD_SUCCESS': 'auth',
    'CHANGE_PASSWORD_FAILED': 'auth',
    'CHANGE_PASSWORD_ERROR': 'auth',
    'UPDATE_PASSWORD_HINT': 'auth',
    'CREATE_BOOKMARK': 'bookmark',
    'UPDATE_BOOKMARK': 'bookmark',
    'DELETE_BOOKMARK': 'bookmark',
    'BOOKMARK_CREATE': 'bookmark',
    'BOOKMARK_UPDATE': 'bookmark',
    'BOOKMARK_DELETE': 'bookmark',
    'CHANGE_VISIBILITY': 'bookmark',
    'CREATE_CATEGORY': 'category',
    'UPDATE_CATEGORY': 'category',
    'DELETE_CATEGORY': 'category',
    'CATEGORY_CREATE': 'category',
    'CATEGORY_UPDATE': 'category',
    'CATEGORY_DELETE': 'category',
    'CREATE_USER': 'user',
    'UPDATE_USER': 'user',
    'DELETE_USER': 'user',
    'USER_CREATE': 'user',
    'USER_UPDATE': 'user',
    'USER_DELETE': 'user',
    'UPDATE_SETTINGS': 'system',
    'UPDATE_SITE_SETTINGS': 'system',
    'SETTINGS_UPDATE': 'system',
    'UPDATE_THEME': 'theme',
    'UPDATE_THEME_ID': 'theme',
    'UPDATE_THEME_MODE': 'theme',
    'UPDATE_THEME_COLORS': 'theme',
    'UPDATE_WALLPAPER': 'theme',
    'UPDATE_PLUGIN': 'plugin',
    'FILE_DELETE': 'file',
    'NOTIFICATION_CREATE': 'notification',
    'CSRF_VIOLATION': 'security',
    'UNAUTHORIZED_ACCESS': 'security',
    'RATE_LIMIT_EXCEEDED': 'security',
    // 小部件操作
    'CREATE_WIDGET': 'widget',
    'UPDATE_WIDGET': 'widget',
    'DELETE_WIDGET': 'widget',
    // 笔记操作
    'CREATE_NOTE': 'note',
    'UPDATE_NOTE': 'note',
    'DELETE_NOTE': 'note',
    // 系统错误动作
    'API_ERROR': 'system',
    'DATABASE_ERROR': 'system',
    'INTERNAL_ERROR': 'system',
    'EXTERNAL_SERVICE_ERROR': 'system',
    // 用户登录相关
    'USER_LOGIN_SUCCESS': 'login',
    'USER_LOGIN_FAILED': 'login',
    'USER_LOGOUT': 'login',
    'ADMIN_LOGIN_SUCCESS': 'login',
    'LOGIN_ERROR': 'login',
    'USER_REGISTER': 'login',
    // 数据导入导出
    'IMPORT_DATA': 'data',
    'EXPORT_DATA': 'data',
    'FACTORY_RESET': 'system',
    // 书签操作
    'REORDER_BOOKMARKS': 'bookmark',
    'SET_PRIVATE_PASSWORD': 'bookmark',
    'REMOVE_PRIVATE_PASSWORD': 'bookmark',
    'SET_PRIVATE': 'bookmark',
    'REMOVE_PRIVATE': 'bookmark',
    // 分类操作
    'REORDER_CATEGORIES': 'category',
    // 主题操作
    'SET_ROLE_DEFAULT_THEME': 'theme'
  }
  return typeMap[action] || 'other'
}

// 获取操作标签
function getActionLabel(action: string): string {
  const labelMap: Record<string, string> = {
    'LOGIN_SUCCESS': '登录成功',
    'LOGIN_FAILED': '登录失败',
    'LOGOUT': '退出登录',
    'REGISTER': '用户注册',
    'PASSWORD_CHANGE': '修改密码',
    'CREATE_BOOKMARK': '创建书签',
    'UPDATE_BOOKMARK': '更新书签',
    'DELETE_BOOKMARK': '删除书签',
    'CREATE_CATEGORY': '创建分类',
    'UPDATE_CATEGORY': '更新分类',
    'DELETE_CATEGORY': '删除分类',
    'CREATE_USER': '创建用户',
    'UPDATE_USER': '更新用户',
    'DELETE_USER': '删除用户',
    'UPDATE_SETTINGS': '更新设置',
    'UPDATE_SITE_SETTINGS': '更新站点设置',
    'UPDATE_PLUGIN': '更新插件',
    'CHANGE_VISIBILITY': '修改可见性',
    'CHANGE_PASSWORD_SUCCESS': '修改密码成功',
    'CHANGE_PASSWORD_FAILED': '修改密码失败',
    'CHANGE_PASSWORD_ERROR': '修改密码错误',
    'UPDATE_PASSWORD_HINT': '更新密码提示',
    'UPDATE_THEME': '更新主题',
    'UPDATE_THEME_ID': '更新主题ID',
    'UPDATE_THEME_MODE': '更新主题模式',
    'UPDATE_THEME_COLORS': '更新主题颜色',
    'UPDATE_WALLPAPER': '更新壁纸',
    'UPDATE_SITE_TITLE': '更新站点标题',
    'UPDATE_FAVICON': '更新站点图标',
    'UPDATE_ANIMATION': '更新动画设置',
    'UPDATE_LITE_MODE': '更新精简模式',
    'UPDATE_WEATHER': '更新天气显示',
    'UPDATE_LUNAR': '更新农历显示',
    'UPDATE_FOOTER_TEXT': '更新备案信息',
    'UPDATE_MENU_VISIBILITY': '更新菜单可见性',
    'UPDATE_WIDGET_VISIBILITY': '更新组件可见性',
    'UPDATE_WIDGET_STYLES': '更新组件样式',
    'UPDATE_WIDGET_POSITION': '更新组件位置',
    'UPDATE_FRONTEND': '更新前端配置',
    'UPDATE_QUOTES': '更新名言配置',
    'UPDATE_PRIVATE_MODE': '更新私密模式',
    'UPDATE_DEMO_MODE': '更新演示模式',
    'UPDATE_DEMO_MODE_HOST': '更新演示模式主机',
    'UPDATE_RESPONSIVE': '更新响应式布局',
    'UPDATE_I18N': '更新国际化配置',
    'CREATE_THEME': '创建主题',
    'DELETE_THEME': '删除主题',
    'BOOKMARK_CREATE': '创建书签',
    'BOOKMARK_UPDATE': '更新书签',
    'BOOKMARK_DELETE': '删除书签',
    'CATEGORY_CREATE': '创建分类',
    'CATEGORY_UPDATE': '更新分类',
    'CATEGORY_DELETE': '删除分类',
    'USER_CREATE': '创建用户',
    'USER_UPDATE': '更新用户',
    'USER_DELETE': '删除用户',
    'SETTINGS_UPDATE': '更新设置',
    'FILE_DELETE': '删除文件',
    'NOTIFICATION_CREATE': '创建通知',
    'CSRF_VIOLATION': 'CSRF 违规',
    'UNAUTHORIZED_ACCESS': '未授权访问',
    'RATE_LIMIT_EXCEEDED': '请求频率超限',
    // 系统错误动作
    'API_ERROR': 'API 错误',
    'DATABASE_ERROR': '数据库错误',
    'INTERNAL_ERROR': '内部错误',
    'EXTERNAL_SERVICE_ERROR': '外部服务错误',
    // 用户登录相关
    'USER_LOGIN_SUCCESS': '用户登录成功',
    'USER_LOGIN_FAILED': '用户登录失败',
    'USER_LOGOUT': '用户退出',
    'ADMIN_LOGIN_SUCCESS': '管理员登录成功',
    'LOGIN_ERROR': '登录错误',
    'USER_REGISTER': '用户注册',
    // 数据导入导出
    'IMPORT_DATA': '导入数据',
    'EXPORT_DATA': '导出数据',
    'FACTORY_RESET': '恢复出厂设置',
    // 书签操作
    'REORDER_BOOKMARKS': '重新排序书签',
    'SET_PRIVATE_PASSWORD': '设置私密密码',
    'REMOVE_PRIVATE_PASSWORD': '移除私密密码',
    'SET_PRIVATE': '设为私密',
    'REMOVE_PRIVATE': '取消私密',
    // 分类操作
    'REORDER_CATEGORIES': '重新排序分类',
    // 主题操作
    'SET_ROLE_DEFAULT_THEME': '设置角色默认主题',
    // 小部件操作
    'CREATE_WIDGET': '创建小部件',
    'UPDATE_WIDGET': '更新小部件',
    'DELETE_WIDGET': '删除小部件',
    // 笔记操作
    'CREATE_NOTE': '创建笔记',
    'UPDATE_NOTE': '更新笔记',
    'DELETE_NOTE': '删除笔记',
    'DELETE_NOTE_ADMIN': '管理员删除笔记',
    'DELETE_NOTE_FOLDER_ADMIN': '管理员删除笔记文件夹',
    // Tab 操作
    'CREATE_TAB': '创建标签页',
    'UPDATE_TAB': '更新标签页',
    'DELETE_TAB': '删除标签页',
    // 文件快传
    'FILE_TRANSFER_UPLOAD': '文件上传',
    'FILE_TRANSFER_DOWNLOAD': '文件下载',
    // 系统配置
    'UPDATE_SECURITY_CONFIG': '更新安全配置',
    'UPDATE_FILE_TRANSFER_CONFIG': '更新文件传输配置',
    'UPDATE_UPLOAD_CONFIG': '更新上传配置',
    'UPDATE_NOTIFICATION_CONFIG': '更新通知配置',
    'UPDATE_HEALTH_CHECK_CONFIG': '更新健康检查配置',
    'UPDATE_RATE_LIMIT_CONFIG': '更新限流配置',
    'UPDATE_SYSTEM_CONFIGS_BATCH': '批量更新系统配置',
    // 基本登录
    'LOGIN': '登录'
  }
  return labelMap[action] || action
}

// 获取操作严重级别
function getActionSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'LOGIN_SUCCESS': 'low',
    'LOGIN_FAILED': 'medium',
    'LOGOUT': 'low',
    'REGISTER': 'low',
    'PASSWORD_CHANGE': 'medium',
    'CHANGE_PASSWORD_SUCCESS': 'low',
    'CHANGE_PASSWORD_FAILED': 'high',
    'CHANGE_PASSWORD_ERROR': 'medium',
    'UPDATE_PASSWORD_HINT': 'low',
    'CREATE_BOOKMARK': 'low',
    'UPDATE_BOOKMARK': 'low',
    'DELETE_BOOKMARK': 'low',
    'BOOKMARK_CREATE': 'low',
    'BOOKMARK_UPDATE': 'low',
    'BOOKMARK_DELETE': 'low',
    'CHANGE_VISIBILITY': 'low',
    'CREATE_CATEGORY': 'low',
    'UPDATE_CATEGORY': 'low',
    'DELETE_CATEGORY': 'low',
    'CATEGORY_CREATE': 'low',
    'CATEGORY_UPDATE': 'low',
    'CATEGORY_DELETE': 'low',
    'CREATE_USER': 'medium',
    'UPDATE_USER': 'medium',
    'DELETE_USER': 'high',
    'USER_CREATE': 'medium',
    'USER_UPDATE': 'medium',
    'USER_DELETE': 'high',
    'UPDATE_SETTINGS': 'medium',
    'UPDATE_SITE_SETTINGS': 'medium',
    'SETTINGS_UPDATE': 'medium',
    'UPDATE_THEME': 'low',
    'UPDATE_THEME_ID': 'low',
    'UPDATE_THEME_MODE': 'low',
    'UPDATE_WALLPAPER': 'low',
    'CREATE_THEME': 'low',
    'DELETE_THEME': 'medium',
    'UPDATE_PLUGIN': 'medium',
    'FILE_DELETE': 'medium',
    'NOTIFICATION_CREATE': 'low',
    'CSRF_VIOLATION': 'high',
    'UNAUTHORIZED_ACCESS': 'critical',
    'RATE_LIMIT_EXCEEDED': 'medium',
    // 系统错误动作 - 全部为高风险
    'API_ERROR': 'high',
    'DATABASE_ERROR': 'critical',
    'INTERNAL_ERROR': 'high',
    'EXTERNAL_SERVICE_ERROR': 'medium',
    // 用户登录相关
    'USER_LOGIN_SUCCESS': 'low',
    'USER_LOGIN_FAILED': 'medium',
    'USER_LOGOUT': 'low',
    'ADMIN_LOGIN_SUCCESS': 'low',
    'LOGIN_ERROR': 'medium',
    'USER_REGISTER': 'low',
    // 数据导入导出
    'IMPORT_DATA': 'medium',
    'EXPORT_DATA': 'medium',
    'FACTORY_RESET': 'critical',
    // 书签操作
    'REORDER_BOOKMARKS': 'low',
    'SET_PRIVATE_PASSWORD': 'medium',
    'REMOVE_PRIVATE_PASSWORD': 'low',
    'SET_PRIVATE': 'low',
    'REMOVE_PRIVATE': 'low',
    // 分类操作
    'REORDER_CATEGORIES': 'low',
    // 主题操作
    'SET_ROLE_DEFAULT_THEME': 'medium',
    // 小部件操作
    'CREATE_WIDGET': 'low',
    'UPDATE_WIDGET': 'low',
    'DELETE_WIDGET': 'low',
    // 笔记操作
    'CREATE_NOTE': 'low',
    'UPDATE_NOTE': 'low',
    'DELETE_NOTE': 'low'
  }
  return severityMap[action] || 'low'
}

// 获取相对时间
function getTimeAgo(dateString: string): string {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知时间'
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 30) return `${days} 天前`
  
  return date.toLocaleDateString()
}

export default router
