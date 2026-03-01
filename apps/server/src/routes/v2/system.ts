/**
 * 系统路由 - V2版本
 * 提供系统信息和状态管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { queryOne } from '../../utils/index.js'
import { getDatabase } from '../../db/index.js'

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
        nodeVersion: process.version,
        platform: process.platform,
        dbVersion: dbInfo?.version || 'unknown',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
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
    
    // Docker 容器信息（如果可用）
    let dockerInfo = null
    try {
      const { execSync } = await import('child_process')
      const result = execSync('docker ps -q 2>/dev/null | wc -l', { encoding: 'utf8', timeout: 1000 })
      const running = parseInt(result.trim()) || 0
      const allResult = execSync('docker ps -aq 2>/dev/null | wc -l', { encoding: 'utf8', timeout: 1000 })
      const total = parseInt(allResult.trim()) || 0
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

export default router
