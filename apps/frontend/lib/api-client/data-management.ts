/**
 * 数据管理 API 客户端
 * 提供数据导出、导入和恢复出厂设置功能
 */

import { request } from './client'

/**
 * 导出所有数据
 */
export async function exportAllData(): Promise<{
  version: string
  exportedAt: string
  data: {
    bookmarks: unknown[]
    categories: unknown[]
    settings: unknown
  }
}> {
  const response = await request<{
    success: boolean
    data: {
      version: string
      exportedAt: string
      data: {
        bookmarks: unknown[]
        categories: unknown[]
        settings: unknown
      }
    }
  }>('/v2/data/export', {
    method: 'GET',
    requireAuth: true,
  })
  return response.data
}

/**
 * 导入数据
 */
export async function importAllData(
  data: unknown
): Promise<{ success: boolean; imported: number }> {
  const response = await request<{
    success: boolean
    data: { success: boolean; imported: number }
  }>('/v2/data/import', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 恢复出厂设置
 */
export async function factoryReset(): Promise<{ success: boolean }> {
  const response = await request<{
    success: boolean
    data: { success: boolean }
  }>('/v2/data/reset', {
    method: 'POST',
    requireAuth: true,
  })
  return response.data
}

/**
 * 数据管理 API 对象
 */
export const dataManagementApi = {
  exportData: exportAllData,
  importData: importAllData,
  factoryReset,
}

export default dataManagementApi
