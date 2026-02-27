/**
 * 设置路由 - V2版本
 * 提供系统设置和用户配置管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware, publicApiLimiter } from '../../middleware/index.js'
import { validateBody, updateSettingsSchema } from '../../schemas.js'
import { logAudit, getUserSettings, setUserSettings } from '../../db/index.js'
import { queryOne, run } from '../../utils/index.js'

const router = Router()

// 默认站点设置
const defaultSiteSettings = {
  siteTitle: "Nexus",
  siteFavicon: "",
  enableBeamAnimation: true,
  enableLiteMode: false,
  enableWeather: true,
  enableLunar: true,
  themeId: 'nebula',
  themeMode: 'auto',
  widgetVisibility: {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  },
  menuVisibility: {
    languageToggle: true,
    themeToggle: true,
  },
  wallpaper: {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  },
  frontend: {
    buttons: {
      showHome: true,
      showSearch: true,
      showAddBookmark: true,
      showFileTransfer: true,
      showCalculator: true,
      showThemeToggle: true,
      showPrivateMode: true,
      showUserMenu: true,
    },
  },
  // 响应式布局配置
  responsive: {
    layoutMode: 'grid' as 'grid' | 'list' | 'masonry',  // 布局模式
    gridColumns: {
      mobile: 1,    // 手机端列数
      tablet: 2,    // 平板端列数
      desktop: 4,   // 桌面端列数
      large: 6,     // 大屏列数
    },
    cardSize: 'medium' as 'small' | 'medium' | 'large',  // 卡片尺寸
    sidebar: {
      enabled: false,      // 是否启用侧边栏
      position: 'left' as 'left' | 'right',  // 侧边栏位置
      width: 280,          // 侧边栏宽度
      collapsed: false,    // 是否默认折叠
    },
    container: {
      maxWidth: '1440px',  // 最大宽度
      padding: '24px',     // 内边距
    },
  },
  // 国际化配置
  i18n: {
    defaultLocale: 'zh',           // 默认语言
    fallbackLocale: 'en',          // 回退语言
    supportedLocales: ['zh', 'en'], // 支持的语言列表
    timezone: 'Asia/Shanghai',     // 默认时区
    dateFormat: 'YYYY-MM-DD',      // 日期格式
    timeFormat: '24h',             // 时间格式 (12h/24h)
  },
  // 主题颜色配置
  themeColors: {
    // 图标颜色
    iconPrimary: '',      // 主图标颜色（空字符串表示使用主题默认值）
    iconSecondary: '',    // 次图标颜色
    iconMuted: '',        // 淡化图标颜色
    // 按钮颜色
    buttonPrimaryBg: '',      // 主按钮背景
    buttonPrimaryText: '',    // 主按钮文字
    buttonSecondaryBg: '',    // 次按钮背景
    buttonSecondaryText: '',  // 次按钮文字
  },
  // 网络环境检测配置
  networkEnv: {
    internalSuffixes: ['.local', '.lan', '.internal', '.corp', '.home'], // 内网域名后缀
    internalIPs: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'], // 内网IP段
    localhostNames: ['localhost', '127.0.0.1', '[::1]'], // localhost别名
  },
}

// 设置项到操作类型的映射
const SETTINGS_ACTION_MAP: Record<string, { action: string; name: string }> = {
  theme: { action: 'UPDATE_THEME', name: '更新主题设置' },
  themeId: { action: 'UPDATE_THEME_ID', name: '更新主题ID' },
  themeMode: { action: 'UPDATE_THEME_MODE', name: '更新主题模式' },
  wallpaper: { action: 'UPDATE_WALLPAPER', name: '更新壁纸设置' },
  siteTitle: { action: 'UPDATE_SITE_TITLE', name: '更新站点标题' },
  siteFavicon: { action: 'UPDATE_FAVICON', name: '更新站点图标' },
  enableBeamAnimation: { action: 'UPDATE_ANIMATION', name: '更新动画设置' },
  enableLiteMode: { action: 'UPDATE_LITE_MODE', name: '更新精简模式' },
  enableWeather: { action: 'UPDATE_WEATHER', name: '更新天气显示' },
  enableLunar: { action: 'UPDATE_LUNAR', name: '更新农历显示' },
  footerText: { action: 'UPDATE_FOOTER_TEXT', name: '更新备案信息' },
  menuVisibility: { action: 'UPDATE_MENU_VISIBILITY', name: '更新菜单可见性' },
  widgetVisibility: { action: 'UPDATE_WIDGET_VISIBILITY', name: '更新组件可见性' },
  widgetStyles: { action: 'UPDATE_WIDGET_STYLES', name: '更新组件样式' },
  widgetPosition: { action: 'UPDATE_WIDGET_POSITION', name: '更新组件位置' },
  frontend: { action: 'UPDATE_FRONTEND', name: '更新前端配置' },
  quotes: { action: 'UPDATE_QUOTES', name: '更新名言配置' },
  passwordHint: { action: 'UPDATE_PASSWORD_HINT', name: '更新密码提示' },
  privateModePassword: { action: 'UPDATE_PRIVATE_MODE', name: '更新私密模式' },
  demoMode: { action: 'UPDATE_DEMO_MODE', name: '更新演示模式' },
  demoModeHost: { action: 'UPDATE_DEMO_MODE_HOST', name: '更新演示模式主机' },
  responsive: { action: 'UPDATE_RESPONSIVE', name: '更新响应式布局' },
  i18n: { action: 'UPDATE_I18N', name: '更新国际化配置' },
  themeColors: { action: 'UPDATE_THEME_COLORS', name: '更新主题颜色' },
}

// 获取默认设置（公开接口，无需认证）
router.get('/default', publicApiLimiter, (req, res) => {
  try {
    res.json(defaultSiteSettings)
  } catch (error) {
    console.error('获取默认设置失败:', error)
    res.status(500).json({ error: '获取默认设置失败' })
  }
})

// 获取站点设置（公开接口，兼容前端调用）
router.get('/site', publicApiLimiter, (req, res) => {
  try {
    // 从数据库读取站点设置
    const siteSettings = queryOne('SELECT * FROM settings WHERE key = ?', ['site_settings'])
    console.log('[Settings API] Raw site_settings from DB:', siteSettings?.value)
    const settings = siteSettings?.value ? JSON.parse(siteSettings.value) : {}
    console.log('[Settings API] Parsed settings:', settings)
    console.log('[Settings API] Wallpaper:', settings.wallpaper)

    // 辅助函数：解析可能为字符串的 JSON 字段
    const parseJsonField = (field: any, defaultValue: any) => {
      if (!field) return defaultValue
      if (typeof field === 'string') {
        try {
          return JSON.parse(field)
        } catch (e) {
          return defaultValue
        }
      }
      return field
    }

    res.json({
      success: true,
      data: {
        siteName: settings.siteName || defaultSiteSettings.siteTitle,
        siteTitle: settings.siteTitle || defaultSiteSettings.siteTitle,
        siteFavicon: settings.siteFavicon || defaultSiteSettings.siteFavicon,
        theme: settings.theme || 'auto',
        themeId: settings.themeId || defaultSiteSettings.themeId,
        themeMode: settings.themeMode || defaultSiteSettings.themeMode,
        enableBeamAnimation: settings.enableBeamAnimation ?? defaultSiteSettings.enableBeamAnimation,
        enableLiteMode: settings.enableLiteMode ?? defaultSiteSettings.enableLiteMode,
        enableWeather: settings.enableWeather ?? defaultSiteSettings.enableWeather,
        enableLunar: settings.enableLunar ?? defaultSiteSettings.enableLunar,
        wallpaper: parseJsonField(settings.wallpaper, defaultSiteSettings.wallpaper),
        frontend: parseJsonField(settings.frontend, defaultSiteSettings.frontend),
        themeColors: parseJsonField(settings.themeColors, defaultSiteSettings.themeColors),
        widgetVisibility: parseJsonField(settings.widgetVisibility, defaultSiteSettings.widgetVisibility),
        menuVisibility: parseJsonField(settings.menuVisibility, defaultSiteSettings.menuVisibility),
      }
    })
  } catch (error) {
    console.error('获取站点设置失败:', error)
    res.status(500).json({ success: false, error: '获取站点设置失败' })
  }
})

// 更新站点设置（需要管理员权限）
router.put('/site', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const updates = req.body
    console.log('[Settings API] Update request body:', updates)
    
    const user = (req as any).user
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
    const userAgent = (req.headers['user-agent'] || '') as string
    
    // 读取现有设置
    const existing = queryOne('SELECT * FROM settings WHERE key = ?', ['site_settings'])
    const currentSettings = existing?.value ? JSON.parse(existing.value) : {}
    console.log('[Settings API] Current settings:', currentSettings)
    
    // 解析可能为字符串的 JSON 字段
    const parseJsonField = (field: any): any => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field)
        } catch (e) {
          return field
        }
      }
      return field
    }
    
    // 处理 updates 中的 JSON 字符串字段
    const processedUpdates: any = { ...updates }
    const jsonFields = ['widgetVisibility', 'menuVisibility', 'wallpaper', 'frontend', 'themeColors', 'responsive', 'i18n']
    jsonFields.forEach(field => {
      if (field in processedUpdates) {
        processedUpdates[field] = parseJsonField(processedUpdates[field])
      }
    })
    
    // 合并新设置
    const newSettings = { ...currentSettings, ...processedUpdates }
    console.log('[Settings API] Merged settings:', newSettings)
    
    if (existing) {
      run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [
        JSON.stringify(newSettings),
        new Date().toISOString(),
        'site_settings'
      ])
    } else {
      run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [
        'site_settings',
        JSON.stringify(newSettings),
        new Date().toISOString()
      ])
    }
    
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'UPDATE_SITE_SETTINGS',
      resourceType: 'system',
      resourceId: 'site',
      details: { updatedKeys: Object.keys(updates) },
      ip,
      userAgent
    })
    
    res.json({
      success: true,
      data: newSettings
    })
  } catch (error) {
    console.error('更新站点设置失败:', error)
    res.status(500).json({ success: false, error: '更新站点设置失败' })
  }
})

// 获取用户设置
router.get('/', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const settings = getUserSettings(user.id)
    res.json(settings)
  } catch (error) {
    console.error('获取设置失败:', error)
    res.status(500).json({ error: '获取设置失败' })
  }
})

// 获取演示模式状态（公开接口，无需认证）
router.get('/demo-mode', (req, res) => {
  try {
    res.json({
      isDemoMode: false,
      enabled: false,
      host: '',
      requestHost: req.headers.host || req.hostname
    })
  } catch (error) {
    console.error('获取演示模式状态失败:', error)
    res.status(500).json({ error: '获取演示模式状态失败' })
  }
})

// 更新用户设置（需要认证）
router.patch('/', authMiddleware, validateBody(updateSettingsSchema), (req: Request, res: Response) => {
  try {
    const updates = req.body
    const user = (req as any).user
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
    const userAgent = (req.headers['user-agent'] || '') as string
    
    const updatedKeys = Object.keys(updates)
    
    setUserSettings(updates as Record<string, string>, user.id)
    
    for (const key of updatedKeys) {
      const actionConfig = SETTINGS_ACTION_MAP[key]
      if (actionConfig) {
        let details: any = updates[key]
        try {
          if (typeof details === 'string' && (details.startsWith('{') || details.startsWith('['))) {
            details = JSON.parse(details)
          }
        } catch {
        }
        
        if (key === 'privateModePassword') {
          details = { updated: true }
        }
        
        logAudit({
          userId: user.id,
          username: user.username,
          action: actionConfig.action,
          resourceType: 'system',
          resourceId: key,
          details: {
            name: actionConfig.name,
            key,
            value: details,
          },
          ip,
          userAgent
        })
      }
    }
    
    const unrecognizedKeys = updatedKeys.filter(key => !SETTINGS_ACTION_MAP[key])
    if (unrecognizedKeys.length > 0) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_SETTINGS',
        resourceType: 'system',
        resourceId: 'settings',
        details: {
          name: '更新系统设置',
          keys: unrecognizedKeys,
        },
        ip,
        userAgent
      })
    }
    
    const settings = getUserSettings(user.id)
    res.json(settings)
  } catch (error) {
    console.error('更新设置失败:', error)
    res.status(500).json({ error: '更新设置失败' })
  }
})

export default router
