#!/usr/bin/env tsx
import { initDatabase, getDatabase, hashPassword, forceSaveDatabase } from './src/db.js'

async function resetAdminPassword() {
  console.log('🔄 正在重置管理员密码...')
  
  try {
    await initDatabase()
    const db = getDatabase()
    
    if (!db) {
      console.error('❌ 数据库初始化失败')
      process.exit(1)
    }
    
    const newPassword = 'admin123'
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
      console.log('🔑 密码: admin123')
    } else {
      console.log('⚠️ 未找到 admin 用户，正在创建...')
      const defaultUserId = 'user_default'
      db.run(
        `INSERT INTO users (id, username, password, role, isActive, isDefaultPassword, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [defaultUserId, 'admin', hashedPassword, 'admin', 1, 1, now, now]
      )
      console.log('✅ admin 用户创建成功！')
      console.log('🔑 用户名: admin')
      console.log('🔑 密码: admin123')
    }
    
    forceSaveDatabase()
    console.log('💾 数据库已保存')
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error)
    process.exit(1)
  }
}

resetAdminPassword()
