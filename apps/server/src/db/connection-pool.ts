/**
 * 数据库连接池管理器
 * 第三阶段 - 性能优化核心组件
 * 
 * 功能特性：
 * 1. 连接复用 - 减少数据库连接开销
 * 2. 连接限流 - 防止连接数过多导致系统崩溃
 * 3. 健康检查 - 自动检测和回收失效连接
 * 4. 性能监控 - 实时统计连接池状态
 */

import type { Database as SqlJsDatabase } from 'sql.js'
import { logger } from '../utils/logger.js'

/**
 * 连接池配置
 */
interface PoolConfig {
  maxConnections: number      // 最大连接数
  minConnections: number      // 最小连接数
  acquireTimeout: number      // 获取连接超时时间（毫秒）
  idleTimeout: number         // 连接空闲超时时间（毫秒）
  maxLifetime: number         // 连接最大生命周期（毫秒）
  healthCheckInterval: number // 健康检查间隔（毫秒）
}

/**
 * 连接池统计信息
 */
interface PoolStats {
  total: number          // 总连接数
  active: number         // 活跃连接数
  idle: number           // 空闲连接数
  waiting: number        // 等待获取连接的请求数
  totalRequests: number  // 总请求数
  totalWaitTime: number  // 总等待时间
  avgWaitTime: number    // 平均等待时间
  maxWaitTime: number    // 最大等待时间
}

/**
 * 池化连接
 */
interface PooledConnection {
  id: string
  db: SqlJsDatabase
  createdAt: number
  lastUsedAt: number
  useCount: number
  isActive: boolean
  isHealthy: boolean
}

/**
 * 等待请求的Promise
 */
interface WaitingRequest {
  resolve: (connection: SqlJsDatabase) => void
  reject: (error: Error) => void
  startTime: number
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  acquireTimeout: 5000,
  idleTimeout: 300000,    // 5分钟
  maxLifetime: 1800000,   // 30分钟
  healthCheckInterval: 60000 // 1分钟
}

/**
 * 连接池管理器
 */
export class ConnectionPool {
  private config: PoolConfig
  private connections: Map<string, PooledConnection> = new Map()
  private idleConnections: string[] = []
  private waitingRequests: WaitingRequest[] = []
  private stats: PoolStats = {
    total: 0,
    active: 0,
    idle: 0,
    waiting: 0,
    totalRequests: 0,
    totalWaitTime: 0,
    avgWaitTime: 0,
    maxWaitTime: 0
  }
  private healthCheckTimer: NodeJS.Timeout | null = null
  private connectionFactory: () => Promise<SqlJsDatabase>
  private isShuttingDown = false

  constructor(
    connectionFactory: () => Promise<SqlJsDatabase>,
    config: Partial<PoolConfig> = {}
  ) {
    this.connectionFactory = connectionFactory
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startHealthCheck()
    logger.info('[ConnectionPool] 连接池初始化完成', { config: this.config })
  }

