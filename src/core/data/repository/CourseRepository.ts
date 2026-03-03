import { Course } from '../../domain/models/Course';
import { getDatabase } from '../database';

function mapRowToCourse(row: any): Course {
  // 行数据映射为领域模型：
  // 说明：将 SQLite 查询返回的字段名转换为前端使用的 Course 字段
  return {
    id: row.id,
    semesterId: row.semester_id,
    name: row.name,
    teacher: row.teacher,
    location: row.location,
    dayOfWeek: row.day_of_week,
    startSection: row.start_section,
    duration: row.duration,
    startWeek: row.start_week,
    endWeek: row.end_week,
    weekType: row.week_type,
    color: row.color,
    isModified: row.is_modified === 1,
    note: row.note,
    originId: row.origin_id,
  };
}

export const CourseRepository = {
  async getAllCourses(): Promise<Course[]> {
    // 查询所有课程记录
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM courses');
    return rows.map(mapRowToCourse);
  },

  async getCoursesBySemester(semesterId: string): Promise<Course[]> {
    // 按学期查询课程列表
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM courses WHERE semester_id = ?', [semesterId]);
    return rows.map(mapRowToCourse);
  },

  async getCourseById(id: string): Promise<Course | null> {
    // 根据课程 ID 查询单条记录
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT * FROM courses WHERE id = ?', [id]);
    return row ? mapRowToCourse(row) : null;
  },

  async addCourse(course: Course): Promise<void> {
    // 新增课程：写入所有字段，布尔值以 0/1 存储
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO courses (
        id, semester_id, name, teacher, location, day_of_week, 
        start_section, duration, start_week, end_week, week_type, 
        color, is_modified, note, origin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.id, course.semesterId, course.name, course.teacher || null, course.location || null,
        course.dayOfWeek, course.startSection, course.duration, course.startWeek, course.endWeek,
        course.weekType, course.color || null, course.isModified ? 1 : 0, course.note || null, course.originId || null
      ]
    );
  },

  async updateCourse(course: Course): Promise<void> {
    // 更新课程：根据 ID 覆盖对应字段
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE courses SET 
        semester_id = ?, name = ?, teacher = ?, location = ?, day_of_week = ?, 
        start_section = ?, duration = ?, start_week = ?, end_week = ?, week_type = ?, 
        color = ?, is_modified = ?, note = ?, origin_id = ?
      WHERE id = ?`,
      [
        course.semesterId, course.name, course.teacher || null, course.location || null,
        course.dayOfWeek, course.startSection, course.duration, course.startWeek, course.endWeek,
        course.weekType, course.color || null, course.isModified ? 1 : 0, course.note || null, course.originId || null,
        course.id
      ]
    );
  },

  async deleteCourse(id: string): Promise<void> {
    // 删除单个课程
    const db = await getDatabase();
    await db.runAsync('DELETE FROM courses WHERE id = ?', [id]);
  },
  
  async deleteCoursesBySemester(semesterId: string): Promise<void> {
    // 删除某学期下的所有课程（用于重建或导入前清理）
    const db = await getDatabase();
    await db.runAsync('DELETE FROM courses WHERE semester_id = ?', [semesterId]);
  }
};
