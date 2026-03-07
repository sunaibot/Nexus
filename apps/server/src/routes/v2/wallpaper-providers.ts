/**
 * 壁纸源管理 API
 * 支持自定义壁纸源，包括 Bing 壁纸、Unsplash、Pexels 等
 */

import { Router, Request, Response } from 'express'
import { queryAll, queryOne, run } from '../../utils/database.js'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { randomUUID } from 'crypto'
import fetch from 'node-fetch'

const router = Router()

// 内置壁纸源预设
const BUILTIN_PROVIDERS = [
  {
    id: 'bing',
    name: 'Bing 每日壁纸',
    description: '微软 Bing 搜索引擎每日精选高清壁纸',
    type: 'builtin',
    icon: 'Image',
    apiUrl: 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN',
    parser: {
      imageUrlPath: 'images[].url',
      titlePath: 'images[].title',
      copyrightPath: 'images[].copyright'
    },
    documentationUrl: 'https://www.bing.com/HPImageArchive.aspx'
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    description: '高质量免费摄影图片',
    type: 'builtin',
    icon: 'Camera',
    apiUrl: 'https://api.unsplash.com/photos/random',
    defaultHeaders: {
      'Accept-Version': 'v1'
    },
    defaultParams: {
      count: '10'
    },
    parser: {
      imageUrlPath: '[].urls.regular',
      titlePath: '[].description',
      authorPath: '[].user.name'
    },
    documentationUrl: 'https://unsplash.com/developers'
  },
  {
    id: 'pexels',
    name: 'Pexels',
    description: '免费高质量图片和视频',
    type: 'builtin',
    icon: 'Video',
    apiUrl: 'https://api.pexels.com/v1/curated',
    defaultParams: {
      per_page: '10'
    },
    parser: {
      imageUrlPath: 'photos[].src.large',
      titlePath: 'photos[].alt',
      authorPath: 'photos[].photographer'
    },
    documentationUrl: 'https://www.pexels.com/api/'
  },
  {
    id: 'picsum',
    name: 'Lorem Picsum',
    description: '随机图片服务，适合测试和开发',
    type: 'builtin',
    icon: 'Shuffle',
    apiUrl: 'https://picsum.photos/v2/list',
    defaultParams: {
      limit: '10'
    },
    parser: {
      imageUrlPath: '[].download_url',
      authorPath: '[].author'
    },
    documentationUrl: 'https://picsum.photos/'
  },
  {
    id: 'wallhaven',
    name: 'Wallhaven',
    description: '高质量壁纸社区',
    type: 'builtin',
    icon: 'Monitor',
    apiUrl: 'https://wallhaven.cc/api/v1/search',
    defaultParams: {
      sorting: 'random',
      per_page: '10'
    },
    parser: {
      imageUrlPath: 'data[].path',
      titlePath: 'data[].category'
    },
    documentationUrl: 'https://wallhaven.cc/help/api'
  }
]

// 解析 JSON 字段
function parseJsonField(value: string | undefined, defaultValue: any = undefined): any {
  if (!value) return defaultValue
  try {
    return JSON.parse(value)
  } catch {
    return defaultValue
  }
}

// 序列化 JSON 字段
function stringifyJsonField(value: any): string | null {
  if (value === undefined || value === null) return null
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

// 转换数据库记录为 API 响应格式
function parseProvider(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    enabled: row.enabled === 1,
    icon: row.icon,
    apiUrl: row.apiUrl,
    apiKey: row.apiKey,
    method: row.method,
    headers: parseJsonField(row.headers, {}),
    params: parseJsonField(row.params, {}),
    parser: parseJsonField(row.parser, {}),
    cacheDuration: row.cacheDuration,
    maxResults: row.maxResults,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

// 获取所有内置壁纸源预设
router.get('/presets', (req: Request, res: Response) => {
  try {
    // 映射字段名以匹配前端类型定义
    const presets = BUILTIN_PROVIDERS.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      icon: p.icon,
      defaultApiUrl: p.apiUrl,
      defaultHeaders: p.defaultHeaders,
      defaultParams: p.defaultParams,
      defaultParser: p.parser,
      documentationUrl: p.documentationUrl
    }))
    return successResponse(res, presets)
  } catch (error) {
    console.error('获取壁纸源预设失败:', error)
    return errorResponse(res, '获取壁纸源预设失败')
  }
})

// 获取所有壁纸源配置（管理员）
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const providers = queryAll('SELECT * FROM wallpaper_providers ORDER BY createdAt DESC')
    return successResponse(res, providers.map(parseProvider))
  } catch (error) {
    console.error('获取壁纸源列表失败:', error)
    return errorResponse(res, '获取壁纸源列表失败')
  }
})

// 获取启用的壁纸源（公开接口）
router.get('/enabled', (req: Request, res: Response) => {
  try {
    const providers = queryAll('SELECT * FROM wallpaper_providers WHERE enabled = 1 ORDER BY name')
    return successResponse(res, providers.map(parseProvider))
  } catch (error) {
    console.error('获取壁纸源列表失败:', error)
    return errorResponse(res, '获取壁纸源列表失败')
  }
})

