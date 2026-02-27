/**
 * 浏览器书签导入工具
 * 支持 Chrome、Firefox、Edge、Safari 等浏览器的书签导出格式
 */

import { Bookmark, Category } from '../types/bookmark'

// 浏览器书签节点类型
interface BrowserBookmarkNode {
  id?: string
  title?: string
  url?: string
  children?: BrowserBookmarkNode[]
  dateAdded?: number
  dateModified?: number
  icon?: string
  type?: 'text/x-moz-place' | 'text/x-moz-place-container' | 'text/x-moz-place-separator'
}

// Chrome/Edge 书签格式
interface ChromeBookmarkRoot {
  checksum?: string
  roots?: {
    bookmark_bar?: BrowserBookmarkNode
    other?: BrowserBookmarkNode
    synced?: BrowserBookmarkNode
  }
}

// Firefox 书签格式 (JSON)
interface FirefoxBookmarks {
  title?: string
  children?: BrowserBookmarkNode[]
  type?: string
}

// Netscape HTML 格式解析结果
interface ParsedHtmlBookmark {
  title: string
  url: string
  icon?: string
  addDate?: string
  folder?: string
}

/**
 * 检测文件类型
 */
export function detectBookmarkFormat(content: string): 'chrome' | 'firefox' | 'html' | 'unknown' {
  const trimmed = content.trim()
  
  // Chrome/Edge JSON 格式
  if (trimmed.startsWith('{') && trimmed.includes('"roots"')) {
    return 'chrome'
  }
  
  // Firefox JSON 格式
  if (trimmed.startsWith('{') && (trimmed.includes('"children"') || trimmed.includes('"type":"text/x-moz-place"'))) {
    return 'firefox'
  }
  
  // Netscape HTML 格式
  if (trimmed.toLowerCase().includes('<!doctype netscape-bookmark-file-1>') || 
      trimmed.toLowerCase().includes('<title>bookmarks</title>') ||
      (trimmed.includes('<h3') && trimmed.includes('<a href='))) {
    return 'html'
  }
  
  return 'unknown'
}

/**
 * 解析 Chrome/Edge 书签 JSON
 */
function parseChromeBookmarks(data: ChromeBookmarkRoot): { bookmarks: Bookmark[]; categories: Category[] } {
  const bookmarks: Bookmark[] = []
  const categories: Category[] = []
  let categoryOrder = 0
  
  function processNode(node: BrowserBookmarkNode, parentCategory?: string) {
    // 如果是文件夹（有 children 但没有 url）
    if (node.children && !node.url) {
      const categoryId = `imported_cat_${Date.now()}_${categoryOrder++}`
      const categoryName = node.title || '未命名文件夹'
      
      categories.push({
        id: categoryId,
        name: categoryName,
        icon: 'Folder',
        color: '#6366f1',
        orderIndex: categoryOrder,
      })
      
      // 递归处理子项
      for (const child of node.children) {
        processNode(child, categoryId)
      }
    }
    // 如果是书签（有 url）
    else if (node.url) {
      bookmarks.push({
        id: `imported_bm_${Date.now()}_${bookmarks.length}`,
        url: node.url,
        title: node.title || node.url,
        description: '',
        category: parentCategory || 'default',
        tags: [],
        orderIndex: bookmarks.length,
        isPinned: false,
        isReadLater: false,
        isRead: false,
        createdAt: node.dateAdded || Date.now(),
        updatedAt: node.dateModified || Date.now(),
      })
    }
  }
  
  // 处理各个根目录
  if (data.roots) {
    if (data.roots.bookmark_bar?.children) {
      for (const node of data.roots.bookmark_bar.children) {
        processNode(node)
      }
    }
    if (data.roots.other?.children) {
      for (const node of data.roots.other.children) {
        processNode(node)
      }
    }
    if (data.roots.synced?.children) {
      for (const node of data.roots.synced.children) {
        processNode(node)
      }
    }
  }
  
  return { bookmarks, categories }
}

/**
 * 解析 Firefox 书签 JSON
 */
function parseFirefoxBookmarks(data: FirefoxBookmarks): { bookmarks: Bookmark[]; categories: Category[] } {
  const bookmarks: Bookmark[] = []
  const categories: Category[] = []
  let categoryOrder = 0
  
  function processNode(node: BrowserBookmarkNode, parentCategory?: string) {
    // 跳过分隔符
    if (node.type === 'text/x-moz-place-separator') {
      return
    }
    
    // 如果是文件夹
    if (node.children || node.type === 'text/x-moz-place-container') {
      const categoryId = `imported_cat_${Date.now()}_${categoryOrder++}`
      const categoryName = node.title || '未命名文件夹'
      
      categories.push({
        id: categoryId,
        name: categoryName,
        icon: 'Folder',
        color: '#6366f1',
        orderIndex: categoryOrder,
      })
      
      // 递归处理子项
      if (node.children) {
        for (const child of node.children) {
          processNode(child, categoryId)
        }
      }
    }
    // 如果是书签
    else if (node.url) {
      bookmarks.push({
        id: `imported_bm_${Date.now()}_${bookmarks.length}`,
        url: node.url,
        title: node.title || node.url,
        description: '',
        category: parentCategory || 'default',
        tags: [],
        orderIndex: bookmarks.length,
        isPinned: false,
        isReadLater: false,
        isRead: false,
        createdAt: node.dateAdded || Date.now(),
        updatedAt: node.dateModified || Date.now(),
      })
    }
  }

  // 处理根节点
  if (data.children) {
    for (const child of data.children) {
      processNode(child)
    }
  }

  return { bookmarks, categories }
}

