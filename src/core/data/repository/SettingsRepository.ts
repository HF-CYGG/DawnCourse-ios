import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, SectionTime } from '../../domain/models/Settings';

const SETTINGS_KEY = 'app_settings'; // 本地持久化键

// 默认节次时间配置（可在设置页面修改）
const DEFAULT_SECTION_TIMES: SectionTime[] = [
  { start: '08:00', end: '08:45' },
  { start: '08:55', end: '09:40' },
  { start: '10:00', end: '10:45' },
  { start: '10:55', end: '11:40' },
  { start: '14:00', end: '14:45' },
  { start: '14:55', end: '15:40' },
  { start: '16:00', end: '16:45' },
  { start: '16:55', end: '17:40' },
  { start: '19:00', end: '19:45' },
  { start: '19:55', end: '20:40' },
  { start: '21:00', end: '21:45' },
  { start: '21:55', end: '22:40' },
];

// 默认设置：合并读取结果，确保新增字段有默认值
const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  transparency: 0,
  defaultCourseDuration: 2,
  hideNonCurrentWeekCourses: true,
  showWeekend: true,
  showSidebarTime: true,
  showSidebarIndex: true,
  showDateInHeader: false,
  dynamicColor: true,
  fontStyle: 'system',
  courseItemHeight: 60, // 课表单节高度（像素）
  courseCardRadius: 6, // 课程卡片圆角（像素）
  courseCardOpacity: 1,
  gridLineWidth: 0.5, // 网格线宽（像素）
  gridLineStyle: 'solid',
  gridLineColor: '#E5E7EB',
  gridLineAlpha: 1,
  showCourseIcons: true,
  enableNotifications: true,
  notificationAdvanceMinutes: 20,
  enablePersistentNotification: false,
  enableAutoMute: false,
  wallpaperMode: 'crop',
  backgroundBlur: 0,
  backgroundBrightness: 1,
  lastImportUrl: 'https://jwxt.xxxx.edu.cn',
  sectionTimes: DEFAULT_SECTION_TIMES,
};

export const SettingsRepository = {
  async getSettings(): Promise<Settings> {
    try {
      const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        // 与默认值合并，确保新字段存在（向后兼容）
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error('设置读取失败', e);
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(newSettings: Partial<Settings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('设置保存失败', e);
    }
  },

  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (e) {
      console.error('设置重置失败', e);
    }
  }
};
