import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import { initDatabase, cleanupExpiredFileTransfers } from './db/index.js'
import { generalLimiter, errorHandler, notFoundHandler, requestLogger, sqlInjectionDetector, contentTypeValidator, doubleSubmitCsrf, refererCheck, autoAuditMiddleware, errorLogMiddleware } from './middleware/index.js'
import cookieParser from 'cookie-parser'

// ========== 导入 V2 API 路由（统一版本） ==========
import v2Router from './routes/v2/index.js'

import { ipFilterMiddleware } from './middleware/ipFilter.js'
import { validateEnv, getEnv } from './utils/envValidator.js'
import { getJwtSecret, getSessionSecret, checkPasswordConfig } from './utils/keyGenerator.js'
import fs from 'fs'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

// ========== 检查 .env 文件是否存在 ==========
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envFilePath = path.resolve(__dirname, '..', '.env')
const envFileExists = fs.existsSync(envFilePath)

if (!envFileExists) {
  console.log(`
⚠️  未检测到 .env 文件，将使用默认配置启动
   默认端口：8787（后端）、5173（前端）、5174（管理后台）
   
   💡 提示：如需自定义配置，可创建 .env 文件：
      cp .env.example .env
      
   🔐 安全提示：生产环境建议设置 YOUR_PASSWORD 以增强安全性
`)
}

// ========== 检查密码配置 ==========
checkPasswordConfig()

const app = express()

// ========== 验证环境变量 ==========
const env = validateEnv()

// ========== 环境配置 ==========
const NODE_ENV = env.NODE_ENV
const isDev = NODE_ENV === 'development'
const PORT = env.PORT

// 启动日志
console.log(`
========================================
  Nexus Server
  Environment: ${NODE_ENV}
  Port: ${PORT}
  Debug Mode: ${isDev ? 'ON' : 'OFF'}
  Config Source: ${envFileExists ? '.env file' : 'default values'}
========================================
  Security Config:
  - Filter Sensitive Info: ${env.FILTER_SENSITIVE_INFO ? 'ON' : 'OFF'}
  - System Audit Log: ${env.ENABLE_SYSTEM_AUDIT ? 'ON' : 'OFF'}
  - Docker Info Access: ${env.ALLOW_DOCKER_INFO ? 'ON' : 'OFF'}
  - Rate Limiting: ${env.ENABLE_RATE_LIMIT ? 'ON' : 'OFF'}
  - IP Filter: ${env.ENABLE_IP_FILTER ? 'ON' : 'OFF'}
========================================
`)

// ========== 中间件配置 ==========

// 信任代理（用于获取真实客户端 IP）
app.set('trust proxy', 1)

// Helmet 安全响应头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: { action: 'sameorigin' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // 允许加载外部资源
}));

// CORS 配置
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 允许未定义的 origin（如 curl、Postman 等直接请求）
    if (!origin) return callback(null, true)
    
    // 生产环境：如果设置了 ALLOWED_ORIGINS 则严格限制，否则允许所有内网 IP
    if (process.env.NODE_ENV === 'production') {
      // 允许 localhost 和 127.0.0.1
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true)
      }
      
      // 允许所有内网 IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      if (origin.match(/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)/)) {
        return callback(null, true)
      }
      
      // 如果设置了 ALLOWED_ORIGINS，则额外允许配置的域名
      if (process.env.ALLOWED_ORIGINS) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
      }
      
      console.error(`[Security] CORS blocked origin: ${origin}`)
      return callback(new Error('Not allowed by CORS'))
    }
    
    // 开发环境允许 localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true)
    }
    
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['X-CSRF-Token']
}))

// Cookie解析
app.use(cookieParser())

// JSON 解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 请求日志中间件
app.use(requestLogger)

// SQL注入检测
app.use(sqlInjectionDetector)

// Session 配置
const isDevEnv = process.env.NODE_ENV === 'development'

// 生产环境建议设置 SESSION_SECRET，但不再强制退出（支持零配置启动）
if (!isDevEnv && !process.env.SESSION_SECRET) {
  console.warn('⚠️  警告：生产环境未设置 SESSION_SECRET，将使用默认密钥')
  console.warn('   为了安全，建议设置 SESSION_SECRET 或使用 YOUR_PASSWORD')
}

// 使用 keyGenerator 生成或获取 session secret
const sessionSecret = getSessionSecret()

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'nowen.sid',
  proxy: true,
  cookie: {
    secure: false, // 允许 HTTP 访问（内网部署通常没有 HTTPS）
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    sameSite: 'lax' // 使用 lax 模式，兼容更多场景
  }
}))

