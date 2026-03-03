// 计算当前周次：
// - 参数 startDate 为学期开始日期的时间戳（毫秒）
// - 若当前日期在学期开始前，统一按第 1 周处理
export function calculateCurrentWeek(startDate: number, today: Date = new Date()): number {
  const start = new Date(startDate);
  // 规范为当天零点，避免时间部分影响日差计算
  start.setHours(0, 0, 0, 0);
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 1;
  }

  return Math.floor(diffDays / 7) + 1;
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  // JS 原生 getDay(): 0 表示周日，1 表示周一
  // 领域模型：1 表示周一，...，7 表示周日
  return day === 0 ? 7 : day;
}
