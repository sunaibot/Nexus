/**
 * 安全验证工具
 * 防止路径穿越、恶意文件上传等攻击
 */

import path from 'path'

// 危险文件扩展名列表
const DANGEROUS_EXTENSIONS = [
  // 可执行文件
  'exe', 'dll', 'bat', 'cmd', 'sh', 'bin', 'run', 'msi', 'dmg', 'pkg', 'deb', 'rpm',
  // 脚本文件
  'js', 'jsx', 'ts', 'tsx', 'php', 'py', 'rb', 'pl', 'cgi', 'jsp', 'asp', 'aspx',
  // 配置文件
  'conf', 'config', 'ini', 'sys', 'reg',
  // 其他危险类型
  'jar', 'war', 'ear', 'apk', 'ipa', 'swf', 'fla'
]

// 危险文件名模式
const DANGEROUS_PATTERNS = [
  /\.\./,           // 路径穿越
  /^\./,            // 隐藏文件
  /[<>:"|?*]/,      // Windows非法字符
  /^(con|prn|aux|nul|com\d|lpt\d)$/i,  // Windows保留名
]

// 允许的MIME类型白名单
const ALLOWED_MIME_TYPES = [
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  // 音频
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  // 视频
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/avi',
  // 压缩包
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-tar',
  // 代码文件（只读）
  'text/html',
  'text/css',
  'application/json',
  'application/xml',
  'text/javascript',
  'text/typescript',
  'text/x-python',
  'text/x-java-source',
  'text/x-c',
  'text/x-c++',
]

/**
 * 验证文件名是否安全
 */
export function validateFileName(fileName: string): { safe: boolean; reason?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { safe: false, reason: '文件名不能为空' }
  }

  // 检查文件名长度
  if (fileName.length > 255) {
    return { safe: false, reason: '文件名过长' }
  }

  // 检查危险模式
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(fileName)) {
      return { safe: false, reason: '文件名包含非法字符' }
    }
  }

  // 获取文件扩展名
  const ext = path.extname(fileName).toLowerCase().replace('.', '')

  // 检查危险扩展名
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { safe: false, reason: '不允许上传可执行文件' }
  }

  // 检查双扩展名（如 file.txt.exe）
  const parts = fileName.split('.')
  if (parts.length > 2) {
    const secondExt = parts[parts.length - 2].toLowerCase()
    if (DANGEROUS_EXTENSIONS.includes(secondExt)) {
      return { safe: false, reason: '文件名可疑' }
    }
  }

  return { safe: true }
}

/**
 * 验证文件路径是否安全（防止路径穿越）
 */
export function validateFilePath(filePath: string, baseDir: string): { safe: boolean; reason?: string } {
  if (!filePath || typeof filePath !== 'string') {
    return { safe: false, reason: '路径不能为空' }
  }

  // 解析绝对路径
  const resolvedPath = path.resolve(filePath)
  const resolvedBaseDir = path.resolve(baseDir)

  // 确保文件路径在基础目录内
  if (!resolvedPath.startsWith(resolvedBaseDir)) {
    return { safe: false, reason: '非法文件路径' }
  }

  // 检查路径中是否包含 .. 
  if (filePath.includes('..')) {
    return { safe: false, reason: '路径包含非法字符' }
  }

  return { safe: true }
}

/**
 * 验证MIME类型
 */
export function validateMimeType(mimeType: string): { safe: boolean; reason?: string } {
  if (!mimeType || typeof mimeType !== 'string') {
    return { safe: false, reason: 'MIME类型不能为空' }
  }

  // 检查是否在白名单中
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return { safe: false, reason: '不支持的文件类型' }
  }

  return { safe: true }
}

/**
 * 验证文件大小
 */
export function validateFileSize(fileSize: number, maxSize: number): { safe: boolean; reason?: string } {
  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return { safe: false, reason: '文件大小无效' }
  }

  if (fileSize > maxSize) {
    return { safe: false, reason: `文件大小超过限制，最大支持 ${(maxSize / 1024 / 1024).toFixed(0)}MB` }
  }

  return { safe: true }
}

/**
 * 清理文件名（生成安全的文件名）
 */
export function sanitizeFileName(fileName: string): string {
  // 移除路径分隔符
  let sanitized = fileName.replace(/[/\\]/g, '_')
  
  // 移除控制字符
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '')
  
  // 移除危险字符
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_')
  
  // 移除连续的点和下划线
  sanitized = sanitized.replace(/\.{2,}/g, '_')
  sanitized = sanitized.replace(/_{2,}/g, '_')
  
  // 限制长度
  if (sanitized.length > 200) {
    const ext = path.extname(sanitized)
    sanitized = sanitized.substring(0, 200 - ext.length) + ext
  }
  
  // 确保不以点或空格开头
  sanitized = sanitized.replace(/^[.\s]+/, '')
  
  // 如果文件名为空，使用默认名
  if (!sanitized || sanitized === '') {
    sanitized = 'unnamed_file'
  }
  
  return sanitized
}

/**
 * 生成安全的存储文件名
 */
export function generateSafeFileName(originalName: string, fileId: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const sanitizedExt = sanitizeFileName(ext)
  return `${fileId}${sanitizedExt}`
}

/**
 * 验证提取码/删除码格式
 */
export function validateCode(code: string, type: 'extract' | 'delete'): { valid: boolean; reason?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, reason: '代码不能为空' }
  }

  // 提取码：6位大写字母数字
  if (type === 'extract') {
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      return { valid: false, reason: '提取码格式错误' }
    }
  }

  // 删除码：6-20位
  if (type === 'delete') {
    if (!/^[A-Z0-9]{6,20}$/.test(code)) {
      return { valid: false, reason: '删除码格式错误' }
    }
  }

  return { valid: true }
}

/**
 * 验证密码格式
 */
export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: '密码不能为空' }
  }

  // 密码：4位大写字母数字
  if (!/^[A-Z0-9]{4}$/.test(password)) {
    return { valid: false, reason: '密码格式错误' }
  }

  return { valid: true }
}

/**
 * 检查文件内容是否包含恶意代码（基础检查）
 */
export function scanFileContent(base64Content: string): { safe: boolean; reason?: string } {
  try {
    // 解码前几个字节检查文件签名
    const buffer = Buffer.from(base64Content.substring(0, 100), 'base64')
    
    // 检查可执行文件签名
    const signatures = [
      { sig: [0x4D, 0x5A], name: 'EXE' },        // Windows executable
      { sig: [0x7F, 0x45, 0x4C, 0x46], name: 'ELF' },  // Linux executable
      { sig: [0xCA, 0xFE, 0xBA, 0xBE], name: 'Java class' },  // Java class
      { sig: [0x50, 0x4B, 0x03, 0x04], name: 'ZIP/JAR' },  // ZIP/JAR
    ]

    for (const { sig, name } of signatures) {
      if (buffer.length >= sig.length) {
        const match = sig.every((byte, i) => buffer[i] === byte)
        if (match) {
          return { safe: false, reason: `检测到可执行文件格式(${name})` }
        }
      }
    }

    return { safe: true }
  } catch (error) {
    return { safe: false, reason: '文件内容验证失败' }
  }
}