// 获取单个壁纸源配置
router.get('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const provider = queryOne('SELECT * FROM wallpaper_providers WHERE id = ?', [id])
    
    if (!provider) {
      return errorResponse(res, '壁纸源不存在', 404)
    }
    
    return successResponse(res, parseProvider(provider))
  } catch (error) {
    console.error('获取壁纸源失败:', error)
    return errorResponse(res, '获取壁纸源失败')
  }
})

// 创建壁纸源配置
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type = 'api',
      enabled = true,
      icon,
      apiUrl,
      apiKey,
      method = 'GET',
      headers,
      params,
      parser,
      cacheDuration = 60,
      maxResults = 20
    } = req.body

    if (!name || !apiUrl) {
      return errorResponse(res, '名称和 API 地址不能为空', 400)
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    const insertParams: any[] = [
      id, name, description, type, enabled ? 1 : 0, icon,
      apiUrl, apiKey, method, stringifyJsonField(headers), stringifyJsonField(params), stringifyJsonField(parser),
      cacheDuration ?? 60, maxResults ?? 20, now, now
    ]
    run(
      `INSERT INTO wallpaper_providers (
        id, name, description, type, enabled, icon,
        apiUrl, apiKey, method, headers, params, parser,
        cacheDuration, maxResults, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    )

    const provider = queryOne('SELECT * FROM wallpaper_providers WHERE id = ?', [id])
    return successResponse(res, parseProvider(provider), 201)
  } catch (error) {
    console.error('创建壁纸源失败:', error)
    return errorResponse(res, '创建壁纸源失败')
  }
})

// 更新壁纸源配置
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      type,
      enabled,
      icon,
      apiUrl,
      apiKey,
      method,
      headers,
      params,
      parser,
      cacheDuration,
      maxResults
    } = req.body

    const provider = queryOne('SELECT * FROM wallpaper_providers WHERE id = ?', [id])
    if (!provider) {
      return errorResponse(res, '壁纸源不存在', 404)
    }

    const now = new Date().toISOString()

    const updateParams: any[] = [
      name, description, type, enabled !== undefined ? (enabled ? 1 : 0) : undefined, icon,
      apiUrl, apiKey, method, stringifyJsonField(headers), stringifyJsonField(params), stringifyJsonField(parser),
      cacheDuration, maxResults, now, id
    ]
    run(
      `UPDATE wallpaper_providers SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        enabled = COALESCE(?, enabled),
        icon = COALESCE(?, icon),
        apiUrl = COALESCE(?, apiUrl),
        apiKey = COALESCE(?, apiKey),
        method = COALESCE(?, method),
        headers = COALESCE(?, headers),
        params = COALESCE(?, params),
        parser = COALESCE(?, parser),
        cacheDuration = COALESCE(?, cacheDuration),
        maxResults = COALESCE(?, maxResults),
        updatedAt = ?
      WHERE id = ?`,
      updateParams
    )

    const updated = queryOne('SELECT * FROM wallpaper_providers WHERE id = ?', [id])
    return successResponse(res, parseProvider(updated))
  } catch (error) {
    console.error('更新壁纸源失败:', error)
    return errorResponse(res, '更新壁纸源失败')
  }
})

// 删除壁纸源配置
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const provider = queryOne('SELECT * FROM wallpaper_providers WHERE id = ?', [id])
    if (!provider) {
      return errorResponse(res, '壁纸源不存在', 404)
    }

    run('DELETE FROM wallpaper_providers WHERE id = ?', [id])
    return successResponse(res, { deleted: true, id })
  } catch (error) {
    console.error('删除壁纸源失败:', error)
    return errorResponse(res, '删除壁纸源失败')
  }
})

// 从内置预设创建壁纸源
router.post('/from-preset/:presetId', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { presetId } = req.params
    const { apiKey, customParams } = req.body

    const preset = BUILTIN_PROVIDERS.find(p => p.id === presetId)
    if (!preset) {
      return errorResponse(res, '预设不存在', 404)
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    const presetParams: any[] = [
      id,
      preset.name,
      preset.description,
      preset.type,
      1,
      preset.icon,
      preset.apiUrl,
      apiKey,
      'GET',
      stringifyJsonField(preset.defaultHeaders),
      stringifyJsonField({ ...preset.defaultParams, ...customParams }),
      stringifyJsonField(preset.parser),
      60,
      20,
      now,
      now
    ]
    run(
      `INSERT INTO wallpaper_providers (
        id, name, description, type, enabled, icon,
        apiUrl, apiKey, method, headers, params, parser,
        cacheDuration, maxResults, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      presetParams
    )

    const provider = queryOne('SELECT * FROM wallpaper_providers WHERE id = ?', [id])
    return successResponse(res, parseProvider(provider), 201)
  } catch (error) {
    console.error('从预设创建壁纸源失败:', error)
    return errorResponse(res, '创建失败')
  }
})

