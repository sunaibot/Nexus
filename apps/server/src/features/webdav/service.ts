/**
 * WebDAV服务层
 * 支持多协议书签同步
 */

import {
  WebDAVConfig,
  WebDAVProtocol,
  SyncDirection,
  SyncResult,
  SyncStatus,
  BookmarkData,
  BookmarkItem,
  CategoryItem,
  SyncConflict,
  ConnectionTestResult,
  ProtocolConfig,
} from './types.js'
import { createClient, WebDAVClient } from 'webdav'
import { queryAll, runQuery, generateId } from '../../utils/index.js'

/**
 * WebDAV服务类
 */
export class WebDAVService {
  private static instance: WebDAVService
  private clients: Map<string, WebDAVClient> = new Map()

  private constructor() {}

  static getInstance(): WebDAVService {
    if (!WebDAVService.instance) {
      WebDAVService.instance = new WebDAVService()
    }
    return WebDAVService.instance
  }

  /**
   * 获取或创建WebDAV客户端
   */
  private getClient(config: WebDAVConfig): WebDAVClient {
    const key = config.id
    if (!this.clients.has(key)) {
      const client = createClient(config.serverUrl, {
        username: config.username,
        password: config.password,
        headers: this.getProtocolHeaders(config),
      })
      this.clients.set(key, client)
    }
    return this.clients.get(key)!
  }

  /**
   * 获取协议特定请求头
   */
  private getProtocolHeaders(config: WebDAVConfig): Record<string, string> {
    switch (config.protocol) {
      case WebDAVProtocol.NEXTCLOUD:
        return {
          'OCS-APIRequest': 'true',
          'Accept': 'application/json',
        }
      case WebDAVProtocol.ONEDRIVE:
        return {
          'Accept': 'application/json',
        }
      case WebDAVProtocol.DROPBOX:
        return {
          'Accept': 'application/json',
        }
      default:
        return {}
    }
  }

  /**
   * 测试连接
   */
  async testConnection(config: Omit<WebDAVConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConnectionTestResult> {
    try {
      const client = createClient(config.serverUrl, {
        username: config.username,
        password: config.password,
        headers: this.getProtocolHeaders(config as WebDAVConfig),
      })

      // 尝试获取目录列表
      const directoryItems = await client.getDirectoryContents('/')

      return {
        success: true,
        message: '连接成功',
        serverInfo: {
          capabilities: ['webdav'],
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: `连接失败: ${error.message || '未知错误'}`,
      }
    }
  }

  /**
   * 同步书签
   */
  async syncBookmarks(config: WebDAVConfig): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      direction: config.syncDirection,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    }

    try {
      // 记录同步开始
      this.recordSyncHistory(config.id, SyncStatus.SYNCING, config.syncDirection)

      switch (config.syncDirection) {
        case SyncDirection.UPLOAD:
          result.uploaded = await this.uploadBookmarks(config)
          break
        case SyncDirection.DOWNLOAD:
          result.downloaded = await this.downloadBookmarks(config)
          break
        case SyncDirection.BIDIRECTIONAL:
          const syncResults = await this.bidirectionalSync(config)
          result.uploaded = syncResults.uploaded
          result.downloaded = syncResults.downloaded
          result.conflicts = syncResults.conflicts
          break
      }

      // 更新最后同步时间
      this.updateLastSyncTime(config.id)

      result.success = true
      this.recordSyncHistory(config.id, SyncStatus.SUCCESS, config.syncDirection, result)
    } catch (error: any) {
      result.errors.push(error.message || '同步失败')
      this.recordSyncHistory(config.id, SyncStatus.ERROR, config.syncDirection, result)
    }

    return result
  }

  /**
   * 上传书签到WebDAV
   */
  private async uploadBookmarks(config: WebDAVConfig): Promise<number> {
    const client = this.getClient(config)

    // 获取本地书签数据
    const bookmarkData = await this.getLocalBookmarkData()

    // 确保远程目录存在
    const remoteDir = config.remotePath || '/bookmarks'
    try {
      await client.createDirectory(remoteDir, { recursive: true })
    } catch (e) {
      // 目录可能已存在
    }

    // 上传书签文件
    const fileName = `bookmarks-${new Date().toISOString().split('T')[0]}.json`
    const filePath = `${remoteDir}/${fileName}`

    await client.putFileContents(
      filePath,
      JSON.stringify(bookmarkData, null, 2),
      { overwrite: true }
    )

    // 同时上传最新版本
    const latestPath = `${remoteDir}/bookmarks-latest.json`
    await client.putFileContents(
      latestPath,
      JSON.stringify(bookmarkData, null, 2),
      { overwrite: true }
    )

    return bookmarkData.bookmarks.length
  }

  /**
   * 从WebDAV下载书签
   */
  private async downloadBookmarks(config: WebDAVConfig): Promise<number> {
    const client = this.getClient(config)
    const remotePath = `${config.remotePath || '/bookmarks'}/bookmarks-latest.json`

    try {
      const content = await client.getFileContents(remotePath, { format: 'text' })
      const bookmarkData: BookmarkData = JSON.parse(content as string)

      // 导入书签到本地
      await this.importBookmarks(bookmarkData)

      return bookmarkData.bookmarks.length
    } catch (error: any) {
      throw new Error(`下载失败: ${error.message}`)
    }
  }

