/**
 * SSRF (服务器端请求伪造) 防护工具
 * 防止攻击者利用服务器发起恶意请求
 * 
 * NAS部署说明：
 * - 元数据抓取：默认阻止内网地址（防止攻击者探测内网）
 * - 服务监控：可通过配置允许内网地址（用于监控局域网服务）
 * - 云元数据：始终阻止（防止云服务器凭证泄露）
 */

import { queryOne } from './database.js'

// ========== 严格黑名单（始终禁止） ==========
// 这些地址涉及云服务商元数据，必须始终阻止
const STRICT_BLOCKED_HOSTS = new Set([
  // 本地回环（严格模式）
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  '[::]',
  '::1',
  '::',
  // 云服务元数据（必须始终阻止）
  'metadata.google.internal',
  'metadata.google.internal.',
  '169.254.169.254',  // AWS/GCP/Azure 元数据服务
  '169.254.170.2',    // AWS ECS 元数据
  'fd00:ec2::254',    // AWS IPv6 元数据
  '100.100.100.200',  // 阿里云元数据
  'metadata.tencentyun.com',  // 腾讯云
  'metadata.ksyun.com',       // 金山云
])

// 严格禁止的IP段（始终阻止）
const STRICT_BLOCKED_IPS = [
  '127.0.0.0/8',      // 本地回环
  '0.0.0.0/8',        // 当前网络
  '169.254.0.0/16',   // 链路本地（含云元数据）
  '192.0.0.0/24',     // IETF协议分配
  '192.0.2.0/24',     // TEST-NET-1
  '198.18.0.0/15',    // 网络基准测试
  '198.51.100.0/24',  // TEST-NET-2
  '203.0.113.0/24',   // TEST-NET-3
  '224.0.0.0/4',      // 多播
  '240.0.0.0/4',      // 保留
  '255.255.255.255/32', // 广播
]

// ========== 可配置黑名单（根据设置决定是否阻止） ==========
// 局域网地址 - 在NAS环境中可能需要允许
const CONFIGURABLE_BLOCKED_IPS = [
  '10.0.0.0/8',       // 私有网络A类
  '172.16.0.0/12',    // 私有网络B类
  '192.168.0.0/16',   // 私有网络C类
  '100.64.0.0/10',    // 运营商级NAT
]

// 允许的协议
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export interface SSRFValidationResult {
  valid: boolean
  error?: string
}

export interface SSRFValidationOptions {
  /** 是否允许内网地址（10.x, 172.16-31.x, 192.168.x） */
  allowPrivateIPs?: boolean
  /** 允许的端口列表 */
  allowedPorts?: number[]
  /** 是否允许URL中包含认证信息 */
  allowCredentials?: boolean
  /** 最大URL长度 */
  maxLength?: number
}

// 缓存配置
let cachedConfig: { allowPrivateIPs: boolean } | null = null
let configCacheTime = 0
const CONFIG_CACHE_TTL = 60000 // 1分钟缓存

/**
 * 获取SSRF配置
 */
function getSSRFConfig(): { allowPrivateIPs: boolean } {
  const now = Date.now()
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  try {
    const setting = queryOne('SELECT value FROM settings WHERE key = ?', ['security.ssrf.allowPrivateIPs'])
    cachedConfig = {
      allowPrivateIPs: setting?.value === 'true'
    }
  } catch {
    cachedConfig = { allowPrivateIPs: false }
  }

  configCacheTime = now
  return cachedConfig
}

/**
 * 验证URL是否安全（防止SSRF攻击）
 * 
 * @param urlString 要验证的URL
 * @param options 验证选项
 */
export function validateUrl(
  urlString: string, 
  options: SSRFValidationOptions = {}
): SSRFValidationResult {
  const {
    allowPrivateIPs = false,
    allowedPorts,
    allowCredentials = false,
    maxLength = 2048
  } = options

  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL不能为空' }
  }

  // 长度限制
  if (urlString.length > maxLength) {
    return { valid: false, error: 'URL过长' }
  }

  let url: URL
  try {
    url = new URL(urlString.trim())
  } catch {
    return { valid: false, error: '无效的URL格式' }
  }

  // 检查协议
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { valid: false, error: `不支持的协议: ${url.protocol}` }
  }

  // 检查端口
  if (allowedPorts && url.port) {
    const port = parseInt(url.port, 10)
    if (!allowedPorts.includes(port)) {
      return { valid: false, error: `不允许的端口: ${port}` }
    }
  }

  // 禁止URL中包含认证信息
  if (!allowCredentials && (url.username || url.password)) {
    return { valid: false, error: 'URL不能包含认证信息' }
  }

  // 获取主机名（小写化）
  const hostname = url.hostname.toLowerCase()

  // 检查严格黑名单（始终阻止）
  if (STRICT_BLOCKED_HOSTS.has(hostname)) {
    return { valid: false, error: '禁止访问该主机' }
  }

  // 检查IP地址
  if (isIPAddress(hostname)) {
    // 首先检查严格黑名单
    if (isStrictBlockedIP(hostname)) {
      return { valid: false, error: '禁止访问该IP地址' }
    }
    
    // 然后检查可配置的私有IP
    if (!allowPrivateIPs && isPrivateIP(hostname)) {
      return { valid: false, error: '禁止访问私有IP地址' }
    }
  }

  // 检查主机名是否包含可疑模式
  if (containsBypassPattern(hostname)) {
    return { valid: false, error: '检测到绕过尝试' }
  }

  return { valid: true }
}