// 内容类型验证（API路由）
app.use('/api', contentTypeValidator(['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']))

// CSRF防护（双提交Cookie模式）
// 开发环境：智能模式 - 自动检测并允许来自同一源的请求
// 生产环境：严格模式 - 必须提供有效的 CSRF Token
const isDevelopment = process.env.NODE_ENV === 'development'

app.use(doubleSubmitCsrf({
  secure: !isDevelopment,
  ignorePaths: [
    // 健康检查
    '/api/health-check',
    // 认证相关（登录注册不需要 CSRF）- V2版本
    '/api/v2/auth/admin/login',
    '/api/v2/auth/login',
    '/api/v2/auth/register',
    '/api/v2/auth/forgot-password',
    '/api/v2/auth/verify-reset-token',
    '/api/v2/auth/reset-password',
    '/api/v2/users/login',
    '/api/v2/users/register',
    '/api/v2/admin/login',
    // Session 认证路由
    '/api/v2/session-auth/admin/login',
    '/api/v2/session-auth/admin/verify',
    '/api/v2/session-auth/admin/logout',
    // 公开数据接口
    '/api/v2/bookmarks/public',
    '/api/v2/quotes/random',
    '/api/v2/categories/public',
    // 分享链接（公开访问）
    '/api/v2/shares/',
    // 元数据抓取（可能需要被第三方调用）
    '/api/v2/metadata',
    // 访问统计追踪
    '/api/v2/visits/track',
    // 私密模式验证
    '/api/v2/private-mode/verify',
    // 演示模式
    '/api/v2/settings/demo-mode',
    // 默认设置
    '/api/v2/settings/default',
    // 密码提示
    '/api/v2/admin/password-hint',
    // API 文档
    '/api/v2/docs',
    // 文件快传 - 公开下载接口
    '/api/file-transfers/extract',
    '/api/file-transfers/download',
  ],
  // 开发环境：允许同源的请求自动通过（基于 Referer/Origin）
  allowSameOrigin: isDevelopment
}))

// Referer检查（额外安全层）- 开发环境跳过
if (process.env.NODE_ENV !== 'development') {
  app.use(refererCheck([
    'localhost',
    '127.0.0.1',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ]))
}

// IP过滤中间件
app.use(ipFilterMiddleware)

// 全局请求频率限制
app.use(generalLimiter)

// 自动审计中间件（记录敏感操作）
app.use('/api', autoAuditMiddleware)

// ========== API 路由挂载（统一使用 V2） ==========
// 所有API统一通过 /api/v2 访问，内部使用 V2 路由
app.use('/api/v2', v2Router)
// 保持向后兼容，/api 也指向 v2
app.use('/api', v2Router)

// ========== 错误处理 ==========
// 404处理
app.use(notFoundHandler)
// 系统错误日志记录（必须在 errorHandler 之前）
app.use(errorLogMiddleware)
// 统一错误处理
app.use(errorHandler)

// ========== 启动服务 ==========
initDatabase().then(() => {
  const useHttps = process.env.HTTPS_ENABLED === 'true'
  
  if (useHttps) {
    const keyPath = process.env.SSL_KEY_PATH || path.join(process.cwd(), 'certs', 'key.pem')
    const certPath = process.env.SSL_CERT_PATH || path.join(process.cwd(), 'certs', 'cert.pem')
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
      
      https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(`✨ Server running at https://0.0.0.0:${PORT}`)
      })
    } else {
      console.warn('⚠️ SSL certs not found, falling back to HTTP')
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`✨ Server running at http://0.0.0.0:${PORT}`)
      })
    }
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✨ Server running at http://0.0.0.0:${PORT}`)
      if (isDev) {
        console.log(`📝 API Docs: http://localhost:${PORT}/api`)
        console.log(`🔧 Dev Mode: Hot reload enabled`)
      }
      
      // 定期清理过期文件（每小时执行一次）
      setInterval(() => {
        try {
          const count = cleanupExpiredFileTransfers()
          if (count > 0) {
            console.log(`🧹 Cleaned up ${count} expired file transfers`)
          }
        } catch (error) {
          console.error('❌ Error cleaning up expired file transfers:', error)
        }
      }, 60 * 60 * 1000)
      
      console.log('⏰ Scheduled cleanup task: cleaning up expired file transfers every hour')
    })
  }
}).catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
