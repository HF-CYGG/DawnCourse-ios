// 学期领域模型
// 说明：
// - startDate 使用毫秒级时间戳
// - isCurrent 表示是否为当前学期（用于首页与提醒）
export interface Semester {
  id: string;         // 学期唯一标识
  name: string;       // 学期名称（如“2025年春季学期”）
  startDate: number;  // 学期开始日期时间戳（毫秒）
  weekCount: number;  // 学期总周数
  isCurrent: boolean; // 是否当前学期
}
