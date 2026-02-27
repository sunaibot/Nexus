/**
 * Zod 验证 Schema
 * 解决类型安全问题：运行时类型验证
 * 
 * 改进点：
 * 1. 统一的验证规则
 * 2. 类型推导
 * 3. 自定义错误消息
 * 4. 支持复杂嵌套类型
 */

import { z } from 'zod'

// ==================== 基础 Schema ====================

// ID Schema
export const IdSchema = z.string().min(1, 'ID 不能为空')

// 时间戳 Schema
export const TimestampSchema = z.number().int().positive()

// URL Schema
export const UrlSchema = z.string().url('请输入有效的 URL')

// 颜色 Schema
export const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确')

// ==================== 用户相关 Schema ====================

export const UserRoleSchema = z.enum(['admin', 'user', 'guest'])

export const UserSchema = z.object({
  id: IdSchema,
  username: z.string().min(3, '用户名至少 3 个字符').max(50, '用户名最多 50 个字符'),
  email: z.string().email('邮箱格式不正确').optional(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateUserSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(50, '用户名最多 50 个字符'),
  password: z.string().min(6, '密码至少 6 个字符').max(100, '密码最多 100 个字符'),
  email: z.string().email('邮箱格式不正确').optional(),
  role: UserRoleSchema.default('user'),
})

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
})

// ==================== 书签相关 Schema ====================

export const BookmarkVisibilitySchema = z.enum(['public', 'personal', 'private'])

export const BookmarkSchema = z.object({
  id: IdSchema,
  url: UrlSchema,
  title: z.string().min(1, '标题不能为空').max(200, '标题最多 200 个字符'),
  description: z.string().max(1000, '描述最多 1000 个字符').optional(),
  favicon: z.string().optional(),
  icon: z.string().optional(),
  iconUrl: z.string().optional(),
  ogImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().default(false),
  isReadLater: z.boolean().default(false),
  isRead: z.boolean().default(false),
  visibility: BookmarkVisibilitySchema.default('public'),
  orderIndex: z.number().int().default(0),
  visitCount: z.number().int().nonnegative().default(0),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateBookmarkSchema = z.object({
  url: UrlSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  favicon: z.string().optional(),
  icon: z.string().optional(),
  iconUrl: z.string().optional(),
  ogImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  isPinned: z.boolean().optional(),
  isReadLater: z.boolean().optional(),
  visibility: BookmarkVisibilitySchema.optional(),
})

export const UpdateBookmarkSchema = CreateBookmarkSchema.partial()

// ==================== 分类相关 Schema ====================

export const CategorySchema = z.object({
  id: IdSchema,
  name: z.string().min(1, '名称不能为空').max(100, '名称最多 100 个字符'),
  icon: z.string().optional(),
  color: ColorSchema.optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().max(500, '描述最多 500 个字符').optional(),
  isVisible: z.boolean().default(true),
  orderIndex: z.number().int().default(0),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: ColorSchema.optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  isVisible: z.boolean().optional(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

// ==================== 分页相关 Schema ====================

export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int(),
      pageSize: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
      hasMore: z.boolean(),
    }),
  })

// ==================== API 响应 Schema ====================

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    status: z.number().optional(),
  })

// ==================== 设置相关 Schema ====================

export const SiteSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().max(500).optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.enum(['zh', 'en']).default('zh'),
})

// ==================== 验证函数 ====================

/**
 * 验证数据
 * @example
 * const result = validate(CreateUserSchema, data)
 * if (!result.success) {
 *   console.error(result.errors)
 * }
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * 部分验证（允许部分字段）
 */
export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  data: unknown
): { success: true; data: Partial<z.infer<T>> } | { success: false; errors: z.ZodError } {
  const partialSchema = schema.partial()
  const result = partialSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as Partial<z.infer<T>> }
  }
  return { success: false, errors: result.error }
}

/**
 * 获取友好的错误消息
 */
export function getValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}

/**
 * 获取第一个错误消息
 */
export function getFirstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message || '验证失败'
}

// ==================== 类型导出 ====================

export type User = z.infer<typeof UserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export type Bookmark = z.infer<typeof BookmarkSchema>
export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>
export type UpdateBookmarkInput = z.infer<typeof UpdateBookmarkSchema>

export type Category = z.infer<typeof CategorySchema>
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>

export type PaginationParams = z.infer<typeof PaginationParamsSchema>
export type SiteSettings = z.infer<typeof SiteSettingsSchema>

export default {
  IdSchema,
  TimestampSchema,
  UrlSchema,
  ColorSchema,
  UserRoleSchema,
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  BookmarkVisibilitySchema,
  BookmarkSchema,
  CreateBookmarkSchema,
  UpdateBookmarkSchema,
  CategorySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  PaginationParamsSchema,
  SiteSettingsSchema,
  validate,
  validatePartial,
  getValidationErrors,
  getFirstErrorMessage,
}
