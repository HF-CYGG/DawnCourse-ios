// 小部件展示的课程条目
export interface WidgetCourseItem {
  id: string;             // 课程 ID
  name: string;           // 课程名称
  location?: string;      // 上课地点（可选）
  dayOfWeek: number;      // 星期（1-7）
  startSection: number;   // 起始节次
  duration: number;       // 持续节数
  color?: string;         // 展示颜色
  startTime: string;      // 开始时间（HH:mm）
  endTime: string;        // 结束时间（HH:mm）
}

// 小部件数据快照
export interface WidgetSnapshot {
  generatedAt: number;              // 快照生成时间（毫秒）
  currentWeek: number;              // 当前周次
  today: string;                    // 今日日期（yyyy-MM-dd）
  lastSuccessfulRefreshAt: number;  // 最近成功刷新时间（毫秒）
  items: WidgetCourseItem[];        // 今日课程条目
  isSemesterEnded: boolean;         // 是否已超过学期周数
  emptyMessage?: string;            // 空态提示（可选）
}
