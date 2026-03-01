/**
 * 完整检查文件传输记录和物理文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'zen-garden.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

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
        filePath,
        expiresAt,
        createdAt
      FROM file_transfers
    `);
    
    if (result.length === 0 || result[0].values.length === 0) {
      console.log('⚠️ 没有文件传输记录');
    } else {
      console.log('📁 文件传输记录:\n');
      
      for (const row of result[0].values) {
        const now = Date.now();
        const isExpired = now > row[6];
        const filePath = path.join(UPLOADS_DIR, row[5]);
        const fileExists = fs.existsSync(filePath);
        
        console.log(`  文件名: ${row[3]}`);
        console.log(`  提取码: ${row[1]}`);
        console.log(`  下载令牌: ${row[2]}`);
        console.log(`  存储路径: ${row[5]}`);
        console.log(`  完整路径: ${filePath}`);
        console.log(`  物理文件存在: ${fileExists ? '✅' : '❌'}`);
        console.log(`  大小: ${(row[4] / 1024).toFixed(2)} KB`);
        console.log(`  是否过期: ${isExpired ? '是 ❌' : '否 ✅'}`);
        console.log(`  创建时间: ${row[7]}`);
        console.log('');
      }
    }

    // 检查uploads目录
    console.log('\n📂 uploads目录内容:');
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      if (files.length === 0) {
        console.log('  (空)');
      } else {
        files.forEach(f => {
          const stat = fs.statSync(path.join(UPLOADS_DIR, f));
          console.log(`  - ${f} (${(stat.size / 1024).toFixed(2)} KB)`);
        });
      }
    } else {
      console.log('  ❌ uploads目录不存在');
    }

    db.close();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkFile();
