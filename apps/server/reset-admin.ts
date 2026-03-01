#!/usr/bin/env tsx
/**
 * 管理员密码重置工具
 * 用于在忘记密码时重置管理员账户
 * 
 * 使用方法:
 *   cd apps/server && npx tsx reset-admin.ts [新密码]
 * 
 * 如果不提供密码，将生成随机密码
 */

import { initDatabase, getDatabase, hashPassword, forceSaveDatabase } from './src/db/index.js'
import crypto from 'crypto'

async function resetAdminPassword(): Promise<void> {
  console.log('🔄 正在重置管理员密码...')
  
  try {
    await initDatabase()
    const db = getDatabase()
    
    if (!db) {
      console.error('❌ 数据库初始化失败')
      process.exit(1)
    }
    
    // 从命令行参数获取密码，或生成随机密码
    const args = process.argv.slice(2)
    let newPassword = args[0]
    
    if (!newPassword) {
      // 生成随机密码
      newPassword = crypto.randomBytes(12).toString('hex')
      console.log('🔐 已生成随机密码')
    }
    
    const hashedPassword = await hashPassword(newPassword)
    const now = new Date().toISOString()
    
    console.log('📝 更新用户表中的 admin 用户...')
    db.run(
      `UPDATE users 
       SET password = ?, isDefaultPassword = 1, updatedAt = ? 
       WHERE username = ?`,
      [hashedPassword, now, 'admin']
    )
    
    const result = db.exec('SELECT username, role, isActive FROM users WHERE username = ?', ['admin'])
    
    if (result.length > 0 && result[0].values.length > 0) {
      console.log('✅ 管理员密码重置成功！')
      console.log('🔑 用户名: admin')
      console.log('🔑 密码:', newPassword)
      console.log('⚠️  请登录后立即修改密码！')
    } else {
      console.log('⚠️ 未找到 admin 用户，正在创建...')
      const defaultUserId = 'user_' + crypto.randomUUID()
      db.run(
        `INSERT INTO users (id, username, password, email, role, isActive, isDefaultPassword, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [defaultUserId, 'admin', hashedPassword, 'admin@localhost', 'admin', 1, 1, now, now]
      )
      console.log('✅ admin 用户创建成功！')
      console.log('🔑 用户名: admin')
      console.log('🔑 密码:', newPassword)
      console.log('⚠️  请登录后立即修改密码！')
    }
    
    forceSaveDatabase()
    console.log('💾 数据库已保存')
    
  } catch (error) {
    console.error('❌ 重置密码时出错:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

resetAdminPassword()
