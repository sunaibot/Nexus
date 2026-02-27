import { z } from 'zod'

// 书签验证 Schema
export const bookmarkSchema = z.object({
  url: z.string().url('请输入有效的 URL').min(1, 'URL 不能为空'),
  title: z.string().min(1, '标题不能为空').max(100, '标题最多 100 字符'),
  description: z.string().max(500, '描述最多 500 字符').optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isReadLater: z.boolean().optional(),
  isPinned: z.boolean().optional(),
})

export type BookmarkFormData = z.infer<typeof bookmarkSchema>

// 分类验证 Schema
export const categorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称最多 50 字符'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '请输入有效的颜色代码'),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// 站点设置验证 Schema
export const siteSettingsSchema = z.object({
  siteTitle: z.string().min(1, '站点标题不能为空').max(50, '站点标题最多 50 字符'),
  siteFavicon: z.string().url('请输入有效的图标 URL').optional().or(z.literal('')),
  enableBeamAnimation: z.boolean(),
  enableLiteMode: z.boolean(),
  enableWeather: z.boolean(),
  enableLunar: z.boolean(),
})

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>

// 登录验证 Schema
export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少 6 位'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// 修改密码验证 Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string().min(6, '新密码至少 6 位'),
  confirmPassword: z.string().min(1, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// 验证函数
export function validateBookmark(data: unknown) {
  return bookmarkSchema.safeParse(data)
}

export function validateCategory(data: unknown) {
  return categorySchema.safeParse(data)
}

export function validateSiteSettings(data: unknown) {
  return siteSettingsSchema.safeParse(data)
}

export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data)
}

export function validateChangePassword(data: unknown) {
  return changePasswordSchema.safeParse(data)
}

// 获取验证错误信息
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })
  return errors
}
