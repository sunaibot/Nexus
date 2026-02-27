/**
 * BaseService - 通用 Service 基类
 * 提供标准的 CRUD 操作和查询构建功能
 * 高内聚：封装所有数据库操作逻辑
 * 低耦合：通过依赖注入获取数据库实例
 */

import {
  IBaseService,
  PaginationParams,
  PaginationResult,
  SortParams,
  FilterParams,
  QueryCondition,
  QueryOptions,
  NotFoundError,
  ValidationError
} from './types.js'
import { queryAll, queryOne, run } from '../utils/index.js'
import { generateId } from '../db/index.js'

export abstract class BaseService<T extends { id: string }, CreateDTO, UpdateDTO>
  implements IBaseService<T, CreateDTO, UpdateDTO>
{
  protected abstract tableName: string
  protected abstract defaultSortField: string
  protected abstract sortableFields: string[]

  /**
   * 将数据库行转换为实体对象
   * 子类需要实现此方法进行类型转换
   */
  protected abstract mapToEntity(row: unknown): T

  /**
   * 将创建 DTO 转换为数据库字段
   */
  protected abstract mapCreateToFields(data: CreateDTO): Record<string, unknown>

  /**
   * 将更新 DTO 转换为数据库字段
   */
  protected abstract mapUpdateToFields(data: UpdateDTO): Record<string, unknown>

  // ========== 基础 CRUD ==========

  /**
   * 根据 ID 查找实体
   */
  findById(id: string): T | null {
    const row = queryOne(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id])
    return row ? this.mapToEntity(row) : null
  }

  /**
   * 根据 ID 查找实体，不存在则抛出错误
   */
  findByIdOrThrow(id: string): T {
    const entity = this.findById(id)
    if (!entity) {
      throw new NotFoundError(this.tableName, id)
    }
    return entity
  }

  /**
   * 查找所有实体
   */
  findAll(filters?: FilterParams): T[] {
    const { whereClause, params } = this.buildWhereClause(filters)
    const orderClause = this.buildOrderClause({
      sortBy: this.defaultSortField,
      sortOrder: 'desc'
    })

    const rows = queryAll(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause}`,
      params
    )
    return rows.map(row => this.mapToEntity(row))
  }

  /**
   * 创建实体
   */
  async create(data: CreateDTO): Promise<T> {
    const fields = this.mapCreateToFields(data)
    const id = generateId()
    const now = new Date().toISOString()

    // 自动添加 id 和时间戳
    const allFields = {
      ...fields,
      id,
      createdAt: now,
      updatedAt: now
    }

    const columns = Object.keys(allFields)
    const placeholders = columns.map(() => '?').join(', ')
    const values = Object.values(allFields)

    run(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )

    return this.findByIdOrThrow(id)
  }

  /**
   * 更新实体
   */
  async update(id: string, data: UpdateDTO): Promise<T | null> {
    // 检查实体是否存在
    const existing = this.findById(id)
    if (!existing) {
      return null
    }

    const fields = this.mapUpdateToFields(data)
    const now = new Date().toISOString()

    // 自动更新 updatedAt
    const allFields = {
      ...fields,
      updatedAt: now
    }

    // 过滤掉 undefined 值
    const validFields = Object.entries(allFields).filter(
      ([, value]) => value !== undefined
    )

    if (validFields.length === 0) {
      return existing
    }

    const setClause = validFields.map(([key]) => `${key} = ?`).join(', ')
    const values = [...validFields.map(([, value]) => value), id]

    run(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      values
    )

    return this.findByIdOrThrow(id)
  }

  /**
   * 删除实体
   */
  delete(id: string): boolean {
    const result = run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id])
    return result.changes > 0
  }

  // ========== 分页查询 ==========

  /**
   * 分页查找实体
   */
  findPaginated(
    pagination: PaginationParams,
    filters?: FilterParams,
    sort?: SortParams
  ): PaginationResult<T> {
    const { page, pageSize } = pagination
    const offset = (page - 1) * pageSize

    const { whereClause, params } = this.buildWhereClause(filters)
    const orderClause = this.buildOrderClause(sort)

    // 获取总数
    const countResult = queryOne(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      params
    )
    const total = (countResult?.total as number) || 0
    const totalPages = Math.ceil(total / pageSize)

    // 获取数据
    const rows = queryAll(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return {
      items: rows.map(row => this.mapToEntity(row)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }
  }

  // ========== 批量操作 ==========

  /**
   * 批量创建
   */
  async createMany(items: CreateDTO[]): Promise<T[]> {
    const results: T[] = []
    for (const item of items) {
      results.push(await this.create(item))
    }
    return results
  }

  /**
   * 批量更新
   */
  async updateMany(ids: string[], data: UpdateDTO): Promise<number> {
    let updatedCount = 0
    for (const id of ids) {
      const updated = await this.update(id, data)
      if (updated) updatedCount++
    }
    return updatedCount
  }

  /**
   * 批量删除
   */
  deleteMany(ids: string[]): number {
    let deletedCount = 0
    for (const id of ids) {
      if (this.delete(id)) deletedCount++
    }
    return deletedCount
  }

  // ========== 查询构建器 ==========

  /**
   * 构建 WHERE 子句
   */
  protected buildWhereClause(filters?: FilterParams): {
    whereClause: string
    params: unknown[]
  } {
    if (!filters || Object.keys(filters).length === 0) {
      return { whereClause: '', params: [] }
    }

    const conditions: string[] = []
    const params: unknown[] = []

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        conditions.push(`${key} IN (${value.map(() => '?').join(', ')})`)
        params.push(...value)
      } else if (typeof value === 'string' && value.includes('%')) {
        conditions.push(`${key} LIKE ?`)
        params.push(value)
      } else {
        conditions.push(`${key} = ?`)
        params.push(value)
      }
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    }
  }

  /**
   * 构建 ORDER BY 子句
   */
  protected buildOrderClause(sort?: SortParams): string {
    if (!sort) {
      return `ORDER BY ${this.defaultSortField} DESC`
    }

    const { sortBy, sortOrder } = sort
    const validField = this.sortableFields.includes(sortBy)
      ? sortBy
      : this.defaultSortField

    return `ORDER BY ${validField} ${sortOrder.toUpperCase()}`
  }

  /**
   * 使用高级选项查询
   */
  protected queryWithOptions(options: QueryOptions): T[] {
    const { conditions, orderBy, limit, offset } = options

    let whereClause = ''
    const params: unknown[] = []

    if (conditions && conditions.length > 0) {
      const clauses = conditions.map(cond => {
        switch (cond.operator) {
          case 'eq':
            params.push(cond.value)
            return `${cond.field} = ?`
          case 'ne':
            params.push(cond.value)
            return `${cond.field} != ?`
          case 'gt':
            params.push(cond.value)
            return `${cond.field} > ?`
          case 'gte':
            params.push(cond.value)
            return `${cond.field} >= ?`
          case 'lt':
            params.push(cond.value)
            return `${cond.field} < ?`
          case 'lte':
            params.push(cond.value)
            return `${cond.field} <= ?`
          case 'like':
            params.push(cond.value)
            return `${cond.field} LIKE ?`
          case 'in':
            if (Array.isArray(cond.value)) {
              params.push(...cond.value)
              return `${cond.field} IN (${cond.value.map(() => '?').join(', ')})`
            }
            return ''
          case 'isNull':
            return `${cond.field} IS NULL`
          default:
            return ''
        }
      }).filter(Boolean)

      if (clauses.length > 0) {
        whereClause = `WHERE ${clauses.join(' AND ')}`
      }
    }

    let orderClause = ''
    if (orderBy && orderBy.length > 0) {
      orderClause = `ORDER BY ${orderBy.map(o => `${o.field} ${o.direction.toUpperCase()}`).join(', ')}`
    }

    let limitClause = ''
    if (limit !== undefined) {
      limitClause = `LIMIT ${limit}`
    }

    let offsetClause = ''
    if (offset !== undefined) {
      offsetClause = `OFFSET ${offset}`
    }

    const sql = `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`.trim()
    const rows = queryAll(sql, params)
    return rows.map(row => this.mapToEntity(row))
  }

  /**
   * 检查字段值是否唯一
   */
  protected isUnique(field: string, value: unknown, excludeId?: string): boolean {
    const sql = excludeId
      ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${field} = ? AND id != ?`
      : `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${field} = ?`
    const params = excludeId ? [value, excludeId] : [value]
    const result = queryOne(sql, params)
    return (result?.count as number) === 0
  }

  /**
   * 获取最大值（用于 orderIndex 等）
   */
  protected getMaxValue(field: string, whereClause?: string, params?: unknown[]): number {
    const sql = whereClause
      ? `SELECT MAX(${field}) as max FROM ${this.tableName} WHERE ${whereClause}`
      : `SELECT MAX(${field}) as max FROM ${this.tableName}`
    const result = queryOne(sql, params || [])
    return (result?.max as number) || 0
  }
}
