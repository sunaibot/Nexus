// @ts-nocheck
import initSqlJs from 'sql.js'
import fs from 'fs'

async function checkDb() {
  const SQL = await initSqlJs()
  const dbPath = './data/zen-garden.db'
  
  if (!fs.existsSync(dbPath)) {
    console.log('数据库文件不存在:', dbPath)
    return
  }
  
  const buffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(buffer)
  
  // 检查 audit_logs 表结构
  try {
    const schema = db.exec("PRAGMA table_info(audit_logs)")
    console.log('audit_logs 表结构:')
    if (schema.length > 0 && schema[0].values.length > 0) {
      schema[0].values.forEach((row: any[]) => {
        console.log(`  ${row[0]}: ${row[1]} (${row[2]})`)
      })
    }
  } catch (e) {
    console.log('无法读取 audit_logs 表结构')
  }
  
  // 检查 audit_logs 数据
  try {
    const data = db.exec('SELECT * FROM audit_logs LIMIT 1')
    if (data.length > 0 && data[0].values.length > 0) {
      console.log('\n审计日志示例数据:')
      console.log(data[0].values[0])
    }
  } catch (e) {
    console.log('无法读取 audit_logs 数据')
  }
  
  db.close()
}

checkDb().catch(console.error)
