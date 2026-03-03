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
  defaultCourseDuration: number;         // 新建课程默认持续节数
  hideNonCurrentWeekCourses: boolean;    // 是否隐藏非本周课程
  showWeekend: boolean;                  // 是否显示周末（周六/周日）
  showSidebarTime: boolean;
  showSidebarIndex: boolean;
  showDateInHeader: boolean;
  dynamicColor: boolean;
  fontStyle: 'system' | 'serif' | 'monospace';
  courseItemHeight: number;              // 课表单节高度（像素）
  courseCardRadius: number;              // 课程卡片圆角（像素）
  courseCardOpacity: number;
  gridLineWidth: number;                 // 网格线宽（像素）
  gridLineStyle: 'solid' | 'dashed' | 'dotted';
  gridLineColor: string;
  gridLineAlpha: number;
  showCourseIcons: boolean;
  enableNotifications: boolean;          // 是否启用通知提醒
  notificationAdvanceMinutes: number;    // 提前提醒分钟数
  enablePersistentNotification: boolean;
  enableAutoMute: boolean;
  ignoreVersion?: string;                // 忽略更新的版本标识（可选）
  wallpaperMode: 'crop' | 'fill';
  backgroundBlur: number;
  backgroundBrightness: number;
  lastImportUrl?: string;                // 强智网页导入上次访问地址
}
