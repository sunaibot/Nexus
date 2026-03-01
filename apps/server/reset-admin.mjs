/**
 * 重置admin密码脚本
 * 用法: node reset-admin.mjs [新密码]
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALT_ROUNDS = 10;
const DB_PATH = path.join(__dirname, 'data', 'zen-garden.db');

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function resetAdminPassword(newPassword = 'admin123') {
  try {
    // 检查数据库文件是否存在
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ 数据库文件不存在:', DB_PATH);
      console.log('💡 请先启动服务器初始化数据库');
      process.exit(1);
    }

    // 动态导入 sql.js
    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();
    
    // 读取数据库文件
    const dbBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(dbBuffer);

    // 检查admin用户是否存在
    const result = db.exec("SELECT id, username FROM users WHERE id = 'admin'");
    
    if (result.length === 0 || result[0].values.length === 0) {
      console.error('❌ admin用户不存在');
      db.close();
      process.exit(1);
    }

    // 生成新密码哈希
    const passwordHash = await hashPassword(newPassword);
    const now = new Date().toISOString();

    // 更新密码
    db.run(
      `UPDATE users SET password = ?, isDefaultPassword = 1, updatedAt = ? WHERE id = 'admin'`,
      [passwordHash, now]
    );

    // 保存数据库
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    db.close();

    console.log('✅ admin密码重置成功！');
    console.log('🔑 新密码:', newPassword);
    console.log('💡 请使用新密码登录，首次登录后建议修改密码');
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error.message);
    process.exit(1);
  }
}

// 获取命令行参数
const newPassword = process.argv[2] || 'admin123';
resetAdminPassword(newPassword);
