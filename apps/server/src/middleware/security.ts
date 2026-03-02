/**
 * 安全中间件
 * 防止常见攻击手段
 */

import { Request, Response, NextFunction } from 'express'

// 危险文件扩展名黑名单
const DANGEROUS_EXTENSIONS = [
  // 可执行文件
  'exe', 'dll', 'bat', 'cmd', 'sh', 'bin',
  // Web 脚本
  'php', 'php3', 'php4', 'php5', 'phtml',
  'jsp', 'jspx', 'war', 'ear',
  'asp', 'aspx', 'ascx', 'ashx',
  'py', 'pyc', 'pyo', 'rb', 'pl', 'cgi',
  // 服务器配置
  'htaccess', 'htpasswd',
  // 脚本
  'js', 'vbs', 'wsf', 'wsh',
  // 其他危险文件
  'jar', 'class', 'so', 'o',
  'sql', 'db', 'sqlite',
]

// 危险 MIME 类型黑名单
const DANGEROUS_MIME_TYPES = [
  'application/x-php',
  'application/x-httpd-php',
  'text/x-php',
  'application/x-python-code',
  'text/x-python',
  'application/x-ruby',
  'text/x-ruby',
  'application/x-perl',
  'text/x-perl',
  'application/x-shellscript',
  'text/x-shellscript',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-sharedlib',
  'application/java-archive',
  'application/x-java-class',
]

// 路径穿越检测
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,           // ../
  /\.\.\\/,           // ..\
  /%2e%2e%2f/i,      // URL encoded ../
  /%2e%2e%5c/i,      // URL encoded ..\
  /\x2e\x2e\x2f/,     // Hex encoded ../
  /\x2e\x2e\x5c/,     // Hex encoded ..\
  /\.\.\//,           // Double encoded
  /^\//,              // 绝对路径 Unix
  /^[a-zA-Z]:\\/,     // 绝对路径 Windows
]

/**
 * 检查文件名是否包含危险扩展名
 */
export function hasDangerousExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return DANGEROUS_EXTENSIONS.includes(ext)
}

/**
 * 检查 MIME 类型是否危险
 */
export function isDangerousMimeType(mimeType: string): boolean {
  return DANGEROUS_MIME_TYPES.some(type => mimeType.toLowerCase().includes(type))
}

/**
 * 检查路径是否包含路径穿越
 */
export function hasPathTraversal(filepath: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(filepath))
}

/**
 * 清理文件名，移除危险字符
 */
export function sanitizeFilename(filename: string): string {
  // 移除路径分隔符
  let sanitized = filename.replace(/[/\\]/g, '')
  // 移除控制字符
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '')
  // 移除特殊字符
  sanitized = sanitized.replace(/[<>:"|?*]/g, '')
  // 限制长度
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || ''
    sanitized = sanitized.substring(0, 250 - ext.length) + '.' + ext
  }
  return sanitized || 'unnamed'
}

/**
 * 生成安全的随机文件名
 */
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  // 只允许安全的扩展名
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar'].includes(ext) ? ext : 'bin'
  return `${timestamp}-${random}.${safeExt}`
}

/**
 * 文件上传安全中间件
 * 检查上传的文件是否安全
 */
export function fileUploadSecurityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 检查 Content-Type
  const contentType = req.headers['content-type'] || ''
  
  // 检查请求体大小
  const contentLength = parseInt(req.headers['content-length'] || '0')
  const maxSize = 100 * 1024 * 1024 // 100MB
  
  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      error: '文件大小超过限制',
    })
    return
  }

  // 检查文件名（如果有）
  const filename = req.body?.fileName || req.body?.filename || ''
  if (filename) {
    if (hasDangerousExtension(filename)) {
      res.status(400).json({
        success: false,
        error: '不安全的文件类型，禁止上传',
      })
      return
    }
    
    if (hasPathTraversal(filename)) {
      res.status(400).json({
        success: false,
        error: '非法文件名',
      })
      return
    }
  }

  next()
}

/**
 * 路径安全中间件
 * 防止路径穿越攻击
 */
export function pathSecurityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 检查 URL 参数
  for (const key in req.params) {
    const value = req.params[key]
    if (typeof value === 'string' && hasPathTraversal(value)) {
      res.status(400).json({
        success: false,
        error: '非法请求参数',
      })
      return
    }
  }

  // 检查查询参数
  for (const key in req.query) {
    const value = req.query[key]
    if (typeof value === 'string' && hasPathTraversal(value)) {
      res.status(400).json({
        success: false,
        error: '非法请求参数',
      })
      return
    }
  }

  next()
}

/**
 * 请求体安全中间件
 * 防止大请求体攻击
 */
export function requestSizeLimitMiddleware(
  maxSize: number = 10 * 1024 * 1024 // 默认 10MB
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0')
    
    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        error: '请求体过大',
      })
      return
    }

    next()
  }
}

/**
 * 文件类型白名单验证
 */
export function validateFileType(
  allowedTypes: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const filename = req.body?.fileName || req.body?.filename || ''
    if (!filename) {
      next()
      return
    }

    const ext = filename.split('.').pop()?.toLowerCase() || ''
    
    // 检查是否在白名单中
    if (!allowedTypes.includes(ext) && !allowedTypes.includes('*')) {
      res.status(400).json({
        success: false,
        error: `不支持的文件类型: ${ext}，只允许: ${allowedTypes.join(', ')}`,
      })
      return
    }

    next()
  }
}