// 获取壁纸源的壁纸列表
router.get('/:id/wallpapers', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { refresh } = req.query

    // 获取壁纸源配置
    const provider = queryOne('SELECT * FROM wallpaper_providers WHERE id = ? AND enabled = 1', [id])
    if (!provider) {
      return errorResponse(res, '壁纸源不存在或未启用', 404)
    }

    // 检查缓存
    if (!refresh) {
      const maxResults = typeof provider.maxResults === 'string' ? parseInt(provider.maxResults, 10) : (provider.maxResults || 20)
      const cached = queryAll(
        'SELECT * FROM wallpaper_provider_cache WHERE providerId = ? ORDER BY createdAt DESC LIMIT ?',
        [id, maxResults]
      )
      
      if (cached.length > 0) {
        // 检查缓存是否过期
        const cacheAge = Date.now() - new Date(cached[0].createdAt).getTime()
        const cacheDuration = typeof provider.cacheDuration === 'string' ? parseInt(provider.cacheDuration, 10) : (provider.cacheDuration || 60)
        const maxAge = cacheDuration * 60 * 1000
        
        if (cacheAge < maxAge) {
          return successResponse(res, cached.map((row: any) => ({
            id: row.id,
            url: row.url,
            thumbnail: row.thumbnail,
            title: row.title,
            author: row.author,
            source: provider.name,
            sourceUrl: row.sourceUrl,
            createdAt: row.createdAt
          })))
        }
      }
    }

    // 从 API 获取新数据
    const headers = parseJsonField(provider.headers, {})
    if (provider.apiKey) {
      headers['Authorization'] = `Client-ID ${provider.apiKey}`
    }

    const params = parseJsonField(provider.params, {})
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    
    const url = queryString ? `${provider.apiUrl}?${queryString}` : provider.apiUrl

    console.log('[Wallpaper] Fetching from URL:', url)
    const response = await fetch(url, {
      method: provider.method || 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Wallpaper] API response:', JSON.stringify(data).substring(0, 500))
    
    // 解析数据
    const parser = parseJsonField(provider.parser, {})
    console.log('[Wallpaper] Parser config:', parser)
    const wallpapers = parseWallpapersFromResponse(data, parser, provider.id, provider.name)
    console.log('[Wallpaper] Parsed wallpapers:', wallpapers.length)

    // 保存到缓存
    if (wallpapers.length > 0) {
      // 清除旧缓存
      run('DELETE FROM wallpaper_provider_cache WHERE providerId = ?', [id])
      
      // 保存新数据
      for (const wp of wallpapers) {
        const cacheParams: any[] = [
          wp.id, 
          id, 
          wp.url, 
          wp.thumbnail, 
          wp.title || null, 
          wp.author || null, 
          wp.sourceUrl || null, 
          wp.createdAt
        ]
        console.log('[Wallpaper] Saving cache:', wp.id, wp.url?.substring(0, 50))
        run(
          `INSERT INTO wallpaper_provider_cache (id, providerId, url, thumbnail, title, author, sourceUrl, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          cacheParams
        )
      }
    }

    return successResponse(res, wallpapers)
  } catch (error) {
    console.error('获取壁纸列表失败:', error)
    return errorResponse(res, '获取壁纸列表失败')
  }
})

// 解析 API 响应数据
function parseWallpapersFromResponse(data: any, parser: any, providerId: string, providerName: string): any[] {
  const wallpapers: any[] = []
  
  if (!parser || !parser.imageUrlPath) {
    return wallpapers
  }

  try {
    // 简单的路径解析（支持基本的数组和对象路径）
    const images = extractValuesByPath(data, parser.imageUrlPath)
    const titles = parser.titlePath ? extractValuesByPath(data, parser.titlePath) : []
    const authors = parser.authorPath ? extractValuesByPath(data, parser.authorPath) : []

    for (let i = 0; i < images.length; i++) {
      if (images[i]) {
        wallpapers.push({
          id: `${providerId}_${i}_${Date.now()}`,
          url: resolveImageUrl(images[i]),
          thumbnail: resolveImageUrl(images[i]),
          title: titles[i] || undefined,
          author: authors[i] || undefined,
          source: providerName,
          sourceUrl: resolveImageUrl(images[i]),
          createdAt: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('解析壁纸数据失败:', error)
  }

  return wallpapers
}

// 根据路径提取值
function extractValuesByPath(data: any, path: string): any[] {
  const values: any[] = []
  
  // 处理数组路径，如 "images[].url" 或 "[].urls.regular"
  if (path.includes('[]')) {
    const [arrayPath, ...restPaths] = path.split('[].')
    let array = data
    
    if (arrayPath) {
      array = getValueByPath(data, arrayPath)
    }
    
    if (Array.isArray(array)) {
      for (const item of array) {
        if (restPaths.length > 0) {
          const value = getValueByPath(item, restPaths.join('.'))
          if (value) values.push(value)
        } else {
          values.push(item)
        }
      }
    }
  } else {
    const value = getValueByPath(data, path)
    if (Array.isArray(value)) {
      values.push(...value)
    } else if (value) {
      values.push(value)
    }
  }
  
  return values
}

// 根据点分隔路径获取值
function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    value = value[key]
  }
  
  return value
}

// 解析图片 URL（处理相对路径）
function resolveImageUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://www.bing.com${url}`
  return url
}

export default router
