// 节次时间定义
// 说明：使用字符串 "HH:mm" 表示起止时间
export interface SectionTime {
  start: string; // 节次开始时间（HH:mm）
  end: string;   // 节次结束时间（HH:mm）
}

// 应用设置领域模型
// 说明：
// - transparency 表示背景透明度（0-1）
// - sectionTimes 为节次时间表
// - notificationAdvanceMinutes 为“上课提醒提前分钟数”
export interface Settings {
  theme: string;                         // 主题模式（system/light/dark）
  wallpaper?: string;                    // 壁纸路径（可选）
  transparency: number;                  // 背景透明度（0-1）
  sectionTimes: SectionTime[];           // 节次时间表
  enableNotifications: boolean;          // 是否启用通知提醒
  notificationAdvanceMinutes: number;    // 提前提醒分钟数
  ignoreVersion?: string;                // 忽略更新的版本标识（可选）
}
