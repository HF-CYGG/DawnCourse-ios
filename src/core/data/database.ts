import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'dawncourse.db';   // 数据库文件名
const DATABASE_VERSION = 1;              // 架构版本号（用于迁移）

// 获取数据库连接（单例由 expo-sqlite 管理）
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
}

// 初始化数据库：开启外键、创建初始表结构、设置版本
export async function initDatabase() {
  const db = await getDatabase();
  
  // 启用外键约束
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    // 初始表结构
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS semesters (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        week_count INTEGER NOT NULL,
        is_current INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY NOT NULL,
        semester_id TEXT NOT NULL,
        name TEXT NOT NULL,
        teacher TEXT,
        location TEXT,
        day_of_week INTEGER NOT NULL,
        start_section INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        start_week INTEGER NOT NULL,
        end_week INTEGER NOT NULL,
        week_type INTEGER NOT NULL,
        color TEXT,
        is_modified INTEGER DEFAULT 0,
        note TEXT,
        origin_id TEXT,
        FOREIGN KEY (semester_id) REFERENCES semesters (id) ON DELETE CASCADE
      );

      PRAGMA user_version = 1;
    `);
  }
  
  // 未来迁移占位：
  // if (currentVersion < 2) { ...; PRAGMA user_version = 2; }
}
