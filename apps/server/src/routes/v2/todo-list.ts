/**
 * Todo List 服务端路由
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js'
import { queryAll, queryOne, run } from '../../utils/database.js'

const router = Router()

// 成功响应
function success(res: Response, data: any, message?: string) {
  res.json({ success: true, data, message })
}

// 错误响应
function error(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, error: message })
}

/**
 * 获取 Todo List 数据
 * GET /api/v2/todo-list
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    // const data = queryAll('SELECT * FROM todo-list_table ORDER BY createdAt DESC')
    // success(res, data)
    success(res, [])
  } catch (err) {
    error(res, '获取数据失败')
  }
})

/**
 * 创建 Todo List 数据
 * POST /api/v2/todo-list
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    // const { name, value } = req.body
    // run('INSERT INTO todo-list_table (id, name, value, createdAt) VALUES (?, ?, ?, ?)', [...])
    success(res, null, '创建成功')
  } catch (err) {
    error(res, '创建失败')
  }
})

/**
 * 更新 Todo List 数据
 * PATCH /api/v2/todo-list/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // const { name, value } = req.body
    // run('UPDATE todo-list_table SET name = ?, value = ? WHERE id = ?', [name, value, id])
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
})

/**
 * 删除 Todo List 数据
 * DELETE /api/v2/todo-list/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // run('DELETE FROM todo-list_table WHERE id = ?', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
})

export default router
