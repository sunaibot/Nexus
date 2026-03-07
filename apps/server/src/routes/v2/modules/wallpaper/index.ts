/**
 * 壁纸管理路由
 * 提供壁纸库管理和壁纸设置功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware, publicApiLimiter } from '../../../../middleware/index.js'
import { queryAll, queryOne, run } from '../../../../utils/database.js'
import { logAudit } from '../../../../db/audit-enhanced.js'

const router = Router()

// 壁纸库表初始化标记
let wallpaperTableInitialized = false

// 壁纸库表初始化
const initWallpaperTable = () => {
  if (wallpaperTableInitialized) return
  try {
    run(`
      CREATE TABLE IF NOT EXISTS wallpaper_library (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'upload',
        category TEXT DEFAULT 'other',
        tags TEXT DEFAULT '[]',
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        used_at TEXT,
        use_count INTEGER DEFAULT 0,
        file_size INTEGER,
        width INTEGER,
        height INTEGER
      )
    `)
    wallpaperTableInitialized = true
  } catch (error) {
    console.error('初始化壁纸库表失败:', error)
  }
}

// 获取壁纸库列表
router.get('/library', authMiddleware, (req: Request, res: Response) => {
  try {
    initWallpaperTable()
    const wallpapers = queryAll(`
      SELECT * FROM wallpaper_library 
      ORDER BY created_at DESC
    `)

    // 解析 tags
    const parsedWallpapers = wallpapers.map((w: any) => ({
      ...w,
      tags: JSON.parse(w.tags || '[]'),
      isFavorite: Boolean(w.is_favorite),
      useCount: w.use_count,
      createdAt: w.created_at,
      usedAt: w.used_at,
      fileSize: w.file_size,
    }))

    res.json({
      success: true,
      data: parsedWallpapers
    })
  } catch (error) {
    console.error('获取壁纸库失败:', error)
    res.status(500).json({ success: false, error: '获取壁纸库失败' })
  }
})

// 添加壁纸到库
router.post('/library', authMiddleware, (req: Request, res: Response) => {
  try {
    initWallpaperTable()
    const { name, url, thumbnail, source = 'upload', category = 'other', tags = [], fileSize, width, height } = req.body

    if (!name || !url) {
      return res.status(400).json({ success: false, error: '名称和URL不能为空' })
    }

    const id = Date.now().toString()
    
    run(`
      INSERT INTO wallpaper_library (id, name, url, thumbnail, source, category, tags, file_size, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, url, thumbnail || url, source, category, JSON.stringify(tags), fileSize, width, height])

    logAudit({
      userId: (req as any).user?.id,
      username: (req as any).user?.username,
      action: 'CREATE_WALLPAPER',
      resourceType: 'wallpaper',
      resourceId: id as string,
      details: { name, source, category },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    res.json({
      success: true,
      data: { id, name, url, thumbnail, source, category, tags, fileSize, width, height }
    })
  } catch (error) {
    console.error('添加壁纸失败:', error)
    res.status(500).json({ success: false, error: '添加壁纸失败' })
  }
})

// 更新壁纸
router.put('/library/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, category, tags, isFavorite } = req.body

    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (category !== undefined) {
      updates.push('category = ?')
      values.push(category)
    }
    if (tags !== undefined) {
      updates.push('tags = ?')
      values.push(JSON.stringify(tags))
    }
    if (isFavorite !== undefined) {
      updates.push('is_favorite = ?')
      values.push(isFavorite ? 1 : 0)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: '没有要更新的字段' })
    }

    values.push(id)

    run(`
      UPDATE wallpaper_library 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values)

    logAudit({
      userId: (req as any).user?.id,
      username: (req as any).user?.username,
      action: 'UPDATE_WALLPAPER',
      resourceType: 'wallpaper',
      resourceId: id as string,
      details: { name, category, tags, isFavorite },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    res.json({ success: true })
  } catch (error) {
    console.error('更新壁纸失败:', error)
    res.status(500).json({ success: false, error: '更新壁纸失败' })
  }
})

// 删除壁纸
router.delete('/library/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params

    run('DELETE FROM wallpaper_library WHERE id = ?', [id])

    logAudit({
      userId: (req as any).user?.id,
      username: (req as any).user?.username,
      action: 'DELETE_WALLPAPER',
      resourceType: 'wallpaper',
      resourceId: id as string,
      details: { wallpaperId: id },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    res.json({ success: true })
  } catch (error) {
    console.error('删除壁纸失败:', error)
    res.status(500).json({ success: false, error: '删除壁纸失败' })
  }
})

// 记录壁纸使用
router.post('/library/:id/use', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params

    run(`
      UPDATE wallpaper_library 
      SET use_count = use_count + 1, used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])

    res.json({ success: true })
  } catch (error) {
    console.error('记录壁纸使用失败:', error)
    res.status(500).json({ success: false, error: '记录失败' })
  }
})

// 切换收藏状态
router.post('/library/:id/favorite', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { isFavorite } = req.body

    run(`
      UPDATE wallpaper_library 
      SET is_favorite = ?
      WHERE id = ?
    `, [isFavorite ? 1 : 0, id])

    res.json({ success: true })
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    res.status(500).json({ success: false, error: '操作失败' })
  }
})

// 获取每日壁纸（公开接口）
router.get('/daily', publicApiLimiter, async (req: Request, res: Response) => {
  try {
    const { source = 'unsplash', category, keywords } = req.query

    let imageUrl = ''

    switch (source) {
      case 'unsplash':
        imageUrl = await fetchUnsplashImage(category as string, keywords as string)
        break
      case 'pexels':
        imageUrl = await fetchPexelsImage(category as string, keywords as string)
        break
      case 'picsum':
        imageUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`
        break
      case 'bing':
        imageUrl = await fetchBingImage()
        break
      default:
        imageUrl = await fetchUnsplashImage(category as string, keywords as string)
    }

    res.json({
      success: true,
      data: { url: imageUrl, source }
    })
  } catch (error) {
    console.error('获取每日壁纸失败:', error)
    res.status(500).json({ success: false, error: '获取每日壁纸失败' })
  }
})

// 获取预设壁纸列表（公开接口）
router.get('/presets', publicApiLimiter, (req: Request, res: Response) => {
  try {
    const presets = [
      {
        id: 'nature-1',
        name: '山脉日出',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
        thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        category: 'nature'
      },
      {
        id: 'city-1',
        name: '城市夜景',
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920',
        thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400',
        category: 'city'
      },
      {
        id: 'abstract-1',
        name: '抽象几何',
        url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920',
        thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400',
        category: 'abstract'
      },
      {
        id: 'minimal-1',
        name: '极简白',
        url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1920',
        thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400',
        category: 'minimal'
      },
      {
        id: 'space-1',
        name: '星空',
        url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920',
        thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
        category: 'space'
      }
    ]

    res.json({
      success: true,
      data: presets
    })
  } catch (error) {
    console.error('获取预设壁纸失败:', error)
    res.status(500).json({ success: false, error: '获取预设壁纸失败' })
  }
})

// 辅助函数：获取 Unsplash 图片
async function fetchUnsplashImage(category?: string, keywords?: string): Promise<string> {
  const query = keywords || category || 'nature'
  return `https://source.unsplash.com/1920x1080/?${encodeURIComponent(query)}&sig=${Date.now()}`
}

// 辅助函数：获取 Pexels 图片
async function fetchPexelsImage(category?: string, keywords?: string): Promise<string> {
  // 注意：实际使用时需要替换为真实的 API key
  return `https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=1920`
}

// 辅助函数：获取 Bing 每日图片
async function fetchBingImage(): Promise<string> {
  try {
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
    const data = await response.json()
    return `https://www.bing.com${data.images[0].url}`
  } catch {
    return 'https://www.bing.com/th?id=OHR.AncientOrkney_ROW1151325237_1920x1080.jpg'
  }
}

export default router
