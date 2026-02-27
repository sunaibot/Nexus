/**
 * 用户管理 Hook
 * 高内聚：封装所有用户相关操作
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  UserDetail,
  UserFilters,
  BatchAction,
} from '../types/user'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  batchUpdateUsers,
  fetchUserStats,
  type CreateUserData,
  type UpdateUserData,
} from '../../../lib/api-client/users'

interface UseUsersOptions {
  autoLoad?: boolean
  pageSize?: number
}

export function useUsers(options: UseUsersOptions = {}) {
  const { autoLoad = true, pageSize = 20 } = options

  const [users, setUsers] = useState<UserDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 加载用户数据并关联统计
  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 获取用户数据
      const usersData = await fetchUsers()

      // 为每个用户获取统计信息
      const usersWithStats: UserDetail[] = await Promise.all(
        usersData.map(async (user) => {
          try {
            const stats = await fetchUserStats(user.id)
            return {
              ...user,
              loginCount: 0,
              lastLoginAt: undefined,
              stats,
            }
          } catch {
            // 如果获取统计失败，使用默认值
            return {
              ...user,
              loginCount: 0,
              lastLoginAt: undefined,
              stats: {
                bookmarkCount: 0,
                categoryCount: 0,
                tagCount: 0,
                totalVisits: 0,
                favoriteCategory: undefined,
              },
            }
          }
        })
      )

      setUsers(usersWithStats)
      setTotal(usersWithStats.length)
    } catch (err: any) {
      setError(err.message || '加载用户失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 筛选和排序用户
  const filteredUsers = useMemo(() => {
    let result = [...users]

    // 搜索筛选
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query))
      )
    }

    // 角色筛选
    if (filters.role && filters.role !== 'all') {
      result = result.filter((u) => u.role === filters.role)
    }

    // 状态筛选
    if (filters.status && filters.status !== 'all') {
      result = result.filter((u) =>
        filters.status === 'active' ? u.isActive : !u.isActive
      )
    }

    // 排序
    if (filters.sortBy) {
      result.sort((a, b) => {
        let comparison = 0
        switch (filters.sortBy) {
          case 'username':
            comparison = a.username.localeCompare(b.username)
            break
          case 'createdAt':
            comparison = a.createdAt - b.createdAt
            break
          case 'lastLogin':
            comparison = (a.lastLoginAt || 0) - (b.lastLoginAt || 0)
            break
          case 'bookmarkCount':
            comparison = a.stats.bookmarkCount - b.stats.bookmarkCount
            break
        }
        return filters.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    return result
  }, [users, filters])

  // 分页
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page, pageSize])

  const totalPages = Math.ceil(filteredUsers.length / pageSize)

  // 创建用户
  const handleCreate = useCallback(
    async (data: CreateUserData) => {
      try {
        await createUser(data)
        await loadUsers()
        return true
      } catch (err: any) {
        setError(err.message || '创建用户失败')
        return false
      }
    },
    [loadUsers]
  )

  // 更新用户
  const handleUpdate = useCallback(
    async (id: string, data: UpdateUserData) => {
      try {
        await updateUser(id, data)
        await loadUsers()
        return true
      } catch (err: any) {
        setError(err.message || '更新用户失败')
        return false
      }
    },
    [loadUsers]
  )

  // 删除用户
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteUser(id)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        await loadUsers()
        return true
      } catch (err: any) {
        setError(err.message || '删除用户失败')
        return false
      }
    },
    [loadUsers]
  )

  // 批量操作
  const handleBatchAction = useCallback(
    async (action: BatchAction) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return false

      try {
        switch (action) {
          case 'activate':
            await batchUpdateUsers(ids, { isActive: true })
            break
          case 'deactivate':
            await batchUpdateUsers(ids, { isActive: false })
            break
          case 'delete':
            await Promise.all(ids.map((id) => deleteUser(id)))
            break
        }
        setSelectedIds(new Set())
        await loadUsers()
        return true
      } catch (err: any) {
        setError(err.message || '批量操作失败')
        return false
      }
    },
    [selectedIds, loadUsers]
  )

  // 选择/取消选择
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === paginatedUsers.length) {
        return new Set()
      }
      return new Set(paginatedUsers.map((u) => u.id))
    })
  }, [paginatedUsers])

  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      loadUsers()
    }
  }, [autoLoad, loadUsers])

  return {
    users: paginatedUsers,
    allUsers: users,
    filteredUsers,
    isLoading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    total: filteredUsers.length,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    refresh: loadUsers,
    createUser: handleCreate,
    updateUser: handleUpdate,
    deleteUser: handleDelete,
    batchAction: handleBatchAction,
  }
}
