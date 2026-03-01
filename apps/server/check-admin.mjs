/**
 * 检查admin用户状态
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'zen-garden.db');

async function checkAdmin() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ 数据库文件不存在:', DB_PATH);
      process.exit(1);
    }

    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();
    
    const dbBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(dbBuffer);

    // 查询所有用户
    const result = db.exec("SELECT id, username, role, isActive, isDefaultPassword, updatedAt FROM users");
    
    if (result.length === 0 || result[0].values.length === 0) {
      console.log('⚠️ 没有用户记录');
    } else {
      console.log('📋 用户列表:');
      result[0].values.forEach((row, index) => {
        console.log(`  ${index + 1}. ID: ${row[0]}, 用户名: ${row[1]}, 角色: ${row[2]}, 激活: ${row[3]}, 默认密码: ${row[4]}, 更新: ${row[5]}`);
      });
    }

    db.close();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkAdmin();
