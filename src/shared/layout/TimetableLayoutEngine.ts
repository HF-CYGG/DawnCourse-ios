// 课表布局计算引擎（TypeScript 版）
// 与安卓端 TimetableLayoutEngine.kt 保持一致的规则与行为
// 职责：根据课程与当前周，计算每个课程在网格中的 Day、Start、End、以及横向分栏（Lane）

import { Course } from '../../core/domain/models/Course';

export interface TimetableLayoutItem {
  course: Course;
  isCurrentWeek: boolean;
  safeDayOfWeek: number;
  safeStartSection: number;
  safeEndSection: number;
  laneIndex: number;
  laneCount: number;
}

export const TimetableLayoutEngine = {
  /**
   * 计算布局项列表
   * @param courses 课程列表
   * @param currentWeek 当前周次
   * @param maxNodes 每日最大节数
   * @param hideNonThisWeek 是否隐藏非本周课程
   * 说明：
   * - 第一步只负责“展示候选”的筛选（本周优先，必要时显示非本周代表）
   * - 第二步根据节次区间冲突进行分栏，并将“长课”作为背景层铺底
   */
  calculateLayoutItems(
    courses: Course[],
    currentWeek: number,
    maxNodes: number,
    hideNonThisWeek: boolean
  ): TimetableLayoutItem[] {
    const raw = prepareRawDisplayList(courses, currentWeek, hideNonThisWeek);
    return generateLayoutItems(raw, maxNodes);
  }
};

type RawPair = { course: Course; isCurrentWeek: boolean };

function prepareRawDisplayList(
  courses: Course[],
  currentWeek: number,
  hideNonThisWeek: boolean
): RawPair[] {
  const groups = new Map<string, Course[]>();
  for (const c of courses) {
    // 分组键：同一“星期 + 起始节次”的课程视为候选冲突组
    const key = `${c.dayOfWeek}-${c.startSection}`;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const result: RawPair[] = [];

  for (const [, group] of groups) {
    const currentWeekCourse = group.find(course => {
      const inRange = currentWeek >= course.startWeek && currentWeek <= course.endWeek;
      const matchWeekType =
        course.weekType === 1
          ? currentWeek % 2 !== 0
          : course.weekType === 2
          ? currentWeek % 2 === 0
          : true;
      return inRange && matchWeekType;
    });

    if (currentWeekCourse) {
      result.push({ course: currentWeekCourse, isCurrentWeek: true });
    } else if (!hideNonThisWeek) {
      // 显示非本周课程（选择 ID 最大的作为代表）
      const maxIdCourse = group.reduce((acc, cur) => (cur.id > acc.id ? cur : acc), group[0]);
      result.push({ course: maxIdCourse, isCurrentWeek: false });
    }
  }
  return result;
}

type Tmp = {
  course: Course;
  isCurrentWeek: boolean;
  safeDayOfWeek: number;
  safeStartSection: number;
  safeEndSection: number;
};

function generateLayoutItems(raw: RawPair[], maxNodes: number): TimetableLayoutItem[] {
  const normalized: Tmp[] = raw
    .map(({ course, isCurrentWeek }) => {
      const safeDay = clamp(course.dayOfWeek, 1, 7);
      const safeStart = clamp(course.startSection, 1, maxNodes);
      const safeDuration = Math.max(course.duration, 1);
      const safeEnd = clamp(safeStart + safeDuration - 1, 1, maxNodes);
      return {
        course,
        isCurrentWeek,
        safeDayOfWeek: safeDay,
        safeStartSection: safeStart,
        safeEndSection: safeEnd
      };
    })
    .sort((a, b) => {
      if (a.safeDayOfWeek !== b.safeDayOfWeek) return a.safeDayOfWeek - b.safeDayOfWeek;
      if (a.safeStartSection !== b.safeStartSection) return a.safeStartSection - b.safeStartSection;
      if (a.safeEndSection !== b.safeEndSection) return a.safeEndSection - b.safeEndSection;
      return String(a.course.id).localeCompare(String(b.course.id));
    });

  const result: TimetableLayoutItem[] = [];
  const byDay = groupBy(normalized, x => x.safeDayOfWeek);

  for (const [day, dayCourses] of byDay) {
    let i = 0;
    while (i < dayCourses.length) {
      // 构造“重叠簇”：同一日内，只要节次区间发生重叠，均划入同一簇以供分栏
      let clusterEnd = dayCourses[i].safeEndSection;
      let j = i + 1;
      while (j < dayCourses.length && dayCourses[j].safeStartSection <= clusterEnd) {
        clusterEnd = Math.max(clusterEnd, dayCourses[j].safeEndSection);
        j++;
      }

      const rawCluster = dayCourses.slice(i, j);

      // 智能冲突处理：簇中有本周课程，则过滤掉所有非本周课程
      const activeCluster = rawCluster.some(x => x.isCurrentWeek)
        ? rawCluster.filter(x => x.isCurrentWeek)
        : rawCluster;

      // 背景课程：时长 > 5，且簇中存在短课程（<=5）
      const hasShort = activeCluster.some(x => x.safeEndSection - x.safeStartSection + 1 <= 5);
      const foreground = hasShort
        ? activeCluster.filter(x => x.safeEndSection - x.safeStartSection + 1 <= 5)
        : activeCluster;
      const background = hasShort
        ? activeCluster.filter(x => x.safeEndSection - x.safeStartSection + 1 > 5)
        : [];

      // 前景课程横向分栏：
      // - 维护每个 lane 的“已占用截止节次” laneEnds
      // - 新课程若其起始节次 > 某个 lane 的已占用截止节次，则复用该 lane，否则新开一个 lane
      const laneEnds: number[] = [];
      const assigned: Array<{ item: Tmp; laneIndex: number }> = [];

      for (const item of foreground) {
        const laneIndex = laneEnds.findIndex(end => end < item.safeStartSection);
        const finalLaneIndex =
          laneIndex >= 0
            ? (laneEnds[laneIndex] = item.safeEndSection, laneIndex)
            : (laneEnds.push(item.safeEndSection), laneEnds.length - 1);
        assigned.push({ item, laneIndex: finalLaneIndex });
      }

      const laneCount = Math.max(laneEnds.length, 1);

      // 输出：背景课程置底、全宽；前景课程按分栏
      for (const item of background) {
        result.push({
          course: item.course,
          isCurrentWeek: item.isCurrentWeek,
          safeDayOfWeek: day,
          safeStartSection: item.safeStartSection,
          safeEndSection: item.safeEndSection,
          laneIndex: 0,
          laneCount: 1
        });
      }
      for (const { item, laneIndex } of assigned) {
        result.push({
          course: item.course,
          isCurrentWeek: item.isCurrentWeek,
          safeDayOfWeek: day,
          safeStartSection: item.safeStartSection,
          safeEndSection: item.safeEndSection,
          laneIndex,
          laneCount
        });
      }

      i = j;
    }
  }

  return result;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function groupBy<T, K>(arr: T[], keyFn: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const item of arr) {
    const k = keyFn(item);
    const list = m.get(k) ?? [];
    list.push(item);
    m.set(k, list);
  }
  return m;
}
