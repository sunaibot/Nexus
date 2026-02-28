/**
 * 笔记 API 客户端
 * 提供富文本笔记管理功能
 */
import { request } from './client'

// 笔记接口
export interface Note {
  id: string
  userId: string
  title: string
  content: string
  isMarkdown: boolean
  tags?: string
  folderId?: string
  isPinned: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

// 笔记文件夹接口
export interface NoteFolder {
  id: string
  userId: string
  name: string
  parentId?: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

// 创建笔记请求
export interface CreateNoteRequest {
  title: string
  content?: string
  isMarkdown?: boolean
  tags?: string
  folderId?: string
}

// 更新笔记请求
export interface UpdateNoteRequest {
  title?: string
  content?: string
  isMarkdown?: boolean
  tags?: string
  folderId?: string
  isPinned?: boolean
  isArchived?: boolean
}

// 创建文件夹请求
export interface CreateFolderRequest {
  name: string
  parentId?: string
}

// 更新文件夹请求
export interface UpdateFolderRequest {
  name?: string
  parentId?: string
}

// 笔记查询参数
export interface NotesQueryParams {
  folderId?: string
  isArchived?: boolean
  search?: string
}

/**
 * 获取笔记列表
 */
export async function fetchNotes(params?: NotesQueryParams): Promise<Note[]> {
  const queryParams = new URLSearchParams()
  if (params?.folderId) queryParams.append('folderId', params.folderId)
  if (params?.isArchived !== undefined) queryParams.append('isArchived', String(params.isArchived))
  if (params?.search) queryParams.append('search', params.search)
  
  const query = queryParams.toString()
  const url = `/v2/notes${query ? `?${query}` : ''}`
  
  const response = await request<{ success: boolean; data: Note[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取单个笔记
 */
export async function fetchNoteById(id: string): Promise<Note> {
  const response = await request<{ success: boolean; data: Note }>(`/v2/notes/${id}`, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 创建笔记
 */
export async function createNote(data: CreateNoteRequest): Promise<Note> {
  const response = await request<{ success: boolean; data: Note }>('/v2/notes', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新笔记
 */
export async function updateNote(id: string, data: UpdateNoteRequest): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除笔记
 */
export async function deleteNote(id: string): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/notes/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 获取文件夹列表
 */
export async function fetchNoteFolders(): Promise<NoteFolder[]> {
  const response = await request<{ success: boolean; data: NoteFolder[] }>('/v2/notes/folders/list', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 创建文件夹
 */
export async function createNoteFolder(data: CreateFolderRequest): Promise<NoteFolder> {
  const response = await request<{ success: boolean; data: NoteFolder }>('/v2/notes/folders', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新文件夹
 */
export async function updateNoteFolder(id: string, data: UpdateFolderRequest): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/notes/folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除文件夹
 */
export async function deleteNoteFolder(id: string): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/notes/folders/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 笔记 API 对象
 */
export const notesApi = {
  fetchAll: fetchNotes,
  fetchById: fetchNoteById,
  create: createNote,
  update: updateNote,
  delete: deleteNote,
  folders: {
    fetchAll: fetchNoteFolders,
    create: createNoteFolder,
    update: updateNoteFolder,
    delete: deleteNoteFolder,
  },
}

export default notesApi
