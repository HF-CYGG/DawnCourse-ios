import { CourseRepository, SemesterRepository, SettingsRepository } from '../../core/data/repository';
import { WidgetSnapshot, WidgetCourseItem } from '../../core/domain/models/WidgetSnapshot';
import { calculateCurrentWeek, formatDate, getDayOfWeek } from '../utils/dateUtils';
import { isCourseActive } from '../utils/courseUtils';

export const WidgetSnapshotGenerator = {
  async generateSnapshot(): Promise<WidgetSnapshot> {
    const now = new Date();
    const generatedAt = now.getTime();
    const todayStr = formatDate(now);
    
    // 1. 拉取数据：当前学期与设置（节次时间等）
    const currentSemester = await SemesterRepository.getCurrentSemester();
    const settings = await SettingsRepository.getSettings();
    
    // 无学期时返回空快照（用于小部件显示友好提示）
    if (!currentSemester) {
      return {
        generatedAt,
        currentWeek: 0,
        today: todayStr,
        lastSuccessfulRefreshAt: generatedAt,
        items: [],
        isSemesterEnded: false,
        emptyMessage: '请先创建学期',
      };
    }
    
    const currentWeek = calculateCurrentWeek(currentSemester.startDate, now);
    const dayOfWeek = getDayOfWeek(now);
    
    // 是否已超出学期总周数（用于显示“学期已结束”）
    const isSemesterEnded = currentWeek > currentSemester.weekCount;
    
    // 2. 获取当前学期课程
    const allCourses = await CourseRepository.getCoursesBySemester(currentSemester.id);
    
    // 3. 过滤今日课程：
    // - 小组件：显示下一节或少量摘要
    // - 中/大型组件：显示今日课程列表
    const todayCourses = allCourses
      .filter(c => c.dayOfWeek === dayOfWeek)
      .filter(c => isCourseActive(c, currentWeek));
      
    // 4. 映射为 WidgetCourseItem（包含具体上课时间）
    const items: WidgetCourseItem[] = todayCourses.map(course => {
      // 从设置的节次定义中取出开始/结束时间
      // 说明：sectionTimes 为数组 0 基；课程 startSection 为 1 基
      const startIdx = course.startSection - 1;
      const endIdx = course.startSection + course.duration - 1 - 1; // inclusive
      
      const startTime = settings.sectionTimes[startIdx]?.start || '00:00';
      const endTime = settings.sectionTimes[endIdx]?.end || '00:00';
      
      return {
        id: course.id,
        name: course.name,
        location: course.location,
        dayOfWeek: course.dayOfWeek,
        startSection: course.startSection,
        duration: course.duration,
        color: course.color,
        startTime,
        endTime,
      };
    });
    
    // 5. 按起始节次排序，保证展示顺序与实际时间一致
    items.sort((a, b) => a.startSection - b.startSection);
    
    return {
      generatedAt,
      currentWeek,
      today: todayStr,
      lastSuccessfulRefreshAt: generatedAt,
      items,
      isSemesterEnded,
      emptyMessage: items.length === 0 ? (isSemesterEnded ? '学期已结束' : '今天没有课') : undefined,
    };
  }
};
