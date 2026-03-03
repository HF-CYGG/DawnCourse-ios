import { Semester } from '../../domain/models/Semester';
import { getDatabase } from '../database';

function mapRowToSemester(row: any): Semester {
  // 行数据映射说明：将 SQLite 字段映射为前端 Semester 模型
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    weekCount: row.week_count,
    isCurrent: row.is_current === 1,
  };
}

export const SemesterRepository = {
  async getAllSemesters(): Promise<Semester[]> {
    // 查询所有学期（按开始日期倒序）
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM semesters ORDER BY start_date DESC');
    return rows.map(mapRowToSemester);
  },

  async getSemesterById(id: string): Promise<Semester | null> {
    // 根据学期 ID 查询
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT * FROM semesters WHERE id = ?', [id]);
    return row ? mapRowToSemester(row) : null;
  },

  async getCurrentSemester(): Promise<Semester | null> {
    // 查询当前学期（is_current = 1）
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT * FROM semesters WHERE is_current = 1');
    return row ? mapRowToSemester(row) : null;
  },

  async addSemester(semester: Semester): Promise<void> {
    // 新增学期记录
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO semesters (id, name, start_date, week_count, is_current) VALUES (?, ?, ?, ?, ?)`,
      [semester.id, semester.name, semester.startDate, semester.weekCount, semester.isCurrent ? 1 : 0]
    );
  },

  async updateSemester(semester: Semester): Promise<void> {
    // 更新学期信息
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE semesters SET name = ?, start_date = ?, week_count = ?, is_current = ? WHERE id = ?`,
      [semester.name, semester.startDate, semester.weekCount, semester.isCurrent ? 1 : 0, semester.id]
    );
  },
  
  async deleteSemester(id: string): Promise<void> {
    // 删除学期
    const db = await getDatabase();
    await db.runAsync('DELETE FROM semesters WHERE id = ?', [id]);
  },

  async setCurrentSemester(id: string): Promise<void> {
    // 设定当前学期：
    // - 先将全部标记为非当前
    // - 再将目标学期标记为当前
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      // 全部重置为 0
      await db.runAsync('UPDATE semesters SET is_current = 0');
      // 目标设为 1
      await db.runAsync('UPDATE semesters SET is_current = 1 WHERE id = ?', [id]);
    });
  }
};
