/**
 * 用户管理页面
 * 模块化、高内聚、低耦合设计
 * 与书签系统深度集成
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Users as UsersIcon, LayoutGrid, List } from 'lucide-react'
import { useUsers } from '../hooks'
import { UserCard, UserForm, UserFilters, BatchActions } from '../components'
import { UserDetail, CreateUserData, UpdateUserData } from '../types/user'
import { useToast } from '../../../components/admin/Toast'
import { cn } from '../../../lib/utils'

type ViewMode = 'grid' | 'list'

export default function UsersPage() {
  const { showToast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null)

  const {
    users,
    allUsers,
    filteredUsers,
    isLoading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    total,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    refresh,
    createUser,
    updateUser,
    deleteUser,
    batchAction,
  } = useUsers({ autoLoad: true, pageSize: 12 })

  // 处理创建用户
  const handleCreate = async (data: CreateUserData) => {
    const success = await createUser(data)
    if (success) {
      showToast('success', '用户创建成功')
    }
    return success
  }

  // 处理更新用户
  const handleUpdate = async (id: string, data: UpdateUserData) => {
    const success = await updateUser(id, data)
    if (success) {
      showToast('success', '用户更新成功')
    }
    return success
  }

  // 处理删除用户
  const handleDelete = async (user: UserDetail) => {
    if (!confirm(`确定要删除用户 "${user.username}" 吗？\n\n注意：该用户拥有的 ${user.stats.bookmarkCount} 个书签和 ${user.stats.categoryCount} 个分类也将被删除。此操作不可恢复。`)) {
      return
    }
    const success = await deleteUser(user.id)
    if (success) {
      showToast('success', '用户删除成功')
    }
  }

  // 处理批量操作
  const handleBatchAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const actionNames = {
      activate: '启用',
      deactivate: '禁用',
      delete: '删除',
    }
    const success = await batchAction(action)
    if (success) {
      showToast('success', `批量${actionNames[action]}成功`)
    }
  }

  // 处理切换用户状态
  const handleToggleStatus = async (user: UserDetail) => {
    const success = await updateUser(user.id, { isActive: !user.isActive })
    if (success) {
      showToast('success', user.isActive ? '用户已禁用' : '用户已启用')
    }
  }

  // 打开编辑表单
  const handleEdit = (user: UserDetail) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  // 打开创建表单
  const handleAdd = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  // 关闭表单
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingUser(null)
  }

  // 提交表单
  const handleSubmit = async (data: CreateUserData | UpdateUserData) => {
    if (editingUser) {
      return handleUpdate(editingUser.id, data as UpdateUserData)
    } else {
      return handleCreate(data as CreateUserData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            用户管理
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            共 {allUsers.length} 个用户
            {filteredUsers.length !== allUsers.length && `，筛选后 ${filteredUsers.length} 个`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 视图切换 */}
          <div className="flex items-center rounded-xl p-1" style={{ background: 'var(--color-bg-tertiary)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' && 'shadow-sm'
              )}
              style={{
                background: viewMode === 'grid' ? 'var(--color-bg-secondary)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' && 'shadow-sm'
              )}
              style={{
                background: viewMode === 'list' ? 'var(--color-bg-secondary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <motion.button
            onClick={refresh}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium disabled:opacity-50"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            刷新
          </motion.button>

          <motion.button
            onClick={handleAdd}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium"
            style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
          >
            <Plus className="w-4 h-4" />
            添加用户
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onChange={setFilters}
        totalUsers={allUsers.length}
        filteredCount={filteredUsers.length}
      />

      {/* Batch Actions */}
      <BatchActions
        selectedCount={selectedIds.size}
        onAction={handleBatchAction}
        onClear={() => toggleSelectAll()}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            重试
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <UsersIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {filters.searchQuery ? '未找到匹配的用户' : '暂无用户'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {filters.searchQuery ? '请尝试其他搜索条件' : '点击"添加用户"创建第一个用户'}
          </p>
          {!filters.searchQuery && (
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 rounded-xl text-white font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              添加用户
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isSelected={selectedIds.has(user.id)}
                  onSelect={() => toggleSelect(user.id)}
                  onEdit={() => handleEdit(user)}
                  onDelete={() => handleDelete(user)}
                  onToggleStatus={() => handleToggleStatus(user)}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}>
              {/* List Header */}
              <div className="flex items-center px-4 py-3 text-sm font-medium" style={{ background: 'var(--color-glass)', color: 'var(--color-text-muted)' }}>
                <div className="w-10">
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-all',
                      selectedIds.size === users.length && users.length > 0 && 'bg-primary border-primary'
                    )}
                    style={{
                      borderColor: selectedIds.size === users.length && users.length > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                      background: selectedIds.size === users.length && users.length > 0 ? 'var(--color-primary)' : 'transparent',
                    }}
                  >
                    {selectedIds.size === users.length && users.length > 0 && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex-1">用户</div>
                <div className="w-24">角色</div>
                <div className="w-20">书签</div>
                <div className="w-20">分类</div>
                <div className="w-20">状态</div>
                <div className="w-32 text-right">操作</div>
              </div>

              {/* List Items */}
              <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center px-4 py-3 hover:bg-[var(--color-glass-hover)] transition-colors cursor-pointer',
                      selectedIds.has(user.id) && 'bg-primary/5'
                    )}
                    onClick={() => toggleSelect(user.id)}
                  >
                    <div className="w-10">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center transition-all',
                          selectedIds.has(user.id) && 'bg-primary border-primary'
                        )}
                        style={{
                          borderColor: selectedIds.has(user.id) ? 'var(--color-primary)' : 'var(--color-border)',
                          background: selectedIds.has(user.id) ? 'var(--color-primary)' : 'transparent',
                        }}
                      >
                        {selectedIds.has(user.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: user.role === 'admin' ? '#8b5cf620' : '#3b82f620',
                        }}
                      >
                        {user.role === 'admin' ? (
                          <svg className="w-4 h-4" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {user.username}
                        </div>
                        {user.email && (
                          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-24">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: user.role === 'admin' ? '#8b5cf620' : '#3b82f620',
                          color: user.role === 'admin' ? '#8b5cf6' : '#3b82f6',
                        }}
                      >
                        {user.role === 'admin' ? '管理员' : user.role === 'guest' ? '访客' : '普通用户'}
                      </span>
                    </div>
                    <div className="w-20" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.stats.bookmarkCount}
                    </div>
                    <div className="w-20" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.stats.categoryCount}
                    </div>
                    <div className="w-20">
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          user.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        )}
                      >
                        {user.isActive ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <div className="w-32 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStatus(user)
                        }}
                        className={cn(
                          'px-2 py-1 rounded text-xs transition-colors',
                          user.isActive ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500'
                        )}
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {user.isActive ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(user)
                        }}
                        className="px-2 py-1 rounded text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(user)
                        }}
                        className="px-2 py-1 rounded text-xs hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl disabled:opacity-50"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                上一页
              </button>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl disabled:opacity-50"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* User Form Modal */}
      <UserForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={editingUser ? {
          username: editingUser.username,
          email: editingUser.email,
          role: editingUser.role,
        } : null}
        mode={editingUser ? 'edit' : 'create'}
      />
    </div>
  )
}
