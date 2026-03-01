/**
 * Cookie 工具函数
 * 用于在同域不同端口间共享登录状态
 */

/**
 * 设置 Cookie
 * @param name Cookie 名称
 * @param value Cookie 值
 * @param days 过期天数
 * @param sameSite SameSite 属性
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 7,
  sameSite: 'Strict' | 'Lax' | 'None' = 'Lax'
): void {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=${sameSite}`

  // 只有在 SameSite=None 时才需要 Secure 属性
  if (sameSite === 'None') {
    cookieString += ';Secure'
  }

  document.cookie = cookieString
}

/**
 * 获取 Cookie
 * @param name Cookie 名称
 * @returns Cookie 值或 null
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '='
  const ca = document.cookie.split(';')

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
  }

  return null
}

/**
 * 删除 Cookie
 * @param name Cookie 名称
 */
export function deleteCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

/**
 * 获取所有 Cookie
 * @returns Cookie 对象
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {}
  const ca = document.cookie.split(';')

  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim()
    if (c) {
      const [name, ...valueParts] = c.split('=')
      if (name) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(valueParts.join('='))
      }
    }
  }

  return cookies
}