  /**
   * 获取连接
   */
  async acquire(): Promise<SqlJsDatabase> {
    if (this.isShuttingDown) {
      throw new Error('连接池正在关闭')
    }

    const startTime = Date.now()
    this.stats.totalRequests++

    // 1. 尝试获取空闲连接
    const idleConnection = this.getIdleConnection()
    if (idleConnection) {
      this.recordWaitTime(Date.now() - startTime)
      return idleConnection.db
    }

    // 2. 如果未达到最大连接数，创建新连接
    if (this.connections.size < this.config.maxConnections) {
      try {
        const connection = await this.createConnection()
        this.recordWaitTime(Date.now() - startTime)
        return connection.db
      } catch (error) {
        logger.error('[ConnectionPool] 创建连接失败', error as Error)
        throw error
      }
    }

    // 3. 等待可用连接
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingRequests.findIndex(r => r.resolve === resolve)
        if (index > -1) {
          this.waitingRequests.splice(index, 1)
        }
        reject(new Error(`获取连接超时 (${this.config.acquireTimeout}ms)`))
      }, this.config.acquireTimeout)

      const request: WaitingRequest = {
        resolve: (conn) => {
          clearTimeout(timeout)
          this.recordWaitTime(Date.now() - startTime)
          resolve(conn)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
        startTime
      }

      this.waitingRequests.push(request)
      this.stats.waiting = this.waitingRequests.length
    })
  }

  /**
   * 释放连接
   */
  release(db: SqlJsDatabase): void {
    const connection = this.findConnection(db)
    if (!connection) {
      logger.warn('[ConnectionPool] 尝试释放未管理的连接')
      return
    }

    connection.isActive = false
    connection.lastUsedAt = Date.now()

    // 检查连接是否需要回收
    if (this.shouldRecycle(connection)) {
      this.destroyConnection(connection.id)
      this.processWaitingRequests()
      return
    }

    // 归还到空闲池
    if (!this.idleConnections.includes(connection.id)) {
      this.idleConnections.push(connection.id)
    }

    this.updateStats()
    this.processWaitingRequests()
  }

  /**
   * 执行查询（自动管理连接）
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const db = await this.acquire()
    try {
      const stmt = db.prepare(sql)
      if (params) {
        stmt.bind(params)
      }
      const results: T[] = []
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T)
      }
      stmt.free()
      return results
    } finally {
      this.release(db)
    }
  }

  /**
   * 执行命令（自动管理连接）
   */
  async run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
    const db = await this.acquire()
    try {
      const stmt = db.prepare(sql)
      if (params) {
        stmt.bind(params)
      }
      stmt.step()
      stmt.free()
      return {
        changes: 1,
        lastInsertRowid: this.getLastInsertRowid(db)
      }
    } finally {
      this.release(db)
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): PoolStats {
    return { ...this.stats }
  }

  /**
   * 关闭连接池
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true
    logger.info('[ConnectionPool] 开始关闭连接池...')

    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    // 拒绝所有等待中的请求
    while (this.waitingRequests.length > 0) {
      const request = this.waitingRequests.shift()!
      request.reject(new Error('连接池已关闭'))
    }

    // 关闭所有连接
    const closePromises = Array.from(this.connections.values()).map(async (conn) => {
      try {
        // sql.js 不需要显式关闭，但我们可以清理引用
        this.connections.delete(conn.id)
      } catch (error) {
        logger.error('[ConnectionPool] 关闭连接失败', error as Error)
      }
    })

    await Promise.all(closePromises)
    this.connections.clear()
    this.idleConnections = []
    
    logger.info('[ConnectionPool] 连接池已关闭')
  }

  /**
   * 创建新连接
   */
  private async createConnection(): Promise<PooledConnection> {
    const db = await this.connectionFactory()
    const connection: PooledConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      db,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
      isActive: true,
      isHealthy: true
    }

    this.connections.set(connection.id, connection)
    this.updateStats()
    
    logger.debug('[ConnectionPool] 创建新连接', { connectionId: connection.id })
    return connection
  }

  /**
   * 获取空闲连接
   */
  private getIdleConnection(): PooledConnection | null {
    while (this.idleConnections.length > 0) {
      const connectionId = this.idleConnections.shift()!
      const connection = this.connections.get(connectionId)

      if (!connection) {
        continue
      }

      // 检查连接是否过期
      if (this.shouldRecycle(connection)) {
        this.destroyConnection(connectionId)
        continue
      }

      connection.isActive = true
      connection.useCount++
      connection.lastUsedAt = Date.now()
      this.updateStats()
      
      return connection
    }

    return null
  }

  /**
   * 判断连接是否需要回收
   */
  private shouldRecycle(connection: PooledConnection): boolean {
    const now = Date.now()
    return (
      !connection.isHealthy ||
      now - connection.createdAt > this.config.maxLifetime ||
      (now - connection.lastUsedAt > this.config.idleTimeout && this.connections.size > this.config.minConnections)
    )
  }

  /**
   * 销毁连接
   */
  private destroyConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    this.connections.delete(connectionId)
    const idleIndex = this.idleConnections.indexOf(connectionId)
    if (idleIndex > -1) {
      this.idleConnections.splice(idleIndex, 1)
    }

    logger.debug('[ConnectionPool] 销毁连接', { connectionId })
    this.updateStats()
  }

  /**
   * 处理等待中的请求
   */
  private processWaitingRequests(): void {
    while (this.waitingRequests.length > 0 && this.idleConnections.length > 0) {
      const request = this.waitingRequests.shift()!
      const connection = this.getIdleConnection()
      
      if (connection) {
        request.resolve(connection.db)
      } else {
        // 连接被回收，重新放入队列
        this.waitingRequests.unshift(request)
        break
      }
    }
    this.stats.waiting = this.waitingRequests.length
  }

  /**
   * 查找连接
   */
  private findConnection(db: SqlJsDatabase): PooledConnection | undefined {
    for (const conn of this.connections.values()) {
      if (conn.db === db) {
        return conn
      }
    }
    return undefined
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    let active = 0
    let idle = 0

    for (const conn of this.connections.values()) {
      if (conn.isActive) {
        active++
      } else {
        idle++
      }
    }

    this.stats.total = this.connections.size
    this.stats.active = active
    this.stats.idle = idle
  }

  /**
   * 记录等待时间
   */
  private recordWaitTime(waitTime: number): void {
    this.stats.totalWaitTime += waitTime
    this.stats.avgWaitTime = this.stats.totalWaitTime / this.stats.totalRequests
    if (waitTime > this.stats.maxWaitTime) {
      this.stats.maxWaitTime = waitTime
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  /**
   * 执行健康检查
   */
  private performHealthCheck(): void {
    const now = Date.now()
    let recycled = 0

    for (const [id, connection] of this.connections.entries()) {
      // 检查连接是否过期
      if (this.shouldRecycle(connection)) {
        this.destroyConnection(id)
        recycled++
        continue
      }

      // 标记为健康
      connection.isHealthy = true
    }

    // 确保最小连接数
    const missingConnections = this.config.minConnections - this.connections.size
    if (missingConnections > 0) {
      for (let i = 0; i < missingConnections; i++) {
        this.createConnection().catch(error => {
          logger.error('[ConnectionPool] 创建最小连接失败', error as Error)
        })
      }
    }

    if (recycled > 0) {
      logger.debug('[ConnectionPool] 健康检查回收连接', { recycled })
    }

    this.processWaitingRequests()
  }

  /**
   * 获取最后插入的行ID
   */
  private getLastInsertRowid(db: SqlJsDatabase): number {
    try {
      const result = db.exec('SELECT last_insert_rowid()')
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0] as number
      }
    } catch (error) {
      logger.error('[ConnectionPool] 获取last_insert_rowid失败', error as Error)
    }
    return 0
  }
}

