import { Course } from '../../core/domain/models/Course';

export function isCourseActive(course: Course, currentWeek: number): boolean {
  // 判断课程在当前周是否有效
  // 1) 周范围判断：当前周需在 [startWeek, endWeek] 范围内
  if (currentWeek < course.startWeek || currentWeek > course.endWeek) {
    return false;
  }

  // 2) 单双周判断：0 全部周；1 单周；2 双周
  if (course.weekType === 0) {
    return true; // 全部周有效
  } else if (course.weekType === 1) {
    return currentWeek % 2 !== 0; // 单周
  } else if (course.weekType === 2) {
    return currentWeek % 2 === 0; // 双周
  }

  return false;
}

export function getTodayCourses(courses: Course[], currentWeek: number, dayOfWeek: number): Course[] {
  // 获取当日有效课程，按起始节次升序
  return courses
    .filter(course => course.dayOfWeek === dayOfWeek)
    .filter(course => isCourseActive(course, currentWeek))
    .sort((a, b) => a.startSection - b.startSection);
}
