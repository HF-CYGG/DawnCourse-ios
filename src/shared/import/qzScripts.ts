// 强智教务脚本注入集合（简化版）
// 目标：在常见强智教务课表页面中提取课程信息，并通过 postMessage 回传标准化 JSON
// 说明：不同学校页面结构可能存在差异，此脚本尽量使用通用选择器和文本解析规则
// 输出格式：{ type: 'courses', data: Array<{ name, teacher, location, dayOfWeek, startSection, duration, weeks: number[], weekType: 0|1|2 }> }

export const qzInjectionBootstrap = `
(function() {
  function log() {
    try { console.log.apply(console, arguments); } catch(e) {}
  }
  function post(payload) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch(e) {}
  }

  // 文本解析工具
  function parseWeeks(text) {
    // 例： "1-16周", "1-16周(单)", "2-18周(双)", "1,3,5,7周"
    const weeks = [];
    let weekType = 0; // 0全部,1单,2双
    if (/单/.test(text)) weekType = 1;
    else if (/双/.test(text)) weekType = 2;
    const rangeMatch = text.match(/(\\d+)-(\\d+)周/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let w = start; w <= end; w++) weeks.push(w);
    } else {
      const listMatch = text.match(/((\\d+)(,\\d+)*)周/);
      if (listMatch) {
        const parts = listMatch[1].split(',').map(x => parseInt(x, 10)).filter(Boolean);
        parts.forEach(w => weeks.push(w));
      }
    }
    return { weeks, weekType };
  }

  function extract() {
    const results = [];
    // 常见强智课表表格：id: kbtable 或 class: kbcontent
    const table = document.querySelector('#kbtable') || document.querySelector('table.kbtable');
    if (!table) {
      // 另一种结构：每个格子 .kbcontent
      const cells = Array.prototype.slice.call(document.querySelectorAll('.kbcontent, td[align=\"center\"]'));
      if (cells.length === 0) {
        post({ type: 'error', message: '未找到课表表格元素' });
        return;
      }
      // 遍历格子，按所在列推断 dayOfWeek，按 rowSpan 推断 duration
      cells.forEach(cell => {
        const text = cell.textContent || '';
        const nameMatch = text.match(/^(.*?)(\\s|\\n|$)/);
        const name = nameMatch ? nameMatch[1].trim() : text.trim();
        const locationMatch = text.match(/地点[:：]\\s*([^\\n]+)/) || text.match(/教室[:：]\\s*([^\\n]+)/);
        const location = locationMatch ? locationMatch[1].trim() : '';
        const teacherMatch = text.match(/教师[:：]\\s*([^\\n]+)/) || text.match(/老师[:：]\\s*([^\\n]+)/);
        const teacher = teacherMatch ? teacherMatch[1].trim() : '';
        const weekInfo = parseWeeks(text);

        // 通过 cell 的位置推断 dayOfWeek 和 startSection
        const td = cell.closest('td');
        const tr = cell.closest('tr');
        if (!td || !tr) return;
        const rowIndex = Array.prototype.indexOf.call(tr.parentNode.children, tr); // 从 0 开始
        const colIndex = Array.prototype.indexOf.call(td.parentNode.children, td); // 从 0 开始
        const startSection = rowIndex; // 需要根据页面第一行是否是标题进行校正
        const duration = td.rowSpan ? parseInt(td.rowSpan, 10) : 1;
        const dayOfWeek = colIndex; // 需要根据周一列位置校正

        // 简化校正：若页面第一行含“节次”，则 startSection = rowIndex
        // 若第一列是节次索引，则 dayOfWeek = colIndex - 1
        const headerRow = table ? table.querySelector('tr') : document.querySelector('tr');
        const headerText = headerRow ? (headerRow.textContent || '') : '';
        let day = dayOfWeek;
        let start = startSection;
        if (/节次|节数|时间/.test(headerText)) {
          // 第一列为节次列
          day = Math.max(1, colIndex); // 保守估计
          start = Math.max(1, rowIndex);
        }
        day = Math.min(Math.max(day, 1), 7);
        start = Math.max(1, start);

        results.push({
          name,
          teacher,
          location,
          dayOfWeek: day,
          startSection: start,
          duration: Math.max(1, duration),
          weeks: weekInfo.weeks,
          weekType: weekInfo.weekType
        });
      });
    } else {
      // 表格结构解析
      const rows = Array.prototype.slice.call(table.querySelectorAll('tr'));
      rows.forEach((tr, rIdx) => {
        const tds = Array.prototype.slice.call(tr.children);
        tds.forEach((td, cIdx) => {
          const text = (td.textContent || '').trim();
          if (!text) return;
          // 排除标题行
          if (rIdx === 0) return;

          // 解析单元格内容
          const nameMatch = text.match(/^(.*?)(\\s|\\n|$)/);
          const name = nameMatch ? nameMatch[1].trim() : text;
          const locationMatch = text.match(/地点[:：]\\s*([^\\n]+)/) || text.match(/教室[:：]\\s*([^\\n]+)/);
          const location = locationMatch ? locationMatch[1].trim() : '';
          const teacherMatch = text.match(/教师[:：]\\s*([^\\n]+)/) || text.match(/老师[:：]\\s*([^\\n]+)/);
          const teacher = teacherMatch ? teacherMatch[1].trim() : '';
          const weekInfo = parseWeeks(text);

          const duration = td.rowSpan ? parseInt(td.rowSpan, 10) : 1;
          let day = Math.max(1, Math.min(7, cIdx));
          let start = Math.max(1, rIdx);

          results.push({
            name,
            teacher,
            location,
            dayOfWeek: day,
            startSection: start,
            duration: Math.max(1, duration),
            weeks: weekInfo.weeks,
            weekType: weekInfo.weekType
          });
        });
      });
    }

    if (results.length === 0) {
      post({ type: 'error', message: '未提取到课程信息' });
    } else {
      post({ type: 'courses', data: results });
    }
  }

  try {
    extract();
  } catch(e) {
    post({ type: 'error', message: '解析异常: ' + (e && e.message) });
  }
})();`;