/**
 * 解析 Netscape HTML 书签格式
 */
function parseHtmlBookmarks(html: string): { bookmarks: Bookmark[]; categories: Category[] } {
  const bookmarks: Bookmark[] = []
  const categories: Category[] = []
  let categoryOrder = 0
  let currentCategory = 'default'
  
  // 创建临时 DOM 解析
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // 查找所有 DT 元素
  const dtElements = doc.querySelectorAll('dt')
  
  dtElements.forEach((dt) => {
    // 查找 H3（文件夹标题）
    const h3 = dt.querySelector('h3')
    if (h3) {
      const categoryId = `imported_cat_${Date.now()}_${categoryOrder++}`
      const categoryName = h3.textContent?.trim() || '未命名文件夹'
      
      categories.push({
        id: categoryId,
        name: categoryName,
        icon: 'Folder',
        color: '#6366f1',
        orderIndex: categoryOrder,
      })
      
      currentCategory = categoryId
      
      // 处理该文件夹下的书签
      const nextDd = dt.nextElementSibling
      if (nextDd && nextDd.tagName === 'DD') {
        const dl = nextDd.querySelector('dl')
        if (dl) {
          const links = dl.querySelectorAll('a')
          links.forEach((link, index) => {
            const url = link.getAttribute('href')
            if (url) {
              bookmarks.push({
                id: `imported_bm_${Date.now()}_${bookmarks.length}`,
                url: url,
                title: link.textContent?.trim() || url,
                description: '',
                category: categoryId,
                tags: [],
                orderIndex: index,
                isPinned: false,
                isReadLater: false,
                isRead: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              })
            }
          })
        }
      }
    }
    
    // 查找直接的书签链接
    const link = dt.querySelector('a')
    if (link) {
      const url = link.getAttribute('href')
      if (url && !url.startsWith('javascript:') && !url.startsWith('place:')) {
        bookmarks.push({
          id: `imported_bm_${Date.now()}_${bookmarks.length}`,
          url: url,
          title: link.textContent?.trim() || url,
          description: '',
          category: currentCategory,
          tags: [],
          orderIndex: bookmarks.length,
          isPinned: false,
          isReadLater: false,
          isRead: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }
    }
  })
  
  return { bookmarks, categories }
}

/**
 * 主转换函数
 */
export function convertBrowserBookmarks(content: string): { 
  bookmarks: Bookmark[]; 
  categories: Category[];
  format: string;
  count: number;
} {
  const format = detectBookmarkFormat(content)
  
  try {
    switch (format) {
      case 'chrome': {
        const chromeData = JSON.parse(content) as ChromeBookmarkRoot
        const result = parseChromeBookmarks(chromeData)
        return {
          ...result,
          format: 'Chrome/Edge',
          count: result.bookmarks.length,
        }
      }
      
      case 'firefox': {
        const firefoxData = JSON.parse(content) as FirefoxBookmarks
        const result = parseFirefoxBookmarks(firefoxData)
        return {
          ...result,
          format: 'Firefox',
          count: result.bookmarks.length,
        }
      }
      
      case 'html': {
        const result = parseHtmlBookmarks(content)
        return {
          ...result,
          format: 'HTML (通用)',
          count: result.bookmarks.length,
        }
      }
      
      default:
        throw new Error('无法识别的书签格式')
    }
  } catch (error: any) {
    throw new Error(`解析书签文件失败: ${error.message}`)
  }
}

/**
 * 验证文件是否为有效的书签文件
 */
export function validateBookmarkFile(file: File): Promise<{ valid: boolean; format?: string; error?: string }> {
  return new Promise((resolve) => {
    // 检查文件扩展名
    const validExtensions = ['.json', '.html', '.htm']
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidExtension && file.type !== 'application/json' && !file.type.includes('html')) {
      resolve({ valid: false, error: '不支持的文件格式，请选择 .json 或 .html 文件' })
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        if (!content || content.trim().length === 0) {
          resolve({ valid: false, error: '文件内容为空' })
          return
        }
        
        const format = detectBookmarkFormat(content)
        
        if (format === 'unknown') {
          resolve({ valid: false, error: '无法识别的书签格式' })
          return
        }
        
        // 尝试解析验证
        const result = convertBrowserBookmarks(content)
        
        if (result.bookmarks.length === 0 && result.categories.length === 0) {
          resolve({ valid: false, error: '未找到有效的书签数据' })
          return
        }
        
        resolve({ valid: true, format: result.format })
      } catch (error: any) {
        resolve({ valid: false, error: error.message })
      }
    }
    
    reader.onerror = () => {
      resolve({ valid: false, error: '读取文件失败' })
    }
    
    reader.readAsText(file)
  })
}
