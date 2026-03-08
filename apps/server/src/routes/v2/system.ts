/**
 * 系统路由 - V2版本
 * 提供系统信息和状态管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { queryOne, run } from '../../utils/index.js'
import { getDatabase } from '../../db/index.js'
import { clearSSRFConfigCache } from '../../utils/ssrfProtection.js'

const router = Router()

// 获取系统状态（公开接口）
router.get('/status', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('获取系统状态失败:', error)
    res.status(500).json({ success: false, error: '获取系统状态失败' })
  }
})

// 获取系统信息（需要认证）
router.get('/info', authMiddleware, (req: Request, res: Response) => {
  try {
    const dbInfo = queryOne('SELECT sqlite_version() as version')
    
    res.json({
      success: true,
      data: {
        status: 'running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('获取系统信息失败:', error)
    res.status(500).json({ success: false, error: '获取系统信息失败' })
  }
})

// 获取系统统计（需要管理员权限）
router.get('/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const userCount = queryOne('SELECT COUNT(*) as count FROM users')
    const bookmarkCount = queryOne('SELECT COUNT(*) as count FROM bookmarks')
    const categoryCount = queryOne('SELECT COUNT(*) as count FROM categories')
    
    res.json({
      success: true,
      data: {
        users: userCount?.count || 0,
        bookmarks: bookmarkCount?.count || 0,
        categories: categoryCount?.count || 0,
      }
    })
  } catch (error) {
    console.error('获取系统统计失败:', error)
    res.status(500).json({ success: false, error: '获取系统统计失败' })
  }
})

// 获取系统监控数据（脉冲数据）- 需要管理员权限
router.get('/pulse', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const os = await import('os')
    
    // CPU 信息
    const cpuUsage = os.loadavg()
    const cpus = os.cpus()
    const cpuCount = cpus.length
    
    // 内存信息
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsagePercent = Math.round((usedMem / totalMem) * 100)
    
    // 磁盘信息（简化版）
    const diskInfo = {
      usedPercent: 0,
      total: 'N/A',
      used: 'N/A',
      free: 'N/A',
      disks: [] as any[]
    }
    
    // 网络信息（简化版）
    const networkInterfaces = os.networkInterfaces()
    const networkStats = {
      rx_sec: 0,
      tx_sec: 0,
      rx_formatted: '0 B/s',
      tx_formatted: '0 B/s'
    }
    
    // 系统运行时间
    const uptime = os.uptime()
    const uptimeFormatted = formatUptime(uptime)
    
    // Docker 容器信息（如果可用）- 使用安全的execFile代替execSync
    let dockerInfo = null
    try {
      const { execFile } = await import('child_process')
      const { promisify } = await import('util')
      const execFileAsync = promisify(execFile)
      
      // 安全地执行docker命令，使用参数数组而非字符串拼接
      const { stdout: runningStdout } = await execFileAsync('docker', ['ps', '-q'], {
        encoding: 'utf8',
        timeout: 1000,
        windowsHide: true // Windows下隐藏命令窗口
      })
      const running = runningStdout.trim().split('\n').filter(Boolean).length
      
      const { stdout: allStdout } = await execFileAsync('docker', ['ps', '-aq'], {
        encoding: 'utf8',
        timeout: 1000,
        windowsHide: true
      })
      const total = allStdout.trim().split('\n').filter(Boolean).length
      
      dockerInfo = { running, total }
    } catch {
      // Docker 不可用
    }
    
    res.json({
      success: true,
      data: {
        cpu: {
          usage: Math.round((cpuUsage[0] / cpuCount) * 100),
          temperature: null, // 需要额外硬件支持
          count: cpuCount,
          model: cpus[0]?.model || 'Unknown'
        },
        memory: {
          usedPercent: memUsagePercent,
          total: formatBytes(totalMem),
          used: formatBytes(usedMem),
          free: formatBytes(freeMem)
        },
        disk: diskInfo,
        network: networkStats,
        containers: dockerInfo,
        uptime: uptimeFormatted,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('获取系统监控数据失败:', error)
    res.status(500).json({ success: false, error: '获取系统监控数据失败' })
  }
})

// 获取硬件信息
router.get('/hardware', authMiddleware, async (req: Request, res: Response) => {
  try {
    const os = await import('os')
    const cpus = os.cpus()
    
    res.json({
      success: true,
      data: {
        cpu: {
          brand: cpus[0]?.model || 'Unknown',
          manufacturer: cpus[0]?.model?.split(' ')[0] || 'Unknown',
          speed: cpus[0]?.speed || 0,
          cores: cpus.length,
          physicalCores: cpus.length / 2 // 估算
        },
        system: {
          manufacturer: 'Unknown',
          model: os.platform(),
          version: os.release()
        },
        os: {
          platform: os.platform(),
          distro: os.type(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname()
        },
        memory: {
          total: formatBytes(os.totalmem())
        }
      }
    })
  } catch (error) {
    console.error('获取硬件信息失败:', error)
    res.status(500).json({ success: false, error: '获取硬件信息失败' })
  }
})

// 获取网络信息
router.get('/network', authMiddleware, async (req: Request, res: Response) => {
  try {
    const os = await import('os')
    const networkInterfaces = os.networkInterfaces()
    
    const interfaces = Object.entries(networkInterfaces).map(([name, addrs]) => ({
      name,
      addresses: addrs?.map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal
      })) || []
    }))
    
    res.json({
      success: true,
      data: {
        interfaces,
        hostname: os.hostname()
      }
    })
  } catch (error) {
    console.error('获取网络信息失败:', error)
    res.status(500).json({ success: false, error: '获取网络信息失败' })
  }
})

// 辅助函数：格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 辅助函数：格式化运行时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  return `${minutes}分钟`
}

// 健康检查接口（用于Docker/K8s健康检查）
router.get('/health', (req: Request, res: Response) => {
  try {
    // 检查数据库连接
    const db = getDatabase()
    const dbCheck = db.exec('SELECT 1')
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck ? 'ok' : 'error',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    })
  } catch (error) {
    console.error('健康检查失败:', error)
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: '服务异常',
      timestamp: new Date().toISOString()
    })
  }
})

// 获取SSRF安全设置（管理员）
router.get('/security/ssrf', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const setting = queryOne('SELECT value FROM settings WHERE key = ?', ['security.ssrf.allowPrivateIPs'])
    
    res.json({
      success: true,
      data: {
        allowPrivateIPs: setting?.value === 'true'
      }
    })
  } catch (error) {
    console.error('获取SSRF设置失败:', error)
    res.status(500).json({ success: false, error: '获取设置失败' })
  }
})

// 更新SSRF安全设置（管理员）
router.put('/security/ssrf', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { allowPrivateIPs } = req.body
    
    if (typeof allowPrivateIPs !== 'boolean') {
      return res.status(400).json({ success: false, error: '参数必须是布尔值' })
    }
    
    const now = new Date().toISOString()
    const existing = queryOne('SELECT key FROM settings WHERE key = ?', ['security.ssrf.allowPrivateIPs'])
    
    if (existing) {
      run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', 
          [String(allowPrivateIPs), now, 'security.ssrf.allowPrivateIPs'])
    } else {
      run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
          ['security.ssrf.allowPrivateIPs', String(allowPrivateIPs), now])
    }
    
    // 清除配置缓存
    clearSSRFConfigCache()
    
    res.json({
      success: true,
      message: '设置已更新',
      data: { allowPrivateIPs }
    })
  } catch (error) {
    console.error('更新SSRF设置失败:', error)
    res.status(500).json({ success: false, error: '更新设置失败' })
  }
})

export default router
