/**
 * UI 状态管理 Store
 * 使用 Zustand 风格的轻量级状态管理
 */

import { useState, useCallback, useRef } from 'react'

// UI 状态接口
interface UIState {
  // 弹窗状态
  showAddModal: boolean
  showCommandPalette: boolean
  showEditModal: boolean
  showSettingsModal: boolean

  // 编辑状态
  isEditMode: boolean
  showPrivateBookmarks: boolean
  showReadLaterOnly: boolean

  // 选中项
  selectedBookmarkId: string | null
  selectedCategoryId: string | null
}

// 初始状态
const initialState: UIState = {
  showAddModal: false,
  showCommandPalette: false,
  showEditModal: false,
  showSettingsModal: false,
  isEditMode: false,
  showPrivateBookmarks: false,
  showReadLaterOnly: false,
  selectedBookmarkId: null,
  selectedCategoryId: null,
}

export function useUIStore() {
  const [state, setState] = useState<UIState>(initialState)

  // 使用 ref 保存最新状态，避免闭包问题
  const stateRef = useRef(state)
  stateRef.current = state

  // 设置单个状态
  const setUIState = useCallback(<K extends keyof UIState>(key: K, value: UIState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  // 批量设置状态
  const setMultipleUIState = useCallback((updates: Partial<UIState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // 重置状态
  const resetUIState = useCallback(() => {
    setState(initialState)
  }, [])

  // ===== 弹窗操作 =====

  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, showAddModal: true }))
  }, [])

  const closeAddModal = useCallback(() => {
    setState(prev => ({ ...prev, showAddModal: false }))
  }, [])

  const openCommandPalette = useCallback(() => {
    setState(prev => ({ ...prev, showCommandPalette: true }))
  }, [])

  const closeCommandPalette = useCallback(() => {
    setState(prev => ({ ...prev, showCommandPalette: false }))
  }, [])

  const openEditModal = useCallback(() => {
    setState(prev => ({ ...prev, showEditModal: true }))
  }, [])

  const closeEditModal = useCallback(() => {
    setState(prev => ({ ...prev, showEditModal: false }))
  }, [])

  const openSettingsModal = useCallback(() => {
    setState(prev => ({ ...prev, showSettingsModal: true }))
  }, [])

  const closeSettingsModal = useCallback(() => {
    setState(prev => ({ ...prev, showSettingsModal: false }))
  }, [])

  // ===== 编辑状态操作 =====

  const toggleEditMode = useCallback(() => {
    setState(prev => ({ ...prev, isEditMode: !prev.isEditMode }))
  }, [])

  const enableEditMode = useCallback(() => {
    setState(prev => ({ ...prev, isEditMode: true }))
  }, [])

  const disableEditMode = useCallback(() => {
    setState(prev => ({ ...prev, isEditMode: false }))
  }, [])

  const togglePrivateBookmarks = useCallback(() => {
    setState(prev => ({ ...prev, showPrivateBookmarks: !prev.showPrivateBookmarks }))
  }, [])

  const showReadLater = useCallback(() => {
    setState(prev => ({ ...prev, showReadLaterOnly: true }))
  }, [])

  const showAllBookmarks = useCallback(() => {
    setState(prev => ({ ...prev, showReadLaterOnly: false }))
  }, [])

  // ===== 选中项操作 =====

  const selectBookmark = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedBookmarkId: id }))
  }, [])

  const selectCategory = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedCategoryId: id }))
  }, [])

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBookmarkId: null,
      selectedCategoryId: null,
    }))
  }, [])

  return {
    // 状态
    ...state,

    // 基础操作
    setUIState,
    setMultipleUIState,
    resetUIState,

    // 弹窗操作
    openAddModal,
    closeAddModal,
    openCommandPalette,
    closeCommandPalette,
    openEditModal,
    closeEditModal,
    openSettingsModal,
    closeSettingsModal,

    // 编辑状态操作
    toggleEditMode,
    enableEditMode,
    disableEditMode,
    togglePrivateBookmarks,
    showReadLater,
    showAllBookmarks,

    // 选中项操作
    selectBookmark,
    selectCategory,
    clearSelection,
  }
}

export type UIStore = ReturnType<typeof useUIStore>