/**
 * 全局连接池实例
 */
let globalPool: ConnectionPool | null = null

/**
 * 初始化连接池
 */
export function initConnectionPool(
  connectionFactory: () => Promise<SqlJsDatabase>,
  config?: Partial<PoolConfig>
): ConnectionPool {
  if (globalPool) {
    logger.warn('[ConnectionPool] 连接池已初始化，返回现有实例')
    return globalPool
  }

  globalPool = new ConnectionPool(connectionFactory, config)
  return globalPool
}

/**
 * 获取连接池实例
 */
export function getConnectionPool(): ConnectionPool {
  if (!globalPool) {
    throw new Error('连接池未初始化，请先调用 initConnectionPool()')
  }
  return globalPool
}

/**
 * 关闭连接池
 */
export async function closeConnectionPool(): Promise<void> {
  if (globalPool) {
    await globalPool.shutdown()
    globalPool = null
  }
}

/**
 * 执行查询（使用全局连接池）
 */
export async function poolQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getConnectionPool()
  return pool.query<T>(sql, params)
}

/**
 * 执行命令（使用全局连接池）
 */
export async function poolRun(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
  const pool = getConnectionPool()
  return pool.run(sql, params)
}

/**
 * 获取连接池统计
 */
export function getPoolStats(): PoolStats {
  const pool = getConnectionPool()
  return pool.getStats()
}
