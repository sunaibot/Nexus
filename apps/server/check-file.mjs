/**
 * 检查文件传输记录
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'zen-garden.db');

async function checkFile() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ 数据库文件不存在');
      process.exit(1);
    }

    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();
    
    const dbBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(dbBuffer);

    // 查询所有文件传输记录
    const result = db.exec(`
      SELECT 
        id, 
        extractCode, 
        downloadToken, 
        fileName, 
        fileSize, 
        expiresAt
      FROM file_transfers
    `);
    
    if (result.length === 0 || result[0].values.length === 0) {
      console.log('⚠️ 没有文件传输记录');
    } else {
      console.log('📁 文件传输记录:');
      result[0].values.forEach((row, index) => {
        const now = Date.now();
        const isExpired = now > row[5];
        console.log(`\n  ${index + 1}. 文件名: ${row[3]}`);
        console.log(`     提取码: ${row[1]}`);
        console.log(`     下载令牌: ${row[2]}`);
        console.log(`     大小: ${(row[4] / 1024).toFixed(2)} KB`);
        console.log(`     过期时间戳: ${row[5]}`);
        console.log(`     当前时间: ${now}`);
        console.log(`     是否过期: ${isExpired ? '是 ❌' : '否 ✅'}`);
      });
    }

    db.close();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkFile();