/**
 * 验证元数据抓取URL（严格模式，禁止内网）
 * 用于：书签元数据抓取
 */
export function validateMetadataUrl(urlString: string): SSRFValidationResult {
  return validateUrl(urlString, {
    allowPrivateIPs: false,  // 元数据抓取不允许内网
    allowCredentials: false,
    maxLength: 2048
  })
}

/**
 * 验证服务监控URL（可配置模式）
 * 用于：服务状态监控，NAS环境中可能需要监控内网服务
 */
export function validateMonitorUrl(urlString: string): SSRFValidationResult {
  const config = getSSRFConfig()
  
  return validateUrl(urlString, {
    allowPrivateIPs: config.allowPrivateIPs,  // 根据配置决定是否允许内网
    allowedPorts: [80, 443, 8080, 8443],      // 只允许标准端口
    allowCredentials: false,
    maxLength: 2048
  })
}

/**
 * 验证壁纸源URL（严格模式）
 * 用于：壁纸API配置
 */
export function validateWallpaperUrl(urlString: string): SSRFValidationResult {
  return validateUrl(urlString, {
    allowPrivateIPs: false,  // 壁纸源不允许内网
    allowedPorts: [80, 443],
    allowCredentials: false,
    maxLength: 2048
  })
}

/**
 * 检查是否为IP地址
 */
function isIPAddress(hostname: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return true
  }
  // IPv6
  if (/^\[?[0-9a-fA-F:]+\]?$/.test(hostname)) {
    return true
  }
  return false
}

/**
 * 检查是否为严格禁止的IP
 */
function isStrictBlockedIP(ip: string): boolean {
  const cleanIP = ip.replace(/[\[\]]/g, '')

  // IPv4检查
  const ipv4Match = cleanIP.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number)

    if ([a, b, c, d].some(n => n < 0 || n > 255)) {
      return true
    }

    // 127.0.0.0/8
    if (a === 127) return true
    // 0.0.0.0/8
    if (a === 0) return true
    // 169.254.0.0/16
    if (a === 169 && b === 254) return true
    // 192.0.0.0/24
    if (a === 192 && b === 0 && c === 0) return true
    // 192.0.2.0/24
    if (a === 192 && b === 0 && c === 2) return true
    // 198.18.0.0/15
    if (a === 198 && b >= 18 && b <= 19) return true
    // 198.51.100.0/24
    if (a === 198 && b === 51 && c === 100) return true
    // 203.0.113.0/24
    if (a === 203 && b === 0 && c === 113) return true
    // 224.0.0.0/4 (多播)
    if (a >= 224 && a <= 239) return true
    // 240.0.0.0/4 (保留)
    if (a >= 240 && a <= 255) return true
  }

  // IPv6检查
  if (cleanIP.includes(':')) {
    if (/^::1$|^0:0:0:0:0:0:0:1$/.test(cleanIP)) return true
    if (/^fe[89ab][0-9a-f]:/i.test(cleanIP)) return true
    if (/^fc[0-9a-f]:/i.test(cleanIP) || /^fd[0-9a-f]:/i.test(cleanIP)) return true
    if (/^::ffff:0:/i.test(cleanIP)) return true
  }

  return false
}

/**
 * 检查是否为私有IP（可配置的）
 */
function isPrivateIP(ip: string): boolean {
  const cleanIP = ip.replace(/[\[\]]/g, '')

  // IPv4检查
  const ipv4Match = cleanIP.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number)

    if ([a, b, c, d].some(n => n < 0 || n > 255)) {
      return true
    }

    // 10.0.0.0/8
    if (a === 10) return true
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true
    // 100.64.0.0/10
    if (a === 100 && b >= 64 && b <= 127) return true
  }

  return false
}

/**
 * 检查是否包含绕过模式
 */
function containsBypassPattern(hostname: string): boolean {
  const bypassPatterns = [
    /\.localhost$/i,
    /\.local$/i,
    /\.internal$/i,
    /\.lan$/i,
    /\.home$/i,
    /\.corp$/i,
    /^\d+\.\d+\.\d+\.\d+\.xip\.io$/i,
    /^\d+\.\d+\.\d+\.\d+\.nip\.io$/i,
    /\.ngrok\.io$/i,
    /\.serveo\.net$/i,
    /\.localtunnel\.me$/i,
  ]

  return bypassPatterns.some(pattern => pattern.test(hostname))
}

/**
 * 安全的URL获取主机名（用于DNS解析前的初步检查）
 */
export function extractHostname(urlString: string): string | null {
  try {
    const url = new URL(urlString)
    return url.hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * 批量验证URL列表
 */
export function validateUrls(
  urls: string[], 
  options?: SSRFValidationOptions
): { valid: string[]; invalid: Array<{ url: string; error: string }> } {
  const valid: string[] = []
  const invalid: Array<{ url: string; error: string }> = []

  for (const url of urls) {
    const result = validateUrl(url, options)
    if (result.valid) {
      valid.push(url)
    } else {
      invalid.push({ url, error: result.error || '未知错误' })
    }
  }

  return { valid, invalid }
}

/**
 * 清除配置缓存（用于配置更新后）
 */
export function clearSSRFConfigCache(): void {
  cachedConfig = null
  configCacheTime = 0
}
