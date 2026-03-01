/**
 * 验证密码是否正确
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'zen-garden.db');

async function verifyPassword(password) {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ 数据库文件不存在');
      process.exit(1);
    }

    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();
    
    const dbBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(dbBuffer);

    // 查询admin用户密码
    const result = db.exec("SELECT password FROM users WHERE id = 'admin'");
    
    if (result.length === 0 || result[0].values.length === 0) {
      console.log('❌ admin用户不存在');
      db.close();
      return;
    }

    const hashedPassword = result[0].values[0][0];
    console.log('🔐 数据库中的密码哈希:', hashedPassword.substring(0, 20) + '...');
    
    // 验证密码
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('✅ 密码验证结果:', isValid);

    db.close();
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 验证 admin123
console.log('🧪 测试密码: admin123');
verifyPassword('admin123');
