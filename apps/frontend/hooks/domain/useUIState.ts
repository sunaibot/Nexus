/**
 * UI 状态管理 Hook
 * 管理页面 UI 相关状态
 */

import { useState, useCallback, useEffect } from 'react'

interface UIStateOptions {
  initialEditMode?: boolean
  initialShowPrivate?: boolean
}

export function useUIState(options: UIStateOptions = {}) {
  const { initialEditMode = false, initialShowPrivate = false } = options

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [isEditMode, setIsEditMode] = useState(initialEditMode)
  const [showPrivateBookmarks, setShowPrivateBookmarks] = useState(initialShowPrivate)
  const [showReadLaterOnly, setShowReadLaterOnly] = useState(false)

  // 打开添加书签弹窗
  const openAddModal = useCallback(() => {
    setShowAddModal(true)
  }, [])

  // 关闭添加书签弹窗
  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
  }, [])

  // 打开命令面板
  const openCommandPalette = useCallback(() => {
    setShowCommandPalette(true)
  }, [])

  // 关闭命令面板
  const closeCommandPalette = useCallback(() => {
    setShowCommandPalette(false)
  }, [])

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev)
  }, [])

  // 退出编辑模式（用于登出时）
  const exitEditMode = useCallback(() => {
    setIsEditMode(false)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    // 状态
    showAddModal,
    showCommandPalette,
    isEditMode,
    showPrivateBookmarks,
    showReadLaterOnly,

    // 设置器
    setShowAddModal,
    setShowCommandPalette,
    setIsEditMode,
    setShowPrivateBookmarks,
    setShowReadLaterOnly,

    // 便捷方法
    openAddModal,
    closeAddModal,
    openCommandPalette,
    closeCommandPalette,
    toggleEditMode,
    exitEditMode,
  }
}
