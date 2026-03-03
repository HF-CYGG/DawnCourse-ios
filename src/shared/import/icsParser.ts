// ICS 文件解析器（简化版，适配常见课程日历导出）
// 功能：
// 1) 解析 VEVENT 的 DTSTART/DTEND/SUMMARY/LOCATION
// 2) 支持 RRULE:FREQ=WEEKLY 的简单展开（按学期范围）
// 3) 将事件映射为 Course 结构所需的字段

import { Settings } from '../../core/domain/models/Settings';
import { calculateCurrentWeek, getDayOfWeek } from '../utils/dateUtils';
import { Course } from '../../core/domain/models/Course';

type RawEvent = {
  summary: string;
  location?: string;
  dtstart: Date;
  dtend: Date;
  rrule?: {
    freq?: string;
    until?: Date;
    interval?: number;
  };
};

export function parseICS(text: string): RawEvent[] {
  const lines = text.split(/\r?\n/);
  const events: RawEvent[] = [];
  let current: any = null;
  function parseDate(val: string): Date {
    // 兼容格式：YYYYMMDDTHHMMSSZ 或 YYYYMMDD 或 含时区偏移
    const m = val.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      if (m[4]) {
        const hh = parseInt(m[5], 10);
        const mm = parseInt(m[6], 10);
        const ss = parseInt(m[7], 10);
        return new Date(Date.UTC(y, mo, d, hh, mm, ss));
      }
      return new Date(y, mo, d);
    }
    // 回退：Date.parse
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  function parseRRULE(val: string): any {
    const parts = Object.fromEntries(
      val.split(';').map(kv => {
        const [k, v] = kv.split('=');
        return [k.toUpperCase(), v];
      })
    );
    const rule: any = {};
    if (parts['FREQ']) rule.freq = parts['FREQ'];
    if (parts['INTERVAL']) rule.interval = parseInt(parts['INTERVAL'], 10);
    if (parts['UNTIL']) rule.until = parseDate(parts['UNTIL']);
    return rule;
  }
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      current = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (current?.DTSTART && current?.DTEND && current?.SUMMARY) {
        events.push({
          summary: current.SUMMARY,
          location: current.LOCATION,
          dtstart: parseDate(current.DTSTART),
          dtend: parseDate(current.DTEND),
          rrule: current.RRULE ? parseRRULE(current.RRULE) : undefined
        });
      }
      current = null;
    } else if (current) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx).toUpperCase();
        const val = line.slice(idx + 1);
        current[key] = val;
      }
    }
  }
  return events;
}

export function expandToCourses(
  raw: RawEvent[],
  settings: Settings,
  semester: { id: string; startDate: number; weekCount: number }
): Omit<Course, 'id'>[] {
  const start = new Date(semester.startDate);
  const semesterEnd = new Date(start);
  semesterEnd.setDate(start.getDate() + semester.weekCount * 7);

  const items: Omit<Course, 'id'>[] = [];
  for (const ev of raw) {
    const occurrences: Array<{ start: Date; end: Date }> = [];
    if (ev.rrule && ev.rrule.freq === 'WEEKLY') {
      const interval = ev.rrule.interval || 1;
      const until = ev.rrule.until && ev.rrule.until.getTime() > 0 ? ev.rrule.until : semesterEnd;
      // 从事件起始开始，按周展开，直到 until
      let cursor = new Date(ev.dtstart);
      let cursorEnd = new Date(ev.dtend);
      while (cursor.getTime() <= until.getTime()) {
        occurrences.push({ start: new Date(cursor), end: new Date(cursorEnd) });
        cursor.setDate(cursor.getDate() + 7 * interval);
        cursorEnd.setDate(cursorEnd.getDate() + 7 * interval);
      }
    } else {
      occurrences.push({ start: ev.dtstart, end: ev.dtend });
    }

    for (const occ of occurrences) {
      const week = calculateCurrentWeek(semester.startDate, occ.start);
      if (week < 1 || week > semester.weekCount) continue;
      const day = getDayOfWeek(occ.start); // 1-7
      // 映射到节次：找到 sectionTimes 中第一个 start >= 实际开始时间 作为 startSection
      const [startSection, duration] = mapTimeToSections(occ.start, occ.end, settings.sectionTimes);
      items.push({
        semesterId: semester.id,
        name: ev.summary,
        teacher: undefined,
        location: ev.location,
        dayOfWeek: day,
        startSection,
        duration,
        startWeek: week,
        endWeek: week,
        weekType: 0,
        color: '#34C759',
        isModified: false,
        note: undefined,
        originId: undefined
      });
    }
  }
  return items;
}

function mapTimeToSections(
  startTime: Date,
  endTime: Date,
  sections: { start: string; end: string }[]
): [number, number] {
  function toMinutes(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  const startMin = startTime.getHours() * 60 + startTime.getMinutes();
  const endMin = endTime.getHours() * 60 + endTime.getMinutes();
  let startIdx = 1;
  let endIdx = 1;
  for (let i = 0; i < sections.length; i++) {
    const s = toMinutes(sections[i].start);
    const e = toMinutes(sections[i].end);
    // 起始匹配策略：找到第一个“实际开始时间不早于节次开始时间 - 5分钟”的节次作为起点
    // 说明：允许小幅提前容差，以适配不同导出源的时间差异
    if (startMin <= s + 5) {
      startIdx = i + 1;
      break;
    }
  }
  for (let i = sections.length - 1; i >= 0; i--) {
    const e = toMinutes(sections[i].end);
    // 结束匹配策略：从末尾寻找第一个“实际结束时间不早于节次结束时间 - 5分钟”的节次作为终点
    if (endMin >= e - 5) {
      endIdx = i + 1;
      break;
    }
  }
  const duration = Math.max(1, endIdx - startIdx + 1);
  return [startIdx, duration];
}