  /**
   * 双向同步
   */
  private async bidirectionalSync(config: WebDAVConfig): Promise<{
    uploaded: number
    downloaded: number
    conflicts: number
  }> {
    const client = this.getClient(config)
    const remotePath = `${config.remotePath || '/bookmarks'}/bookmarks-latest.json`

    // 获取本地数据
    const localData = await this.getLocalBookmarkData()

    // 获取远程数据
    let remoteData: BookmarkData
    try {
      const content = await client.getFileContents(remotePath, { format: 'text' })
      remoteData = JSON.parse(content as string)
    } catch (e) {
      // 远程没有数据，直接上传本地数据
      await this.uploadBookmarks(config)
      return { uploaded: localData.bookmarks.length, downloaded: 0, conflicts: 0 }
    }

    // 合并数据
    const merged = this.mergeBookmarks(localData, remoteData)

    // 上传合并后的数据
    const remoteDir = config.remotePath || '/bookmarks'
    await client.putFileContents(
      `${remoteDir}/bookmarks-latest.json`,
      JSON.stringify(merged, null, 2),
      { overwrite: true }
    )

    // 导入合并后的数据到本地
    await this.importBookmarks(merged)

    return {
      uploaded: merged.bookmarks.length,
      downloaded: remoteData.bookmarks.length,
      conflicts: merged.conflicts?.length || 0,
    }
  }

  /**
   * 获取本地书签数据
   */
  private async getLocalBookmarkData(): Promise<BookmarkData & { conflicts?: SyncConflict[] }> {
    const bookmarks = queryAll('SELECT * FROM bookmarks ORDER BY "order" ASC', [])
    const categories = queryAll('SELECT * FROM categories ORDER BY "order" ASC', [])

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bookmarks: bookmarks.map((b: any) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        category: b.category,
        favicon: b.favicon,
        description: b.description,
        order: b.order,
        isPinned: b.isPinned === 1,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      categories: categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order,
      })),
    }
  }

  /**
   * 导入书签到本地
   */
  private async importBookmarks(data: BookmarkData): Promise<void> {
    // 导入分类
    if (data.categories && data.categories.length > 0) {
      for (const category of data.categories) {
        const existing = queryAll('SELECT id FROM categories WHERE id = ?', [category.id])
        if (existing.length === 0) {
          runQuery(
            'INSERT INTO categories (id, name, icon, color, "order") VALUES (?, ?, ?, ?, ?)',
            [category.id, category.name, category.icon || null, category.color || null, category.order]
          )
        }
      }
    }

    // 导入书签
    if (data.bookmarks && data.bookmarks.length > 0) {
      for (const bookmark of data.bookmarks) {
        const existing = queryAll('SELECT id FROM bookmarks WHERE id = ?', [bookmark.id])
        if (existing.length === 0) {
          runQuery(
            `INSERT INTO bookmarks (id, title, url, category, favicon, description, "order", isPinned, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bookmark.id,
              bookmark.title,
              bookmark.url,
              bookmark.category,
              bookmark.favicon || null,
              bookmark.description || null,
              bookmark.order,
              bookmark.isPinned ? 1 : 0,
              bookmark.createdAt,
              bookmark.updatedAt,
            ]
          )
        }
      }
    }
  }

  /**
   * 合并书签数据
   */
  private mergeBookmarks(
    local: BookmarkData,
    remote: BookmarkData
  ): BookmarkData & { conflicts?: SyncConflict[] } {
    const conflicts: SyncConflict[] = []
    const mergedBookmarks: BookmarkItem[] = [...local.bookmarks]
    const mergedCategories: CategoryItem[] = [...local.categories]

    // 合并远程书签
    for (const remoteBookmark of remote.bookmarks) {
      const localIndex = mergedBookmarks.findIndex(b => b.id === remoteBookmark.id)

      if (localIndex === -1) {
        // 本地没有，添加
        mergedBookmarks.push(remoteBookmark)
      } else {
        const localBookmark = mergedBookmarks[localIndex]
        // 比较更新时间
        if (new Date(remoteBookmark.updatedAt) > new Date(localBookmark.updatedAt)) {
          // 远程更新，替换
          mergedBookmarks[localIndex] = remoteBookmark
        } else if (new Date(remoteBookmark.updatedAt) < new Date(localBookmark.updatedAt)) {
          // 本地更新，保留本地
        } else {
          // 时间相同但内容不同，记录冲突
          if (JSON.stringify(localBookmark) !== JSON.stringify(remoteBookmark)) {
            conflicts.push({
              bookmarkId: remoteBookmark.id,
              localBookmark,
              remoteBookmark,
            })
          }
        }
      }
    }

    // 合并分类
    for (const remoteCategory of remote.categories) {
      if (!mergedCategories.find(c => c.id === remoteCategory.id)) {
        mergedCategories.push(remoteCategory)
      }
    }

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bookmarks: mergedBookmarks,
      categories: mergedCategories,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    }
  }

  /**
   * 记录同步历史
   */
  private recordSyncHistory(
    configId: string,
    status: SyncStatus,
    direction: SyncDirection,
    result?: SyncResult
  ): void {
    const id = generateId()
    const now = new Date().toISOString()

    runQuery(
      `INSERT INTO webdav_sync_history (id, configId, status, direction, uploaded, downloaded, conflicts, errors, startedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        configId,
        status,
        direction,
        result?.uploaded || 0,
        result?.downloaded || 0,
        result?.conflicts || 0,
        result?.errors ? JSON.stringify(result.errors) : null,
        now,
      ]
    )
  }

  /**
   * 更新最后同步时间
   */
  private updateLastSyncTime(configId: string): void {
    const now = new Date().toISOString()
    runQuery(
      'UPDATE webdav_configs SET lastSync = ?, updatedAt = ? WHERE id = ?',
      [now, now, configId]
    )
  }

  /**
   * 清除客户端缓存
   */
  clearClientCache(configId?: string): void {
    if (configId) {
      this.clients.delete(configId)
    } else {
      this.clients.clear()
    }
  }
}

/**
 * 服务实例导出
 */
export const webDAVService = WebDAVService.getInstance()
