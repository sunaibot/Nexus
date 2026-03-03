/**
 * API 文档路由 - 完整版
 * 模块化设计，高内聚低耦合，美观的UI展示
 */

import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/index.js'

const router = Router()

// 从 query 参数中获取 token 并设置到 header 的中间件
function queryTokenAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`
  }
  next()
}

// ========== API 模块定义 ==========

const apiModules = {
  // 认证模块
  auth: {
    id: 'auth',
    name: '认证管理',
    icon: '🔐',
    description: '用户登录、注册、令牌管理',
    apis: [
      {
        method: 'POST', path: '/api/v2/auth/admin/login', auth: false, admin: false,
        name: '管理员登录',
        desc: '管理员账号登录，返回访问令牌',
        body: [
          { name: 'username', type: 'string', required: true, desc: '用户名' },
          { name: 'password', type: 'string', required: true, desc: '密码' }
        ],
        response: { code: 200, desc: '登录成功', example: { success: true, data: { token: 'xxx', user: { id: 'admin', username: 'admin', role: 'admin' } } } }
      },
      {
        method: 'GET', path: '/api/v2/auth/admin/verify', auth: true, admin: true,
        name: '验证管理员Token',
        desc: '验证当前管理员令牌是否有效',
        response: { code: 200, desc: '验证成功', example: { success: true, data: { user: { id: 'admin', username: 'admin', role: 'admin' } } } }
      },
      {
        method: 'POST', path: '/api/v2/auth/admin/logout', auth: true, admin: true,
        name: '管理员登出',
        desc: '注销当前管理员会话',
        response: { code: 200, desc: '登出成功', example: { success: true, message: '登出成功' } }
      },
      {
        method: 'POST', path: '/api/v2/auth/login', auth: false, admin: false,
        name: '用户登录',
        desc: '普通用户登录',
        body: [
          { name: 'username', type: 'string', required: true, desc: '用户名' },
          { name: 'password', type: 'string', required: true, desc: '密码' }
        ],
        response: { code: 200, desc: '登录成功', example: { success: true, data: { token: 'xxx', user: { id: 'user1', username: 'user1', role: 'user' } } } }
      },
      {
        method: 'POST', path: '/api/v2/auth/register', auth: false, admin: false,
        name: '用户注册',
        desc: '注册新用户账号',
        body: [
          { name: 'username', type: 'string', required: true, desc: '用户名' },
          { name: 'password', type: 'string', required: true, desc: '密码' },
          { name: 'email', type: 'string', required: false, desc: '邮箱' }
        ],
        response: { code: 201, desc: '注册成功', example: { success: true, data: { id: 'user1', username: 'user1' } } }
      },
      {
        method: 'GET', path: '/api/v2/auth/verify', auth: true, admin: false,
        name: '验证用户Token',
        desc: '验证当前用户令牌是否有效',
        response: { code: 200, desc: '验证成功', example: { success: true, data: { user: { id: 'user1', username: 'user1', role: 'user' } } } }
      },
      {
        method: 'POST', path: '/api/v2/auth/logout', auth: true, admin: false,
        name: '用户登出',
        desc: '注销当前用户会话',
        response: { code: 200, desc: '登出成功', example: { success: true, message: '登出成功' } }
      }
    ]
  },

  // 用户管理模块
  users: {
    id: 'users',
    name: '用户管理',
    icon: '👥',
    description: '用户CRUD、权限管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/users', auth: true, admin: true,
        name: '获取用户列表',
        desc: '获取所有用户列表（管理员）',
        response: { code: 200, desc: '用户列表', example: { success: true, data: [{ id: 'user1', username: 'user1', role: 'user', isActive: 1 }] } }
      },
      {
        method: 'POST', path: '/api/v2/users', auth: true, admin: true,
        name: '创建用户',
        desc: '创建新用户（管理员）',
        body: [
          { name: 'username', type: 'string', required: true, desc: '用户名' },
          { name: 'password', type: 'string', required: true, desc: '密码' },
          { name: 'email', type: 'string', required: false, desc: '邮箱' },
          { name: 'role', type: 'string', required: false, desc: '角色', enum: ['admin', 'user'], default: 'user' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'user2', username: 'user2' } } }
      },
      {
        method: 'GET', path: '/api/v2/users/profile', auth: true, admin: false,
        name: '获取用户资料',
        desc: '获取当前登录用户的详细资料',
        response: { code: 200, desc: '用户资料', example: { success: true, data: { id: 'user1', username: 'user1', email: 'user@example.com' } } }
      },
      {
        method: 'PUT', path: '/api/v2/users/:userId', auth: true, admin: true,
        name: '更新用户',
        desc: '更新指定用户信息（管理员）',
        params: [
          { name: 'userId', type: 'string', required: true, desc: '用户ID' }
        ],
        body: [
          { name: 'username', type: 'string', required: false, desc: '用户名' },
          { name: 'email', type: 'string', required: false, desc: '邮箱' },
          { name: 'role', type: 'string', required: false, desc: '角色' },
          { name: 'isActive', type: 'integer', required: false, desc: '是否激活' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, message: '更新成功' } }
      },
      {
        method: 'DELETE', path: '/api/v2/users/:userId', auth: true, admin: true,
        name: '删除用户',
        desc: '删除指定用户（管理员）',
        params: [
          { name: 'userId', type: 'string', required: true, desc: '用户ID' }
        ],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  },

  // 书签管理模块
  bookmarks: {
    id: 'bookmarks',
    name: '书签管理',
    icon: '🔖',
    description: '书签CRUD、分类、标签、权限',
    apis: [
      {
        method: 'GET', path: '/api/v2/bookmarks', auth: false, admin: false,
        name: '获取书签列表',
        desc: '获取书签列表（支持公开/个人/私有）',
        query: [
          { name: 'visibility', type: 'string', required: false, desc: '可见性筛选', enum: ['public', 'personal', 'private'] },
          { name: 'category', type: 'string', required: false, desc: '分类ID' }
        ],
        response: { code: 200, desc: '书签列表', example: { success: true, data: [{ id: 'bm1', title: '示例', url: 'https://example.com', visibility: 'public' }] } }
      },
      {
        method: 'GET', path: '/api/v2/bookmarks/public', auth: false, admin: false,
        name: '获取公开书签',
        desc: '获取所有公开书签（无需登录）',
        response: { code: 200, desc: '公开书签列表', example: { success: true, data: [{ id: 'bm1', title: '示例', url: 'https://example.com' }] } }
      },
      {
        method: 'GET', path: '/api/v2/bookmarks/admin/all', auth: true, admin: true,
        name: '获取所有书签（管理）',
        desc: '获取系统中所有书签（管理员）',
        response: { code: 200, desc: '所有书签列表', example: { success: true, data: [{ id: 'bm1', title: '示例', userId: 'user1' }] } }
      },
      {
        method: 'GET', path: '/api/v2/bookmarks/paginated', auth: true, admin: false,
        name: '分页获取书签',
        desc: '分页获取当前用户的书签',
        query: [
          { name: 'page', type: 'integer', required: false, desc: '页码', default: 1 },
          { name: 'pageSize', type: 'integer', required: false, desc: '每页数量', default: 20 },
          { name: 'search', type: 'string', required: false, desc: '搜索关键词' },
          { name: 'category', type: 'string', required: false, desc: '分类ID' },
          { name: 'isPinned', type: 'boolean', required: false, desc: '是否置顶' },
          { name: 'isReadLater', type: 'boolean', required: false, desc: '是否稍后阅读' }
        ],
        response: { code: 200, desc: '分页书签列表', example: { success: true, data: { items: [], total: 100, page: 1, pageSize: 20, totalPages: 5 } } }
      },
      {
        method: 'POST', path: '/api/v2/bookmarks', auth: true, admin: false,
        name: '创建书签',
        desc: '创建新书签',
        body: [
          { name: 'url', type: 'string', required: true, desc: 'URL地址' },
          { name: 'title', type: 'string', required: true, desc: '标题' },
          { name: 'description', type: 'string', required: false, desc: '描述' },
          { name: 'category', type: 'string', required: false, desc: '分类ID' },
          { name: 'visibility', type: 'string', required: false, desc: '可见性', enum: ['public', 'personal', 'private'], default: 'personal' },
          { name: 'tags', type: 'array', required: false, desc: '标签数组' },
          { name: 'isPinned', type: 'boolean', required: false, desc: '是否置顶', default: false },
          { name: 'isReadLater', type: 'boolean', required: false, desc: '是否稍后阅读', default: false }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'bm1', title: '示例', url: 'https://example.com' } } }
      },
      {
        method: 'GET', path: '/api/v2/bookmarks/:id', auth: true, admin: false,
        name: '获取书签详情',
        desc: '获取指定书签的详细信息',
        params: [
          { name: 'id', type: 'string', required: true, desc: '书签ID' }
        ],
        response: { code: 200, desc: '书签详情', example: { success: true, data: { id: 'bm1', title: '示例', url: 'https://example.com', description: '', tags: [] } } }
      },
      {
        method: 'PATCH', path: '/api/v2/bookmarks/:id', auth: true, admin: false,
        name: '更新书签',
        desc: '更新指定书签信息',
        params: [
          { name: 'id', type: 'string', required: true, desc: '书签ID' }
        ],
        body: [
          { name: 'title', type: 'string', required: false, desc: '标题' },
          { name: 'url', type: 'string', required: false, desc: 'URL' },
          { name: 'description', type: 'string', required: false, desc: '描述' },
          { name: 'category', type: 'string', required: false, desc: '分类ID' },
          { name: 'visibility', type: 'string', required: false, desc: '可见性' },
          { name: 'tags', type: 'array', required: false, desc: '标签数组' },
          { name: 'isPinned', type: 'boolean', required: false, desc: '是否置顶' },
          { name: 'isReadLater', type: 'boolean', required: false, desc: '是否稍后阅读' },
          { name: 'isRead', type: 'boolean', required: false, desc: '是否已读' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'bm1', title: '更新后的标题' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/bookmarks/:id', auth: true, admin: false,
        name: '删除书签',
        desc: '删除指定书签',
        params: [
          { name: 'id', type: 'string', required: true, desc: '书签ID' }
        ],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      },
      {
        method: 'PATCH', path: '/api/v2/bookmarks/reorder', auth: true, admin: false,
        name: '重新排序书签',
        desc: '批量更新书签排序',
        body: [
          { name: 'items', type: 'array', required: true, desc: '排序项数组 [{id, orderIndex}]' }
        ],
        response: { code: 200, desc: '排序成功', example: { success: true, message: '排序成功' } }
      }
    ]
  },

  // 分类管理模块
  categories: {
    id: 'categories',
    name: '分类管理',
    icon: '📁',
    description: '书签分类CRUD、层级管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/categories', auth: true, admin: false,
        name: '获取分类列表',
        desc: '获取当前用户的所有分类',
        response: { code: 200, desc: '分类列表', example: { success: true, data: [{ id: 'cat1', name: '技术', icon: '💻', color: '#3b82f6' }] } }
      },
      {
        method: 'GET', path: '/api/v2/categories/public', auth: false, admin: false,
        name: '获取公开分类',
        desc: '获取所有公开分类（无需登录）',
        response: { code: 200, desc: '公开分类列表', example: { success: true, data: [{ id: 'cat1', name: '技术', icon: '💻' }] } }
      },
      {
        method: 'GET', path: '/api/v2/categories/admin/all', auth: true, admin: true,
        name: '获取所有分类（管理）',
        desc: '获取系统中所有分类（管理员）',
        response: { code: 200, desc: '所有分类列表', example: { success: true, data: [{ id: 'cat1', name: '技术', userId: 'user1' }] } }
      },
      {
        method: 'POST', path: '/api/v2/categories', auth: true, admin: false,
        name: '创建分类',
        desc: '创建新分类',
        body: [
          { name: 'name', type: 'string', required: true, desc: '分类名称' },
          { name: 'description', type: 'string', required: false, desc: '分类描述' },
          { name: 'icon', type: 'string', required: false, desc: '图标' },
          { name: 'color', type: 'string', required: false, desc: '颜色' },
          { name: 'parentId', type: 'string', required: false, desc: '父分类ID' },
          { name: 'orderIndex', type: 'integer', required: false, desc: '排序索引' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'cat1', name: '技术', icon: '💻' } } }
      },
      {
        method: 'GET', path: '/api/v2/categories/:id', auth: true, admin: false,
        name: '获取分类详情',
        desc: '获取指定分类的详细信息',
        params: [
          { name: 'id', type: 'string', required: true, desc: '分类ID' }
        ],
        response: { code: 200, desc: '分类详情', example: { success: true, data: { id: 'cat1', name: '技术', description: '', bookmarks: [] } } }
      },
      {
        method: 'PATCH', path: '/api/v2/categories/:id', auth: true, admin: false,
        name: '更新分类',
        desc: '更新指定分类信息',
        params: [
          { name: 'id', type: 'string', required: true, desc: '分类ID' }
        ],
        body: [
          { name: 'name', type: 'string', required: false, desc: '分类名称' },
          { name: 'description', type: 'string', required: false, desc: '分类描述' },
          { name: 'icon', type: 'string', required: false, desc: '图标' },
          { name: 'color', type: 'string', required: false, desc: '颜色' },
          { name: 'parentId', type: 'string', required: false, desc: '父分类ID' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'cat1', name: '更新后的名称' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/categories/:id', auth: true, admin: false,
        name: '删除分类',
        desc: '删除指定分类',
        params: [
          { name: 'id', type: 'string', required: true, desc: '分类ID' }
        ],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      },
      {
        method: 'PATCH', path: '/api/v2/categories/reorder', auth: true, admin: false,
        name: '重新排序分类',
        desc: '批量更新分类排序',
        body: [
          { name: 'items', type: 'array', required: true, desc: '排序项数组 [{id, orderIndex}]' }
        ],
        response: { code: 200, desc: '排序成功', example: { success: true, message: '排序成功' } }
      }
    ]
  },

  // 标签管理模块
  tags: {
    id: 'tags',
    name: '标签管理',
    icon: '🏷️',
    description: '书签标签CRUD',
    apis: [
      {
        method: 'GET', path: '/api/v2/tags', auth: true, admin: false,
        name: '获取标签列表',
        desc: '获取当前用户的所有标签',
        response: { code: 200, desc: '标签列表', example: { success: true, data: [{ id: 'tag1', name: '前端', color: '#3b82f6' }] } }
      },
      {
        method: 'POST', path: '/api/v2/tags', auth: true, admin: false,
        name: '创建标签',
        desc: '创建新标签',
        body: [
          { name: 'name', type: 'string', required: true, desc: '标签名称' },
          { name: 'color', type: 'string', required: false, desc: '标签颜色' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'tag1', name: '前端', color: '#3b82f6' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/tags/:id', auth: true, admin: false,
        name: '删除标签',
        desc: '删除指定标签',
        params: [
          { name: 'id', type: 'string', required: true, desc: '标签ID' }
        ],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  },

  // 系统管理模块
  system: {
    id: 'system',
    name: '系统管理',
    icon: '⚙️',
    description: '系统状态、统计、配置',
    apis: [
      {
        method: 'GET', path: '/api/v2/system/status', auth: false, admin: false,
        name: '获取系统状态',
        desc: '获取系统运行状态（公开接口）',
        response: { code: 200, desc: '系统状态', example: { success: true, data: { status: 'running', version: '2.0.0', timestamp: '2024-01-01T00:00:00Z' } } }
      },
      {
        method: 'GET', path: '/api/v2/system/info', auth: true, admin: false,
        name: '获取系统信息',
        desc: '获取系统详细信息（需要登录）',
        response: { code: 200, desc: '系统信息', example: { success: true, data: { nodeVersion: 'v18.x', platform: 'linux', dbVersion: '3.x', uptime: 3600 } } }
      },
      {
        method: 'GET', path: '/api/v2/system/stats', auth: true, admin: true,
        name: '获取系统统计',
        desc: '获取系统统计数据（管理员）',
        response: { code: 200, desc: '系统统计', example: { success: true, data: { users: 10, bookmarks: 100, categories: 5 } } }
      },
      {
        method: 'GET', path: '/api/v2/health-check', auth: false, admin: false,
        name: '健康检查',
        desc: '系统健康状态检查',
        response: { code: 200, desc: '健康状态', example: { success: true, data: { status: 'healthy', timestamp: '2024-01-01T00:00:00Z' } } }
      }
    ]
  },

  // 设置管理模块
  settings: {
    id: 'settings',
    name: '设置管理',
    icon: '🔧',
    description: '系统设置、用户配置',
    apis: [
      {
        method: 'GET', path: '/api/v2/settings', auth: true, admin: false,
        name: '获取用户设置',
        desc: '获取当前用户的所有设置',
        response: { code: 200, desc: '用户设置', example: { success: true, data: { theme: 'dark', language: 'zh-CN' } } }
      },
      {
        method: 'GET', path: '/api/v2/settings/site', auth: false, admin: false,
        name: '获取站点设置',
        desc: '获取站点公开设置',
        response: { code: 200, desc: '站点设置', example: { success: true, data: { siteTitle: 'Nexus', enableWeather: true } } }
      },
      {
        method: 'PUT', path: '/api/v2/settings/site', auth: true, admin: true,
        name: '更新站点设置',
        desc: '更新站点设置（管理员）',
        body: [
          { name: 'siteTitle', type: 'string', required: false, desc: '站点标题' },
          { name: 'siteFavicon', type: 'string', required: false, desc: '站点图标' },
          { name: 'enableWeather', type: 'boolean', required: false, desc: '启用天气' },
          { name: 'enableLunar', type: 'boolean', required: false, desc: '启用农历' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, message: '更新成功' } }
      },
      {
        method: 'PATCH', path: '/api/v2/settings', auth: true, admin: false,
        name: '更新用户设置',
        desc: '更新当前用户的设置',
        body: [
          { name: 'theme', type: 'string', required: false, desc: '主题' },
          { name: 'language', type: 'string', required: false, desc: '语言' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, message: '更新成功' } }
      }
    ]
  },

  // 笔记管理模块
  notes: {
    id: 'notes',
    name: '笔记管理',
    icon: '📝',
    description: '富文本笔记管理，支持Markdown',
    apis: [
      {
        method: 'GET', path: '/api/v2/notes', auth: true, admin: false,
        name: '获取笔记列表',
        desc: '获取当前用户的所有笔记',
        query: [
          { name: 'folderId', type: 'string', required: false, desc: '文件夹ID' },
          { name: 'isArchived', type: 'string', required: false, desc: '是否归档 (true/false)' },
          { name: 'search', type: 'string', required: false, desc: '搜索关键词' }
        ],
        response: { code: 200, desc: '笔记列表', example: { success: true, data: [{ id: 'note1', title: '笔记标题', content: '内容', isMarkdown: true }] } }
      },
      {
        method: 'POST', path: '/api/v2/notes', auth: true, admin: false,
        name: '创建笔记',
        desc: '创建新笔记',
        body: [
          { name: 'title', type: 'string', required: true, desc: '标题' },
          { name: 'content', type: 'string', required: false, desc: '内容' },
          { name: 'isMarkdown', type: 'boolean', required: false, desc: '是否Markdown', default: true },
          { name: 'tags', type: 'string', required: false, desc: '标签' },
          { name: 'folderId', type: 'string', required: false, desc: '文件夹ID' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'note1', title: '笔记标题' } } }
      },
      {
        method: 'GET', path: '/api/v2/notes/:id', auth: true, admin: false,
        name: '获取笔记详情',
        desc: '获取指定笔记的详细信息',
        params: [{ name: 'id', type: 'string', required: true, desc: '笔记ID' }],
        response: { code: 200, desc: '笔记详情', example: { success: true, data: { id: 'note1', title: '笔记标题', content: '内容' } } }
      },
      {
        method: 'PATCH', path: '/api/v2/notes/:id', auth: true, admin: false,
        name: '更新笔记',
        desc: '更新指定笔记',
        params: [{ name: 'id', type: 'string', required: true, desc: '笔记ID' }],
        body: [
          { name: 'title', type: 'string', required: false, desc: '标题' },
          { name: 'content', type: 'string', required: false, desc: '内容' },
          { name: 'isMarkdown', type: 'boolean', required: false, desc: '是否Markdown' },
          { name: 'tags', type: 'string', required: false, desc: '标签' },
          { name: 'folderId', type: 'string', required: false, desc: '文件夹ID' },
          { name: 'isPinned', type: 'boolean', required: false, desc: '是否置顶' },
          { name: 'isArchived', type: 'boolean', required: false, desc: '是否归档' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'note1' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/notes/:id', auth: true, admin: false,
        name: '删除笔记',
        desc: '删除指定笔记',
        params: [{ name: 'id', type: 'string', required: true, desc: '笔记ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  },

  // 记事本管理模块
  notepads: {
    id: 'notepads',
    name: '记事本管理',
    icon: '📓',
    description: '简单记事本管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/notepads', auth: true, admin: false,
        name: '获取记事本列表',
        desc: '获取当前用户的所有记事本',
        response: { code: 200, desc: '记事本列表', example: { success: true, data: [{ id: 'np1', title: '记事本', content: '内容' }] } }
      },
      {
        method: 'POST', path: '/api/v2/notepads', auth: true, admin: false,
        name: '创建记事本',
        desc: '创建新记事本',
        body: [
          { name: 'title', type: 'string', required: true, desc: '标题' },
          { name: 'content', type: 'string', required: false, desc: '内容' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'np1', title: '记事本' } } }
      },
      {
        method: 'GET', path: '/api/v2/notepads/:id', auth: true, admin: false,
        name: '获取记事本详情',
        desc: '获取指定记事本',
        params: [{ name: 'id', type: 'string', required: true, desc: '记事本ID' }],
        response: { code: 200, desc: '记事本详情', example: { success: true, data: { id: 'np1', title: '记事本', content: '内容' } } }
      },
      {
        method: 'PATCH', path: '/api/v2/notepads/:id', auth: true, admin: false,
        name: '更新记事本',
        desc: '更新指定记事本',
        params: [{ name: 'id', type: 'string', required: true, desc: '记事本ID' }],
        body: [
          { name: 'title', type: 'string', required: false, desc: '标题' },
          { name: 'content', type: 'string', required: false, desc: '内容' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'np1' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/notepads/:id', auth: true, admin: false,
        name: '删除记事本',
        desc: '删除指定记事本',
        params: [{ name: 'id', type: 'string', required: true, desc: '记事本ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  },

  // 小部件管理模块
  widgets: {
    id: 'widgets',
    name: '小部件管理',
    icon: '🧩',
    description: '用户小部件管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/widgets', auth: true, admin: false,
        name: '获取小部件列表',
        desc: '获取当前用户的所有小部件',
        response: { code: 200, desc: '小部件列表', example: { success: true, data: [{ id: 'w1', name: '天气', type: 'weather', config: {} }] } }
      },
      {
        method: 'POST', path: '/api/v2/widgets', auth: true, admin: false,
        name: '创建小部件',
        desc: '创建新小部件',
        body: [
          { name: 'name', type: 'string', required: true, desc: '名称' },
          { name: 'type', type: 'string', required: true, desc: '类型' },
          { name: 'config', type: 'object', required: false, desc: '配置' },
          { name: 'orderIndex', type: 'integer', required: false, desc: '排序索引' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'w1', name: '天气' } } }
      },
      {
        method: 'PATCH', path: '/api/v2/widgets/:id', auth: true, admin: false,
        name: '更新小部件',
        desc: '更新指定小部件',
        params: [{ name: 'id', type: 'string', required: true, desc: '小部件ID' }],
        body: [
          { name: 'name', type: 'string', required: false, desc: '名称' },
          { name: 'type', type: 'string', required: false, desc: '类型' },
          { name: 'config', type: 'object', required: false, desc: '配置' },
          { name: 'orderIndex', type: 'integer', required: false, desc: '排序索引' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'w1' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/widgets/:id', auth: true, admin: false,
        name: '删除小部件',
        desc: '删除指定小部件',
        params: [{ name: 'id', type: 'string', required: true, desc: '小部件ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  },

  // RSS订阅模块
  rss: {
    id: 'rss',
    name: 'RSS订阅',
    icon: '📡',
    description: 'RSS订阅源管理和文章阅读',
    apis: [
      {
        method: 'GET', path: '/api/v2/rss/feeds', auth: true, admin: false,
        name: '获取订阅源列表',
        desc: '获取所有RSS订阅源',
        query: [{ name: 'activeOnly', type: 'boolean', required: false, desc: '仅活跃' }],
        response: { code: 200, desc: '订阅源列表', example: { success: true, data: [{ id: 'feed1', title: 'RSS源', url: 'https://example.com/rss' }] } }
      },
      {
        method: 'GET', path: '/api/v2/rss/feeds/:id', auth: true, admin: false,
        name: '获取订阅源详情',
        desc: '获取指定订阅源',
        params: [{ name: 'id', type: 'string', required: true, desc: '订阅源ID' }],
        response: { code: 200, desc: '订阅源详情', example: { success: true, data: { id: 'feed1', title: 'RSS源', url: 'https://example.com/rss' } } }
      },
      {
        method: 'POST', path: '/api/v2/rss/feeds', auth: true, admin: false,
        name: '创建订阅源',
        desc: '添加新RSS订阅源',
        body: [
          { name: 'url', type: 'string', required: true, desc: 'RSS URL' },
          { name: 'title', type: 'string', required: false, desc: '标题' },
          { name: 'description', type: 'string', required: false, desc: '描述' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, id: 'feed1' } }
      },
      {
        method: 'PATCH', path: '/api/v2/rss/feeds/:id', auth: true, admin: false,
        name: '更新订阅源',
        desc: '更新订阅源信息',
        params: [{ name: 'id', type: 'string', required: true, desc: '订阅源ID' }],
        response: { code: 200, desc: '更新成功', example: { success: true } }
      },
      {
        method: 'DELETE', path: '/api/v2/rss/feeds/:id', auth: true, admin: false,
        name: '删除订阅源',
        desc: '删除订阅源',
        params: [{ name: 'id', type: 'string', required: true, desc: '订阅源ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true } }
      },
      {
        method: 'GET', path: '/api/v2/rss/articles', auth: true, admin: false,
        name: '获取文章列表',
        desc: '获取RSS文章',
        query: [
          { name: 'feedId', type: 'string', required: false, desc: '订阅源ID' },
          { name: 'unreadOnly', type: 'boolean', required: false, desc: '仅未读' }
        ],
        response: { code: 200, desc: '文章列表', example: { success: true, data: [{ id: 'art1', title: '文章标题', content: '内容' }] } }
      },
      {
        method: 'GET', path: '/api/v2/rss/unread-count', auth: true, admin: false,
        name: '获取未读数',
        desc: '获取未读文章数量',
        query: [{ name: 'feedId', type: 'string', required: false, desc: '订阅源ID' }],
        response: { code: 200, desc: '未读数量', example: { success: true, data: { count: 10 } } }
      },
      {
        method: 'PATCH', path: '/api/v2/rss/articles/:id/read', auth: true, admin: false,
        name: '标记已读',
        desc: '标记文章为已读',
        params: [{ name: 'id', type: 'string', required: true, desc: '文章ID' }],
        response: { code: 200, desc: '标记成功', example: { success: true } }
      },
      {
        method: 'POST', path: '/api/v2/rss/mark-all-read', auth: true, admin: false,
        name: '标记全部已读',
        desc: '标记所有文章为已读',
        body: [{ name: 'feedId', type: 'string', required: false, desc: '订阅源ID' }],
        response: { code: 200, desc: '标记成功', example: { success: true } }
      },
      {
        method: 'PATCH', path: '/api/v2/rss/articles/:id/star', auth: true, admin: false,
        name: '收藏文章',
        desc: '收藏或取消收藏文章',
        params: [{ name: 'id', type: 'string', required: true, desc: '文章ID' }],
        body: [{ name: 'isStarred', type: 'boolean', required: true, desc: '是否收藏' }],
        response: { code: 200, desc: '操作成功', example: { success: true } }
      }
    ]
  },

  // 访问统计模块
  visits: {
    id: 'visits',
    name: '访问统计',
    icon: '📊',
    description: '书签访问统计和数据分析',
    apis: [
      {
        method: 'POST', path: '/api/v2/visits/track', auth: false, admin: false,
        name: '记录访问',
        desc: '记录书签访问（公开接口）',
        body: [
          { name: 'bookmarkId', type: 'string', required: true, desc: '书签ID' },
          { name: 'userId', type: 'string', required: false, desc: '用户ID' },
          { name: 'userAgent', type: 'string', required: false, desc: '用户代理' }
        ],
        response: { code: 200, desc: '记录成功', example: { success: true, data: { recorded: true } } }
      },
      {
        method: 'GET', path: '/api/v2/visits/stats', auth: true, admin: false,
        name: '获取统计概览',
        desc: '获取访问统计概览',
        response: { code: 200, desc: '统计信息', example: { success: true, data: { totalVisits: 100, todayVisits: 10, uniqueVisitors: 50 } } }
      },
      {
        method: 'GET', path: '/api/v2/visits/top', auth: true, admin: false,
        name: '热门书签',
        desc: '获取热门书签排行',
        query: [
          { name: 'limit', type: 'integer', required: false, desc: '数量限制', default: 10 },
          { name: 'period', type: 'string', required: false, desc: '时间段 (day/week/month/all)', default: 'all' }
        ],
        response: { code: 200, desc: '热门书签', example: { success: true, data: [{ id: 'bm1', title: '书签', visitCount: 50 }] } }
      },
      {
        method: 'GET', path: '/api/v2/visits/trend', auth: true, admin: false,
        name: '访问趋势',
        desc: '获取访问趋势数据',
        query: [{ name: 'days', type: 'integer', required: false, desc: '天数', default: 7 }],
        response: { code: 200, desc: '趋势数据', example: { success: true, data: [{ date: '2024-01-01', count: 10 }] } }
      },
      {
        method: 'GET', path: '/api/v2/visits/recent', auth: true, admin: false,
        name: '最近访问',
        desc: '获取最近访问记录',
        query: [{ name: 'limit', type: 'integer', required: false, desc: '数量限制', default: 20 }],
        response: { code: 200, desc: '访问记录', example: { success: true, data: [{ id: 'v1', bookmarkId: 'bm1', visitedAt: '2024-01-01' }] } }
      }
    ]
  },

  // 数据统计模块
  stats: {
    id: 'stats',
    name: '数据统计',
    icon: '📈',
    description: '访问统计、书签点击热力图、分类使用统计',
    apis: [
      {
        method: 'GET', path: '/api/v2/stats/overview', auth: true, admin: false,
        name: '获取统计概览',
        desc: '获取PV/UV/今日访问/书签数/分类数等统计概览',
        response: { code: 200, desc: '统计概览', example: { success: true, data: { pv: 1000, uv: 500, today: 50, bookmarks: 100, categories: 10 } } }
      },
      {
        method: 'GET', path: '/api/v2/stats/trends', auth: true, admin: false,
        name: '获取访问趋势',
        desc: '按日期获取访问趋势数据',
        query: [{ name: 'days', type: 'integer', required: false, desc: '天数(7-90)', default: 30 }],
        response: { code: 200, desc: '趋势数据', example: { success: true, data: [{ date: '2024-01-01', pv: 100, uv: 50 }] } }
      },
      {
        method: 'GET', path: '/api/v2/stats/popular-bookmarks', auth: true, admin: false,
        name: '热门书签排行',
        desc: '获取访问量最高的书签排行',
        query: [{ name: 'limit', type: 'integer', required: false, desc: '数量限制', default: 20 }],
        response: { code: 200, desc: '热门书签', example: { success: true, data: [{ id: 'bm1', title: '书签', url: 'https://example.com', visitCount: 100, uniqueVisitors: 50 }] } }
      },
      {
        method: 'GET', path: '/api/v2/stats/heatmap', auth: true, admin: false,
        name: '获取点击热力图',
        desc: '获取书签点击热力图数据（按小时/星期/分类）',
        query: [{ name: 'days', type: 'integer', required: false, desc: '天数(7-365)', default: 30 }],
        response: { code: 200, desc: '热力图数据', example: { success: true, data: { hourly: [{ hour: '00', count: 10 }], weekday: [{ weekday: '周一', count: 50 }], category: [{ category: '技术', count: 100 }] } } }
      },
      {
        method: 'GET', path: '/api/v2/stats/category-usage', auth: true, admin: false,
        name: '分类使用统计',
        desc: '获取各分类的书签数量和访问统计',
        response: { code: 200, desc: '分类统计', example: { success: true, data: [{ categoryId: 'cat1', name: '技术', bookmarkCount: 20, visitCount: 500 }] } }
      }
    ]
  },

  // 主题管理模块
  theme: {
    id: 'theme',
    name: '主题管理',
    icon: '🎨',
    description: '主题配置和管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/theme', auth: true, admin: false,
        name: '获取当前主题',
        desc: '获取当前用户的主题配置',
        response: { code: 200, desc: '主题配置', example: { success: true, data: { id: 'theme1', name: '默认主题', isDark: true, colors: {} } } }
      },
      {
        method: 'GET', path: '/api/v2/theme/list', auth: true, admin: false,
        name: '获取主题列表',
        desc: '获取所有可用主题',
        response: { code: 200, desc: '主题列表', example: { success: true, data: [{ id: 'theme1', name: '默认主题' }] } }
      },
      {
        method: 'POST', path: '/api/v2/theme', auth: true, admin: true,
        name: '创建主题',
        desc: '创建新主题（管理员）',
        body: [
          { name: 'name', type: 'string', required: true, desc: '主题名称' },
          { name: 'isDark', type: 'boolean', required: false, desc: '是否暗色主题' },
          { name: 'colors', type: 'object', required: false, desc: '颜色配置' },
          { name: 'layout', type: 'object', required: false, desc: '布局配置' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'theme1' } } }
      }
    ]
  },

  // 插件管理模块
  plugins: {
    id: 'plugins',
    name: '插件管理',
    icon: '🔌',
    description: '插件管理和配置',
    apis: [
      {
        method: 'GET', path: '/api/v2/plugins', auth: true, admin: false,
        name: '获取插件列表',
        desc: '获取所有可用插件',
        response: { code: 200, desc: '插件列表', example: { success: true, data: [{ id: 'p1', name: '插件', version: '1.0.0', isEnabled: true }] } }
      },
      {
        method: 'GET', path: '/api/v2/plugins/:id', auth: true, admin: false,
        name: '获取插件详情',
        desc: '获取指定插件详情',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        response: { code: 200, desc: '插件详情', example: { success: true, data: { id: 'p1', name: '插件', config: {} } } }
      },
      {
        method: 'POST', path: '/api/v2/plugins', auth: true, admin: true,
        name: '创建插件',
        desc: '创建新插件（管理员）',
        body: [
          { name: 'name', type: 'string', required: true, desc: '插件名称' },
          { name: 'description', type: 'string', required: false, desc: '描述' },
          { name: 'version', type: 'string', required: false, desc: '版本' },
          { name: 'visibility', type: 'string', required: false, desc: '可见性', enum: ['public', 'role', 'private'] }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'p1' } } }
      },
      {
        method: 'PUT', path: '/api/v2/plugins/:id', auth: true, admin: true,
        name: '更新插件',
        desc: '更新插件信息（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        body: [
          { name: 'name', type: 'string', required: false, desc: '名称' },
          { name: 'isEnabled', type: 'boolean', required: false, desc: '是否启用' },
          { name: 'visibility', type: 'string', required: false, desc: '可见性' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true } }
      },
      {
        method: 'DELETE', path: '/api/v2/plugins/:id', auth: true, admin: true,
        name: '删除插件',
        desc: '删除插件（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true } }
      }
    ]
  },

  // 自定义插件模块（可视化构建器）
  customPlugins: {
    id: 'custom-plugins',
    name: '自定义插件',
    icon: '🧩',
    description: '通过可视化构建器创建的自定义插件管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/custom-plugins', auth: true, admin: false,
        name: '获取自定义插件列表',
        desc: '获取所有自定义插件（需要登录）',
        response: { 
          code: 200, 
          desc: '自定义插件列表', 
          example: { 
            success: true, 
            data: [
              { 
                id: 'custom_abc123', 
                name: '我的插件', 
                description: '这是一个自定义插件',
                version: '1.0.0',
                author: 'admin',
                icon: '📦',
                isEnabled: true,
                isInstalled: true,
                isCustom: true,
                builderData: {
                  name: '我的插件',
                  description: '',
                  canvas: { width: 800, height: 600, gridSize: 8 },
                  components: []
                },
                visibility: 'public',
                orderIndex: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z'
              }
            ] 
          } 
        }
      },
      {
        method: 'GET', path: '/api/v2/custom-plugins/:id', auth: true, admin: false,
        name: '获取自定义插件详情',
        desc: '获取指定自定义插件的详细信息（需要登录）',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        response: { 
          code: 200, 
          desc: '插件详情', 
          example: { 
            success: true, 
            data: { 
              id: 'custom_abc123', 
              name: '我的插件',
              builderData: {
                name: '我的插件',
                canvas: { width: 800, height: 600 },
                components: [
                  {
                    id: 'comp_001',
                    partId: 'part_button_1',
                    position: { x: 100, y: 100 },
                    size: { width: 'auto', height: 'auto' },
                    props: { text: '点击我' },
                    zIndex: 0,
                    visible: true,
                    locked: false
                  }
                ]
              }
            } 
          } 
        }
      },
      {
        method: 'POST', path: '/api/v2/custom-plugins', auth: true, admin: false,
        name: '创建自定义插件',
        desc: '通过可视化构建器创建新插件（需要登录）',
        body: [
          { name: 'name', type: 'string', required: true, desc: '插件名称' },
          { name: 'description', type: 'string', required: false, desc: '插件描述' },
          { name: 'icon', type: 'string', required: false, desc: '插件图标（emoji）', default: '📦' },
          { 
            name: 'builderData', 
            type: 'object', 
            required: true, 
            desc: '构建器数据，包含画布配置和组件列表',
            fields: [
              { name: 'name', type: 'string', desc: '插件名称' },
              { name: 'description', type: 'string', desc: '插件描述' },
              { name: 'canvas', type: 'object', desc: '画布配置' },
              { name: 'components', type: 'array', desc: '组件列表' },
              { name: 'dataSources', type: 'array', desc: '数据源配置' },
              { name: 'variables', type: 'array', desc: '变量定义' },
              { name: 'actions', type: 'array', desc: '动作定义' }
            ]
          },
          { name: 'visibility', type: 'string', required: false, desc: '可见性', enum: ['public', 'private', 'role'], default: 'public' }
        ],
        response: { 
          code: 200, 
          desc: '创建成功', 
          example: { 
            success: true, 
            data: { 
              plugin: {
                id: 'custom_abc123',
                name: '我的插件',
                version: '1.0.0',
                isEnabled: true,
                isCustom: true
              },
              message: '插件创建成功'
            } 
          } 
        }
      },
      {
        method: 'PUT', path: '/api/v2/custom-plugins/:id', auth: true, admin: false,
        name: '更新自定义插件',
        desc: '更新自定义插件信息（需要登录，只能更新自己创建的插件）',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        body: [
          { name: 'name', type: 'string', required: false, desc: '插件名称' },
          { name: 'description', type: 'string', required: false, desc: '插件描述' },
          { name: 'icon', type: 'string', required: false, desc: '插件图标' },
          { name: 'builderData', type: 'object', required: false, desc: '构建器数据' },
          { name: 'isEnabled', type: 'boolean', required: false, desc: '是否启用' }
        ],
        response: { 
          code: 200, 
          desc: '更新成功', 
          example: { 
            success: true, 
            data: {
              plugin: { id: 'custom_abc123', name: '更新后的插件' },
              message: '插件更新成功'
            }
          } 
        }
      },
      {
        method: 'DELETE', path: '/api/v2/custom-plugins/:id', auth: true, admin: false,
        name: '删除自定义插件',
        desc: '删除自定义插件（需要登录，只能删除自己创建的插件）',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        response: { 
          code: 200, 
          desc: '删除成功', 
          example: { success: true, data: { message: '插件删除成功' } } 
        }
      },
      {
        method: 'GET', path: '/api/v2/custom-plugins/public', auth: false, admin: false,
        name: '获取公开自定义插件列表',
        desc: '获取所有公开且启用的自定义插件（无需登录，前台使用）',
        response: { 
          code: 200, 
          desc: '公开插件列表', 
          example: { 
            success: true, 
            data: [
              {
                id: 'custom_abc123',
                name: '我的插件',
                description: '这是一个示例插件',
                icon: '📦',
                builderData: {
                  name: '我的插件',
                  canvas: { width: 800, height: 600 },
                  components: []
                }
              }
            ]
          } 
        }
      },
      {
        method: 'GET', path: '/api/v2/custom-plugins/:id/content', auth: false, admin: false,
        name: '获取自定义插件内容',
        desc: '获取指定自定义插件的完整内容（无需登录，前台渲染使用）',
        params: [{ name: 'id', type: 'string', required: true, desc: '插件ID' }],
        response: { 
          code: 200, 
          desc: '插件内容', 
          example: { 
            success: true, 
            data: {
              id: 'custom_abc123',
              name: '我的插件',
              description: '这是一个示例插件',
              icon: '📦',
              builderData: {
                name: '我的插件',
                description: '',
                version: '1.0.0',
                canvas: {
                  width: 800,
                  height: 600,
                  gridSize: 8,
                  snapToGrid: true,
                  showGrid: true,
                  backgroundColor: '#ffffff'
                },
                components: [
                  {
                    id: 'comp_001',
                    partId: 'part_button_1',
                    part: {
                      id: 'part_button_1',
                      name: '主按钮',
                      icon: '🔘',
                      visual: {
                        base: {
                          padding: '12px 24px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          borderRadius: '8px'
                        },
                        states: {
                          hover: { backgroundColor: '#2563eb' }
                        }
                      }
                    },
                    position: { x: 100, y: 100 },
                    size: { width: 'auto', height: 'auto' },
                    props: { text: '点击我' },
                    zIndex: 0,
                    visible: true,
                    locked: false
                  }
                ],
                selectedComponentIds: [],
                dataSources: [],
                variables: [],
                actions: []
              }
            }
          } 
        }
      }
    ]
  },

  // 数据管理模块
  data: {
    id: 'data',
    name: '数据管理',
    icon: '💾',
    description: '数据备份、恢复和导入导出',
    apis: [
      {
        method: 'GET', path: '/api/v2/data/export', auth: true, admin: true,
        name: '导出数据',
        desc: '导出所有数据（管理员）',
        response: { code: 200, desc: '导出成功', example: { success: true, data: { version: '2.0', bookmarks: [], categories: [] } } }
      },
      {
        method: 'POST', path: '/api/v2/data/import', auth: true, admin: true,
        name: '导入数据',
        desc: '导入数据（管理员）',
        body: [{ name: 'data', type: 'object', required: true, desc: '导入数据' }],
        response: { code: 200, desc: '导入成功', example: { success: true, message: '导入成功' } }
      }
    ]
  },

  // 批量操作模块
  batch: {
    id: 'batch',
    name: '批量操作',
    icon: '⚡',
    description: '批量数据处理',
    apis: [
      {
        method: 'POST', path: '/api/v2/batch/bookmarks/delete', auth: true, admin: false,
        name: '批量删除书签',
        desc: '批量删除多个书签',
        body: [{ name: 'ids', type: 'array', required: true, desc: '书签ID数组' }],
        response: { code: 200, desc: '删除成功', example: { success: true, deleted: 5 } }
      },
      {
        method: 'POST', path: '/api/v2/batch/bookmarks/move', auth: true, admin: false,
        name: '批量移动书签',
        desc: '批量移动书签到分类',
        body: [
          { name: 'ids', type: 'array', required: true, desc: '书签ID数组' },
          { name: 'categoryId', type: 'string', required: true, desc: '目标分类ID' }
        ],
        response: { code: 200, desc: '移动成功', example: { success: true, moved: 5 } }
      },
      {
        method: 'POST', path: '/api/v2/batch/bookmarks/update', auth: true, admin: false,
        name: '批量更新书签',
        desc: '批量更新书签属性',
        body: [
          { name: 'ids', type: 'array', required: true, desc: '书签ID数组' },
          { name: 'updates', type: 'object', required: true, desc: '更新字段' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, updated: 5 } }
      }
    ]
  },

  // 分享管理模块
  shares: {
    id: 'shares',
    name: '分享管理',
    icon: '🔗',
    description: '内容分享功能',
    apis: [
      {
        method: 'POST', path: '/api/v2/shares', auth: true, admin: false,
        name: '创建分享',
        desc: '创建内容分享',
        body: [
          { name: 'type', type: 'string', required: true, desc: '分享类型' },
          { name: 'resourceId', type: 'string', required: true, desc: '资源ID' },
          { name: 'expiresIn', type: 'integer', required: false, desc: '过期时间(秒)' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, shareCode: 'ABC12345' } }
      },
      {
        method: 'GET', path: '/api/v2/shares/:code', auth: false, admin: false,
        name: '获取分享内容',
        desc: '通过分享码获取内容',
        params: [{ name: 'code', type: 'string', required: true, desc: '分享码' }],
        response: { code: 200, desc: '分享内容', example: { success: true, data: { code: 'ABC12345', content: null } } }
      }
    ]
  },

  // 安全管理模块
  security: {
    id: 'security',
    name: '安全管理',
    icon: '🛡️',
    description: '系统安全配置和管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/security/config', auth: true, admin: true,
        name: '获取安全配置',
        desc: '获取系统安全配置（管理员）',
        response: { code: 200, desc: '安全配置', example: { success: true, data: { csrf: {}, ipFilter: {}, rateLimit: {} } } }
      },
      {
        method: 'PUT', path: '/api/v2/security/csrf', auth: true, admin: true,
        name: '更新CSRF配置',
        desc: '更新CSRF保护配置（管理员）',
        body: [{ name: 'ignorePaths', type: 'array', required: true, desc: '忽略路径列表' }],
        response: { code: 200, desc: '更新成功', example: { success: true } }
      }
    ]
  },

  // 名言管理模块
  quotes: {
    id: 'quotes',
    name: '名言管理',
    icon: '💬',
    description: '名言警句管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/quotes/random', auth: false, admin: false,
        name: '随机名言',
        desc: '获取随机名言（公开）',
        response: { code: 200, desc: '随机名言', example: { success: true, data: { text: '学而时习之', author: '孔子' } } }
      },
      {
        method: 'GET', path: '/api/v2/quotes', auth: true, admin: false,
        name: '获取名言列表',
        desc: '获取所有名言',
        response: { code: 200, desc: '名言列表', example: { success: true, data: [] } }
      }
    ]
  },

  // 元数据模块
  metadata: {
    id: 'metadata',
    name: '元数据',
    icon: '🌐',
    description: 'URL元数据提取',
    apis: [
      {
        method: 'POST', path: '/api/v2/metadata/extract', auth: true, admin: false,
        name: '提取元数据',
        desc: '提取URL的元数据信息',
        body: [{ name: 'url', type: 'string', required: true, desc: 'URL地址' }],
        response: { code: 200, desc: '元数据', example: { success: true, data: { url: 'https://example.com', title: '', description: '', icon: '' } } }
      }
    ]
  },

  // 管理员菜单模块
  adminMenus: {
    id: 'adminMenus',
    name: '管理员菜单',
    icon: '📋',
    description: '后台管理菜单配置',
    apis: [
      {
        method: 'GET', path: '/api/v2/admin-menus', auth: true, admin: true,
        name: '获取管理菜单',
        desc: '获取所有管理菜单（管理员）',
        response: { code: 200, desc: '菜单列表', example: { success: true, data: [{ id: 'bookmarks', name: '书签管理', icon: 'BookMarked' }] } }
      },
      {
        method: 'GET', path: '/api/v2/admin-menus/stats', auth: true, admin: true,
        name: '获取菜单统计',
        desc: '获取管理菜单统计数据',
        response: { code: 200, desc: '统计数据', example: { success: true, data: { bookmarks: 10, categories: 5, users: 2 } } }
      },
      {
        method: 'POST', path: '/api/v2/admin-menus', auth: true, admin: true,
        name: '创建菜单',
        desc: '创建新菜单项',
        body: [
          { name: 'name', type: 'string', required: true, desc: '菜单名称' },
          { name: 'icon', type: 'string', required: false, desc: '图标' },
          { name: 'path', type: 'string', required: true, desc: '路径' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, id: 'menu1' } }
      },
      {
        method: 'PATCH', path: '/api/v2/admin-menus/reorder', auth: true, admin: true,
        name: '排序菜单',
        desc: '批量更新菜单排序',
        body: [{ name: 'items', type: 'array', required: true, desc: '排序项 [{id, orderIndex}]' }],
        response: { code: 200, desc: '排序成功', example: { success: true, updatedCount: 5 } }
      }
    ]
  },

  // Dock配置模块
  dockConfigs: {
    id: 'dockConfigs',
    name: 'Dock配置',
    icon: '📌',
    description: 'Dock导航配置管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/dock-configs', auth: true, admin: false,
        name: '获取Dock配置',
        desc: '获取Dock配置列表',
        query: [
          { name: 'scope', type: 'string', required: false, desc: '作用域 (global/user/role)' },
          { name: 'userId', type: 'string', required: false, desc: '用户ID' }
        ],
        response: { code: 200, desc: '配置列表', example: { success: true, data: [{ id: 'dock1', name: '默认Dock', items: [] }] } }
      },
      {
        method: 'GET', path: '/api/v2/dock-configs/current', auth: true, admin: false,
        name: '获取当前Dock',
        desc: '获取当前用户的有效Dock配置',
        response: { code: 200, desc: 'Dock配置', example: { success: true, data: { id: 'dock1', items: [] } } }
      }
    ]
  },

  // 设置标签模块
  settingsTabs: {
    id: 'settingsTabs',
    name: '设置标签',
    icon: '🏷️',
    description: '设置页面标签配置',
    apis: [
      {
        method: 'GET', path: '/api/v2/settings-tabs', auth: true, admin: false,
        name: '获取设置标签',
        desc: '获取设置页面标签列表',
        query: [{ name: 'visibility', type: 'string', required: false, desc: '可见性' }],
        response: { code: 200, desc: '标签列表', example: { success: true, data: [{ id: 'tab1', tabId: 'general', name: '常规' }] } }
      },
      {
        method: 'GET', path: '/api/v2/settings-tabs/all', auth: true, admin: true,
        name: '获取所有标签',
        desc: '获取所有设置标签（管理员）',
        response: { code: 200, desc: '标签列表', example: { success: true, data: [] } }
      }
    ]
  },

  // 前端导航模块
  frontendNav: {
    id: 'frontendNav',
    name: '前端导航',
    icon: '🧭',
    description: '前端导航项配置',
    apis: [
      {
        method: 'GET', path: '/api/v2/frontend-nav', auth: true, admin: false,
        name: '获取导航项',
        desc: '获取前端导航项列表',
        query: [
          { name: 'visibility', type: 'string', required: false, desc: '可见性' },
          { name: 'requireAuth', type: 'boolean', required: false, desc: '是否需要认证' }
        ],
        response: { code: 200, desc: '导航项列表', example: { success: true, data: [{ id: 'nav1', navId: 'home', name: '首页' }] } }
      },
      {
        method: 'GET', path: '/api/v2/frontend-nav/all', auth: true, admin: true,
        name: '获取所有导航',
        desc: '获取所有导航项（管理员）',
        response: { code: 200, desc: '导航列表', example: { success: true, data: [] } }
      }
    ]
  },

  // 文件快传模块
  fileTransfers: {
    id: 'fileTransfers',
    name: '文件快传',
    icon: '📤',
    description: '文件上传、下载和传输管理',
    apis: [
      {
        method: 'POST', path: '/api/v2/file-transfers/upload', auth: false, admin: false,
        name: '上传文件',
        desc: '上传文件（支持匿名和登录用户）',
        body: [
          { name: 'file', type: 'file', required: true, desc: '文件数据' },
          { name: 'expiresIn', type: 'integer', required: false, desc: '过期时间(秒)' }
        ],
        response: { code: 200, desc: '上传成功', example: { success: true, data: { id: 'ft1', extractCode: 'ABC123', deleteCode: 'DEL456' } } }
      },
      {
        method: 'GET', path: '/api/v2/file-transfers/download/:extractCode', auth: false, admin: false,
        name: '下载文件',
        desc: '通过提取码下载文件',
        params: [{ name: 'extractCode', type: 'string', required: true, desc: '提取码' }],
        response: { code: 200, desc: '文件流', example: { success: true } }
      },
      {
        method: 'GET', path: '/api/v2/file-transfers/:extractCode/preview', auth: false, admin: false,
        name: '预览文件',
        desc: '预览文件内容（图片、视频、文本等）',
        params: [{ name: 'extractCode', type: 'string', required: true, desc: '提取码' }],
        response: { code: 200, desc: '文件流', example: { success: true } }
      },
      {
        method: 'DELETE', path: '/api/v2/file-transfers/:deleteCode', auth: false, admin: false,
        name: '删除文件',
        desc: '通过删除码删除文件',
        params: [{ name: 'deleteCode', type: 'string', required: true, desc: '删除码' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      },
      {
        method: 'GET', path: '/api/v2/file-transfers/my', auth: true, admin: false,
        name: '我的文件',
        desc: '获取当前用户的文件列表',
        response: { code: 200, desc: '文件列表', example: { success: true, data: [{ id: 'ft1', fileName: 'example.pdf', fileSize: 1024 }] } }
      },
      {
        method: 'GET', path: '/api/v2/file-transfers/all', auth: true, admin: true,
        name: '所有文件',
        desc: '获取所有文件（管理员）',
        response: { code: 200, desc: '文件列表', example: { success: true, data: [] } }
      },
      {
        method: 'GET', path: '/api/v2/file-transfers/settings', auth: true, admin: false,
        name: '获取设置',
        desc: '获取文件传输设置',
        response: { code: 200, desc: '设置信息', example: { success: true, data: { maxFileSize: 104857600, allowedTypes: ['*'] } } }
      },
      {
        method: 'PUT', path: '/api/v2/file-transfers/settings', auth: true, admin: true,
        name: '更新设置',
        desc: '更新文件传输设置（管理员）',
        body: [
          { name: 'maxFileSize', type: 'integer', required: false, desc: '最大文件大小' },
          { name: 'allowedTypes', type: 'array', required: false, desc: '允许的文件类型' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true } }
      },
      {
        method: 'GET', path: '/api/v2/file-transfers/stats', auth: true, admin: true,
        name: '获取统计',
        desc: '获取文件传输统计（管理员）',
        response: { code: 200, desc: '统计数据', example: { success: true, data: { totalFiles: 100, totalSize: 1048576000 } } }
      }
    ]
  },

  // WebDAV同步模块
  webdav: {
    id: 'webdav',
    name: 'WebDAV同步',
    icon: '🔄',
    description: 'WebDAV协议支持，多协议书签同步',
    apis: [
      {
        method: 'GET', path: '/api/v2/webdav/configs', auth: true, admin: false,
        name: '获取配置列表',
        desc: '获取所有WebDAV配置',
        response: { code: 200, desc: '配置列表', example: { success: true, data: [{ id: 'wd1', name: '我的NAS', serverUrl: 'https://nas.example.com/webdav' }] } }
      },
      {
        method: 'POST', path: '/api/v2/webdav/configs', auth: true, admin: false,
        name: '创建配置',
        desc: '创建WebDAV配置',
        body: [
          { name: 'name', type: 'string', required: true, desc: '配置名称' },
          { name: 'protocol', type: 'string', required: false, desc: '协议', enum: ['webdav', 'nextcloud', 'owncloud'], default: 'webdav' },
          { name: 'serverUrl', type: 'string', required: true, desc: '服务器地址' },
          { name: 'username', type: 'string', required: true, desc: '用户名' },
          { name: 'password', type: 'string', required: true, desc: '密码' },
          { name: 'remotePath', type: 'string', required: false, desc: '远程路径', default: '/bookmarks' },
          { name: 'syncDirection', type: 'string', required: false, desc: '同步方向', enum: ['upload', 'download', 'bidirectional'], default: 'bidirectional' },
          { name: 'autoSync', type: 'boolean', required: false, desc: '自动同步', default: false },
          { name: 'syncInterval', type: 'integer', required: false, desc: '同步间隔(分钟)', default: 60 }
        ],
        response: { code: 200, desc: '创建成功', example: { success: true, data: { id: 'wd1' } } }
      },
      {
        method: 'PUT', path: '/api/v2/webdav/configs/:id', auth: true, admin: false,
        name: '更新配置',
        desc: '更新WebDAV配置',
        params: [{ name: 'id', type: 'string', required: true, desc: '配置ID' }],
        body: [
          { name: 'name', type: 'string', required: false, desc: '配置名称' },
          { name: 'serverUrl', type: 'string', required: false, desc: '服务器地址' },
          { name: 'username', type: 'string', required: false, desc: '用户名' },
          { name: 'password', type: 'string', required: false, desc: '密码' },
          { name: 'enabled', type: 'boolean', required: false, desc: '是否启用' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true } }
      },
      {
        method: 'DELETE', path: '/api/v2/webdav/configs/:id', auth: true, admin: false,
        name: '删除配置',
        desc: '删除WebDAV配置',
        params: [{ name: 'id', type: 'string', required: true, desc: '配置ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true } }
      },
      {
        method: 'POST', path: '/api/v2/webdav/test', auth: true, admin: false,
        name: '测试连接',
        desc: '测试WebDAV连接',
        body: [
          { name: 'serverUrl', type: 'string', required: true, desc: '服务器地址' },
          { name: 'username', type: 'string', required: true, desc: '用户名' },
          { name: 'password', type: 'string', required: true, desc: '密码' }
        ],
        response: { code: 200, desc: '测试结果', example: { success: true, data: { connected: true, message: '连接成功' } } }
      },
      {
        method: 'POST', path: '/api/v2/webdav/sync/:id', auth: true, admin: false,
        name: '执行同步',
        desc: '执行WebDAV同步',
        params: [{ name: 'id', type: 'string', required: true, desc: '配置ID' }],
        response: { code: 200, desc: '同步结果', example: { success: true, data: { uploaded: 10, downloaded: 5, conflicts: 0 } } }
      }
    ]
  },

  // 通知系统模块
  notifications: {
    id: 'notifications',
    name: '通知系统',
    icon: '🔔',
    description: '多通道通知管理和推送',
    apis: [
      {
        method: 'GET', path: '/api/v2/notifications', auth: true, admin: false,
        name: '获取通知列表',
        desc: '获取用户通知列表',
        query: [
          { name: 'unreadOnly', type: 'boolean', required: false, desc: '仅未读' },
          { name: 'limit', type: 'integer', required: false, desc: '数量限制', default: 20 },
          { name: 'offset', type: 'integer', required: false, desc: '偏移量', default: 0 }
        ],
        response: { code: 200, desc: '通知列表', example: { success: true, data: [{ id: 'n1', title: '系统通知', content: '欢迎使用', isRead: false }], pagination: { total: 10, limit: 20, offset: 0 } } }
      },
      {
        method: 'GET', path: '/api/v2/notifications/unread-count', auth: true, admin: false,
        name: '获取未读数',
        desc: '获取未读通知数量',
        response: { code: 200, desc: '未读数量', example: { success: true, data: { count: 5 } } }
      },
      {
        method: 'PUT', path: '/api/v2/notifications/:id/read', auth: true, admin: false,
        name: '标记已读',
        desc: '标记通知为已读',
        params: [{ name: 'id', type: 'string', required: true, desc: '通知ID' }],
        response: { code: 200, desc: '标记成功', example: { success: true } }
      },
      {
        method: 'PUT', path: '/api/v2/notifications/read-all', auth: true, admin: false,
        name: '标记全部已读',
        desc: '标记所有通知为已读',
        response: { code: 200, desc: '标记成功', example: { success: true } }
      },
      {
        method: 'DELETE', path: '/api/v2/notifications/:id', auth: true, admin: false,
        name: '删除通知',
        desc: '删除指定通知',
        params: [{ name: 'id', type: 'string', required: true, desc: '通知ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true } }
      },
      {
        method: 'POST', path: '/api/v2/notifications', auth: true, admin: true,
        name: '创建通知',
        desc: '创建通知（管理员）',
        body: [
          { name: 'type', type: 'string', required: true, desc: '通知类型' },
          { name: 'title', type: 'string', required: true, desc: '标题' },
          { name: 'content', type: 'string', required: true, desc: '内容' },
          { name: 'priority', type: 'string', required: false, desc: '优先级', enum: ['low', 'normal', 'high', 'urgent'] },
          { name: 'channels', type: 'array', required: false, desc: '通知渠道' }
        ],
        response: { code: 200, desc: '创建成功', example: { success: true, data: { id: 'n1' } } }
      },
      {
        method: 'GET', path: '/api/v2/notifications/configs', auth: true, admin: false,
        name: '获取通知配置',
        desc: '获取通知渠道配置',
        response: { code: 200, desc: '配置列表', example: { success: true, data: [{ channel: 'email', enabled: true }] } }
      },
      {
        method: 'POST', path: '/api/v2/notifications/configs', auth: true, admin: false,
        name: '保存通知配置',
        desc: '保存通知渠道配置',
        body: [
          { name: 'channel', type: 'string', required: true, desc: '渠道类型' },
          { name: 'enabled', type: 'boolean', required: true, desc: '是否启用' },
          { name: 'config', type: 'object', required: false, desc: '渠道配置' }
        ],
        response: { code: 200, desc: '保存成功', example: { success: true } }
      },
      {
        method: 'GET', path: '/api/v2/notifications/channels', auth: true, admin: false,
        name: '获取渠道列表',
        desc: '获取支持的通知渠道',
        response: { code: 200, desc: '渠道列表', example: { success: true, data: [{ value: 'web', name: '站内通知' }, { value: 'email', name: '邮件' }] } }
      }
    ]
  },

  // 审计日志模块
  auditLogs: {
    id: 'auditLogs',
    name: '审计日志',
    icon: '📋',
    description: '系统操作审计日志',
    apis: [
      {
        method: 'GET', path: '/api/v2/audit-logs', auth: true, admin: true,
        name: '获取日志列表',
        desc: '获取审计日志列表（管理员）',
        query: [
          { name: 'userId', type: 'string', required: false, desc: '用户ID' },
          { name: 'action', type: 'string', required: false, desc: '操作类型' },
          { name: 'resourceType', type: 'string', required: false, desc: '资源类型' },
          { name: 'startDate', type: 'string', required: false, desc: '开始日期' },
          { name: 'endDate', type: 'string', required: false, desc: '结束日期' },
          { name: 'limit', type: 'integer', required: false, desc: '数量限制', default: 50 }
        ],
        response: { code: 200, desc: '日志列表', example: { success: true, data: [{ id: 'log1', action: 'CREATE', resourceType: 'bookmark', createdAt: '2024-01-01' }] } }
      },
      {
        method: 'GET', path: '/api/v2/audit-logs/stats', auth: true, admin: true,
        name: '获取日志统计',
        desc: '获取审计日志统计（管理员）',
        response: { code: 200, desc: '统计数据', example: { success: true, data: { total: 1000, today: 50 } } }
      },
      {
        method: 'GET', path: '/api/v2/audit-logs/:id', auth: true, admin: true,
        name: '获取日志详情',
        desc: '获取单条日志详情',
        params: [{ name: 'id', type: 'string', required: true, desc: '日志ID' }],
        response: { code: 200, desc: '日志详情', example: { success: true, data: { id: 'log1', details: {} } } }
      }
    ]
  },

  // 自定义监控指标模块
  customMetrics: {
    id: 'customMetrics',
    name: '自定义监控',
    icon: '📈',
    description: '自定义监控指标管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/custom-metrics', auth: true, admin: true,
        name: '获取指标列表',
        desc: '获取所有自定义指标（管理员）',
        response: { code: 200, desc: '指标列表', example: { success: true, data: [{ id: 'cm1', name: 'API调用次数', metricType: 'counter' }] } }
      },
      {
        method: 'POST', path: '/api/v2/custom-metrics', auth: true, admin: true,
        name: '创建指标',
        desc: '创建自定义指标',
        body: [
          { name: 'name', type: 'string', required: true, desc: '指标名称' },
          { name: 'description', type: 'string', required: false, desc: '描述' },
          { name: 'metricType', type: 'string', required: true, desc: '指标类型', enum: ['counter', 'gauge', 'histogram'] },
          { name: 'unit', type: 'string', required: false, desc: '单位' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'cm1' } } }
      },
      {
        method: 'POST', path: '/api/v2/custom-metrics/:id/record', auth: true, admin: true,
        name: '记录指标值',
        desc: '记录指标数据点',
        params: [{ name: 'id', type: 'string', required: true, desc: '指标ID' }],
        body: [
          { name: 'value', type: 'number', required: true, desc: '指标值' },
          { name: 'labels', type: 'object', required: false, desc: '标签' }
        ],
        response: { code: 200, desc: '记录成功', example: { success: true } }
      },
      {
        method: 'GET', path: '/api/v2/custom-metrics/:id/history', auth: true, admin: true,
        name: '获取历史数据',
        desc: '获取指标历史数据',
        params: [{ name: 'id', type: 'string', required: true, desc: '指标ID' }],
        query: [
          { name: 'startTime', type: 'string', required: false, desc: '开始时间' },
          { name: 'endTime', type: 'string', required: false, desc: '结束时间' }
        ],
        response: { code: 200, desc: '历史数据', example: { success: true, data: [{ timestamp: '2024-01-01', value: 100 }] } }
      }
    ]
  },

  // 服务监控模块
  serviceMonitors: {
    id: 'serviceMonitors',
    name: '服务监控',
    icon: '🔍',
    description: '外部服务健康监控',
    apis: [
      {
        method: 'GET', path: '/api/v2/service-monitors', auth: true, admin: true,
        name: '获取监控列表',
        desc: '获取所有服务监控（管理员）',
        response: { code: 200, desc: '监控列表', example: { success: true, data: [{ id: 'sm1', name: 'Google', url: 'https://google.com', status: 'up' }] } }
      },
      {
        method: 'POST', path: '/api/v2/service-monitors', auth: true, admin: true,
        name: '创建监控',
        desc: '创建服务监控',
        body: [
          { name: 'name', type: 'string', required: true, desc: '监控名称' },
          { name: 'url', type: 'string', required: true, desc: '监控URL' },
          { name: 'method', type: 'string', required: false, desc: '请求方法', default: 'GET' },
          { name: 'interval', type: 'integer', required: false, desc: '检查间隔(秒)', default: 300 },
          { name: 'timeout', type: 'integer', required: false, desc: '超时时间(秒)', default: 30 }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'sm1' } } }
      },
      {
        method: 'GET', path: '/api/v2/service-monitors/:id/status', auth: true, admin: true,
        name: '获取监控状态',
        desc: '获取服务监控状态',
        params: [{ name: 'id', type: 'string', required: true, desc: '监控ID' }],
        response: { code: 200, desc: '监控状态', example: { success: true, data: { status: 'up', responseTime: 200, lastCheck: '2024-01-01' } } }
      }
    ]
  },

  // IP过滤模块
  ipFilters: {
    id: 'ipFilters',
    name: 'IP过滤',
    icon: '🚫',
    description: 'IP地址黑白名单管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/ip-filters', auth: true, admin: true,
        name: '获取过滤规则',
        desc: '获取所有IP过滤规则（管理员）',
        response: { code: 200, desc: '规则列表', example: { success: true, data: [{ id: 'ip1', ip: '192.168.1.1', type: 'whitelist', description: '本地网络' }] } }
      },
      {
        method: 'POST', path: '/api/v2/ip-filters', auth: true, admin: true,
        name: '创建过滤规则',
        desc: '创建IP过滤规则',
        body: [
          { name: 'ip', type: 'string', required: true, desc: 'IP地址或CIDR' },
          { name: 'type', type: 'string', required: true, desc: '类型', enum: ['whitelist', 'blacklist'] },
          { name: 'description', type: 'string', required: false, desc: '描述' }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'ip1' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/ip-filters/:id', auth: true, admin: true,
        name: '删除过滤规则',
        desc: '删除IP过滤规则',
        params: [{ name: 'id', type: 'string', required: true, desc: '规则ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true } }
      }
    ]
  },

  // 私密模式模块
  privateMode: {
    id: 'privateMode',
    name: '私密模式',
    icon: '🔒',
    description: '私密书签和密码保护',
    apis: [
      {
        method: 'POST', path: '/api/v2/private/bookmarks/:id/verify', auth: true, admin: false,
        name: '验证访问密码',
        desc: '验证私密书签访问密码',
        params: [{ name: 'id', type: 'string', required: true, desc: '书签ID' }],
        body: [{ name: 'password', type: 'string', required: true, desc: '访问密码' }],
        response: { code: 200, desc: '验证结果', example: { success: true, data: { verified: true } } }
      },
      {
        method: 'POST', path: '/api/v2/private/bookmarks/:id/set-password', auth: true, admin: false,
        name: '设置访问密码',
        desc: '为书签设置访问密码',
        params: [{ name: 'id', type: 'string', required: true, desc: '书签ID' }],
        body: [{ name: 'password', type: 'string', required: true, desc: '访问密码' }],
        response: { code: 200, desc: '设置成功', example: { success: true } }
      },
      {
        method: 'DELETE', path: '/api/v2/private/bookmarks/:id/remove-password', auth: true, admin: false,
        name: '移除访问密码',
        desc: '移除书签访问密码',
        params: [{ name: 'id', type: 'string', required: true, desc: '书签ID' }],
        response: { code: 200, desc: '移除成功', example: { success: true } }
      }
    ]
  },

  // 壁纸管理模块
  wallpaper: {
    id: 'wallpaper',
    name: '壁纸管理',
    icon: '🖼️',
    description: '壁纸上传和管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/wallpapers', auth: true, admin: false,
        name: '获取壁纸列表',
        desc: '获取所有壁纸',
        response: { code: 200, desc: '壁纸列表', example: { success: true, data: [{ id: 'wp1', name: '风景', url: '/uploads/wallpaper1.jpg' }] } } }
      ,
      {
        method: 'POST', path: '/api/v2/wallpapers', auth: true, admin: true,
        name: '上传壁纸',
        desc: '上传新壁纸（管理员）',
        body: [
          { name: 'file', type: 'file', required: true, desc: '壁纸文件' },
          { name: 'name', type: 'string', required: false, desc: '壁纸名称' }
        ],
        response: { code: 201, desc: '上传成功', example: { success: true, data: { id: 'wp1', url: '/uploads/wallpaper1.jpg' } } } }
      ,
      {
        method: 'DELETE', path: '/api/v2/wallpapers/:id', auth: true, admin: true,
        name: '删除壁纸',
        desc: '删除壁纸（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '壁纸ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true } } }
      ,
      {
        method: 'GET', path: '/api/v2/wallpapers/current', auth: true, admin: false,
        name: '获取当前壁纸',
        desc: '获取当前用户设置的壁纸',
        response: { code: 200, desc: '当前壁纸', example: { success: true, data: { id: 'wp1', url: '/uploads/wallpaper1.jpg' } } } }
      ,
      {
        method: 'PUT', path: '/api/v2/wallpapers/current', auth: true, admin: false,
        name: '设置当前壁纸',
        desc: '设置当前壁纸',
        body: [{ name: 'wallpaperId', type: 'string', required: true, desc: '壁纸ID' }],
        response: { code: 200, desc: '设置成功', example: { success: true } } }
      
    ]
  },

  // 权限管理模块
  permissions: {
    id: 'permissions',
    name: '权限管理',
    icon: '🔐',
    description: '角色权限矩阵、API权限、页面权限控制',
    apis: [
      {
        method: 'GET', path: '/api/v2/permissions/me', auth: true, admin: false,
        name: '获取当前用户权限',
        desc: '获取当前登录用户的所有权限信息',
        response: { code: 200, desc: '权限信息', example: { success: true, data: { userId: 'user1', username: 'admin', role: 'admin', permissions: ['bookmark:view', 'bookmark:create'], pages: ['page:dashboard', 'page:bookmarks'], apis: ['bookmark:view', 'bookmark:create'] } } } }
      ,
      {
        method: 'GET', path: '/api/v2/permissions/definitions', auth: true, admin: true,
        name: '获取权限定义',
        desc: '获取所有权限定义列表（管理员）',
        response: { code: 200, desc: '权限定义', example: { success: true, data: { permissions: [{ code: 'bookmark:view', name: '查看书签', category: '书签管理' }], pages: [{ code: 'page:dashboard', name: '仪表盘', category: '页面权限' }] } } } }
      ,
      {
        method: 'GET', path: '/api/v2/permissions/roles', auth: true, admin: true,
        name: '获取角色权限矩阵',
        desc: '获取所有角色及其权限（管理员）',
        response: { code: 200, desc: '角色权限', example: { success: true, data: [{ code: 'admin', name: '管理员', permissions: ['bookmark:view', 'bookmark:create'], permissionCount: 20 }] } } }
      ,
      {
        method: 'GET', path: '/api/v2/permissions/roles/:role', auth: true, admin: true,
        name: '获取指定角色权限',
        desc: '获取指定角色的详细权限（管理员）',
        params: [{ name: 'role', type: 'string', required: true, desc: '角色代码' }],
        response: { code: 200, desc: '角色权限详情', example: { success: true, data: { code: 'admin', name: '管理员', permissions: ['bookmark:view'], pages: ['page:dashboard'], apis: ['bookmark:view'] } } } }
      ,
      {
        method: 'POST', path: '/api/v2/permissions/check', auth: true, admin: false,
        name: '检查权限',
        desc: '检查当前用户是否拥有指定权限',
        body: [
          { name: 'permissions', type: 'array', required: true, desc: '权限列表' },
          { name: 'requireAll', type: 'boolean', required: false, desc: '是否需要所有权限', default: false }
        ],
        response: { code: 200, desc: '检查结果', example: { success: true, data: { hasAccess: true, checked: ['bookmark:view'], granted: ['bookmark:view'], missing: [] } } } }
      ,
      {
        method: 'GET', path: '/api/v2/permissions/api-map', auth: true, admin: true,
        name: '获取API权限映射',
        desc: '获取API路径与权限的映射关系（管理员）',
        query: [{ name: 'groupBy', type: 'string', required: false, desc: '分组方式 (path/permission)', default: 'path' }],
        response: { code: 200, desc: 'API权限映射', example: { success: true, data: { total: 50, apis: [{ path: '/api/v2/bookmarks', method: 'GET', permissions: ['bookmark:view'], description: '获取书签列表' }] } } } }
      ,
      {
        method: 'POST', path: '/api/v2/permissions/verify-api', auth: true, admin: false,
        name: '验证API权限',
        desc: '验证用户是否有权访问指定API',
        body: [
          { name: 'path', type: 'string', required: true, desc: 'API路径' },
          { name: 'method', type: 'string', required: true, desc: 'HTTP方法' }
        ],
        response: { code: 200, desc: '验证结果', example: { success: true, data: { allowed: true, path: '/api/v2/bookmarks', method: 'GET', required: ['bookmark:view'], description: '获取书签列表' } } } }
      ,
      {
        method: 'GET', path: '/api/v2/permissions/pages', auth: true, admin: false,
        name: '获取可访问页面',
        desc: '获取当前用户可访问的页面列表',
        response: { code: 200, desc: '页面列表', example: { success: true, data: [{ code: 'page:dashboard', name: '仪表盘', path: '/admin/dashboard' }] } } }
      
    ]
  },

  // 公告管理模块
  announcements: {
    id: 'announcements',
    name: '公告管理',
    icon: '📢',
    description: '系统公告发布和管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/announcements', auth: false, admin: false,
        name: '获取公告列表',
        desc: '获取当前生效的公告列表（公开）',
        query: [
          { name: 'limit', type: 'integer', required: false, desc: '数量限制', default: 10 },
          { name: 'includeRead', type: 'boolean', required: false, desc: '包含已读', default: false }
        ],
        response: { code: 200, desc: '公告列表', example: { success: true, data: [{ id: 'ann1', title: '系统维护通知', content: '系统将于今晚维护', type: 'info', priority: 'normal', isRead: false }] } } }
      ,
      {
        method: 'GET', path: '/api/v2/announcements/admin', auth: true, admin: true,
        name: '获取所有公告',
        desc: '获取所有公告（管理员）',
        query: [
          { name: 'status', type: 'string', required: false, desc: '状态筛选 (draft/published/expired)' },
          { name: 'page', type: 'integer', required: false, desc: '页码', default: 1 },
          { name: 'limit', type: 'integer', required: false, desc: '每页数量', default: 20 }
        ],
        response: { code: 200, desc: '公告列表', example: { success: true, data: { items: [{ id: 'ann1', title: '通知', status: 'published' }], pagination: { page: 1, limit: 20, total: 10, totalPages: 1 } } } } }
      ,
      {
        method: 'POST', path: '/api/v2/announcements', auth: true, admin: true,
        name: '创建公告',
        desc: '创建新公告（管理员）',
        body: [
          { name: 'title', type: 'string', required: true, desc: '公告标题' },
          { name: 'content', type: 'string', required: true, desc: '公告内容' },
          { name: 'type', type: 'string', required: false, desc: '类型 (info/success/warning/error)', default: 'info' },
          { name: 'priority', type: 'string', required: false, desc: '优先级 (low/normal/high/urgent)', default: 'normal' },
          { name: 'targetRoles', type: 'array', required: false, desc: '目标角色' },
          { name: 'targetUsers', type: 'array', required: false, desc: '目标用户ID' },
          { name: 'publishAt', type: 'string', required: false, desc: '发布时间' },
          { name: 'expireAt', type: 'string', required: false, desc: '过期时间' },
          { name: 'isSticky', type: 'boolean', required: false, desc: '是否置顶', default: false }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'ann1', title: '通知', status: 'draft' } } } }
      ,
      {
        method: 'GET', path: '/api/v2/announcements/:id', auth: true, admin: true,
        name: '获取公告详情',
        desc: '获取公告详细信息（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '公告ID' }],
        response: { code: 200, desc: '公告详情', example: { success: true, data: { id: 'ann1', title: '通知', content: '内容', status: 'published', readCount: 10 } } } }
      ,
      {
        method: 'PATCH', path: '/api/v2/announcements/:id', auth: true, admin: true,
        name: '更新公告',
        desc: '更新公告信息（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '公告ID' }],
        body: [
          { name: 'title', type: 'string', required: false, desc: '标题' },
          { name: 'content', type: 'string', required: false, desc: '内容' },
          { name: 'type', type: 'string', required: false, desc: '类型' },
          { name: 'priority', type: 'string', required: false, desc: '优先级' },
          { name: 'isSticky', type: 'boolean', required: false, desc: '是否置顶' },
          { name: 'expireAt', type: 'string', required: false, desc: '过期时间' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'ann1', title: '更新后的标题' } } } }
      ,
      {
        method: 'DELETE', path: '/api/v2/announcements/:id', auth: true, admin: true,
        name: '删除公告',
        desc: '删除公告（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '公告ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } } }
      ,
      {
        method: 'POST', path: '/api/v2/announcements/:id/publish', auth: true, admin: true,
        name: '发布公告',
        desc: '发布公告（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '公告ID' }],
        response: { code: 200, desc: '发布成功', example: { success: true, data: { id: 'ann1', status: 'published', publishedAt: '2024-01-01' } } } }
      ,
      {
        method: 'POST', path: '/api/v2/announcements/:id/read', auth: true, admin: false,
        name: '标记已读',
        desc: '标记公告为已读',
        params: [{ name: 'id', type: 'string', required: true, desc: '公告ID' }],
        response: { code: 200, desc: '标记成功', example: { success: true } } }
      ,
      {
        method: 'GET', path: '/api/v2/announcements/unread-count', auth: true, admin: false,
        name: '获取未读数',
        desc: '获取未读公告数量',
        response: { code: 200, desc: '未读数量', example: { success: true, data: { count: 5 } } } }
      
    ]
  },

  // 国际化模块
  i18n: {
    id: 'i18n',
    name: '国际化',
    icon: '🌍',
    description: '多语言内容管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/i18n/locales', auth: false, admin: false,
        name: '获取语言列表',
        desc: '获取所有支持的语言（公开）',
        query: [{ name: 'enabledOnly', type: 'boolean', required: false, desc: '仅启用的语言', default: 'true' }],
        response: { code: 200, desc: '语言列表', example: { success: true, data: [{ code: 'zh', name: '中文', nativeName: '中文', flag: '🇨🇳', isEnabled: true, isDefault: true }] } } }
      ,
      {
        method: 'GET', path: '/api/v2/i18n/config', auth: false, admin: false,
        name: '获取语言配置',
        desc: '获取当前语言配置（公开）',
        response: { code: 200, desc: '语言配置', example: { success: true, data: { defaultLocale: 'zh', supportedLocales: ['zh', 'en'], locales: [{ code: 'zh', name: '中文' }] } } } }
      ,
      {
        method: 'GET', path: '/api/v2/i18n/translations/:locale', auth: false, admin: false,
        name: '获取翻译内容',
        desc: '获取指定语言的翻译内容（公开）',
        params: [{ name: 'locale', type: 'string', required: true, desc: '语言代码' }],
        query: [{ name: 'namespace', type: 'string', required: false, desc: '命名空间', default: 'all' }],
        response: { code: 200, desc: '翻译内容', example: { success: true, data: { locale: 'zh', translations: { common: { hello: '你好' } } } } } }
      ,
      {
        method: 'GET', path: '/api/v2/i18n/translations', auth: true, admin: true,
        name: '获取所有翻译',
        desc: '获取翻译列表（管理员）',
        query: [
          { name: 'locale', type: 'string', required: false, desc: '语言筛选' },
          { name: 'namespace', type: 'string', required: false, desc: '命名空间筛选' },
          { name: 'search', type: 'string', required: false, desc: '搜索关键词' },
          { name: 'page', type: 'integer', required: false, desc: '页码', default: 1 },
          { name: 'limit', type: 'integer', required: false, desc: '每页数量', default: 50 }
        ],
        response: { code: 200, desc: '翻译列表', example: { success: true, data: { translations: [{ id: 't1', key: 'hello', namespace: 'common', locale: 'zh', value: '你好' }], pagination: { page: 1, limit: 50, total: 100 } } } } }
      ,
      {
        method: 'POST', path: '/api/v2/i18n/translations', auth: true, admin: true,
        name: '创建/更新翻译',
        desc: '创建或更新翻译（管理员）',
        body: [
          { name: 'key', type: 'string', required: true, desc: '翻译键名' },
          { name: 'namespace', type: 'string', required: false, desc: '命名空间', default: 'common' },
          { name: 'locale', type: 'string', required: true, desc: '语言代码' },
          { name: 'value', type: 'string', required: true, desc: '翻译内容' },
          { name: 'description', type: 'string', required: false, desc: '描述' }
        ],
        response: { code: 200, desc: '保存成功', example: { success: true, data: { id: 't1', key: 'hello', value: '你好' } } } }
      ,
      {
        method: 'POST', path: '/api/v2/i18n/translations/batch', auth: true, admin: true,
        name: '批量更新翻译',
        desc: '批量更新翻译内容（管理员）',
        body: [
          { name: 'locale', type: 'string', required: true, desc: '语言代码' },
          { name: 'namespace', type: 'string', required: true, desc: '命名空间' },
          { name: 'translations', type: 'object', required: true, desc: '翻译对象 {key: value}' }
        ],
        response: { code: 200, desc: '批量保存成功', example: { success: true, data: { updated: 10, translations: [] } } } }
      ,
      {
        method: 'DELETE', path: '/api/v2/i18n/translations/:id', auth: true, admin: true,
        name: '删除翻译',
        desc: '删除翻译（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '翻译ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } } }
      ,
      {
        method: 'POST', path: '/api/v2/i18n/locales', auth: true, admin: true,
        name: '添加语言',
        desc: '添加新语言（管理员）',
        body: [
          { name: 'code', type: 'string', required: true, desc: '语言代码' },
          { name: 'name', type: 'string', required: true, desc: '语言名称' },
          { name: 'nativeName', type: 'string', required: true, desc: '本地名称' },
          { name: 'flag', type: 'string', required: false, desc: '国旗emoji' },
          { name: 'rtl', type: 'boolean', required: false, desc: '是否从右到左', default: false }
        ],
        response: { code: 201, desc: '添加成功', example: { success: true, data: { code: 'en', name: 'English', isEnabled: true } } } }
      ,
      {
        method: 'PATCH', path: '/api/v2/i18n/locales/:code', auth: true, admin: true,
        name: '更新语言配置',
        desc: '更新语言配置（管理员）',
        params: [{ name: 'code', type: 'string', required: true, desc: '语言代码' }],
        body: [
          { name: 'name', type: 'string', required: false, desc: '名称' },
          { name: 'isEnabled', type: 'boolean', required: false, desc: '是否启用' },
          { name: 'isDefault', type: 'boolean', required: false, desc: '是否默认' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { code: 'en', isEnabled: true } } } }
      ,
      {
        method: 'DELETE', path: '/api/v2/i18n/locales/:code', auth: true, admin: true,
        name: '删除语言',
        desc: '删除语言（管理员）',
        params: [{ name: 'code', type: 'string', required: true, desc: '语言代码' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } } }
      ,
      {
        method: 'GET', path: '/api/v2/i18n/export', auth: true, admin: true,
        name: '导出翻译',
        desc: '导出翻译内容（管理员）',
        query: [
          { name: 'format', type: 'string', required: false, desc: '格式 (json/csv)', default: 'json' },
          { name: 'locale', type: 'string', required: false, desc: '语言筛选' }
        ],
        response: { code: 200, desc: '文件流', example: { success: true } } }
      ,
      {
        method: 'POST', path: '/api/v2/i18n/import', auth: true, admin: true,
        name: '导入翻译',
        desc: '导入翻译内容（管理员）',
        body: [
          { name: 'translations', type: 'object', required: true, desc: '翻译数据' },
          { name: 'overwrite', type: 'boolean', required: false, desc: '是否覆盖', default: false }
        ],
        response: { code: 200, desc: '导入成功', example: { success: true, data: { imported: 100, skipped: 10, message: '成功导入 100 条翻译，跳过 10 条' } } }
      }
    ]
  },

  // 自定义图标模块
  customIcons: {
    id: 'customIcons',
    name: '自定义图标',
    icon: '🎨',
    description: '用户自定义图标管理',
    apis: [
      {
        method: 'GET', path: '/api/v2/custom-icons', auth: true, admin: false,
        name: '获取自定义图标列表',
        desc: '获取当前用户的所有自定义图标',
        response: { code: 200, desc: '图标列表', example: { success: true, data: [{ id: 'icon1', name: '百度', url: 'https://baidu.com/favicon.ico', isPublic: false }] } }
      },
      {
        method: 'POST', path: '/api/v2/custom-icons', auth: true, admin: false,
        name: '创建自定义图标',
        desc: '创建新的自定义图标',
        body: [
          { name: 'name', type: 'string', required: true, desc: '图标名称' },
          { name: 'url', type: 'string', required: true, desc: '图标URL' },
          { name: 'isPublic', type: 'boolean', required: false, desc: '是否公开', default: false }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'icon1', name: '百度', url: 'https://baidu.com/favicon.ico' } } }
      },
      {
        method: 'PUT', path: '/api/v2/custom-icons/:id', auth: true, admin: false,
        name: '更新自定义图标',
        desc: '更新指定图标',
        params: [{ name: 'id', type: 'string', required: true, desc: '图标ID' }],
        body: [
          { name: 'name', type: 'string', required: false, desc: '图标名称' },
          { name: 'url', type: 'string', required: false, desc: '图标URL' },
          { name: 'isPublic', type: 'boolean', required: false, desc: '是否公开' }
        ],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'icon1' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/custom-icons/:id', auth: true, admin: false,
        name: '删除自定义图标',
        desc: '删除指定图标',
        params: [{ name: 'id', type: 'string', required: true, desc: '图标ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  },

  // 天气模块
  weather: {
    id: 'weather',
    name: '天气服务',
    icon: '🌤️',
    description: '天气数据查询（后端代理，保护用户IP）',
    apis: [
      {
        method: 'GET', path: '/api/v2/weather', auth: false, admin: false,
        name: '获取天气数据',
        desc: '根据经纬度获取天气数据',
        query: [
          { name: 'lat', type: 'number', required: true, desc: '纬度' },
          { name: 'lon', type: 'number', required: true, desc: '经度' },
          { name: 'city', type: 'string', required: false, desc: '城市名称' }
        ],
        response: { code: 200, desc: '天气数据', example: { success: true, data: { temperature: 24, feelsLike: 26, humidity: 65, description: '晴', icon: '☀️', city: '北京' } } }
      },
      {
        method: 'GET', path: '/api/v2/weather/city', auth: false, admin: false,
        name: '根据城市获取天气',
        desc: '根据城市名称获取天气数据',
        query: [
          { name: 'name', type: 'string', required: true, desc: '城市名称' }
        ],
        response: { code: 200, desc: '天气数据', example: { success: true, data: { temperature: 24, description: '晴', city: '北京' } } }
      }
    ]
  },

  // 书签卡片样式模块
  bookmarkCardStyles: {
    id: 'bookmarkCardStyles',
    name: '书签卡片样式',
    icon: '🎴',
    description: '书签卡片样式配置管理（全局/角色/用户级别）',
    apis: [
      {
        method: 'GET', path: '/api/v2/bookmark-card-styles', auth: true, admin: true,
        name: '获取样式列表',
        desc: '获取所有书签卡片样式（管理员）',
        query: [
          { name: 'scope', type: 'string', required: false, desc: '作用域筛选 (global/role/user)' },
          { name: 'isEnabled', type: 'boolean', required: false, desc: '是否启用' }
        ],
        response: { code: 200, desc: '样式列表', example: { success: true, data: [{ id: 'style1', name: '玻璃拟态', scope: 'global', isEnabled: true }] } }
      },
      {
        method: 'GET', path: '/api/v2/bookmark-card-styles/active', auth: false, admin: false,
        name: '获取当前样式',
        desc: '获取当前用户生效的卡片样式',
        response: { code: 200, desc: '当前样式', example: { success: true, data: { id: 'style1', name: '玻璃拟态', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' } } }
      },
      {
        method: 'POST', path: '/api/v2/bookmark-card-styles', auth: true, admin: true,
        name: '创建样式',
        desc: '创建新的卡片样式（管理员）',
        body: [
          { name: 'name', type: 'string', required: true, desc: '样式名称' },
          { name: 'description', type: 'string', required: false, desc: '样式描述' },
          { name: 'scope', type: 'string', required: true, desc: '作用域 (global/role/user)' },
          { name: 'backgroundColor', type: 'string', required: false, desc: '背景颜色' },
          { name: 'borderRadius', type: 'string', required: false, desc: '边框圆角' },
          { name: 'isEnabled', type: 'boolean', required: false, desc: '是否启用', default: true }
        ],
        response: { code: 201, desc: '创建成功', example: { success: true, data: { id: 'style1', name: '玻璃拟态' } } }
      },
      {
        method: 'PUT', path: '/api/v2/bookmark-card-styles/:id', auth: true, admin: true,
        name: '更新样式',
        desc: '更新指定样式（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '样式ID' }],
        response: { code: 200, desc: '更新成功', example: { success: true, data: { id: 'style1' } } }
      },
      {
        method: 'DELETE', path: '/api/v2/bookmark-card-styles/:id', auth: true, admin: true,
        name: '删除样式',
        desc: '删除指定样式（管理员）',
        params: [{ name: 'id', type: 'string', required: true, desc: '样式ID' }],
        response: { code: 200, desc: '删除成功', example: { success: true, message: '删除成功' } }
      }
    ]
  }
}

// 数据库结构定义
const databaseSchema = {
  tables: [
    {
      name: 'users',
      desc: '用户表 - 存储用户基本信息',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '用户ID' },
        { name: 'username', type: 'TEXT', unique: true, desc: '用户名' },
        { name: 'password', type: 'TEXT', desc: '密码哈希' },
        { name: 'email', type: 'TEXT', desc: '邮箱' },
        { name: 'role', type: 'TEXT', default: 'user', desc: '角色 (admin/user)' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否激活 (1=是, 0=否)' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'tokens',
      desc: '令牌表 - 存储用户登录令牌',
      columns: [
        { name: 'token', type: 'TEXT', pk: true, desc: '令牌字符串' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'username', type: 'TEXT', desc: '用户名' },
        { name: 'expiresAt', type: 'INTEGER', desc: '过期时间戳' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' }
      ]
    },
    {
      name: 'bookmarks',
      desc: '书签表 - 存储书签信息',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '书签ID' },
        { name: 'url', type: 'TEXT', desc: 'URL地址' },
        { name: 'title', type: 'TEXT', desc: '标题' },
        { name: 'description', type: 'TEXT', desc: '描述' },
        { name: 'favicon', type: 'TEXT', desc: '网站图标' },
        { name: 'ogImage', type: 'TEXT', desc: 'Open Graph图片' },
        { name: 'icon', type: 'TEXT', desc: '图标' },
        { name: 'iconUrl', type: 'TEXT', desc: '图标URL' },
        { name: 'category', type: 'TEXT', desc: '分类ID' },
        { name: 'tags', type: 'TEXT', desc: '标签JSON' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'isPinned', type: 'INTEGER', default: 0, desc: '是否置顶' },
        { name: 'isReadLater', type: 'INTEGER', default: 0, desc: '是否稍后阅读' },
        { name: 'isRead', type: 'INTEGER', default: 0, desc: '是否已读' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'internalUrl', type: 'TEXT', desc: '内部URL' },
        { name: 'notes', type: 'TEXT', desc: '备注' },
        { name: 'visibility', type: 'TEXT', default: 'personal', desc: '可见性 (public/personal/private)' },
        { name: 'visitCount', type: 'INTEGER', default: 0, desc: '访问次数' }
      ]
    },
    {
      name: 'categories',
      desc: '分类表 - 存储书签分类',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '分类ID' },
        { name: 'name', type: 'TEXT', desc: '分类名称' },
        { name: 'description', type: 'TEXT', desc: '分类描述' },
        { name: 'icon', type: 'TEXT', desc: '图标' },
        { name: 'color', type: 'TEXT', desc: '颜色' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'parentId', type: 'TEXT', desc: '父分类ID' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'tags',
      desc: '标签表 - 存储书签标签',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '标签ID' },
        { name: 'name', type: 'TEXT', desc: '标签名称' },
        { name: 'color', type: 'TEXT', desc: '颜色' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' }
      ]
    },
    {
      name: 'bookmark_tags',
      desc: '书签标签关联表 - 书签和标签的多对多关系',
      columns: [
        { name: 'bookmarkId', type: 'TEXT', pk: true, desc: '书签ID' },
        { name: 'tagId', type: 'TEXT', pk: true, desc: '标签ID' }
      ]
    },
    {
      name: 'settings',
      desc: '设置表 - 存储用户和系统设置',
      columns: [
        { name: 'key', type: 'TEXT', pk: true, desc: '设置键' },
        { name: 'value', type: 'TEXT', desc: '设置值' },
        { name: 'userId', type: 'TEXT', desc: '用户ID (null为系统设置)' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'audit_logs',
      desc: '审计日志表 - 存储系统操作日志',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '日志ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'username', type: 'TEXT', desc: '用户名' },
        { name: 'action', type: 'TEXT', desc: '操作类型' },
        { name: 'resourceType', type: 'TEXT', desc: '资源类型' },
        { name: 'resourceId', type: 'TEXT', desc: '资源ID' },
        { name: 'details', type: 'TEXT', desc: '详情JSON' },
        { name: 'ip', type: 'TEXT', desc: 'IP地址' },
        { name: 'userAgent', type: 'TEXT', desc: '用户代理' },
        { name: 'sessionId', type: 'TEXT', desc: '会话ID' },
        { name: 'deviceInfo', type: 'TEXT', desc: '设备信息' },
        { name: 'riskLevel', type: 'TEXT', default: 'low', desc: '风险等级' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' }
      ]
    },
    {
      name: 'visits',
      desc: '访问记录表 - 存储书签访问日志',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '记录ID' },
        { name: 'bookmarkId', type: 'TEXT', desc: '书签ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'visitedAt', type: 'TEXT', desc: '访问时间' },
        { name: 'ip', type: 'TEXT', desc: 'IP地址' },
        { name: 'userAgent', type: 'TEXT', desc: '用户代理' }
      ]
    },
    {
      name: 'file_transfers',
      desc: '文件传输表 - 存储文件快传记录',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '文件ID' },
        { name: 'fileName', type: 'TEXT', desc: '文件名' },
        { name: 'fileSize', type: 'INTEGER', desc: '文件大小(字节)' },
        { name: 'fileType', type: 'TEXT', desc: '文件类型' },
        { name: 'filePath', type: 'TEXT', desc: '文件存储路径' },
        { name: 'extractCode', type: 'TEXT', unique: true, desc: '提取码' },
        { name: 'deleteCode', type: 'TEXT', unique: true, desc: '删除码' },
        { name: 'userId', type: 'TEXT', desc: '上传用户ID' },
        { name: 'expiresAt', type: 'TEXT', desc: '过期时间' },
        { name: 'downloadCount', type: 'INTEGER', default: 0, desc: '下载次数' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'webdav_configs',
      desc: 'WebDAV配置表 - 存储WebDAV同步配置',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '配置ID' },
        { name: 'name', type: 'TEXT', desc: '配置名称' },
        { name: 'protocol', type: 'TEXT', default: 'webdav', desc: '协议类型' },
        { name: 'serverUrl', type: 'TEXT', desc: '服务器地址' },
        { name: 'username', type: 'TEXT', desc: '用户名' },
        { name: 'password', type: 'TEXT', desc: '密码' },
        { name: 'remotePath', type: 'TEXT', default: '/bookmarks', desc: '远程路径' },
        { name: 'syncDirection', type: 'TEXT', default: 'bidirectional', desc: '同步方向' },
        { name: 'autoSync', type: 'INTEGER', default: 0, desc: '自动同步' },
        { name: 'syncInterval', type: 'INTEGER', default: 60, desc: '同步间隔(分钟)' },
        { name: 'enabled', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'lastSyncAt', type: 'TEXT', desc: '最后同步时间' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'notifications',
      desc: '通知表 - 存储用户通知',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '通知ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'type', type: 'TEXT', desc: '通知类型' },
        { name: 'title', type: 'TEXT', desc: '标题' },
        { name: 'content', type: 'TEXT', desc: '内容' },
        { name: 'priority', type: 'TEXT', default: 'normal', desc: '优先级' },
        { name: 'channels', type: 'TEXT', desc: '通知渠道JSON' },
        { name: 'data', type: 'TEXT', desc: '附加数据JSON' },
        { name: 'isRead', type: 'INTEGER', default: 0, desc: '是否已读' },
        { name: 'readAt', type: 'TEXT', desc: '阅读时间' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' }
      ]
    },
    {
      name: 'notification_configs',
      desc: '通知配置表 - 存储用户通知渠道配置',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '配置ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'channel', type: 'TEXT', desc: '渠道类型' },
        { name: 'enabled', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'config', type: 'TEXT', desc: '配置JSON' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'rss_feeds',
      desc: 'RSS订阅源表 - 存储RSS订阅',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '订阅源ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'title', type: 'TEXT', desc: '标题' },
        { name: 'url', type: 'TEXT', desc: 'RSS地址' },
        { name: 'description', type: 'TEXT', desc: '描述' },
        { name: 'siteUrl', type: 'TEXT', desc: '网站地址' },
        { name: 'favicon', type: 'TEXT', desc: '图标' },
        { name: 'category', type: 'TEXT', desc: '分类' },
        { name: 'updateInterval', type: 'INTEGER', default: 60, desc: '更新间隔(分钟)' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否活跃' },
        { name: 'lastFetchedAt', type: 'TEXT', desc: '最后获取时间' },
        { name: 'errorCount', type: 'INTEGER', default: 0, desc: '错误次数' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'rss_articles',
      desc: 'RSS文章表 - 存储RSS文章',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '文章ID' },
        { name: 'feedId', type: 'TEXT', desc: '订阅源ID' },
        { name: 'title', type: 'TEXT', desc: '标题' },
        { name: 'content', type: 'TEXT', desc: '内容' },
        { name: 'summary', type: 'TEXT', desc: '摘要' },
        { name: 'link', type: 'TEXT', desc: '原文链接' },
        { name: 'author', type: 'TEXT', desc: '作者' },
        { name: 'publishedAt', type: 'TEXT', desc: '发布时间' },
        { name: 'isRead', type: 'INTEGER', default: 0, desc: '是否已读' },
        { name: 'isStarred', type: 'INTEGER', default: 0, desc: '是否收藏' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' }
      ]
    },
    {
      name: 'notes',
      desc: '笔记表 - 存储富文本笔记',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '笔记ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'title', type: 'TEXT', desc: '标题' },
        { name: 'content', type: 'TEXT', desc: '内容' },
        { name: 'isMarkdown', type: 'INTEGER', default: 1, desc: '是否Markdown' },
        { name: 'tags', type: 'TEXT', desc: '标签' },
        { name: 'folderId', type: 'TEXT', desc: '文件夹ID' },
        { name: 'isPinned', type: 'INTEGER', default: 0, desc: '是否置顶' },
        { name: 'isArchived', type: 'INTEGER', default: 0, desc: '是否归档' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'note_folders',
      desc: '笔记文件夹表 - 存储笔记分类文件夹',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '文件夹ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'name', type: 'TEXT', desc: '名称' },
        { name: 'parentId', type: 'TEXT', desc: '父文件夹ID' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'notepads',
      desc: '记事本表 - 存储简单记事',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '记事本ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'title', type: 'TEXT', desc: '标题' },
        { name: 'content', type: 'TEXT', desc: '内容' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'widgets',
      desc: '小部件表 - 存储用户小部件',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '小部件ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'name', type: 'TEXT', desc: '名称' },
        { name: 'type', type: 'TEXT', desc: '类型' },
        { name: 'config', type: 'TEXT', desc: '配置JSON' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'isVisible', type: 'INTEGER', default: 1, desc: '是否可见' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'quotes',
      desc: '名言表 - 存储名言警句',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '名言ID' },
        { name: 'text', type: 'TEXT', desc: '名言内容' },
        { name: 'author', type: 'TEXT', desc: '作者' },
        { name: 'source', type: 'TEXT', desc: '出处' },
        { name: 'category', type: 'TEXT', desc: '分类' },
        { name: 'tags', type: 'TEXT', desc: '标签' },
        { name: 'language', type: 'TEXT', default: 'zh', desc: '语言' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'shares',
      desc: '分享表 - 存储内容分享',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '分享ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'type', type: 'TEXT', desc: '分享类型' },
        { name: 'resourceId', type: 'TEXT', desc: '资源ID' },
        { name: 'shareCode', type: 'TEXT', unique: true, desc: '分享码' },
        { name: 'password', type: 'TEXT', desc: '访问密码' },
        { name: 'expiresAt', type: 'TEXT', desc: '过期时间' },
        { name: 'accessCount', type: 'INTEGER', default: 0, desc: '访问次数' },
        { name: 'maxAccess', type: 'INTEGER', desc: '最大访问次数' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' }
      ]
    },
    {
      name: 'plugins',
      desc: '插件表 - 存储插件信息',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '插件ID' },
        { name: 'name', type: 'TEXT', desc: '插件名称' },
        { name: 'description', type: 'TEXT', desc: '描述' },
        { name: 'version', type: 'TEXT', desc: '版本' },
        { name: 'author', type: 'TEXT', desc: '作者' },
        { name: 'icon', type: 'TEXT', desc: '图标' },
        { name: 'entry', type: 'TEXT', desc: '入口文件' },
        { name: 'config', type: 'TEXT', desc: '配置JSON' },
        { name: 'isEnabled', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'isInstalled', type: 'INTEGER', default: 1, desc: '是否安装' },
        { name: 'visibility', type: 'TEXT', default: 'public', desc: '可见性' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'user_plugins',
      desc: '用户插件关联表 - 存储用户插件启用状态',
      columns: [
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'pluginId', type: 'TEXT', desc: '插件ID' },
        { name: 'isEnabled', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'config', type: 'TEXT', desc: '用户配置JSON' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'themes',
      desc: '主题表 - 存储主题配置',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '主题ID' },
        { name: 'name', type: 'TEXT', desc: '主题名称' },
        { name: 'isDark', type: 'INTEGER', default: 0, desc: '是否暗色主题' },
        { name: 'isDefault', type: 'INTEGER', default: 0, desc: '是否默认主题' },
        { name: 'colors', type: 'TEXT', desc: '颜色配置JSON' },
        { name: 'layout', type: 'TEXT', desc: '布局配置JSON' },
        { name: 'fonts', type: 'TEXT', desc: '字体配置JSON' },
        { name: 'customCSS', type: 'TEXT', desc: '自定义CSS' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'user_theme_preferences',
      desc: '用户主题偏好表 - 存储用户主题设置',
      columns: [
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'themeId', type: 'TEXT', desc: '主题ID' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'customColors', type: 'TEXT', desc: '自定义颜色JSON' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'admin_menus',
      desc: '管理员菜单表 - 存储后台菜单配置',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '菜单ID' },
        { name: 'parentId', type: 'TEXT', desc: '父菜单ID' },
        { name: 'name', type: 'TEXT', desc: '菜单名称' },
        { name: 'labelKey', type: 'TEXT', desc: '标签键' },
        { name: 'icon', type: 'TEXT', desc: '图标' },
        { name: 'path', type: 'TEXT', desc: '路径' },
        { name: 'pluginId', type: 'TEXT', desc: '插件ID' },
        { name: 'isVisible', type: 'INTEGER', default: 1, desc: '是否可见' },
        { name: 'isEnabled', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'visibility', type: 'TEXT', default: 'public', desc: '可见性' },
        { name: 'allowedRoles', type: 'TEXT', desc: '允许的角色' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'dock_configs',
      desc: 'Dock配置表 - 存储Dock导航配置',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '配置ID' },
        { name: 'name', type: 'TEXT', desc: '配置名称' },
        { name: 'scope', type: 'TEXT', desc: '作用域' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'roleId', type: 'TEXT', desc: '角色ID' },
        { name: 'items', type: 'TEXT', desc: '项目JSON' },
        { name: 'layout', type: 'TEXT', desc: '布局配置JSON' },
        { name: 'isDefault', type: 'INTEGER', default: 0, desc: '是否默认' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'settings_tabs',
      desc: '设置标签表 - 存储设置页面标签',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '标签ID' },
        { name: 'tabId', type: 'TEXT', unique: true, desc: '标签标识' },
        { name: 'name', type: 'TEXT', desc: '标签名称' },
        { name: 'icon', type: 'TEXT', desc: '图标' },
        { name: 'component', type: 'TEXT', desc: '组件路径' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'visibility', type: 'TEXT', default: 'public', desc: '可见性' },
        { name: 'allowedRoles', type: 'TEXT', desc: '允许的角色' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'frontend_nav_items',
      desc: '前端导航表 - 存储前端导航项',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '导航ID' },
        { name: 'navId', type: 'TEXT', unique: true, desc: '导航标识' },
        { name: 'name', type: 'TEXT', desc: '导航名称' },
        { name: 'icon', type: 'TEXT', desc: '图标' },
        { name: 'path', type: 'TEXT', desc: '路径' },
        { name: 'external', type: 'INTEGER', default: 0, desc: '是否外部链接' },
        { name: 'requireAuth', type: 'INTEGER', default: 0, desc: '是否需要认证' },
        { name: 'orderIndex', type: 'INTEGER', default: 0, desc: '排序索引' },
        { name: 'visibility', type: 'TEXT', default: 'public', desc: '可见性' },
        { name: 'allowedRoles', type: 'TEXT', desc: '允许的角色' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'custom_metrics',
      desc: '自定义监控指标表 - 存储自定义指标定义',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '指标ID' },
        { name: 'name', type: 'TEXT', desc: '指标名称' },
        { name: 'description', type: 'TEXT', desc: '描述' },
        { name: 'metricType', type: 'TEXT', desc: '指标类型' },
        { name: 'unit', type: 'TEXT', desc: '单位' },
        { name: 'labels', type: 'TEXT', desc: '标签JSON' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'custom_metric_history',
      desc: '自定义指标历史表 - 存储指标数据点',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '记录ID' },
        { name: 'metricId', type: 'TEXT', desc: '指标ID' },
        { name: 'value', type: 'REAL', desc: '指标值' },
        { name: 'labels', type: 'TEXT', desc: '标签JSON' },
        { name: 'recordedAt', type: 'TEXT', desc: '记录时间' }
      ]
    },
    {
      name: 'service_monitors',
      desc: '服务监控表 - 存储外部服务监控',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '监控ID' },
        { name: 'name', type: 'TEXT', desc: '监控名称' },
        { name: 'url', type: 'TEXT', desc: '监控URL' },
        { name: 'method', type: 'TEXT', default: 'GET', desc: '请求方法' },
        { name: 'headers', type: 'TEXT', desc: '请求头JSON' },
        { name: 'body', type: 'TEXT', desc: '请求体' },
        { name: 'expectedStatus', type: 'INTEGER', desc: '期望状态码' },
        { name: 'expectedResponse', type: 'TEXT', desc: '期望响应' },
        { name: 'interval', type: 'INTEGER', default: 300, desc: '检查间隔' },
        { name: 'timeout', type: 'INTEGER', default: 30, desc: '超时时间' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'lastCheckAt', type: 'TEXT', desc: '最后检查时间' },
        { name: 'lastStatus', type: 'TEXT', desc: '最后状态' },
        { name: 'lastResponseTime', type: 'INTEGER', desc: '最后响应时间' },
        { name: 'consecutiveFailures', type: 'INTEGER', default: 0, desc: '连续失败次数' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'ip_filters',
      desc: 'IP过滤表 - 存储IP黑白名单',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '规则ID' },
        { name: 'ip', type: 'TEXT', desc: 'IP地址或CIDR' },
        { name: 'type', type: 'TEXT', desc: '类型(whitelist/blacklist)' },
        { name: 'description', type: 'TEXT', desc: '描述' },
        { name: 'isActive', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'system_config',
      desc: '系统配置表 - 存储系统级配置',
      columns: [
        { name: 'key', type: 'TEXT', pk: true, desc: '配置键' },
        { name: 'value', type: 'TEXT', desc: '配置值' },
        { name: 'description', type: 'TEXT', desc: '描述' },
        { name: 'isEditable', type: 'INTEGER', default: 1, desc: '是否可编辑' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'custom_icons',
      desc: '自定义图标表 - 存储用户自定义图标',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '图标ID' },
        { name: 'name', type: 'TEXT', desc: '图标名称' },
        { name: 'url', type: 'TEXT', desc: '图标URL' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'isPublic', type: 'INTEGER', default: 0, desc: '是否公开' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    },
    {
      name: 'bookmark_card_styles',
      desc: '书签卡片样式表 - 存储卡片样式配置',
      columns: [
        { name: 'id', type: 'TEXT', pk: true, desc: '样式ID' },
        { name: 'name', type: 'TEXT', desc: '样式名称' },
        { name: 'description', type: 'TEXT', desc: '样式描述' },
        { name: 'scope', type: 'TEXT', desc: '作用域(global/role/user)' },
        { name: 'roleId', type: 'TEXT', desc: '角色ID' },
        { name: 'userId', type: 'TEXT', desc: '用户ID' },
        { name: 'backgroundColor', type: 'TEXT', desc: '背景颜色' },
        { name: 'backgroundGradient', type: 'TEXT', desc: '背景渐变' },
        { name: 'borderRadius', type: 'TEXT', desc: '边框圆角' },
        { name: 'borderWidth', type: 'TEXT', desc: '边框宽度' },
        { name: 'borderColor', type: 'TEXT', desc: '边框颜色' },
        { name: 'shadowColor', type: 'TEXT', desc: '阴影颜色' },
        { name: 'shadowBlur', type: 'TEXT', desc: '阴影模糊' },
        { name: 'shadowSpread', type: 'TEXT', desc: '阴影扩散' },
        { name: 'shadowX', type: 'TEXT', desc: '阴影X偏移' },
        { name: 'shadowY', type: 'TEXT', desc: '阴影Y偏移' },
        { name: 'padding', type: 'TEXT', desc: '内边距' },
        { name: 'margin', type: 'TEXT', desc: '外边距' },
        { name: 'gap', type: 'TEXT', desc: '间距' },
        { name: 'titleFontSize', type: 'TEXT', desc: '标题字体大小' },
        { name: 'titleFontWeight', type: 'TEXT', desc: '标题字体粗细' },
        { name: 'titleColor', type: 'TEXT', desc: '标题颜色' },
        { name: 'descriptionFontSize', type: 'TEXT', desc: '描述字体大小' },
        { name: 'descriptionFontWeight', type: 'TEXT', desc: '描述字体粗细' },
        { name: 'descriptionColor', type: 'TEXT', desc: '描述颜色' },
        { name: 'opacity', type: 'REAL', desc: '透明度' },
        { name: 'backdropBlur', type: 'TEXT', desc: '背景模糊' },
        { name: 'backdropSaturate', type: 'TEXT', desc: '背景饱和度' },
        { name: 'hoverScale', type: 'REAL', desc: '悬停缩放' },
        { name: 'hoverTransition', type: 'TEXT', desc: '悬停过渡' },
        { name: 'iconSize', type: 'TEXT', desc: '图标大小' },
        { name: 'iconColor', type: 'TEXT', desc: '图标颜色' },
        { name: 'iconBackgroundColor', type: 'TEXT', desc: '图标背景色' },
        { name: 'iconBorderRadius', type: 'TEXT', desc: '图标圆角' },
        { name: 'imageHeight', type: 'TEXT', desc: '图片高度' },
        { name: 'imageBorderRadius', type: 'TEXT', desc: '图片圆角' },
        { name: 'imageObjectFit', type: 'TEXT', desc: '图片填充方式' },
        { name: 'tagBackgroundColor', type: 'TEXT', desc: '标签背景色' },
        { name: 'tagTextColor', type: 'TEXT', desc: '标签文字颜色' },
        { name: 'tagBorderRadius', type: 'TEXT', desc: '标签圆角' },
        { name: 'tagFontSize', type: 'TEXT', desc: '标签字体大小' },
        { name: 'isEnabled', type: 'INTEGER', default: 1, desc: '是否启用' },
        { name: 'isDefault', type: 'INTEGER', default: 0, desc: '是否默认' },
        { name: 'priority', type: 'INTEGER', default: 0, desc: '优先级' },
        { name: 'createdAt', type: 'TEXT', desc: '创建时间' },
        { name: 'updatedAt', type: 'TEXT', desc: '更新时间' }
      ]
    }
  ]
}

// ========== HTML 生成 ==========

function generateHtml(): string {
  const modulesJson = JSON.stringify(apiModules)
  const dbJson = JSON.stringify(databaseSchema)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus API 文档 - 模块化设计</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-blue: #3b82f6;
      --accent-purple: #8b5cf6;
      --accent-green: #10b981;
      --accent-orange: #f59e0b;
      --accent-red: #ef4444;
      --border-color: #334155;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      --radius: 8px;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }
    
    /* 头部 */
    .header {
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
      border-bottom: 1px solid var(--border-color);
      padding: 1.5rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .header-title h1 {
      font-size: 1.5rem;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    
    .header-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .badge-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .badge-green { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-orange { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    
    /* 布局 */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      padding: 2rem;
    }
    
    /* 侧边栏 */
    .sidebar {
      position: sticky;
      top: 100px;
      height: calc(100vh - 120px);
      overflow-y: auto;
    }
    
    .nav-section {
      margin-bottom: 1.5rem;
    }
    
    .nav-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0 0.75rem;
      margin-bottom: 0.5rem;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 0.25rem;
    }
    
    .nav-item:hover {
      background: var(--bg-secondary);
    }
    
    .nav-item.active {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), transparent);
      border-left: 3px solid var(--accent-blue);
    }
    
    .nav-icon {
      font-size: 1.25rem;
      width: 1.5rem;
      text-align: center;
    }
    
    .nav-text {
      flex: 1;
    }
    
    .nav-name {
      font-weight: 500;
      font-size: 0.875rem;
    }
    
    .nav-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* 主内容区 */
    .main {
      min-height: calc(100vh - 120px);
    }
    
    .module-header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .module-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .module-title h2 {
      font-size: 1.875rem;
      font-weight: 700;
    }
    
    .module-icon {
      font-size: 2rem;
    }
    
    .module-description {
      color: var(--text-secondary);
      font-size: 1rem;
    }
    
    /* API 卡片 */
    .api-grid {
      display: grid;
      gap: 1rem;
    }
    
    .api-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      overflow: hidden;
      transition: all 0.2s;
    }
    
    .api-card:hover {
      border-color: var(--accent-blue);
      box-shadow: var(--shadow);
    }
    
    .api-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.05), transparent);
    }
    
    .api-method {
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      min-width: 60px;
      text-align: center;
    }
    
    .method-get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .method-post { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .method-put { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .method-patch { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
    .method-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    
    .api-path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      color: var(--text-primary);
      flex: 1;
    }
    
    .api-name {
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .api-badges {
      display: flex;
      gap: 0.5rem;
    }
    
    .api-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    
    .api-body.open {
      max-height: 2000px;
    }
    
    .api-content {
      padding: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
    
    .api-section {
      margin-bottom: 1.5rem;
    }
    
    .api-section:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .api-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.6;
    }
    
    /* 参数表格 */
    .param-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    
    .param-table th,
    .param-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .param-table th {
      font-weight: 600;
      color: var(--text-secondary);
      background: rgba(51, 65, 85, 0.5);
    }
    
    .param-table code {
      font-family: 'Monaco', 'Menlo', monospace;
      background: rgba(59, 130, 246, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: var(--accent-blue);
    }
    
    .param-type {
      color: var(--accent-purple);
      font-size: 0.8rem;
    }
    
    .param-required {
      color: var(--accent-red);
      font-size: 0.75rem;
    }
    
    .param-optional {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    
    .param-desc {
      color: var(--text-secondary);
      font-size: 0.8rem;
    }
    
    /* 响应示例 */
    .response-example {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: var(--radius);
      padding: 1rem;
      overflow-x: auto;
    }
    
    .response-example pre {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8rem;
      line-height: 1.5;
      color: #e6edf3;
      margin: 0;
    }
    
    /* 数据库结构 */
    .db-grid {
      display: grid;
      gap: 1.5rem;
    }
    
    .db-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      overflow: hidden;
    }
    
    .db-header {
      padding: 1rem 1.25rem;
      background: linear-gradient(90deg, rgba(139, 92, 246, 0.1), transparent);
      border-bottom: 1px solid var(--border-color);
    }
    
    .db-name {
      font-size: 1.125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .db-desc {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .db-body {
      padding: 1rem;
    }
    
    /* 切换图标 */
    .toggle-icon {
      transition: transform 0.2s;
      color: var(--text-muted);
    }
    
    .toggle-icon.open {
      transform: rotate(180deg);
    }
    
    /* 滚动条 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: var(--bg-primary);
    }
    
    ::-webkit-scrollbar-thumb {
      background: var(--bg-tertiary);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }
    
    /* 响应式 */
    @media (max-width: 1024px) {
      .container {
        grid-template-columns: 1fr;
      }
      
      .sidebar {
        position: relative;
        top: 0;
        height: auto;
        display: flex;
        overflow-x: auto;
        gap: 0.5rem;
        padding-bottom: 1rem;
      }
      
      .nav-section {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0;
      }
      
      .nav-title {
        display: none;
      }
      
      .nav-item {
        white-space: nowrap;
        margin-bottom: 0;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <div class="header-title">
        <h1>🔰 Nexus API 文档</h1>
        <span class="badge badge-blue">v2.0.0</span>
      </div>
      <div class="header-meta">
        <span class="badge badge-green">模块化设计</span>
        <span class="badge badge-orange">管理员权限</span>
      </div>
    </div>
  </header>
  
  <div class="container">
    <aside class="sidebar" id="sidebar"></aside>
    <main class="main" id="main"></main>
  </div>

  <script>
    const apiModules = ${modulesJson};
    const databaseSchema = ${dbJson};
    let currentModule = 'auth';

    // 渲染侧边栏
    function renderSidebar() {
      const sidebar = document.getElementById('sidebar');
      
      let html = '<div class="nav-section">';
      html += '<div class="nav-title">API 模块</div>';
      
      Object.values(apiModules).forEach(module => {
        html += \`
          <div class="nav-item \${module.id === currentModule ? 'active' : ''}" data-module="\${module.id}">
            <span class="nav-icon">\${module.icon}</span>
            <div class="nav-text">
              <div class="nav-name">\${module.name}</div>
              <div class="nav-desc">\${module.apis.length} 个接口</div>
            </div>
          </div>
        \`;
      });
      
      html += '</div>';
      
      html += '<div class="nav-section">';
      html += '<div class="nav-title">其他</div>';
      html += \`
        <div class="nav-item" data-module="database">
          <span class="nav-icon">🗄️</span>
          <div class="nav-text">
            <div class="nav-name">数据库结构</div>
            <div class="nav-desc">\${databaseSchema.tables.length} 个表</div>
          </div>
        </div>
      \`;
      html += '</div>';
      
      sidebar.innerHTML = html;
      
      // 绑定点击事件
      sidebar.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          currentModule = item.dataset.module;
          renderSidebar();
          renderMain();
        });
      });
    }

    // 渲染主内容
    function renderMain() {
      const main = document.getElementById('main');
      
      if (currentModule === 'database') {
        renderDatabase(main);
        return;
      }
      
      const module = apiModules[currentModule];
      if (!module) return;
      
      let html = '<div class="module-header">';
      html += '<div class="module-title">';
      html += \`<span class="module-icon">\${module.icon}</span>\`;
      html += \`<h2>\${module.name}</h2>\`;
      html += '</div>';
      html += \`<p class="module-description">\${module.description}</p>\`;
      html += '</div>';
      
      html += '<div class="api-grid">';
      
      module.apis.forEach((api, index) => {
        const methodClass = 'method-' + api.method.toLowerCase();
        const authBadge = api.admin ? '<span class="badge badge-orange">管理员</span>' : 
                          api.auth ? '<span class="badge badge-blue">需登录</span>' : 
                          '<span class="badge badge-green">公开</span>';
        
        html += \`
          <div class="api-card">
            <div class="api-header" onclick="toggleApi(\${index})">
              <span class="api-method \${methodClass}">\${api.method}</span>
              <code class="api-path">\${api.path}</code>
              <span class="api-name">\${api.name}</span>
              <div class="api-badges">\${authBadge}</div>
              <svg class="toggle-icon" id="toggle-\${index}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div class="api-body" id="api-body-\${index}">
              <div class="api-content">
                <div class="api-section">
                  <div class="section-title">接口说明</div>
                  <p class="api-description">\${api.desc}</p>
                </div>
                \${renderParams(api.params, '路径参数')}
                \${renderParams(api.query, '查询参数')}
                \${renderParams(api.body, '请求体')}
                \${renderResponse(api.response)}
              </div>
            </div>
          </div>
        \`;
      });
      
      html += '</div>';
      main.innerHTML = html;
    }

    // 渲染参数
    function renderParams(params, title) {
      if (!params || params.length === 0) return '';
      
      let html = \`<div class="api-section"><div class="section-title">\${title}</div>\`;
      html += '<table class="param-table"><thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead><tbody>';
      
      params.forEach(p => {
        const required = p.required ? '<span class="param-required">必填</span>' : '<span class="param-optional">可选</span>';
        const defaultVal = p.default !== undefined ? \` (默认: \${p.default})\` : '';
        const enumVal = p.enum ? \` [\${p.enum.join(', ')}]\` : '';
        
        html += \`
          <tr>
            <td><code>\${p.name}</code></td>
            <td class="param-type">\${p.type}</td>
            <td>\${required}</td>
            <td class="param-desc">\${p.desc}\${enumVal}\${defaultVal}</td>
          </tr>
        \`;
      });
      
      html += '</tbody></table></div>';
      return html;
    }

    // 渲染响应
    function renderResponse(response) {
      if (!response) return '';
      
      return \`
        <div class="api-section">
          <div class="section-title">响应示例 (HTTP \${response.code})</div>
          <div class="response-example">
            <pre>\${JSON.stringify(response.example, null, 2)}</pre>
          </div>
        </div>
      \`;
    }

    // 渲染数据库结构
    function renderDatabase(container) {
      let html = '<div class="module-header">';
      html += '<div class="module-title">';
      html += '<span class="module-icon">🗄️</span>';
      html += '<h2>数据库结构</h2>';
      html += '</div>';
      html += '<p class="module-description">完整的数据库表结构定义，共 ' + databaseSchema.tables.length + ' 个表</p>';
      html += '</div>';
      
      html += '<div class="db-grid">';
      
      databaseSchema.tables.forEach(table => {
        html += \`
          <div class="db-card">
            <div class="db-header">
              <div class="db-name">📋 \${table.name}</div>
              <div class="db-desc">\${table.desc}</div>
            </div>
            <div class="db-body">
              <table class="param-table">
                <thead>
                  <tr><th>字段</th><th>类型</th><th>约束</th><th>说明</th></tr>
                </thead>
                <tbody>
                  \${table.columns.map(col => {
                    const constraints = [];
                    if (col.pk) constraints.push('主键');
                    if (col.unique) constraints.push('唯一');
                    if (col.default !== undefined) constraints.push(\`默认:\${col.default}\`);
                    return \`
                      <tr>
                        <td><code>\${col.name}</code></td>
                        <td class="param-type">\${col.type}</td>
                        <td>\${constraints.join(', ') || '-'}</td>
                        <td class="param-desc">\${col.desc}</td>
                      </tr>
                    \`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      });
      
      html += '</div>';
      container.innerHTML = html;
    }

    // 切换 API 详情
    window.toggleApi = function(index) {
      const body = document.getElementById('api-body-' + index);
      const icon = document.getElementById('toggle-' + index);
      body.classList.toggle('open');
      icon.classList.toggle('open');
    };

    // 初始化
    renderSidebar();
    renderMain();
  </script>
</body>
</html>`
}

// ========== 路由 ==========

// API 文档首页 - 需要管理员权限（支持从 query 参数获取 token）
router.get('/', queryTokenAuthMiddleware, authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  res.send(generateHtml())
})

// API JSON 数据 - 需要管理员权限（支持从 query 参数获取 token）
router.get('/json', queryTokenAuthMiddleware, authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    data: {
      version: '2.0.0',
      modules: apiModules,
      database: databaseSchema
    }
  })
})

export default router
