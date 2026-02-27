/**
 * 安全锁定机制
 * 防止暴力破解密码
 * 3次错误后锁定15分钟
 */

interface LockRecord {
  attempts: number
  lockedUntil: number | null
  lastAttempt: number
}

// 内存中的锁定记录（按IP和提取码/删除码组合）
const lockMap = new Map<string, LockRecord>()

// 配置
const MAX_ATTEMPTS = 3
const LOCK_DURATION = 15 * 60 * 1000 // 15分钟
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1小时清理一次

/**
 * 生成锁定键
 */
function generateLockKey(ip: string, code: string, type: 'extract' | 'delete'): string {
  return `${ip}:${code}:${type}`
}

/**
 * 检查是否被锁定
 */
export function isLocked(ip: string, code: string, type: 'extract' | 'delete'): { locked: boolean; remainingTime?: number } {
  const key = generateLockKey(ip, code, type)
  const record = lockMap.get(key)
  
  if (!record) {
    return { locked: false }
  }
  
  // 检查是否还在锁定时间内
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingTime = Math.ceil((record.lockedUntil - Date.now()) / 1000 / 60) // 分钟
    return { locked: true, remainingTime }
  }
  
  // 锁定已过期，清除记录
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    lockMap.delete(key)
    return { locked: false }
  }
  
  return { locked: false }
}

/**
 * 记录一次失败尝试
 */
export function recordFailedAttempt(ip: string, code: string, type: 'extract' | 'delete'): { locked: boolean; remainingAttempts: number } {
  const key = generateLockKey(ip, code, type)
  const now = Date.now()
  
  let record = lockMap.get(key)
  
  if (!record) {
    record = {
      attempts: 0,
      lockedUntil: null,
      lastAttempt: now
    }
  }
  
  // 增加尝试次数
  record.attempts++
  record.lastAttempt = now
  
  // 检查是否达到最大尝试次数
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_DURATION
    lockMap.set(key, record)
    return { locked: true, remainingAttempts: 0 }
  }
  
  lockMap.set(key, record)
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - record.attempts }
}

/**
 * 清除锁定记录（成功验证后调用）
 */
export function clearLock(ip: string, code: string, type: 'extract' | 'delete'): void {
  const key = generateLockKey(ip, code, type)
  lockMap.delete(key)
}

/**
 * 获取剩余尝试次数
 */
export function getRemainingAttempts(ip: string, code: string, type: 'extract' | 'delete'): number {
  const key = generateLockKey(ip, code, type)
  const record = lockMap.get(key)
  
  if (!record || record.lockedUntil) {
    return MAX_ATTEMPTS
  }
  
  return Math.max(0, MAX_ATTEMPTS - record.attempts)
}

/**
 * 清理过期的锁定记录
 */
function cleanupExpiredLocks(): void {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  lockMap.forEach((record, key) => {
    // 删除超过1小时没有活动的记录
    if (now - record.lastAttempt > 60 * 60 * 1000) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => lockMap.delete(key))
  
  if (keysToDelete.length > 0) {
    console.log(`[SecurityLock] Cleaned up ${keysToDelete.length} expired lock records`)
  }
}

// 启动定时清理
setInterval(cleanupExpiredLocks, CLEANUP_INTERVAL)

console.log('[SecurityLock] Security lock system initialized')
