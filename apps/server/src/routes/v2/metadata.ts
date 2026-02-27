/**
 * 元数据路由 - V2版本
 * 提供书签元数据提取
 */

import { Router, Request, Response } from 'express'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 提取URL元数据
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url } = req.body

    if (!url) {
      return errorResponse(res, 'URL不能为空')
    }

    // 使用 cheerio 和 axios 获取网页元数据
    const metadata = await extractMetadata(url)

    return successResponse(res, metadata)
  } catch (error) {
    console.error('提取元数据失败:', error)
    return errorResponse(res, '提取元数据失败')
  }
})

// 提取元数据的辅助函数
async function extractMetadata(url: string) {
  try {
    // 动态导入 axios
    const { default: axios } = await import('axios')
    const { load } = await import('cheerio')

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
    })

    const html = response.data
    const $ = load(html)

    // 提取标题
    const title = $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  ''

    // 提取描述
    const description = $('meta[name="description"]').attr('content') ||
                        $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content') ||
                        ''

    // 提取图标
    let favicon = $('link[rel="icon"]').attr('href') ||
                  $('link[rel="shortcut icon"]').attr('href') ||
                  $('link[rel="apple-touch-icon"]').attr('href') ||
                  ''

    // 将相对路径的图标转换为绝对路径
    if (favicon && !favicon.startsWith('http')) {
      const urlObj = new URL(url)
      if (favicon.startsWith('/')) {
        favicon = `${urlObj.protocol}//${urlObj.host}${favicon}`
      } else {
        favicon = `${urlObj.protocol}//${urlObj.host}/${favicon}`
      }
    }

    // 如果没有找到图标，使用默认的 favicon.ico
    if (!favicon) {
      const urlObj = new URL(url)
      favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
    }

    // 提取 OG 图片
    const ogImage = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') ||
                    ''

    return {
      url,
      title,
      description,
      favicon,
      ogImage,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('提取元数据失败:', error)
    // 返回默认值
    return {
      url,
      title: '',
      description: '',
      favicon: '',
      ogImage: '',
      timestamp: new Date().toISOString(),
    }
  }
}

export default router
