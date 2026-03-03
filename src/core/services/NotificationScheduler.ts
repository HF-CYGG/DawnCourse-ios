import * as Notifications from 'expo-notifications';
import { CourseRepository, SemesterRepository, SettingsRepository } from '../data/repository';
import { calculateCurrentWeek, getDayOfWeek, formatDate } from '../../shared/utils/dateUtils';
import { isCourseActive } from '../../shared/utils/courseUtils';

const REMINDER_CATEGORY_ID = 'course_reminder';
const DAYS_TO_SCHEDULE = 7; // 预排未来 7 天的本地通知

export const NotificationScheduler = {
  async scheduleReminders(): Promise<void> {
    console.log('开始预排课程提醒...');
    
    // 1. 清理旧的提醒任务
    // 说明：目前不区分分类，简单地清空所有已计划通知，避免重复
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // 2. 拉取配置与数据
    const settings = await SettingsRepository.getSettings();
    if (!settings.enableNotifications) {
      console.log('设置中已关闭通知');
      return;
    }
    
    const semester = await SemesterRepository.getCurrentSemester();
    if (!semester) {
      console.log('未找到当前学期');
      return;
    }
    
    const courses = await CourseRepository.getCoursesBySemester(semester.id);
    if (courses.length === 0) {
      console.log('当前学期暂无课程');
      return;
    }
    
    const now = new Date();
    let scheduledCount = 0;
    
    // 3. 遍历未来 N 天，按日筛选课程并计划通知
    for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);
      targetDate.setHours(0, 0, 0, 0); // 规范为当天零点，便于按日计算
      
      const currentWeek = calculateCurrentWeek(semester.startDate, targetDate);
      
      // 若超过学期总周数则跳过
      if (currentWeek > semester.weekCount) continue;
      
      const dayOfWeek = getDayOfWeek(targetDate);
      
      // 按星期筛选当日课程，并过滤非本周
      const daysCourses = courses
        .filter(c => c.dayOfWeek === dayOfWeek)
        .filter(c => isCourseActive(c, currentWeek));
        
      for (const course of daysCourses) {
        // 计算提醒触发时间
        // 注意：sectionTimes 为 0 基；startSection 为 1 基
        const startIdx = course.startSection - 1;
        const timeStr = settings.sectionTimes[startIdx]?.start;
        
        if (!timeStr) continue;
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const triggerDate = new Date(targetDate);
        triggerDate.setHours(hours, minutes, 0, 0);
        
        // 应用“提前分钟数”配置
        triggerDate.setMinutes(triggerDate.getMinutes() - settings.notificationAdvanceMinutes);
        
        // 若触发时间已过去则跳过
        if (triggerDate.getTime() <= Date.now()) continue;
        
        // 计划本地通知
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '上课提醒',
            body: `${course.name} 即将开始\n地点: ${course.location || '未知'}`,
            data: { courseId: course.id },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          } as Notifications.DateTriggerInput,
        });
        scheduledCount++;
      }
    }
    
    console.log(`已预排 ${scheduledCount} 条提醒（未来 ${DAYS_TO_SCHEDULE} 天）`);
  }
};
