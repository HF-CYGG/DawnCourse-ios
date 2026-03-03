// 课程领域模型（前端统一数据结构）
// 说明：
// - dayOfWeek 使用 1-7 表示周一至周日
// - weekType 使用 0/1/2 表示全部/单周/双周
export interface Course {
  id: string;              // 课程唯一标识（字符串）
  semesterId: string;      // 所属学期 ID
  name: string;            // 课程名称
  teacher?: string;        // 授课教师（可选）
  location?: string;       // 上课地点（可选）
  dayOfWeek: number;       // 星期（1-7；1 表示周一）
  startSection: number;    // 起始节次（1 基）
  duration: number;        // 持续节数（>=1）
  startWeek: number;       // 起始周次
  endWeek: number;         // 结束周次
  weekType: number;        // 周类型（0 全部；1 单周；2 双周）
  color?: string;          // 课程展示颜色（可选）
  isModified: boolean;     // 是否为用户修改过的课程（区别于导入原始）
  note?: string;           // 备注（可选）
  originId?: string;       // 原始来源 ID（可选；用于导入溯源）
}
